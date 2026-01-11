import * as React from "react"

type OrçamentoFormProps = {
  action: "GET" | "POST" | "PUT" | "DELETE";
}

export function OrçamentoForm({ action }: OrçamentoFormProps) {
  return (
    <div>
      <form action={action}>
        <div className="mb-4">
          <label className="block text-sm font-bold mb-2" htmlFor="nome">Nome do Orçamento</label>
          <input className="border border-gray-300 p-2 w-full" type="text" id="nome" name="nome" placeholder="Digite o nome do orçamento" />
          <label htmlFor="descricao">Cliente</label>
          <input className="border border-gray-300 p-2 w-full" type="text" id="cliente" name="cliente" placeholder="Digite o nome do cliente" />
        </div>
      </form>
    </div>
  )
}