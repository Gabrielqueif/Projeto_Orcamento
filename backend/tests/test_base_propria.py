import uuid
from datetime import datetime, timedelta, timezone
from io import BytesIO

import pandas as pd
import pytest
from fastapi.testclient import TestClient

from app.dependencies import get_supabase
from app.main import app
from app.modules.base_propria.planilha import BasePropriaExcelParser, gerar_modelo_xlsx
from app.modules.base_propria.repositories import BasePropriaRepository, _termo_seguro
from app.modules.base_propria.services import MAX_PROFUNDIDADE, alcanca, encontrar_ciclo
from core.security import get_current_user

USUARIO_A = "user-a"
USUARIO_B = "user-b"

UNICOS = {
    "base_propria_insumos": ("base_id", "codigo"),
    "base_propria_composicoes": ("base_id", "codigo"),
}
CASCATA = {
    "bases_proprias": [("base_propria_insumos", "base_id"), ("base_propria_composicoes", "base_id")],
    "base_propria_composicoes": [("base_propria_composicao_itens", "composicao_id")],
}


class FakeResultado:
    def __init__(self, data):
        self.data = data


class FakeConsulta:
    """Subconjunto do query builder do supabase-py, em memória, suficiente para os repositórios."""

    def __init__(self, banco, tabela):
        self.banco, self.tabela = banco, tabela
        self.operacao = "select"
        self.filtros = []
        self.carga = None
        self.ordem = None
        self.corte = None
        self.conflito = None

    def select(self, *_):
        self.operacao = "select"
        return self

    def insert(self, carga):
        self.operacao, self.carga = "insert", carga
        return self

    def update(self, carga):
        self.operacao, self.carga = "update", carga
        return self

    def upsert(self, carga, on_conflict=None):
        self.operacao, self.carga, self.conflito = "upsert", carga, on_conflict
        return self

    def delete(self):
        self.operacao = "delete"
        return self

    def eq(self, coluna, valor):
        self.filtros.append(lambda linha: linha.get(coluna) == valor)
        return self

    def in_(self, coluna, valores):
        self.filtros.append(lambda linha: linha.get(coluna) in valores)
        return self

    def ilike(self, coluna, padrao):
        miolo = padrao.strip("%").casefold()
        parcial = padrao.startswith("%") or padrao.endswith("%")
        self.filtros.append(
            lambda linha: (
                miolo in str(linha.get(coluna, "")).casefold()
                if parcial
                else miolo == str(linha.get(coluna, "")).casefold()
            )
        )
        return self

    def or_(self, expressao):
        partes = [p.split(".ilike.") for p in expressao.split(",")]
        self.filtros.append(
            lambda linha: any(
                padrao.strip("%").casefold() in str(linha.get(coluna, "")).casefold() for coluna, padrao in partes
            )
        )
        return self

    def order(self, coluna, desc=False):
        self.ordem = (coluna, desc)
        return self

    def limit(self, n):
        self.corte = (0, n)
        return self

    def range(self, inicio, fim):
        self.corte = (inicio, fim - inicio + 1)
        return self

    def _casam(self):
        return [
            linha for linha in self.banco.tabelas.setdefault(self.tabela, []) if all(f(linha) for f in self.filtros)
        ]

    def _nova_linha(self, dados):
        n = next(self.banco.contador)
        agora = (datetime(2026, 1, 1, tzinfo=timezone.utc) + timedelta(seconds=n)).isoformat()
        return {"id": str(uuid.uuid4()), "created_at": agora, "updated_at": agora, **dados}

    def _inserir(self, dados):
        chaves = UNICOS.get(self.tabela)
        if chaves and any(all(reg.get(c) == dados.get(c) for c in chaves) for reg in self.banco.tabelas[self.tabela]):
            raise Exception("duplicate key value violates unique constraint")
        linha = self._nova_linha(dados)
        self.banco.tabelas.setdefault(self.tabela, []).append(linha)
        return linha

    def _remover(self, tabela, linhas):
        ids = {linha["id"] for linha in linhas}
        self.banco.tabelas[tabela] = [reg for reg in self.banco.tabelas.get(tabela, []) if reg["id"] not in ids]
        for filha, coluna in CASCATA.get(tabela, []):
            filhas = [reg for reg in self.banco.tabelas.get(filha, []) if reg.get(coluna) in ids]
            self._remover(filha, filhas)

    def execute(self):
        if self.operacao == "insert":
            lote = self.carga if isinstance(self.carga, list) else [self.carga]
            return FakeResultado([dict(self._inserir(d)) for d in lote])
        if self.operacao == "upsert":
            chaves = self.conflito.split(",")
            saida = []
            for dados in self.carga:
                existente = next(
                    (
                        reg
                        for reg in self.banco.tabelas.setdefault(self.tabela, [])
                        if all(reg[c] == dados[c] for c in chaves)
                    ),
                    None,
                )
                if existente:
                    existente.update(dados)
                    saida.append(dict(existente))
                else:
                    saida.append(dict(self._inserir(dados)))
            return FakeResultado(saida)
        casadas = self._casam()
        if self.operacao == "update":
            for linha in casadas:
                linha.update(self.carga)
            return FakeResultado([dict(reg) for reg in casadas])
        if self.operacao == "delete":
            self._remover(self.tabela, casadas)
            return FakeResultado([])
        if self.ordem:
            casadas = sorted(casadas, key=lambda reg: str(reg.get(self.ordem[0], "")), reverse=self.ordem[1])
        if self.corte:
            inicio, tamanho = self.corte
            casadas = casadas[inicio : inicio + tamanho]
        return FakeResultado([dict(reg) for reg in casadas])


