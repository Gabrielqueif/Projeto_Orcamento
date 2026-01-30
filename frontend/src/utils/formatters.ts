export const formatarMoeda = (valor: number | null): string => {
    if (valor === null || valor === undefined) return "R$ 0,00";
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
};

export const formatarData = (data: string): string => {
    try {
        const date = new Date(data);
        return date.toLocaleDateString('pt-BR');
    } catch {
        return data;
    }
};
