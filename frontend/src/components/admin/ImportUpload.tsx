'use client';

import { useState } from 'react';
import { Desktop } from '@phosphor-icons/react';
import { importWorksheet } from '@/lib/api/importacao';

export function ImportUpload() {
    const [files, setFiles] = useState<File[]>([]);

    const [importing, setImporting] = useState(false);
    const [source, setSource] = useState('SINAPI');
    const [error, setError] = useState<string | null>(null);
    const [importResult, setImportResult] = useState<any>(null);

    const limparArquivo = () => {
        const el = document.getElementById('file_complete') as HTMLInputElement | null;
        if (el) el.value = '';
    };

    const handleImport = async () => {
        if (files.length === 0) {
            setError(`Selecione o(s) arquivo(s) ${source} para importar.`);
            return;
        }

        setImporting(true);
        setError(null);
        setImportResult(null);

        try {
            const result = await importWorksheet(files, source);
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

    const semArquivo = importing || files.length === 0;

    return (
        <>
        {/* Mobile: os arquivos oficiais são grandes; avisa que o computador é o melhor lugar */}
        <div className="gp-only-m">
            <div role="note" className="gp-4e-nota">
                <Desktop size={22} weight="bold" aria-hidden="true" style={{ flex: '0 0 22px' }} />
                <p style={{ margin: 0 }}>
                    <strong>Melhor no computador.</strong> Os arquivos oficiais são grandes e a importação pode demorar. No celular, mantenha esta tela aberta até o fim.
                </p>
            </div>
        </div>
        <div className="gp-split">
            <section className="gp-card gp-pad gp-main" aria-labelledby="h-nv" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <h2 id="h-nv" className="gp-h2">Nova importação</h2>
                <div className="gp-fld">
                    <label htmlFor="source" className="gp-lb">Fonte</label>
                    <select
                        id="source"
                        value={source}
                        onChange={(e) => { setSource(e.target.value); setFiles([]); limparArquivo(); }}
                        className="gp-in"
                    >
                        <option value="SINAPI">SINAPI (Nacional)</option>
                        <option value="SEINFRA">SEINFRA (Ceará)</option>
                    </select>
                </div>

                <div className="gp-fld">
                    <label htmlFor="file_complete" className="gp-lb">{source === 'SEINFRA' ? 'Arquivos Excel (.xls) — Insumos e Composições' : 'Arquivo Excel (.xlsx)'}</label>
                    <input
                        id="file_complete"
                        type="file"
                        accept=".xls,.xlsx"
                        multiple={source === 'SEINFRA'}
                        onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
                        disabled={importing}
                        style={{ padding: 28, border: '2px dashed #7B8AA0', borderRadius: 16, background: '#F4F6FA', color: '#001b3d', fontSize: 15, width: '100%', boxSizing: 'border-box' }}
                    />
                    <span className="gp-hint">
                        {source === 'SINAPI'
                            ? 'O sistema buscará automaticamente as abas CSD, CCD e CSE neste arquivo.'
                            : 'Selecione juntos o arquivo de Insumos e o de Composições da mesma tabela (mesmos encargos sociais).'}
                    </span>
                </div>

                {error && (
                    <p role="alert" className="gp-bg gp-da" style={{ margin: 0, whiteSpace: 'normal', borderRadius: 14, padding: '10px 14px' }}>
                        {error}
                    </p>
                )}

                <button
                    type="button"
                    className="gp-btn gp-bp gp-4e-start"
                    onClick={handleImport}
                    disabled={semArquivo}
                    style={semArquivo ? { background: '#E6EBF2', color: '#475569', cursor: 'not-allowed' } : undefined}
                >
                    {importing ? 'Processando (Isso pode demorar)...' : 'Importar Tabela Completa'}
                </button>

                {importResult && (
                    <div role="status" style={{ padding: 16, borderRadius: 14, background: '#F4F6FA', display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>
                            {importResult.status === 'parcial' ? 'Importação Concluída com Falhas' : 'Importação Concluída com Sucesso!'}
                        </h3>
                        {importResult.falhas?.length > 0 && (
                            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 14, color: '#B91C1C' }}>
                                {importResult.falhas.map((f: { arquivo: string; motivo: string }) => (
                                    <li key={f.arquivo}>{f.arquivo}: {f.motivo}</li>
                                ))}
                            </ul>
                        )}
                        <p style={{ margin: 0, fontSize: 14, color: '#334155' }}>Resumo do processamento:</p>
                        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 14 }}>
                            <li><strong>{importResult.imported_items}</strong> Composições cadastradas/atualizadas</li>
                            <li><strong>{importResult.imported_prices}</strong> Preços de composições atualizados</li>
                            <li><strong>{importResult.imported_analitico ?? 0}</strong> Itens analíticos (composição → insumo)</li>
                            <li><strong>{importResult.imported_insumo_prices ?? 0}</strong> Preços de insumos atualizados</li>
                        </ul>
                        <button
                            type="button"
                            className="gp-btn gp-bs gp-sm"
                            style={{ alignSelf: 'flex-end' }}
                            onClick={() => { setFiles([]); setImportResult(null); limparArquivo(); }}
                        >
                            Nova Importação
                        </button>
                    </div>
                )}
            </section>
            <aside className="gp-card gp-pad gp-dark gp-side" aria-labelledby="h-info" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <h2 id="h-info" className="gp-h2" style={{ color: '#fff' }}>Como funciona</h2>
                <p style={{ margin: 0, fontSize: 14, color: '#cbd5e1', lineHeight: 1.5 }}>
                    Faça upload das planilhas (SINAPI ou SEINFRA) para atualizar a base de dados. O sistema extrai automaticamente a data base e processa os encargos conforme a fonte selecionada.
                </p>
            </aside>
        </div>
        </>
    );
}