class FakeSupabase:
    def __init__(self):
        self.tabelas = {}
        self.contador = iter(range(1, 10**9))

    def table(self, nome):
        return FakeConsulta(self, nome)


@pytest.fixture
def banco():
    return FakeSupabase()


@pytest.fixture
def api(banco):
    """Fábrica de clientes autenticados como um usuário, todos sobre o mesmo banco em memória."""
    app.dependency_overrides[get_supabase] = lambda: banco

    def como(usuario):
        app.dependency_overrides[get_current_user] = lambda: {"id": usuario, "email": f"{usuario}@x.com"}
        return TestClient(app)

    yield como
    app.dependency_overrides.clear()


@pytest.fixture
def a(api):
    return api(USUARIO_A)


@pytest.fixture
def base_id(a):
    r = a.post("/bases-proprias", json={"nome": "Minha base", "uf": "ce"})
    assert r.status_code == 201
    return r.json()["id"]


def novo_insumo(cliente, base, codigo, preco, tipo="MATERIAL"):
    r = cliente.post(
        f"/bases-proprias/{base}/insumos",
        json={"codigo": codigo, "descricao": f"Insumo {codigo}", "unidade": "UN", "tipo": tipo, "preco": preco},
    )
    assert r.status_code == 201, r.text
    return r.json()


def nova_composicao(cliente, base, codigo, itens=None):
    r = cliente.post(
        f"/bases-proprias/{base}/composicoes",
        json={"codigo": codigo, "descricao": f"Composição {codigo}", "unidade": "M2", "itens": itens or []},
    )
    assert r.status_code == 201, r.text
    return r.json()


def item(fonte, tipo, codigo, coef):
    return {"ref_fonte": fonte, "ref_tipo": tipo, "ref_codigo": codigo, "coeficiente": coef}


# --- Bases -------------------------------------------------------------------


def test_crud_de_base(a):
    criada = a.post("/bases-proprias", json={"nome": "  Obras Fortaleza ", "uf": "ce", "data_referencia": "2026-10-01"})
    assert criada.status_code == 201
    base = criada.json()
    assert base["nome"] == "Obras Fortaleza"
    assert base["uf"] == "CE"

    assert [b["id"] for b in a.get("/bases-proprias").json()] == [base["id"]]
    assert a.get(f"/bases-proprias/{base['id']}").json()["nome"] == "Obras Fortaleza"

    atualizada = a.put(f"/bases-proprias/{base['id']}", json={"descricao": "Preços de 2026"})
    assert atualizada.status_code == 200
    assert atualizada.json()["descricao"] == "Preços de 2026"
    assert atualizada.json()["nome"] == "Obras Fortaleza"

    assert a.put(f"/bases-proprias/{base['id']}", json={}).json()["nome"] == "Obras Fortaleza"
    assert a.put(f"/bases-proprias/{base['id']}", json={"nome": "  "}).status_code == 400

    assert a.delete(f"/bases-proprias/{base['id']}").status_code == 204
    assert a.get(f"/bases-proprias/{base['id']}").status_code == 404
    assert a.get("/bases-proprias").json() == []


def test_base_exige_nome(a):
    assert a.post("/bases-proprias", json={"nome": "   "}).status_code == 422
    assert a.post("/bases-proprias", json={}).status_code == 422


def test_rotas_exigem_autenticacao(banco):
    app.dependency_overrides[get_supabase] = lambda: banco
    try:
        assert TestClient(app).get("/bases-proprias").status_code in (401, 403)
    finally:
        app.dependency_overrides.clear()


# --- Insumos -----------------------------------------------------------------


