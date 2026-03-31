import { useMemo } from 'react';
import type { Message } from '../types';
import { useFilter } from '../context/FilterContext';
import {
  calculateSummary,
  calculateUserStats,
  calculateMessageIntervals,
  resolveMessages,
} from '../utils/parser';

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
