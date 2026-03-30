import { useState, useEffect } from 'react';
import type { Message } from '../types';
import { parseImportedRawData } from '../utils/importParsers';

export function useCrData() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const response = await fetch('/cr.txt');
        if (!response.ok) {
          throw new Error(`Erro ao carregar o ficheiro (${response.status}).`);
        }
        const text = await response.text();
        const result = parseImportedRawData({ format: 'txt', fileName: 'cr.txt', content: text });
        setMessages(result.messages);
      } catch {
        setError('Erro ao carregar os dados do grupo.');
      } finally {
        setIsLoading(false);
      }
    }
    void load();
  }, []);

  return { messages, isLoading, error };
}