def test_crud_de_insumo(a, base_id):
    insumo = novo_insumo(a, base_id, "INS-1", 10.5)
    assert insumo["preco"] == 10.5

    lista = a.get(f"/bases-proprias/{base_id}/insumos").json()
    assert [i["codigo"] for i in lista] == ["INS-1"]
    assert a.get(f"/bases-proprias/{base_id}/insumos", params={"q": "ins-1"}).json()[0]["codigo"] == "INS-1"
    assert a.get(f"/bases-proprias/{base_id}/insumos", params={"q": "inexistente"}).json() == []

    url = f"/bases-proprias/{base_id}/insumos/{insumo['id']}"
    assert a.get(url).json()["descricao"] == "Insumo INS-1"
    atualizado = a.put(url, json={"preco": 12, "tipo": "SERVICO"}).json()
    assert (atualizado["preco"], atualizado["tipo"]) == (12, "SERVICO")
    assert a.put(url, json={}).json()["preco"] == 12

    assert a.delete(url).status_code == 204
    assert a.get(url).status_code == 404
    assert a.put(url, json={"preco": 1}).status_code == 404


def test_insumo_valida_campos_e_codigo_duplicado(a, base_id):
    novo_insumo(a, base_id, "INS-1", 1)
    duplicado = a.post(
        f"/bases-proprias/{base_id}/insumos",
        json={"codigo": "INS-1", "descricao": "x", "unidade": "UN", "tipo": "MATERIAL", "preco": 1},
    )
    assert duplicado.status_code == 409
    invalido = a.post(
        f"/bases-proprias/{base_id}/insumos",
        json={"codigo": "INS-2", "descricao": "x", "unidade": "UN", "tipo": "OUTRO", "preco": -1},
    )
    assert invalido.status_code == 422


def test_nao_exclui_insumo_usado_por_composicao(a, base_id):
    insumo = novo_insumo(a, base_id, "INS-1", 5)
    comp = nova_composicao(a, base_id, "C1", [item("PROPRIA", "INSUMO", "INS-1", 2)])
    assert a.delete(f"/bases-proprias/{base_id}/insumos/{insumo['id']}").status_code == 409

    item_id = comp["itens"][0]["id"]
    assert a.delete(f"/bases-proprias/{base_id}/composicoes/{comp['id']}/itens/{item_id}").status_code == 204
    assert a.delete(f"/bases-proprias/{base_id}/insumos/{insumo['id']}").status_code == 204


# --- Composições e itens -----------------------------------------------------


def test_crud_de_composicao_e_itens(a, base_id):
    novo_insumo(a, base_id, "INS-1", 10)
    comp = nova_composicao(
        a, base_id, "C1", [item("PROPRIA", "INSUMO", "INS-1", 2), item("SINAPI", "INSUMO", "370", 1)]
    )
    assert len(comp["itens"]) == 2

    url = f"/bases-proprias/{base_id}/composicoes/{comp['id']}"
    detalhe = a.get(url).json()
    assert detalhe["codigo"] == "C1"
    assert len(detalhe["itens"]) == 2
    assert [c["codigo"] for c in a.get(f"/bases-proprias/{base_id}/composicoes").json()] == ["C1"]
    assert a.get(f"/bases-proprias/{base_id}/composicoes", params={"q": "c1"}).json()[0]["codigo"] == "C1"

    assert a.put(url, json={"grupo": "Alvenaria"}).json()["grupo"] == "Alvenaria"
    assert a.put(url, json={}).json()["grupo"] == "Alvenaria"

    novo = a.post(f"{url}/itens", json=item("SEINFRA", "COMPOSICAO", "C0001", 0.5))
    assert novo.status_code == 201
    item_id = novo.json()["id"]
    assert a.put(f"{url}/itens/{item_id}", json={"coeficiente": 3}).json()["coeficiente"] == 3
    assert a.put(f"{url}/itens/{item_id}", json={}).json()["coeficiente"] == 3
    assert a.put(f"{url}/itens/inexistente", json={"coeficiente": 3}).status_code == 404

    assert a.delete(f"{url}/itens/{item_id}").status_code == 204
    assert a.delete(f"{url}/itens/{item_id}").status_code == 404
    assert len(a.get(url).json()["itens"]) == 2

    assert a.delete(url).status_code == 204
    assert a.get(url).status_code == 404


def test_composicao_com_codigo_duplicado_ou_referencia_inexistente(a, base_id):
    nova_composicao(a, base_id, "C1")
    duplicada = a.post(
        f"/bases-proprias/{base_id}/composicoes", json={"codigo": "C1", "descricao": "x", "unidade": "M2"}
    )
    assert duplicada.status_code == 409

    sem_insumo = a.post(
        f"/bases-proprias/{base_id}/composicoes",
        json={"codigo": "C2", "descricao": "x", "unidade": "M2", "itens": [item("PROPRIA", "INSUMO", "FANTASMA", 1)]},
    )
    assert sem_insumo.status_code == 400
    assert "FANTASMA" in sem_insumo.json()["detail"]
    assert a.get(f"/bases-proprias/{base_id}/composicoes", params={"q": "C2"}).json() == []

    sem_comp = a.post(
        f"/bases-proprias/{base_id}/composicoes/{nova_composicao(a, base_id, 'C3')['id']}/itens",
        json=item("PROPRIA", "COMPOSICAO", "FANTASMA", 1),
    )
    assert sem_comp.status_code == 400


