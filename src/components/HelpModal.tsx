interface HelpModalProps {
  open: boolean;
  onClose: () => void;
}

export function HelpModal({ open, onClose }: HelpModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-lg bg-white dark:bg-gray-800 shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Como ler os gráficos
          </h3>
          <button
            onClick={onClose}
            className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
            aria-label="Fechar"
          >
            <svg className="w-5 h-5 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-4 space-y-4 text-sm text-gray-700 dark:text-gray-300 overflow-y-auto max-h-[60vh]">
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Resumo</h4>
            <p>Totais gerais do grupo: número de mensagens, participantes, período de atividade e o dia com mais mensagens enviadas.</p>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Pódio dos Mais Ativos</h4>
            <p>Os três participantes com mais mensagens enviadas, representados com medalhas de ouro, prata e bronze. Clicar numa medalha filtra os outros gráficos para esse participante.</p>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Pódio dos Menos Ativos</h4>
            <p>Os três participantes com menos mensagens, premiados com as medalhas de ferrugem, madeira e papelão. Funciona da mesma forma que o pódio dos mais ativos.</p>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Mensagens Enviadas</h4>
            <p>Gráfico de barras com todos os participantes ordenados por número de mensagens (do mais ao menos ativo). Clicar numa barra ou no nome filtra os restantes gráficos.</p>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Menos Participativos</h4>
            <p>Versão invertida do gráfico anterior, destacando quem menos contribuiu para a conversa.</p>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Intervalos entre Mensagens</h4>
            <p>Tempo médio que cada participante demora a responder após uma mensagem de outro membro do grupo. Valores mais baixos indicam respostas mais rápidas.</p>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Filtros</h4>
            <p>Clicar em qualquer participante (nos gráficos de barras ou pódios) filtra todos os outros gráficos para mostrar apenas as mensagens desse participante. Para limpar o filtro, usar o botão <strong>Limpar Filtros</strong> que aparece no topo.</p>
          </div>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
