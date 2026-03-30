import { describe, it, expect } from 'vitest';
import { calculateMessageIntervals } from './parser';
import type { Message } from '../types';

function msg(sender: string, minutesOffset: number, content = 'hello'): Message {
  return {
    timestamp: new Date(2024, 0, 1, 0, minutesOffset, 0),
    sender,
    content,
    isSystemMessage: false,
  };
}

describe('calculateMessageIntervals', () => {
  it('computes average interval for users with 2+ messages', () => {
    const messages = [
      msg('Alice', 0),
      msg('Alice', 10),  // gap = 10min = 600s
      msg('Alice', 40),  // gap = 30min = 1800s
    ];

    const result = calculateMessageIntervals(messages);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Alice');
    expect(result[0].avgInterval).toBe(1200); // (600 + 1800) / 2
  });

  it('excludes users with only 1 message', () => {
    const messages = [
      msg('Alice', 0),
      msg('Alice', 10),
      msg('Bob', 5),  // only 1 message
    ];

    const result = calculateMessageIntervals(messages);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Alice');
  });

  it('sorts by largest average interval first', () => {
    const messages = [
      msg('Alice', 0),
      msg('Alice', 5),   // avg = 5min = 300s
      msg('Bob', 0),
      msg('Bob', 60),    // avg = 60min = 3600s
    ];

    const result = calculateMessageIntervals(messages);
    expect(result[0].name).toBe('Bob');
    expect(result[1].name).toBe('Alice');
  });

  it('excludes system messages', () => {
    const sysMsg: Message = {
      timestamp: new Date(2024, 0, 1, 0, 5, 0),
      sender: 'Alice',
      content: 'criou o grupo',
      isSystemMessage: true,
    };
    const messages = [
      msg('Alice', 0),
      sysMsg,
      msg('Alice', 20),
    ];

    const result = calculateMessageIntervals(messages);
    expect(result).toHaveLength(1);
    // gap should be 20min = 1200s (system msg ignored)
    expect(result[0].avgInterval).toBe(1200);
  });
});
