import type { SinapiBase } from '@/lib/api/orcamentos';

export interface FonteConfig {
  id: string;
  fonte: string;
  title: string;
  description: string;
}

export const FONTES: FonteConfig[] = [
  {
    id: 'sinapi',
    fonte: 'SINAPI',
    title: 'Base de dados SINAPI',
    description:
      'Dados oficiais do SINAPI (Sistema Nacional de Pesquisa de Custos e Índices da Construção Civil).',
  },
  {
    id: 'seinfra',
    fonte: 'SEINFRA',
    title: 'Base de dados SEINFRA-CE',
    description: 'Tabela de custos da Secretaria da Infraestrutura do Ceará (SEINFRA-CE).',
  },
];

export function fonteDoId(id: string): FonteConfig | undefined {
  return FONTES.find((f) => f.id === id.toLowerCase());
}

export function agruparPorFonte(bases: SinapiBase[]): Record<string, SinapiBase[]> {
  return bases.reduce<Record<string, SinapiBase[]>>((acc, base) => {
    const chave = (base.fonte || 'SINAPI').toUpperCase();
    (acc[chave] ||= []).push(base);
    return acc;
  }, {});
}
