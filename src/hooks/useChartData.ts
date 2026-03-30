import { useMemo } from 'react';
import type { Message } from '../types';
import { useFilter } from '../context/FilterContext';
import {
  calculateSummary,
  calculateUserStats,
  calculateMessageIntervals,
} from '../utils/parser';
import contactsData from '../data/contacts.json';

function normalizePhone(p: string): string {
  return p.replace(/[\s\-()]/g, '');
}

const contactMap = new Map<string, string>(
  contactsData.mappings
    .filter(e => e.number)
    .map(e => [normalizePhone(e.number), e.name]),
);

function resolveMessages(messages: Message[]): Message[] {
  return messages.map(m => {
    if (!m.sender.startsWith('+')) return m;
    const resolved = contactMap.get(normalizePhone(m.sender));
    return resolved ? { ...m, sender: resolved } : m;
  });
}

export function useChartData(messages: Message[]) {
  const { selectedUsers } = useFilter();

  const resolvedMessages = useMemo(() => resolveMessages(messages), [messages]);

  const filteredMessages = useMemo(() => {
    if (selectedUsers.length === 0) return resolvedMessages;
    return resolvedMessages.filter(m => selectedUsers.includes(m.sender));
  }, [resolvedMessages, selectedUsers]);

  const summary = useMemo(() => calculateSummary(resolvedMessages), [resolvedMessages]);

  const userStats = useMemo(() => calculateUserStats(resolvedMessages), [resolvedMessages]);

  const filteredUserStats = useMemo(() => {
    if (selectedUsers.length === 0) return userStats;
    return userStats.filter(u => selectedUsers.includes(u.name));
  }, [userStats, selectedUsers]);

  const messageIntervals = useMemo(() => calculateMessageIntervals(filteredMessages), [filteredMessages]);

  return {
    summary,
    userStats: filteredUserStats,
    allUserStats: userStats,
    messageIntervals,
  };
}