def test_coeficiente_deve_ser_positivo(a, base_id):
    comp = nova_composicao(a, base_id, "C1")
    r = a.post(f"/bases-proprias/{base_id}/composicoes/{comp['id']}/itens", json=item("SINAPI", "INSUMO", "1", 0))
    assert r.status_code == 422


def test_nao_exclui_composicao_usada_por_outra(a, base_id):
    interna = nova_composicao(a, base_id, "INTERNA")
    nova_composicao(a, base_id, "EXTERNA", [item("PROPRIA", "COMPOSICAO", "INTERNA", 1)])
    assert a.delete(f"/bases-proprias/{base_id}/composicoes/{interna['id']}").status_code == 409


# --- Ciclos ------------------------------------------------------------------


def test_impede_composicao_dentro_de_si_mesma(a, base_id):
    comp = nova_composicao(a, base_id, "A")
    r = a.post(f"/bases-proprias/{base_id}/composicoes/{comp['id']}/itens", json=item("PROPRIA", "COMPOSICAO", "A", 1))
    assert r.status_code == 400
    assert "si mesma" in r.json()["detail"]


def test_impede_ciclo_indireto(a, base_id):
    nova_composicao(a, base_id, "C")
    b = nova_composicao(a, base_id, "B", [item("PROPRIA", "COMPOSICAO", "C", 1)])
    a_ = nova_composicao(a, base_id, "A", [item("PROPRIA", "COMPOSICAO", "B", 1)])

    c_id = a.get(f"/bases-proprias/{base_id}/composicoes", params={"q": "C"}).json()
    c_id = next(c["id"] for c in c_id if c["codigo"] == "C")
    r = a.post(f"/bases-proprias/{base_id}/composicoes/{c_id}/itens", json=item("PROPRIA", "COMPOSICAO", "A", 1))
    assert r.status_code == 400
    assert "circular" in r.json()["detail"]
    assert b["id"] != a_["id"]


def test_atualizar_item_nao_conta_a_propria_aresta_como_ciclo(a, base_id):
    nova_composicao(a, base_id, "B")
    nova_composicao(a, base_id, "C")
    comp_a = nova_composicao(a, base_id, "A", [item("PROPRIA", "COMPOSICAO", "B", 1)])
    url = f"/bases-proprias/{base_id}/composicoes/{comp_a['id']}/itens/{comp_a['itens'][0]['id']}"
    assert a.put(url, json={"ref_codigo": "C"}).status_code == 200
    assert a.put(url, json={"ref_codigo": "A"}).status_code == 400


def test_calculo_detecta_ciclo_gravado_direto_no_banco(a, banco, base_id):
    comp_a = nova_composicao(a, base_id, "A")
    comp_b = nova_composicao(a, base_id, "B", [item("PROPRIA", "COMPOSICAO", "A", 1)])
    banco.tabelas["base_propria_composicao_itens"].append(
        {"id": "x", "composicao_id": comp_a["id"], "created_at": "z", **item("PROPRIA", "COMPOSICAO", "B", 1)}
    )
    r = a.get(f"/bases-proprias/{base_id}/composicoes/{comp_b['id']}/preco", params={"uf": "CE", "mes": "10/2026"})
    assert r.status_code == 400
    assert "circular" in r.json()["detail"]


def test_calculo_respeita_limite_de_profundidade(a, base_id):
    nova_composicao(a, base_id, "N0")
    ultima = None
    for n in range(1, MAX_PROFUNDIDADE + 3):
        ultima = nova_composicao(a, base_id, f"N{n}", [item("PROPRIA", "COMPOSICAO", f"N{n - 1}", 1)])
    r = a.get(f"/bases-proprias/{base_id}/composicoes/{ultima['id']}/preco", params={"uf": "CE", "mes": "10/2026"})
    assert r.status_code == 400
    assert "níveis" in r.json()["detail"]


def test_grafo_alcanca_e_encontrar_ciclo():
    grafo = {"A": ["B"], "B": ["C"], "C": []}
    assert alcanca(grafo, "A", "C")
    assert not alcanca(grafo, "C", "A")
    assert encontrar_ciclo(grafo) is None
    assert encontrar_ciclo({"A": ["B"], "B": ["C"], "C": ["A"]}) == ["A", "B", "C", "A"]
    assert encontrar_ciclo({"A": ["A"]}) == ["A", "A"]
    assert encontrar_ciclo({"A": ["B", "C"], "B": ["D"], "C": ["D"], "D": []}) is None


