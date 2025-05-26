'use client';

import { useEffect, useState } from 'react';

export default function Tabela() {
  const [data, setData] = useState<any[]>([]);
  const [next, setNext] = useState<string | null>(null);
  const [previous, setPrevious] = useState<string | null>(null);
  const [pageUrl, setPageUrl] = useState('/api/composicoes/?page=1');

  useEffect(() => {
      fetch(`http://localhost:8000${pageUrl}`)
      .then(res => res.json())
      .then(res => {
        setData(res.results);
        setNext(res.next ? new URL(res.next).pathname + new URL(res.next).search : null);
        setPrevious(res.previous ? new URL(res.previous).pathname + new URL(res.previous).search : null);
      });
  }, [pageUrl]);

  return (
    <div className="p-4">
      <div className="flex justify-between mt-4">
        <button
          disabled={!previous}
          onClick={() => previous && setPageUrl(previous)}
          className="bg-blue-500 text-white px-4 py-2 rounded disabled:bg-gray-400"
        >
          Anterior
        </button>
        <button
          disabled={!next}
          onClick={() => next && setPageUrl(next)}
          className="bg-blue-500 text-white px-4 py-2 rounded disabled:bg-gray-400"
        >
          Próxima
        </button>
      </div>
      <table className="table-auto border w-full">
        <thead>
          <tr>
            <th className="border px-2">Grupo</th>
            <th className="border px-2">Código da Composicao</th>
            <th className="border px-2">Tipo de Item</th>
            <th className="border px-2">Cóodigo de Item</th>
            <th className="border px-2">Descrição</th>
            <th className="border px-2">Unidade</th>
            <th className="border px-2">Coeficiente</th>
            
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <tr key={item.id}>
              <td className="border px-2">{item.grupo}</td>
              <td className="border px-2">{item.codigo_composicao}</td>
              <td className="border px-2">{item.tipo_item}</td>
              <td className="border px-2">{item.codigo_item}</td>
              <td className="border px-2">{item.descricao}</td>
              <td className="border px-2">{item.unidade}</td>
              <td className="border px-2">{item.coeficiente}</td>
              {/* Outras colunas */}
            </tr>
          ))}
        </tbody>
      </table>

      
    </div>
  );
}
