import { useMemo } from 'react';
import type { Message } from '../types';
import { useFilter } from '../context/FilterContext';
import {
  calculateSummary,
  calculateUserStats,
  calculateMessageIntervals,
} from '../utils/parser';

export function useChartData(messages: Message[]) {
  const { selectedUsers } = useFilter();

  const filteredMessages = useMemo(() => {
    if (selectedUsers.length === 0) return messages;
    return messages.filter(m => selectedUsers.includes(m.sender));
  }, [messages, selectedUsers]);

  const summary = useMemo(() => calculateSummary(messages), [messages]);

  const userStats = useMemo(() => calculateUserStats(messages), [messages]);

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
