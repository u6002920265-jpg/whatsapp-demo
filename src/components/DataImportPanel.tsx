import { useEffect, useMemo, useRef, useState } from 'react';
import { useDataSource } from '../context/DataSourceContext';
import { HelpModal } from './HelpModal';

export function DataImportPanel() {
  const { kind, sourceName, groupName, importFile, resetToSample, loading, error } = useDataSource();
  const [openHelp, setOpenHelp] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSelectedFile(null);
  }, [kind, sourceName]);

  const subtitle = useMemo(() => {
    const label = kind === 'sample' ? 'Exemplo' : 'Importado';
    const group = groupName ? ` • Grupo: ${groupName}` : '';
    return `${label} • Ficheiro: ${sourceName}${group}`;
  }, [kind, sourceName, groupName]);

  const handleChoose = () => {
    inputRef.current?.click();
  };

  const handleImport = async () => {
    if (!selectedFile) return;
    setImporting(true);
    try {
      await importFile(selectedFile);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md mb-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Dados</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">{subtitle}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={inputRef}
            type="file"
            accept=".txt,.json,.csv"
            className="hidden"
            onChange={e => setSelectedFile(e.target.files?.[0] ?? null)}
          />

          <button
            onClick={handleChoose}
            className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            Escolher ficheiro
          </button>

          <button
            onClick={handleImport}
            disabled={!selectedFile || importing || loading}
            className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {importing ? 'Importando...' : 'Importar'}
          </button>

          <button
            onClick={() => setOpenHelp(true)}
            className="px-4 py-2 rounded bg-transparent border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Ajuda
          </button>

          <button
            onClick={() => void resetToSample()}
            disabled={loading || kind === 'sample'}
            className="px-4 py-2 rounded bg-transparent border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Grupo Riba
          </button>
        </div>
      </div>

      {selectedFile && (
        <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
          Selecionado: <strong>{selectedFile.name}</strong>
        </p>
      )}

      {error && (
        <div className="mt-3 rounded border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/20 p-3">
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      <HelpModal open={openHelp} onClose={() => setOpenHelp(false)} />
    </div>
  );
}
