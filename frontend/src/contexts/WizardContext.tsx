"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

export interface Item {
  id: number;
  nome: string;
  qtd: number;
  preco: number;
}

export interface Etapa {
  id: number;
  nome: string;
  itens: Item[];
}

interface WizardData {
  // Etapa 1: Dados Gerais
  nome: string;
  cliente: string;
  tipo: string;
  estado: string; // Adicionado para preços regionais
  endereco: string;
  dataInicio: string;
  dataTermino: string;
  baseReferencia: string; // Adicionado para selecionar a base do SINAPI
  
  // Etapa 2: Equipe
  membros: string[]; 
  
  // Etapa 3: Orçamento
  metragem: number;
  etapas: Etapa[];
}

interface WizardContextType {
  data: WizardData;
  updateData: (newData: Partial<WizardData>) => void;
  resetWizard: () => void;
}

const initialData: WizardData = {
  nome: "",
  cliente: "",
  tipo: "",
  estado: "", 
  endereco: "",
  dataInicio: "",
  dataTermino: "",
  baseReferencia: "", 
  membros: ["Você (Gestor)"],
  metragem: 500,
  etapas: [],
};


const WizardContext = createContext<WizardContextType | undefined>(undefined);

export function WizardProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<WizardData>(initialData);

  const updateData = (newData: Partial<WizardData>) => {
    setData((prev) => ({ ...prev, ...newData }));
  };

  const resetWizard = () => setData(initialData);

  return (
    <WizardContext.Provider value={{ data, updateData, resetWizard }}>
      {children}
    </WizardContext.Provider>
  );
}

export function useWizard() {
  const context = useContext(WizardContext);
  if (context === undefined) {
    throw new Error("useWizard must be used within a WizardProvider");
  }
  return context;
}
