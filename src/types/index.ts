export interface Message {
  timestamp: Date;
  sender: string;
  content: string;
  replyTo?: string;
  isSystemMessage: boolean;
}

export interface UserStats {
  name: string;
  messageCount: number;
  repliesReceived: number;
  avgResponseTime: number;
  initiations: number;
  responses: number;
}

export interface FilterState {
  selectedUsers: string[];
}

export interface SummaryData {
  totalMessages: number;
  totalParticipants: number;
  dateRange: { start: Date; end: Date };
  mostActiveDay: { date: Date; count: number };
}

export interface MessageIntervalData {
  name: string;
  avgInterval: number;
}

export interface ParseProgress {
  current: number;
  total: number;
  percentage: number;
}