# --- Preço -------------------------------------------------------------------


def semear_precos_oficiais(banco):
    banco.tabelas["insumo_precos"] = [
        {
            "codigo_insumo": "370",
            "fonte": "SINAPI",
            "mes_referencia": "09/2026",
            "tipo_composicao": "Sem Desoneração",
            "ce": 40.0,
        },
        {
            "codigo_insumo": "370",
            "fonte": "SINAPI",
            "mes_referencia": "10/2026",
            "tipo_composicao": "Sem Desoneração",
            "ce": 50.0,
        },
    ]
    banco.tabelas["composicao_estados"] = [
        {
            "codigo_composicao": "87495",
            "fonte": "SINAPI",
            "mes_referencia": "10/2026",
            "tipo_composicao": "Sem Desoneração",
            "ce": 100.0,
        },
        {
            "codigo_composicao": "C0001",
            "fonte": "SEINFRA",
            "mes_referencia": "10/2026",
            "tipo_composicao": "Sem Desoneração",
            "ce": 20.0,
        },
    ]


def test_preco_soma_coeficiente_vezes_preco_de_todas_as_fontes(a, banco, base_id):
    semear_precos_oficiais(banco)
    novo_insumo(a, base_id, "INS-1", 10)
    interna = nova_composicao(
        a, base_id, "INTERNA", [item("PROPRIA", "INSUMO", "INS-1", 3), item("SINAPI", "INSUMO", "370", 0.1)]
    )
    comp = nova_composicao(
        a,
        base_id,
        "EXTERNA",
        [
            item("PROPRIA", "INSUMO", "INS-1", 2),  # 20
            item("PROPRIA", "COMPOSICAO", "INTERNA", 2),  # 2 * (30 + 5) = 70
            item("SINAPI", "COMPOSICAO", "87495", 0.5),  # 50
            item("SEINFRA", "COMPOSICAO", "C0001", 1),  # 20
            item("SINAPI", "INSUMO", "370", 1),  # 50 (mês pedido)
        ],
    )

    r = a.get(
        f"/bases-proprias/{base_id}/composicoes/{comp['id']}/preco",
        params={"uf": "ce", "mes": "10/2026", "tipo": "Sem Desoneração"},
    )
    assert r.status_code == 200
    corpo = r.json()
    assert corpo["preco_total"] == 210.0
    assert corpo["uf"] == "CE"
    assert corpo["itens_sem_preco"] == 0
    assert [i["subtotal"] for i in corpo["itens"]] == [20.0, 70.0, 50.0, 20.0, 50.0]
    assert corpo["itens"][1]["descricao"] == "Composição INTERNA"
    assert all(i["encontrado"] for i in corpo["itens"])

    interna_r = a.get(
        f"/bases-proprias/{base_id}/composicoes/{interna['id']}/preco", params={"uf": "CE", "mes": "10/2026"}
    ).json()
    assert interna_r["preco_total"] == 35.0
    assert interna_r["tipo"] == "Sem Desoneração"


def test_preco_de_insumo_oficial_usa_mes_mais_recente_na_falta_do_pedido(a, banco, base_id):
    semear_precos_oficiais(banco)
    comp = nova_composicao(a, base_id, "C", [item("SINAPI", "INSUMO", "370", 1)])
    r = a.get(f"/bases-proprias/{base_id}/composicoes/{comp['id']}/preco", params={"uf": "CE", "mes": "01/2026"})
    assert r.json()["preco_total"] == 50.0
    r = a.get(f"/bases-proprias/{base_id}/composicoes/{comp['id']}/preco", params={"uf": "CE", "mes": "09/2026"})
    assert r.json()["preco_total"] == 40.0


def test_preco_sinaliza_itens_sem_preco(a, banco, base_id):
    semear_precos_oficiais(banco)
    comp = nova_composicao(
        a, base_id, "C", [item("SINAPI", "INSUMO", "370", 1), item("SINAPI", "INSUMO", "NAO-EXISTE", 5)]
    )
    r = a.get(f"/bases-proprias/{base_id}/composicoes/{comp['id']}/preco", params={"uf": "CE", "mes": "10/2026"})
    corpo = r.json()
    assert corpo["preco_total"] == 50.0
    assert corpo["itens_sem_preco"] == 1
    assert corpo["itens"][1]["encontrado"] is False
    assert corpo["itens"][1]["preco_unitario"] is None

    sem_uf_do_preco = a.get(
        f"/bases-proprias/{base_id}/composicoes/{comp['id']}/preco", params={"uf": "SP", "mes": "10/2026"}
    ).json()
    assert sem_uf_do_preco["itens_sem_preco"] == 2


