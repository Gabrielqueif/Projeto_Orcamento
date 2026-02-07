'use client';

import { useState } from 'react';
import { importSinapi } from '@/lib/api/sinapi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function SinapiUpload() {
    const [fileCSD, setFileCSD] = useState<File | null>(null);
    const [fileCCD, setFileCCD] = useState<File | null>(null);
    const [fileCSE, setFileCSE] = useState<File | null>(null);
    // Removed fileCCD and fileCSE states as per instruction

    const [importing, setImporting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [importResult, setImportResult] = useState<any>(null);

    const handleImport = async () => {
        if (!fileCSD) { // Reusing fileCSD state as main file
            setError('Selecione o arquivo SINAPI para importar.');
            return;
        }

        setImporting(true);
        setError(null);
        setImportResult(null);

        try {
            // New signature expects array, we send just one consolidated file
            const result = await importSinapi([fileCSD]);
            setImportResult(result);
        } catch (err: unknown) {
            console.error(err);
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('Erro ao realizar a importação completa.');
            }
        } finally {
            setImporting(false);
        }
    };

    return (
        <Card className="w-full max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle>Importar Tabela SINAPI Completa</CardTitle>
                <CardDescription>
                    Selecione o arquivo Excel Consolidado (contendo abas CSD, CCD, CSE) para importar tanto o catálogo quanto os preços variados.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">

                <div className="grid w-full items-center gap-1.5">
                    <Label htmlFor="file_complete" className="text-gray-700 font-medium">Arquivo SINAPI (Excel)</Label>
                    <Input
                        id="file_complete"
                        type="file"
                        accept=".xls,.xlsx"
                        onChange={(e) => setFileCSD(e.target.files?.[0] || null)} // Use one state
                        disabled={importing}
                    />
                    <p className="text-xs text-muted-foreground">O sistema buscará automaticamente as abas CSD, CCD e CSE neste arquivo.</p>
                </div>

                {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
                        {error}
                    </div>
                )}

                <div className="flex justify-end pt-4">
                    <Button
                        className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
                        onClick={handleImport}
                        disabled={importing || !fileCSD}
                    >
                        {importing ? 'Processando (Isso pode demorar)...' : 'Importar Tabela Completa'}
                    </Button>
                </div>

                {importResult && (
                    <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md animate-in fade-in duration-500">
                        <h3 className="font-semibold text-blue-800 mb-2">Importação Concluída com Sucesso!</h3>
                        <p className="text-sm text-blue-700">
                            Resumo do processamento:
                        </p>
                        <ul className="list-disc list-inside text-sm text-blue-700 mt-2">
                            <li><strong>{importResult.imported_items}</strong> Composições cadastradas/atualizadas</li>
                            <li><strong>{importResult.imported_prices}</strong> Preços atualizados (CSD, CCD, CSE)</li>
                        </ul>
                        <div className="mt-4 flex justify-end">
                            <Button variant="outline" onClick={() => {
                                setFileCSD(null);
                                setImportResult(null);
                                const el = document.getElementById('file_complete') as HTMLInputElement;
                                if (el) el.value = '';
                            }}>
                                Nova Importação
                            </Button>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
