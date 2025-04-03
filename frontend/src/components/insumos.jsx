import { useEffect, useState } from "react";
import axios from "axios";

const Insumos = () => {
  const [insumos, setInsumos] = useState([]);

  useEffect(() => {
    axios
      .get("http://127.0.0.1:8000/api/insumos") // Certifique-se de que a URL está correta
      .then((response) => setInsumos(response.data))
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
          {insumos.map((insumos) => (
            <tr key={insumos.id}>
              <td>{insumos.classificacao}</td>
              <td>{insumos.codigo_insumo}</td>
              <td>{insumos.descricao_do_insumo}</td>
              <td>{insumos.unidade}</td>
              <td>{insumos.origem_de_preco}</td>
              <td>{insumos.AC}</td>
              <td>{insumos.AL}</td>
              <td>{insumos.AP}</td>
              <td>{insumos.AM}</td>
              <td>{insumos.BA}</td>
              <td>{insumos.CE}</td>
              <td>{insumos.DF}</td>
              <td>{insumos.ES}</td>
              <td>{insumos.GO}</td>
              <td>{insumos.MA}</td>
              <td>{insumos.MT}</td>
              <td>{insumos.MS}</td>
              <td>{insumos.MG}</td>
              <td>{insumos.PA}</td>
              <td>{insumos.PB}</td>
              <td>{insumos.PR}</td>
              <td>{insumos.PE}</td>
              <td>{insumos.PI}</td>
              <td>{insumos.RJ}</td>
              <td>{insumos.RN}</td>
              <td>{insumos.RS}</td>
              <td>{insumos.RO}</td>
              <td>{insumos.RR}</td>
              <td>{insumos.SC}</td>
              <td>{insumos.SP}</td>
              <td>{insumos.SE}</td>
              <td>{insumos.TO}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Insumos;