def test_preco_valida_parametros(a, base_id):
    comp = nova_composicao(a, base_id, "C")
    url = f"/bases-proprias/{base_id}/composicoes/{comp['id']}/preco"
    assert a.get(url).status_code == 422
    assert a.get(url, params={"uf": "CEA", "mes": "10/2026"}).status_code == 422
    assert a.get(url, params={"uf": "CE", "mes": "10/2026"}).json()["preco_total"] == 0
    assert (
        a.get(f"/bases-proprias/{base_id}/composicoes/inexistente/preco", params={"uf": "CE", "mes": "1"}).status_code
        == 404
    )


# --- Duplicação --------------------------------------------------------------


def test_duplicar_base_copia_insumos_composicoes_e_itens(a, banco, base_id):
    semear_precos_oficiais(banco)
    novo_insumo(a, base_id, "INS-1", 10)
    nova_composicao(a, base_id, "INTERNA", [item("PROPRIA", "INSUMO", "INS-1", 1)])
    nova_composicao(
        a, base_id, "EXTERNA", [item("PROPRIA", "COMPOSICAO", "INTERNA", 2), item("SINAPI", "INSUMO", "370", 1)]
    )

    r = a.post(f"/bases-proprias/{base_id}/duplicar", json={"nome": "Versão 2"})
    assert r.status_code == 201
    copia = r.json()
    assert copia["id"] != base_id
    assert copia["nome"] == "Versão 2"

    composicoes = a.get(f"/bases-proprias/{copia['id']}/composicoes").json()
    assert {c["codigo"] for c in composicoes} == {"INTERNA", "EXTERNA"}
    externa = next(c for c in composicoes if c["codigo"] == "EXTERNA")
    preco = a.get(
        f"/bases-proprias/{copia['id']}/composicoes/{externa['id']}/preco", params={"uf": "CE", "mes": "10/2026"}
    )
    assert preco.json()["preco_total"] == 70.0

    # a cópia é independente da original
    novo_insumo(a, copia["id"], "SO-NA-COPIA", 1)
    assert len(a.get(f"/bases-proprias/{base_id}/insumos").json()) == 1

    sem_corpo = a.post(f"/bases-proprias/{base_id}/duplicar")
    assert sem_corpo.status_code == 201
    assert sem_corpo.json()["nome"] == "Minha base (cópia)"


def test_duplicar_remove_copia_parcial_se_falhar(a, banco, base_id, monkeypatch):
    novo_insumo(a, base_id, "INS-1", 10)

    def falha(self, dados):
        raise RuntimeError("banco indisponível")

    monkeypatch.setattr(BasePropriaRepository, "upsert_composicoes", falha)
    cliente = TestClient(app, raise_server_exceptions=False)
    r = cliente.post(f"/bases-proprias/{base_id}/duplicar")
    assert r.status_code == 500
    assert [b["id"] for b in banco.tabelas["bases_proprias"]] == [base_id]


# --- Importação --------------------------------------------------------------


def xlsx(insumos=None, composicoes=None, abas=("Insumos", "Composições")):
    saida = BytesIO()
    with pd.ExcelWriter(saida, engine="openpyxl") as escritor:
        if "Insumos" in abas:
            pd.DataFrame(insumos or [], columns=["codigo", "descricao", "unidade", "tipo", "preco"]).to_excel(
                escritor, sheet_name="Insumos", index=False
            )
        if "Composições" in abas:
            colunas = ["codigo", "descricao", "unidade", "grupo", "ref_fonte", "ref_tipo", "ref_codigo", "coeficiente"]
            pd.DataFrame(composicoes or [], columns=colunas).to_excel(escritor, sheet_name="Composições", index=False)
    return saida.getvalue()


def enviar(cliente, base, conteudo, nome="base.xlsx"):
    return cliente.post(
        f"/bases-proprias/{base}/importar", files={"file": (nome, conteudo, "application/octet-stream")}
    )


def test_modelo_de_importacao_baixa_e_reimporta_sem_alteracao(a, base_id):
    r = a.get("/bases-proprias/modelo-importacao")
    assert r.status_code == 200
    assert "spreadsheetml" in r.headers["content-type"]
    assert "modelo_base_propria.xlsx" in r.headers["content-disposition"]

    resultado = enviar(a, base_id, r.content)
    assert resultado.status_code == 200, resultado.text
    assert resultado.json() == {"insumos_importados": 2, "composicoes_importadas": 2, "itens_importados": 5}

    enviar(a, base_id, r.content)  # reimportar substitui itens em vez de duplicá-los
    comps = a.get(f"/bases-proprias/{base_id}/composicoes").json()
    comp1 = next(c for c in comps if c["codigo"] == "COMP-001")
    assert len(a.get(f"/bases-proprias/{base_id}/composicoes/{comp1['id']}").json()["itens"]) == 3
    assert len(a.get(f"/bases-proprias/{base_id}/insumos").json()) == 2


