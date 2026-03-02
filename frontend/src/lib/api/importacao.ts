import { fetchWithAuth } from './client';

export interface SinapiMetadata {
    mes_referencia: string;
    uf: string;
    desoneracao: string;
}

export async function uploadWorksheet(file: File, source: string = "SINAPI"): Promise<SinapiMetadata> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetchWithAuth(`/importacao/upload?source=${source}`, {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Erro ao enviar planilha');
    }

    return response.json();
}

export async function importWorksheet(files: File[], source: string = "SINAPI"): Promise<any> {
    const formData = new FormData();
    files.forEach(file => {
        formData.append('files', file); // 'files' must match backend parameter name
    });

    const response = await fetchWithAuth(`/importacao/import?source=${source}`, {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Erro ao importar dados');
    }

    return response.json();
}
