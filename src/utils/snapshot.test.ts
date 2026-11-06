import { describe, expect, it } from 'vitest';
import type { Infraction, InfractionsResult, Message } from '../types';
import {
  buildGameSnapshot,
  fitasFor,
  initialReview,
  keptCount,
  messageCountsByUser,
  rankUsers,
  reviewUsers,
  usersForReview,
  type ReviewedUser,
} from './snapshot';

function inf(severity: Infraction['severity'], rule = 'Regra', message = 'Mensagem de teste'): Infraction {
  return { rule, message, severity };
}

function message(sender: string, content = 'Olá', isSystemMessage = false): Message {
  return { sender, content, isSystemMessage, timestamp: new Date('2026-11-06T12:00:00Z') };
}

function user(name: string, infractions: Infraction[], messageCount = 0): ReviewedUser {
  return {
    user: name,
    messageCount,
    originalInfractionCount: infractions.length,
    infractions: infractions.map((entry) => ({ ...entry, kept: true })),
  };
}

describe('messageCountsByUser', () => {
  it('resolve números de telefone e ignora mensagens de sistema', () => {
    const messages = [
      message('+351 936 160 697'),
      message('+351936160697'),
      message('Miguel Reis'),
      message('+351 936 160 697', 'Sistema', true),
    ];
    const counts = messageCountsByUser(messages);
    expect(counts.get('Miguel Reis')).toBe(3);
    expect(counts.has('+351 936 160 697')).toBe(false);
  });
});

describe('reviewUsers', () => {
  it('aplica remoções e mudanças de gravidade sem alterar o resultado original', () => {
    const result: InfractionsResult = {
      results: [
        { user: 'Marta', infractions: [inf('low'), inf('medium')] },
        { user: 'André', infractions: [] },
      ],
    };
    const review = initialReview(result);
    review.Marta = { removed: [0], severity: { 1: 'high' } };
    const users = reviewUsers(result, new Map([['Marta', 10], ['André', 4]]), review);
    const marta = users.find((entry) => entry.user === 'Marta')!;
    expect(marta.messageCount).toBe(10);
    expect(marta.infractions[0].kept).toBe(false);
    expect(marta.infractions[1].severity).toBe('high');
    expect(fitasFor(marta)).toBe(3);
    expect(keptCount(marta)).toBe(1);
    expect(result.results[0].infractions[0].severity).toBe('low');
  });
});

describe('rankUsers', () => {
  it('ordena por fitas, infrações, mensagens e nome', () => {
    const users = [
      user('B', [inf('medium')], 100),
      user('A', [inf('high')], 10),
      user('C', [inf('low'), inf('low')], 999),
      user('D', [], 1000),
    ];
    expect(rankUsers(users).map((entry) => entry.user)).toEqual(['A', 'C', 'B', 'D']);
  });
});

describe('usersForReview', () => {
  it('inclui todas as deteções, os 12 do elenco e três candidatos sem infrações', () => {
    const users = [
      ...Array.from({ length: 11 }, (_, index) => user(`D${index}`, [inf('high')], 1000 - index)),
      user('Z1', [], 400),
      user('Z2', [], 300),
      user('Z3', [], 200),
      user('Z4', [], 100),
    ];
    const shown = usersForReview(users).map((entry) => entry.user);
    expect(shown).toHaveLength(14);
    expect(shown).toContain('Z1');
    expect(shown).toContain('Z2');
    expect(shown).toContain('Z3');
    expect(shown).not.toContain('Z4');
  });
});

describe('buildGameSnapshot', () => {
  it('produz o privado com nomes e mensagens, e o público com alcunhas e sem mensagens', () => {
    const users = [
      ...Array.from({ length: 11 }, (_, index) => user(`Jogador ${index + 1}`, [inf('high')], 500 - index)),
      user('André Faria', [], 1860),
      user('Nuno Motta', [], 285),
      user('Dinis Sottomayor', [], 280),
    ];
    const options = {
      aliases: { 'André Faria': 'Participante Especial' },
      statutesHash: 'sha256:teste',
      generatedAt: '2026-11-06T12:00:00.000Z',
      reviewedAt: '2026-11-06T12:00:00.000Z',
    };
    const privateSnapshot = buildGameSnapshot(users, { ...options, privacy: 'private' });
    expect(privateSnapshot.participants).toHaveLength(12);
    expect(privateSnapshot.participants[11].displayName).toBe('André Faria');
    expect(privateSnapshot.participants[11].fillReason).toBe('sem-fitas');
    expect(privateSnapshot.participants[11].infractions).toEqual([]);
    expect(privateSnapshot.selection.filled).toBe(1);
    expect(privateSnapshot.analysis.window).toBe('last-50-messages-per-participant');
    expect(privateSnapshot.selection.criterion).toBe('fitas-desc');
    const j1 = privateSnapshot.participants[0];
    expect(j1.displayName).toBe('Jogador 1');
    expect(j1.infractions[0].message).toBe('Mensagem de teste');
    expect(j1.fitas).toBe(3);

    const publicSnapshot = buildGameSnapshot(users, { ...options, privacy: 'public' });
    const publicAndre = publicSnapshot.participants[11];
    expect(publicAndre.displayName).toBe('Participante Especial');
    expect(publicAndre.infractions).toEqual([]);
    expect(publicSnapshot.participants[0].displayName).toBe('Participante 01');
    expect(publicSnapshot.participants[0].infractions[0].message).toBeUndefined();
    expect(publicSnapshot.privacy).toBe('public');
  });

  it('preenche a 12.ª vaga com o membro sem infrações com mais mensagens', () => {
    const users = [
      ...Array.from({ length: 10 }, (_, index) => user(`Com fitas ${index + 1}`, [inf('high')], 100)),
      user('Sem fitas A', [], 900),
      user('Sem fitas B', [], 800),
      user('Sem fitas C', [], 700),
    ];
    const snapshot = buildGameSnapshot(users, {
      privacy: 'private',
      aliases: {},
      statutesHash: 'sha256:teste',
      generatedAt: '2026-11-06T12:00:00.000Z',
      reviewedAt: '2026-11-06T12:00:00.000Z',
    });
    expect(snapshot.participants).toHaveLength(12);
    expect(snapshot.participants[10].displayName).toBe('Sem fitas A');
    expect(snapshot.participants[10].fillReason).toBe('sem-fitas');
    expect(snapshot.participants[11].displayName).toBe('Sem fitas B');
    expect(snapshot.selection.filled).toBe(2);
  });
});
