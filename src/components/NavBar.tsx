import { useState, useMemo } from 'react';
import type { Message } from '../types';
import { ThemeToggle } from './ThemeToggle';
import { ExportPDF } from './ExportPDF';
import { HelpModal } from './HelpModal';

interface NavBarProps {
  messages: Message[];
}

export function NavBar({ messages }: NavBarProps) {
  const [helpOpen, setHelpOpen] = useState(false);

  const memberCount = useMemo(() => {
    const senders = new Set(messages.filter(m => !m.isSystemMessage).map(m => m.sender));
    return senders.size;
  }, [messages]);

  return (
    <>
      <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">A Nossa Turma</h1>
            <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
              {memberCount} membros
            </span>
          </div>
          <div className="flex items-center gap-2">
            <ExportPDF targetId="dashboard-content" />
            <button
              onClick={() => setHelpOpen(true)}
              className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              aria-label="Ajuda"
            >
              <svg className="w-5 h-5 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </button>
            <ThemeToggle />
          </div>
        </div>
      </header>
      <HelpModal open={helpOpen} onClose={() => setHelpOpen(false)} />
    </>
  );
}
