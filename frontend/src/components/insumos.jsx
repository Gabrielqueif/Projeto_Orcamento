import { useEffect, useState } from "react";
import axios from "axios";

const Insumos = () => {
  const [insumos, setInsumos] = useState([]);

  useEffect(() => {
    axios.get("http://127.0.0.1:8000/api/insumos") // Certifique-se de que a URL está correta
      .then((response) => {
        console.log("Dados recebidos:", response.data); // Verifique os dados no console
        setInsumos(response.data);
      })
      .catch((error) => console.error("Erro ao buscar insumos:", error));
  }, []);

  return (
    <div>
      <h1>Lista de Insumos</h1>
      <table border="1" style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th>Classificação</th>
            <th>Código</th>
            <th>Descrição</th>
            <th>Unidade</th>
            <th>Origem de Preço</th>
            <th>AC</th>
            <th>AL</th>
            <th>AP</th>
            <th>AM</th>
            <th>BA</th>
            <th>CE</th>
            <th>DF</th>
            <th>ES</th>
            <th>GO</th>
            <th>MA</th>
            <th>MT</th>
            <th>MS</th>
            <th>MG</th>
            <th>PA</th>
            <th>PB</th>
            <th>PR</th>
            <th>PE</th>
            <th>PI</th>
            <th>RJ</th>
            <th>RN</th>
            <th>RS</th>
            <th>RO</th>
            <th>RR</th>
            <th>SC</th>
            <th>SP</th>
            <th>SE</th>
            <th>TO</th>
          </tr>
        </thead>
        <tbody>
          {insumos.length > 0 ? (
            insumos.map((insumo) => (
              <tr key={insumo.id}>
                <td>{insumo.classificacao}</td>
                <td>{insumo.codigo_insumo}</td>
                <td>{insumo.descricao_do_insumo}</td>
                <td>{insumo.unidade}</td>
                <td>{insumo.origem_de_preco}</td>
                <td>{insumo.AC}</td>
                <td>{insumo.AL}</td>
                <td>{insumo.AP}</td>
                <td>{insumo.AM}</td>
                <td>{insumo.BA}</td>
                <td>{insumo.CE}</td>
                <td>{insumo.DF}</td>
                <td>{insumo.ES}</td>
                <td>{insumo.GO}</td>
                <td>{insumo.MA}</td>
                <td>{insumo.MT}</td>
                <td>{insumo.MS}</td>
                <td>{insumo.MG}</td>
                <td>{insumo.PA}</td>
                <td>{insumo.PB}</td>
                <td>{insumo.PR}</td>
                <td>{insumo.PE}</td>
                <td>{insumo.PI}</td>
                <td>{insumo.RJ}</td>
                <td>{insumo.RN}</td>
                <td>{insumo.RS}</td>
                <td>{insumo.RO}</td>
                <td>{insumo.RR}</td>
                <td>{insumo.SC}</td>
                <td>{insumo.SP}</td>
                <td>{insumo.SE}</td>
                <td>{insumo.TO}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="32">Nenhum dado disponível.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Insumos;