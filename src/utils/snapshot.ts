import type {
  GameSnapshot,
  Infraction,
  InfractionsResult,
  Message,
  Severity,
  SnapshotParticipant,
} from '../types';
import { resolveContactName } from './contacts';

export const SEVERITY_WEIGHT: Record<Severity, number> = {
  low: 1,
  medium: 2,
  high: 3,
};

export const SEVERITY_LABEL: Record<Severity, string> = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta',
};

export const SNAPSHOT_MODEL = 'anthropic/claude-sonnet-4.6';
export const SNAPSHOT_WINDOW = 'last-50-messages-per-participant' as const;
export const SNAPSHOT_SAMPLE_SIZE = 50;
export const SNAPSHOT_GROUP = { name: 'A Nossa Turma', slug: 'cedros' } as const;
export const SNAPSHOT_TIE_BREAKERS = ['infractions-desc', 'messages-desc', 'name-asc'] as const;

export interface ReviewedInfraction extends Infraction {
  kept: boolean;
}

export interface ReviewedUser {
  user: string;
  messageCount: number;
  originalInfractionCount: number;
  infractions: ReviewedInfraction[];
}

export interface ReviewUserState {
  removed: number[];
  severity: Record<number, Severity>;
}

export type ReviewState = Record<string, ReviewUserState>;

export interface SnapshotOptions {
  privacy: 'private' | 'public';
  aliases: Record<string, string>;
  statutesHash: string;
  generatedAt: string;
  reviewedAt: string;
}

export function defaultAlias(rank: number): string {
  return `Participante ${String(rank).padStart(2, '0')}`;
}

export function initialReview(result: InfractionsResult): ReviewState {
  return Object.fromEntries(
    result.results.map((entry) => [entry.user, { removed: [], severity: {} }]),
  );
}

export function messageCountsByUser(messages: Message[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const message of messages) {
    if (message.isSystemMessage) continue;
    const user = resolveContactName(message.sender);
    counts.set(user, (counts.get(user) ?? 0) + 1);
  }
  return counts;
}

export function reviewUsers(
  result: InfractionsResult,
  messageCounts: Map<string, number>,
  review: ReviewState,
): ReviewedUser[] {
  return result.results.map((entry) => {
    const state = review[entry.user];
    return {
      user: entry.user,
      messageCount: messageCounts.get(entry.user) ?? 0,
      originalInfractionCount: entry.infractions.length,
      infractions: entry.infractions.map((infraction, index) => ({
        ...infraction,
        severity: state?.severity[index] ?? infraction.severity,
        kept: !state?.removed.includes(index),
      })),
    };
  });
}

export function fitasFor(user: ReviewedUser): number {
  return user.infractions
    .filter((infraction) => infraction.kept)
    .reduce((sum, infraction) => sum + SEVERITY_WEIGHT[infraction.severity], 0);
}

export function keptCount(user: ReviewedUser): number {
  return user.infractions.filter((infraction) => infraction.kept).length;
}

export function rankUsers(users: ReviewedUser[]): ReviewedUser[] {
  return [...users].sort(
    (a, b) =>
      fitasFor(b) - fitasFor(a) ||
      keptCount(b) - keptCount(a) ||
      b.messageCount - a.messageCount ||
      a.user.localeCompare(b.user, 'pt-PT'),
  );
}

export function selectionOf(users: ReviewedUser[]): {
  selected: ReviewedUser[];
  candidates: ReviewedUser[];
} {
  const ranked = rankUsers(users);
  return { selected: ranked.slice(0, 12), candidates: ranked.slice(12) };
}

/**
 * Linhas que valem a pena mostrar na mesa de revisão:
 * todos os participantes com deteções, os 12 do elenco e os 3 melhores
 * candidatos sem infrações para o caso de ser preciso preencher vagas.
 */
export function usersForReview(users: ReviewedUser[]): ReviewedUser[] {
  const ranked = rankUsers(users);
  const selected = ranked.slice(0, 12);
  const withDetections = ranked.filter((user) => user.originalInfractionCount > 0);
  const zeroCandidates = ranked
    .filter((user) => user.originalInfractionCount === 0)
    .slice(0, 3);
  const shown = new Set(
    [...selected, ...withDetections, ...zeroCandidates].map((user) => user.user),
  );
  return ranked.filter((user) => shown.has(user.user));
}

export function buildGameSnapshot(
  users: ReviewedUser[],
  options: SnapshotOptions,
): GameSnapshot {
  const selected = rankUsers(users).slice(0, 12);
  const participants: SnapshotParticipant[] = selected.map((user, index) => {
    const rank = index + 1;
    const fitas = fitasFor(user);
    const infractions = user.infractions.filter((infraction) => infraction.kept);
    return {
      id: `p${String(rank).padStart(2, '0')}`,
      rank,
      displayName:
        options.privacy === 'public'
          ? options.aliases[user.user]?.trim() || defaultAlias(rank)
          : user.user,
      messageCount: user.messageCount,
      fitas,
      infractionCount: infractions.length,
      selected: true,
      fillReason: fitas === 0 ? 'sem-fitas' : null,
      infractions: infractions.map((infraction) => ({
        rule: infraction.rule,
        severity: infraction.severity,
        fitas: SEVERITY_WEIGHT[infraction.severity],
        ...(options.privacy === 'private' ? { message: infraction.message } : {}),
      })),
    };
  });

  return {
    schemaVersion: 1,
    kind: 'melon-game-snapshot',
    generatedAt: options.generatedAt,
    privacy: options.privacy,
    demo: false,
    group: { ...SNAPSHOT_GROUP },
    analysis: {
      model: SNAPSHOT_MODEL,
      window: SNAPSHOT_WINDOW,
      sampleSize: SNAPSHOT_SAMPLE_SIZE,
      statutesHash: options.statutesHash,
      reviewedAt: options.reviewedAt,
    },
    selection: {
      criterion: 'fitas-desc',
      tieBreakers: [...SNAPSHOT_TIE_BREAKERS],
      filled: participants.filter((participant) => participant.fillReason).length,
    },
    participants,
  };
}
