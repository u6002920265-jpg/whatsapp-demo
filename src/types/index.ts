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

export type Severity = 'low' | 'medium' | 'high';

export interface Infraction {
  rule: string;
  message: string;
  severity: Severity;
}

export interface UserInfractions {
  user: string;
  infractions: Infraction[];
}

export interface InfractionsResult {
  results: UserInfractions[];
}

export interface SnapshotInfraction {
  rule: string;
  severity: Severity;
  fitas: number;
  message?: string;
}

export interface SnapshotParticipant {
  id: string;
  rank: number;
  displayName: string;
  messageCount: number;
  fitas: number;
  infractionCount: number;
  selected: true;
  fillReason: 'sem-fitas' | null;
  infractions: SnapshotInfraction[];
}

export interface GameSnapshot {
  schemaVersion: 1;
  kind: 'melon-game-snapshot';
  generatedAt: string;
  privacy: 'private' | 'public';
  demo: false;
  group: { name: string; slug: string };
  analysis: {
    model: string;
    window: 'last-50-messages-per-participant';
    sampleSize: number;
    statutesHash: string;
    reviewedAt: string;
  };
  selection: {
    criterion: 'fitas-desc';
    tieBreakers: string[];
    filled: number;
  };
  participants: SnapshotParticipant[];
}
