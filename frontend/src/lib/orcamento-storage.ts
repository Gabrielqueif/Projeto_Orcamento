// src/lib/orcamento-storage.ts

import { IOrcamento } from "@/types/sinapi";

// Chave para salvar os dados no localStorage. Evita "magic strings".
const STORAGE_KEY = 'meu-orcamento-app:orcamentos';

/**
 * Lista todos os orçamentos salvos no localStorage.
 * Retorna um array vazio se não houver nada salvo ou em ambiente de servidor.
 * @returns {IOrcamento[]} A lista de orçamentos.
 */
export function listarOrcamentos(): IOrcamento[] {
    // localStorage só existe no navegador, esta verificação previne erros no servidor (SSR)
    if (typeof window === 'undefined') {
        return [];
    }

    try {
        const dadosSalvos = localStorage.getItem(STORAGE_KEY);
        return dadosSalvos ? JSON.parse(dadosSalvos) : [];
    } catch (error) {
        console.error("Erro ao ler orçamentos do localStorage:", error);
        return [];
    }
}

/**
 * Salva um orçamento. Se já existir um com o mesmo ID, ele será atualizado.
 * Se não, será adicionado à lista.
 * @param {IOrcamento} orcamentoParaSalvar O objeto do orçamento a ser salvo.
 */
export function salvarOrcamento(orcamentoParaSalvar: IOrcamento): void {
    if (typeof window === 'undefined') return;

    const orcamentosAtuais = listarOrcamentos();
    const indexExistente = orcamentosAtuais.findIndex(o => o.id === orcamentoParaSalvar.id);

    if (indexExistente > -1) {
        // Atualiza o orçamento existente
        orcamentosAtuais[indexExistente] = orcamentoParaSalvar;
    } else {
        // Adiciona o novo orçamento
        orcamentosAtuais.push(orcamentoParaSalvar);
    }

    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(orcamentosAtuais));
    } catch (error) {
        console.error("Erro ao salvar orçamento no localStorage:", error);
    }
}

/**
 * Busca um orçamento específico pelo seu ID.
 * @param {string} id O ID do orçamento a ser buscado.
 * @returns {IOrcamento | undefined} O orçamento encontrado ou undefined.
 */
export function buscarOrcamentoPorId(id: string): IOrcamento | undefined {
    const orcamentos = listarOrcamentos();
    return orcamentos.find(o => o.id === id);
}

/**
 * Deleta um orçamento pelo seu ID.
 * @param {string} id O ID do orçamento a ser deletado.
 */
export function deletarOrcamento(id: string): void {
    if (typeof window === 'undefined') return;

    const orcamentosAtuais = listarOrcamentos();
    const orcamentosFiltrados = orcamentosAtuais.filter(o => o.id !== id);

    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(orcamentosFiltrados));
    } catch (error) {
        console.error("Erro ao deletar orçamento do localStorage:", error);
    }
}