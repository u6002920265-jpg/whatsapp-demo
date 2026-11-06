import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import type { InfractionsResult, Message, Severity } from '../types';
import {
  SEVERITY_LABEL,
  buildGameSnapshot,
  defaultAlias,
  fitasFor,
  initialReview,
  keptCount,
  messageCountsByUser,
  rankUsers,
  reviewUsers,
  usersForReview,
  type ReviewState,
  type ReviewedUser,
} from '../utils/snapshot';

interface SnapshotExportProps {
  messages: Message[];
  result: InfractionsResult;
  statutes: string;
}

const SEVERITY_BADGE: Record<Severity, string> = {
  low: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  medium: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300',
  high: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
};

const inputClass =
  'w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-1.5 py-1 text-xs text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500';

function fitasLabel(count: number): string {
  return `${count} ${count === 1 ? 'fita' : 'fitas'}`;
}

export function SnapshotExport({ messages, result, statutes }: SnapshotExportProps) {
  const [review, setReview] = useState<ReviewState>(() => initialReview(result));
  const [aliases, setAliases] = useState<Record<string, string>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [privacy, setPrivacy] = useState<'private' | 'public'>('private');
  const [statutesHash, setStatutesHash] = useState('sha256:…');
  const [generatedAt] = useState(() => new Date().toISOString());
  const [notice, setNotice] = useState('');
  const previousSelection = useRef<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function digest() {
      try {
        const bytes = new TextEncoder().encode(statutes);
        const hash = await crypto.subtle.digest('SHA-256', bytes);
        const hex = [...new Uint8Array(hash)]
          .map((byte) => byte.toString(16).padStart(2, '0'))
          .join('');
        if (!cancelled) setStatutesHash(`sha256:${hex}`);
      } catch {
        if (!cancelled) setStatutesHash('sha256:indisponivel');
      }
    }
    void digest();
    return () => {
      cancelled = true;
    };
  }, [statutes]);

  const messageCounts = useMemo(() => messageCountsByUser(messages), [messages]);
  const users = useMemo(
    () => reviewUsers(result, messageCounts, review),
    [result, messageCounts, review],
  );
  const ranked = useMemo(() => rankUsers(users), [users]);
  const selected = ranked.slice(0, 12);
  const candidates = ranked.slice(12, 15);
  const displayed = useMemo(() => usersForReview(users), [users]);
  const rankByName = useMemo(
    () => new Map(ranked.map((user, index) => [user.user, index + 1])),
    [ranked],
  );
  const selectedNames = new Set(selected.map((user) => user.user));

  const totalDetected = users.reduce((sum, user) => sum + user.originalInfractionCount, 0);
  const totalKept = users.reduce((sum, user) => sum + keptCount(user), 0);
  const totalRemoved = totalDetected - totalKept;
  const totalFitas = users.reduce((sum, user) => sum + fitasFor(user), 0);
  const filled = selected.filter((user) => fitasFor(user) === 0).length;
  const zeroUsers = users.filter((user) => user.originalInfractionCount === 0);
  const zeroDisplayed = displayed.filter((user) => user.originalInfractionCount === 0).length;
  const maxFitas = Math.max(1, ...ranked.map((user) => fitasFor(user)));
  const firstNotSelected = displayed.findIndex((user) => !selectedNames.has(user.user));

  const selectionKey = selected.map((user) => user.user).join('|');
  useEffect(() => {
    const current = selectionKey ? selectionKey.split('|') : [];
    const previous = previousSelection.current;
    if (previous.length > 0) {
      const entered = current.filter((name) => !previous.includes(name));
      const left = previous.filter((name) => !current.includes(name));
      if (entered.length > 0 || left.length > 0) {
        const parts: string[] = [];
        if (entered.length > 0) parts.push(`entrou ${entered.join(', ')}`);
        if (left.length > 0) parts.push(`saiu ${left.join(', ')}`);
        setNotice(`Elenco atualizado: ${parts.join('; ')}.`);
      }
    }
    previousSelection.current = current;
  }, [selectionKey]);

  function toggleInfraction(userName: string, index: number) {
    setReview((previous) => {
      const current = previous[userName] ?? { removed: [], severity: {} };
      const removed = current.removed.includes(index)
        ? current.removed.filter((value) => value !== index)
        : [...current.removed, index];
      return { ...previous, [userName]: { ...current, removed } };
    });
    setNotice('Revisão atualizada. O snapshot reflete as infrações mantidas.');
  }

  function changeSeverity(userName: string, index: number, severity: Severity) {
    setReview((previous) => {
      const current = previous[userName] ?? { removed: [], severity: {} };
      return {
        ...previous,
        [userName]: {
          ...current,
          severity: { ...current.severity, [index]: severity },
        },
      };
    });
    setNotice(`Gravidade alterada para ${SEVERITY_LABEL[severity]}.`);
  }

  function snapshotFor(mode: 'private' | 'public') {
    return buildGameSnapshot(users, {
      privacy: mode,
      aliases,
      statutesHash,
      generatedAt,
      reviewedAt: generatedAt,
    });
  }

  const preview = useMemo(
    () =>
      JSON.stringify(
        buildGameSnapshot(users, {
          privacy,
          aliases,
          statutesHash,
          generatedAt,
          reviewedAt: generatedAt,
        }),
        null,
        2,
      ),
    [users, privacy, aliases, statutesHash, generatedAt],
  );

  function download(mode: 'private' | 'public') {
    const blob = new Blob([JSON.stringify(snapshotFor(mode), null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = mode === 'public' ? 'game-data.public.json' : 'game-data.json';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setNotice(`Snapshot ${mode === 'public' ? 'público' : 'privado'} gerado.`);
  }

  async function copySnapshot() {
    const text = JSON.stringify(snapshotFor(privacy), null, 2);
    try {
      await navigator.clipboard.writeText(text);
      setNotice('JSON copiado.');
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand('copy');
        setNotice('JSON copiado.');
      } catch {
        setNotice('Não foi possível copiar; usa o download.');
      }
      textarea.remove();
    }
  }

  function statusFor(user: ReviewedUser) {
    if (!selectedNames.has(user.user)) {
      return { label: 'Candidato', className: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300' };
    }
    if (fitasFor(user) === 0) {
      return { label: 'Preenchimento', className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' };
    }
    return { label: 'No elenco', className: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300' };
  }

  return (
    <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-5" data-testid="snapshot-export">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Exportação do jogo
          </p>
          <h3 className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
            Mesa de revisão
          </h3>
          <p className="mt-1 max-w-3xl text-sm text-gray-500 dark:text-gray-400">
            Revê as deteções, ajusta a gravidade e remove falsos positivos. O elenco dos 12 e o
            snapshot atualizam-se à medida que decides.
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 px-3 py-2 text-xs text-gray-600 dark:text-gray-400">
          <strong className="text-gray-900 dark:text-white">{totalFitas}</strong> fitas ·{' '}
          <strong className="text-gray-900 dark:text-white">{totalKept}</strong> infrações
        </div>
      </div>

      <div
        role="status"
        data-testid="snapshot-stats"
        className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 px-3 py-2 text-xs text-gray-600 dark:text-gray-400"
      >
        <span><strong className="text-gray-900 dark:text-white">{totalDetected}</strong> {totalDetected === 1 ? 'detetada' : 'detetadas'}</span>
        <span>·</span>
        <span><strong className="text-gray-900 dark:text-white">{totalKept}</strong> {totalKept === 1 ? 'mantida' : 'mantidas'}</span>
        <span>·</span>
        <span><strong className="text-gray-900 dark:text-white">{totalRemoved}</strong> {totalRemoved === 1 ? 'removida' : 'removidas'}</span>
        <span>·</span>
        <span><strong className="text-gray-900 dark:text-white">{totalFitas}</strong> {totalFitas === 1 ? 'fita' : 'fitas'}</span>
        <span>·</span>
        <span><strong className="text-gray-900 dark:text-white">{selected.length}</strong> no elenco</span>
        {notice && <span className="ml-auto max-w-full truncate text-indigo-600 dark:text-indigo-400">{notice}</span>}
      </div>

      <div className="mt-4 grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0">
          <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
            <table className="w-full min-w-[760px] border-collapse text-sm" data-testid="snapshot-table">
              <thead className="bg-gray-50 dark:bg-gray-900/40 text-left text-[10px] uppercase tracking-wider text-gray-500 dark:text-gray-400">
                <tr>
                  <th className="px-3 py-2 font-semibold">#</th>
                  <th className="px-3 py-2 font-semibold">Participante</th>
                  <th className="px-3 py-2 font-semibold">Infrações</th>
                  <th className="px-3 py-2 font-semibold">Fitas</th>
                  <th className="px-3 py-2 font-semibold">Elenco</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {displayed.map((user, index) => {
                  const rank = rankByName.get(user.user) ?? index + 1;
                  const fitas = fitasFor(user);
                  const status = statusFor(user);
                  const isOpen = Boolean(expanded[user.user]);
                  return (
                    <Fragment key={user.user}>
                      {index === firstNotSelected && firstNotSelected > 0 && (
                        <tr>
                          <td
                            colSpan={6}
                            className="bg-gray-50 dark:bg-gray-900/40 px-3 py-1.5 text-[10px] uppercase tracking-wider text-gray-500 dark:text-gray-400"
                          >
                            Fora do elenco · candidatos
                          </td>
                        </tr>
                      )}
                      <tr className="align-top hover:bg-gray-50 dark:hover:bg-gray-700/30">
                        <td className="px-3 py-2 text-xs text-gray-400">{rank}</td>
                        <td className="px-3 py-2">
                          <div className="font-medium text-gray-900 dark:text-white">{user.user}</div>
                          <div className="text-[11px] text-gray-500 dark:text-gray-400">
                            {user.messageCount.toLocaleString('pt-PT')} mensagens
                          </div>
                        </td>
                        <td className="px-3 py-2 text-xs text-gray-600 dark:text-gray-300">
                          {keptCount(user)}/{user.originalInfractionCount}
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-gray-900 dark:text-white">{fitas}</span>
                            <div className="h-1 w-20 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-amber-500 to-red-600"
                                style={{ width: `${Math.min(100, (fitas / maxFitas) * 100)}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${status.className}`}>
                            {status.label}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-right">
                          <button
                            type="button"
                            onClick={() =>
                              setExpanded((previous) => ({ ...previous, [user.user]: !previous[user.user] }))
                            }
                            aria-expanded={isOpen}
                            className="rounded border border-gray-200 dark:border-gray-600 px-2 py-1 text-[10px] text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300"
                          >
                            {isOpen ? 'Fechar' : 'Ver infrações'}
                          </button>
                        </td>
                      </tr>
                      {isOpen && (
                        <tr>
                          <td colSpan={6} className="bg-gray-50 dark:bg-gray-900/40 px-3 py-3">
                            {user.infractions.length === 0 ? (
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                Sem infrações. Entra no elenco por preenchimento se faltarem pessoas
                                com fitas.
                              </p>
                            ) : (
                              <div className="space-y-2">
                                {user.infractions.map((infraction, infractionIndex) => (
                                  <div
                                    key={`${user.user}-${infractionIndex}`}
                                    className={`grid gap-2 rounded-md border p-2.5 md:grid-cols-[minmax(0,1fr)_auto] ${
                                      infraction.kept
                                        ? 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'
                                        : 'border-dashed border-gray-300 bg-gray-50 opacity-60 dark:border-gray-600 dark:bg-gray-900/40'
                                    }`}
                                  >
                                    <div>
                                      <div className="flex flex-wrap items-center gap-2">
                                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                                          {infraction.rule}
                                        </span>
                                        <span className={`inline-flex rounded px-1.5 py-0.5 text-[10px] font-semibold ${SEVERITY_BADGE[infraction.severity]}`}>
                                          {SEVERITY_LABEL[infraction.severity]}
                                        </span>
                                      </div>
                                      <p className="mt-1 text-xs italic text-gray-500 dark:text-gray-400">
                                        “{infraction.message}”
                                      </p>
                                    </div>
                                    <div className="flex items-center justify-end gap-2">
                                      <select
                                        value={infraction.severity}
                                        onChange={(event) =>
                                          changeSeverity(user.user, infractionIndex, event.target.value as Severity)
                                        }
                                        aria-label={`Gravidade de ${infraction.rule}`}
                                        className="rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-1.5 py-1 text-xs text-gray-700 dark:text-gray-200"
                                      >
                                        {(Object.keys(SEVERITY_LABEL) as Severity[]).map((severity) => (
                                          <option key={severity} value={severity}>
                                            {SEVERITY_LABEL[severity]}
                                          </option>
                                        ))}
                                      </select>
                                      <button
                                        type="button"
                                        onClick={() => toggleInfraction(user.user, infractionIndex)}
                                        className={`rounded border px-2 py-1 text-[10px] font-medium ${
                                          infraction.kept
                                            ? 'border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20'
                                            : 'border-gray-200 text-gray-600 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'
                                        }`}
                                      >
                                        {infraction.kept ? 'Remover' : 'Restaurar'}
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-[11px] text-gray-500 dark:text-gray-400">
            Mostra todas as deteções, os 12 do elenco e os 3 melhores candidatos sem infrações.
            {zeroUsers.length > zeroDisplayed
              ? ` ${zeroUsers.length - zeroDisplayed} membros sem infrações não estão listados.`
              : ''}{' '}
            A seleção é automática: mais fitas; desempate por infrações, mensagens e nome.
          </p>
        </div>

        <aside className="min-w-0 space-y-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 lg:sticky lg:top-24">
          <div>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Snapshot do jogo</h4>
            <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
              schema v1 · 12 participantes · {fitasLabel(totalFitas)}
              {filled > 0 ? ` · ${filled} por preenchimento` : ''}
            </p>
          </div>

          <div className="inline-flex rounded-md border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 p-0.5">
            {(['private', 'public'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setPrivacy(mode)}
                aria-pressed={privacy === mode}
                data-testid={`privacy-${mode}`}
                className={`rounded px-3 py-1 text-xs font-medium ${
                  privacy === mode
                    ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white'
                    : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                {mode === 'private' ? 'Privado' : 'Público'}
              </button>
            ))}
          </div>

          <div>
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Elenco
            </p>
            <div className="space-y-1">
              {selected.map((user, index) => {
                const rank = index + 1;
                const alias = aliases[user.user] ?? defaultAlias(rank);
                return (
                  <div
                    key={user.user}
                    className="grid grid-cols-[18px_minmax(0,1fr)_auto] items-center gap-2 border-b border-gray-100 py-1 text-xs last:border-0 dark:border-gray-700"
                  >
                    <span className="text-[10px] text-gray-400">{rank}</span>
                    {privacy === 'public' ? (
                      <input
                        value={alias}
                        onChange={(event) =>
                          setAliases((previous) => ({ ...previous, [user.user]: event.target.value }))
                        }
                        aria-label={`Alcunha pública de ${user.user}`}
                        className={inputClass}
                      />
                    ) : (
                      <span className="truncate text-gray-700 dark:text-gray-200">{user.user}</span>
                    )}
                    <span className="text-[10px] text-gray-500 dark:text-gray-400">{fitasLabel(fitasFor(user))}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {candidates.length > 0 && (
            <div>
              <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Fora do elenco
              </p>
              <div className="space-y-1">
                {candidates.map((user) => (
                  <div key={user.user} className="flex items-center justify-between gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <span className="truncate">{user.user}</span>
                    <span className="text-[10px]">{fitasLabel(fitasFor(user))}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Pré-visualização {privacy === 'public' ? 'pública' : 'privada'}
            </p>
            <pre className="max-h-48 overflow-auto rounded-md border border-gray-200 bg-gray-50 p-2 text-[10px] leading-relaxed text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300" data-testid="snapshot-json">
              {preview}
            </pre>
          </div>

          <div className="space-y-1.5">
            <button
              type="button"
              onClick={() => download(privacy)}
              data-testid="snapshot-download"
              className="w-full rounded-md bg-indigo-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-indigo-700"
            >
              Descarregar snapshot {privacy === 'public' ? 'público' : 'privado'}
            </button>
            <button
              type="button"
              onClick={() => void copySnapshot()}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-600 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Copiar JSON
            </button>
            <p className="text-[10px] text-gray-500 dark:text-gray-400">
              Privado inclui nomes e excertos; público usa alcunhas e remove as mensagens.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
