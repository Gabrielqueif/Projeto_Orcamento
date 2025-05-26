'use client'
import {useEffect, useState } from "react"

export default function Insumos() {
  const [data, setData] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function fetchData() {
    try {
      const response = await fetch('http://localhost:8000/api/insumos');

      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (!result || !Array.isArray(result)) {
        setError('Formato de dados inválido');
        return;
      }
      
      setData(result);
      setError(null);
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
      setError(error instanceof Error ? error.message : 'Erro ao buscar dados');
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  if (error) {
    return <div className="text-red-500 p-4">Erro: {error}</div>;
  }

  if (data.length === 0) {
    return <div className="p-4">Carregando dados...</div>;
  }
  
  return (
    <div className="p-4">
      <table className="table-auto border w-full">
        <thead className="bg-gray-200">
          <tr className="text-center">
            <th className ='border-2'>classificacao</th>
            <th className ='border-2'>codigo_insumo</th>
            <th className ='border-2'>descricao_do_insumo</th>
            <th className ='border-2'>unidade</th>
            <th className ='border-2'>origem_de_preco</th>
            <th className ='border-2'>AC</th>
            <th className ='border-2'>AL</th>
            <th className ='border-2'>AP</th>
            <th className ='border-2'>AM</th>
            <th className ='border-2'>BA</th>
            <th className ='border-2'>CE</th>
            <th className ='border-2'>DF</th>
            <th className ='border-2'>ES</th>
            <th className ='border-2'>GO</th>
            <th className ='border-2'>MA</th>
            <th className ='border-2'>MT</th>
            <th className ='border-2'>MS</th>
            <th className ='border-2'>MG</th>
            <th className ='border-2'>PA</th>
            <th className ='border-2'>PB</th>
            <th className ='border-2'>PR</th>
            <th className ='border-2'>PE</th>
            <th className ='border-2'>PI</th>
            <th className ='border-2'>RJ</th>
            <th className ='border-2'>RN</th>
            <th className ='border-2'>RS</th>
            <th className ='border-2'>RO</th>
            <th className ='border-2'>RR</th>
            <th className ='border-2'>SC</th>
            <th className ='border-2'>SP</th>
            <th className ='border-2'>SE</th>
            <th className ='border-2'>TO</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (            
            <tr key={item.codigo_insumo} className="text-center">
              <td className ='border-2'>{item.id}</td>
              <td className ='border-2'>{item.classificacao}</td>
              <td className ='border-2'>{item.codigo_insumo}</td>
              <td className ='border-2'>{item.descricao_do_insumo}</td>
              <td className ='border-2'>{item.unidade}</td>
              <td className ='border-2'>{item.origem_de_preco}</td>
              <td className ='border-2'>{item.AC}</td>
              <td className ='border-2'>{item.AL}</td>
              <td className ='border-2'>{item.AP}</td>
              <td className ='border-2'>{item.AM}</td>
              <td className ='border-2'>{item.BA}</td>
              <td className ='border-2'>{item.CE}</td>
              <td className ='border-2'>{item.DF}</td>
              <td className ='border-2'>{item.ES}</td>
              <td className ='border-2'>{item.GO}</td>
              <td className ='border-2'>{item.MA}</td>
              <td className ='border-2'>{item.MT}</td>
              <td className ='border-2'>{item.MS}</td>
              <td className ='border-2'>{item.MG}</td>
              <td className ='border-2'>{item.PA}</td>
              <td className ='border-2'>{item.PB}</td>
              <td className ='border-2'>{item.PR}</td>
              <td className ='border-2'>{item.PE}</td>
              <td className ='border-2'>{item.PI}</td>
              <td className ='border-2'>{item.RJ}</td>
              <td className ='border-2'>{item.RN}</td>
              <td className ='border-2'>{item.RS}</td>
              <td className ='border-2'>{item.RO}</td>
              <td className ='border-2'>{item.RR}</td>
              <td className ='border-2'>{item.SC}</td>
              <td className ='border-2'>{item.SP}</td>
              <td className ='border-2'>{item.TO}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}