def test_importacao_aceita_so_insumos_e_virgula_decimal(a, base_id):
    conteudo = xlsx([["I1", "Areia", "M3", "material", "1,5"]], abas=("Insumos",))
    r = enviar(a, base_id, conteudo)
    assert r.json() == {"insumos_importados": 1, "composicoes_importadas": 0, "itens_importados": 0}
    insumo = a.get(f"/bases-proprias/{base_id}/insumos").json()[0]
    assert (insumo["preco"], insumo["tipo"]) == (1.5, "MATERIAL")


def test_importacao_rejeita_tudo_quando_ha_erros(a, base_id):
    conteudo = xlsx(
        insumos=[["I1", "Areia", "M3", "MATERIAL", "10"], ["I2", "Brita", "M3", "TIPO-RUIM", "5"]],
        composicoes=[["C1", "Comp", "M2", "", "PROPRIA", "INSUMO", "NAO-EXISTE", "1"]],
    )
    r = enviar(a, base_id, conteudo)
    assert r.status_code == 400
    detalhe = r.json()["detail"]
    assert "nada foi gravado" in detalhe
    assert "linha 3" in detalhe
    assert "NAO-EXISTE" in detalhe
    assert a.get(f"/bases-proprias/{base_id}/insumos").json() == []


def test_importacao_valida_linhas_de_composicao(a, base_id):
    linhas = [
        ["", "sem codigo", "M2", "", "", "", "", ""],
        ["C1", "Comp", "M2", "", "OUTRA", "INSUMO", "1", "1"],
        ["C1", "Comp", "M2", "", "SINAPI", "OUTRO", "1", "1"],
        ["C1", "Comp", "M2", "", "SINAPI", "INSUMO", "", "1"],
        ["C1", "Comp", "M2", "", "SINAPI", "INSUMO", "1", "0"],
        ["C1", "Comp", "M2", "", "SINAPI", "INSUMO", "1", "abc"],
    ]
    r = enviar(a, base_id, xlsx(composicoes=linhas))
    assert r.status_code == 400
    detalhe = r.json()["detail"]
    for trecho in ("obrigatórios", "ref_fonte", "ref_tipo", "ref_codigo", "coeficiente"):
        assert trecho in detalhe


def test_importacao_detecta_ciclo(a, base_id):
    composicoes = [
        ["A", "A", "M2", "", "PROPRIA", "COMPOSICAO", "B", "1"],
        ["B", "B", "M2", "", "PROPRIA", "COMPOSICAO", "A", "1"],
    ]
    r = enviar(a, base_id, xlsx(composicoes=composicoes))
    assert r.status_code == 400
    assert "circular" in r.json()["detail"]


def test_importacao_considera_composicoes_ja_existentes_na_base(a, base_id):
    nova_composicao(a, base_id, "A")
    nova_composicao(a, base_id, "B", [item("PROPRIA", "COMPOSICAO", "A", 1)])
    # importar A dependendo de B fecha o ciclo com o B que já está na base
    r = enviar(a, base_id, xlsx(composicoes=[["A", "A", "M2", "", "PROPRIA", "COMPOSICAO", "B", "1"]]))
    assert r.status_code == 400
    # importar só uma composição nova que usa a existente é válido
    ok = enviar(a, base_id, xlsx(composicoes=[["Z", "Z", "M2", "", "PROPRIA", "COMPOSICAO", "B", "1"]]))
    assert ok.status_code == 200


def test_importacao_rejeita_arquivos_invalidos(a, base_id):
    assert enviar(a, base_id, b"nao e uma planilha").status_code == 400
    assert enviar(a, base_id, b"PK\x03\x04quebrado").status_code == 400
    sem_abas = BytesIO()
    with pd.ExcelWriter(sem_abas, engine="openpyxl") as escritor:
        pd.DataFrame([[1]]).to_excel(escritor, sheet_name="Outra", index=False)
    r = enviar(a, base_id, sem_abas.getvalue())
    assert r.status_code == 400
    assert "abas" in r.json()["detail"]

    colunas_erradas = BytesIO()
    with pd.ExcelWriter(colunas_erradas, engine="openpyxl") as escritor:
        pd.DataFrame([["x"]], columns=["foo"]).to_excel(escritor, sheet_name="Insumos", index=False)
    assert "sem as colunas" in enviar(a, base_id, colunas_erradas.getvalue()).json()["detail"]

    assert enviar(a, base_id, b"PK" + b"0" * (5 * 1024 * 1024 + 1)).status_code == 400


