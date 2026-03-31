import { useState, useCallback } from 'react';
import type { Message, InfractionsResult } from '../types';
import { StatutesEditor } from './StatutesEditor';
import { InfractionsChart } from './InfractionsChart';

interface InfractionsAnalysisProps {
  messages: Message[];
}

export function InfractionsAnalysis({ messages }: InfractionsAnalysisProps) {
  const [statutes, setStatutes] = useState('');
  const [result, setResult] = useState<InfractionsResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStatutesChange = useCallback((value: string) => {
    setStatutes(value);
  }, []);

  async function runAnalysis() {
    if (!statutes.trim()) {
      setError('Adicione os estatutos do grupo antes de analisar.');
      return;
    }

    const nonSystem = messages.filter((m) => !m.isSystemMessage);
    if (nonSystem.length === 0) {
      setError('Sem mensagens para analisar.');
      return;
    }

    // Aggregate messages per user
    const byUser = new Map<string, string[]>();
    for (const msg of nonSystem) {
      if (!byUser.has(msg.sender)) byUser.set(msg.sender, []);
      byUser.get(msg.sender)!.push(msg.content);
    }

    const userMessages = Array.from(byUser.entries()).map(([user, msgs]) => ({
      user,
      messages: msgs,
    }));

    setIsAnalyzing(true);
    setError(null);

    try {
      const response = await fetch('/api/analyze-infractions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statutes, userMessages }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? `Erro ${response.status}`);
      }

      const data = (await response.json()) as InfractionsResult;
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setIsAnalyzing(false);
    }
  }

  const totalInfractions = result?.results.reduce((sum, u) => sum + u.infractions.length, 0) ?? 0;
  const usersWithInfractions = result?.results.filter((u) => u.infractions.length > 0).length ?? 0;

  return (
    <div className="space-y-4">
      <StatutesEditor onStatutesChange={handleStatutesChange} />

      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Análise de Infrações
          </h2>

          <button
            onClick={runAnalysis}
            disabled={isAnalyzing}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-medium rounded-md transition-colors"
          >
            {isAnalyzing ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                A analisar…
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2h-2"
                  />
                </svg>
                Analisar mensagens
              </>
            )}
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        {result && (
          <div className="space-y-4">
            <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-400">
              <span>
                <strong className="text-gray-900 dark:text-white">{totalInfractions}</strong>{' '}
                infração{totalInfractions !== 1 ? 'ões' : ''} detetada{totalInfractions !== 1 ? 's' : ''}
              </span>
              <span>
                <strong className="text-gray-900 dark:text-white">{usersWithInfractions}</strong>{' '}
                utilizador{usersWithInfractions !== 1 ? 'es' : ''} envolvido{usersWithInfractions !== 1 ? 's' : ''}
              </span>
            </div>
            <InfractionsChart data={result.results} />
          </div>
        )}

        {!result && !isAnalyzing && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Clique em <strong>Analisar mensagens</strong> para que a IA verifique as mensagens do grupo contra os estatutos definidos.
          </p>
        )}
      </div>
    </div>
  );
}