def test_parser_expoe_o_contrato_da_base():
    parser = BasePropriaExcelParser(gerar_modelo_xlsx())
    assert parser.identificar_abas_dados() == ["Insumos", "Composições"]
    assert parser.classificar_tipo_composicao("Insumos") == "PROPRIA"
    assert parser.extrair_metadados()["fonte"] == "PROPRIA"
    composicoes, itens = parser.extrair_registros_aba("Composições")
    assert len(composicoes) == 2
    assert len(itens) == 5
    assert parser.erros == []


# --- Repositório -------------------------------------------------------------


def test_termo_de_busca_remove_caracteres_de_filtro():
    assert _termo_seguro("a,b(c)%d_e*") == "a b c d e"


def test_repositorio_pagina_alem_de_mil_linhas(banco):
    base = str(uuid.uuid4())
    banco.tabelas["base_propria_insumos"] = [
        {"id": str(i), "base_id": base, "codigo": f"{i:05d}", "descricao": "x", "unidade": "UN", "tipo": "MATERIAL"}
        for i in range(1005)
    ]
    assert len(BasePropriaRepository(banco).todos_insumos(base)) == 1005


def test_repositorio_consulta_de_preco_trata_falha_como_sem_preco():
    class Quebrado:
        def table(self, _):
            raise RuntimeError("boom")

    assert (
        BasePropriaRepository(Quebrado()).buscar_preco_insumo_oficial("1", "CE", "10/2026", "Sem Desoneração", "SINAPI")
        is None
    )


# --- Isolamento entre usuários -----------------------------------------------


def test_usuario_b_nao_enxerga_nem_altera_a_base_do_usuario_a(api):
    a = api(USUARIO_A)
    base = a.post("/bases-proprias", json={"nome": "Base do A"}).json()["id"]
    insumo = novo_insumo(a, base, "INS-1", 10)
    comp = nova_composicao(a, base, "C1", [item("PROPRIA", "INSUMO", "INS-1", 1)])

    b = api(USUARIO_B)
    assert b.get("/bases-proprias").json() == []

    raiz = f"/bases-proprias/{base}"
    acessos = [
        ("get", raiz, None),
        ("put", raiz, {"nome": "invadida"}),
        ("delete", raiz, None),
        ("post", f"{raiz}/duplicar", None),
        ("get", f"{raiz}/insumos", None),
        ("post", f"{raiz}/insumos", {"codigo": "X", "descricao": "x", "unidade": "UN", "tipo": "MATERIAL", "preco": 1}),
        ("get", f"{raiz}/insumos/{insumo['id']}", None),
        ("put", f"{raiz}/insumos/{insumo['id']}", {"preco": 0}),
        ("delete", f"{raiz}/insumos/{insumo['id']}", None),
        ("get", f"{raiz}/composicoes", None),
        ("post", f"{raiz}/composicoes", {"codigo": "X", "descricao": "x", "unidade": "M2"}),
        ("get", f"{raiz}/composicoes/{comp['id']}", None),
        ("put", f"{raiz}/composicoes/{comp['id']}", {"grupo": "x"}),
        ("delete", f"{raiz}/composicoes/{comp['id']}", None),
        ("get", f"{raiz}/composicoes/{comp['id']}/preco?uf=CE&mes=10/2026", None),
        ("post", f"{raiz}/composicoes/{comp['id']}/itens", item("SINAPI", "INSUMO", "1", 1)),
        ("put", f"{raiz}/composicoes/{comp['id']}/itens/{comp['itens'][0]['id']}", {"coeficiente": 9}),
        ("delete", f"{raiz}/composicoes/{comp['id']}/itens/{comp['itens'][0]['id']}", None),
    ]
    for metodo, url, corpo in acessos:
        r = getattr(b, metodo)(url, **({"json": corpo} if corpo is not None else {}))
        assert r.status_code == 404, f"{metodo.upper()} {url} devolveu {r.status_code}"
        assert r.json()["detail"] == "Base não encontrada"

    r = enviar(b, base, gerar_modelo_xlsx())
    assert r.status_code == 404

    # nada mudou para o dono
    a = api(USUARIO_A)
    assert a.get(raiz).json()["nome"] == "Base do A"
    assert len(a.get(f"{raiz}/insumos").json()) == 1
    assert len(a.get(f"{raiz}/composicoes/{comp['id']}").json()["itens"]) == 1


def test_base_inexistente_responde_404(a):
    assert a.get(f"/bases-proprias/{uuid.uuid4()}").status_code == 404


def test_repositorio_nunca_devolve_base_de_outro_dono(banco):
    repo = BasePropriaRepository(banco)
    base = repo.criar_base({"user_id": USUARIO_A, "nome": "A"})
    assert repo.buscar_base(base["id"], USUARIO_B) is None
    assert repo.atualizar_base(base["id"], USUARIO_B, {"nome": "x"}) is None
    repo.deletar_base(base["id"], USUARIO_B)
    assert repo.buscar_base(base["id"], USUARIO_A)["nome"] == "A"
