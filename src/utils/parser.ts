import type { Message, SummaryData, UserStats, MessageIntervalData } from '../types';
import { parseDate } from './dateUtils';

const PHONE_TO_NAME: Record<string, string> = {
  '+351 936 586 711': 'Nuno Motta',
  '+351 962 006 169': 'Pedro Barbosa',
  '+351 939 871 400': 'Pedro Silva',
  '+351 919 187 448': 'Rodrigo Adão Fonseca',
  '+351 919 241 492': 'Rodrigo Menéres',
  '+351 919 643 070': 'Toko',
  '+351 936 264 750': 'Zé Pedro',
  '+351 919 385 727': 'João Fleming',
  '+351 966 649 659': 'João Pedro',
  '+351 939 084 981': 'Jose',
  '+351 932 883 221': 'Lopo Vaz',
  '+351 912 551 133': 'Miguel MC',
  '+351 937 036 629': 'Miguel Pereira',
  '+351 936 160 697': 'Miguel Rocha Reis',
  '+351 967 850 292': 'Nlaranjo',
  '+351 966 237 760': 'Nuno',
  '+351 963 314 707': 'Nuno BritoFaro',
  '+55 69 8115-6915': 'Antonio Carlos',
  '+61 451 008 998': 'Armando',
  '+351 935 710 386': 'Dinis Sottomayor',
  '+351 913 250 069': 'Filipe Cameira',
  '+351 939 434 275': 'Filipe Sousa Pinto',
  '+351 937 042 033': 'Fmaquinta',
  '+351 918 622 903': 'Francisco Fonseca',
  '+351 962 533 908': 'Gabriel Campos',
  '+351 930 489 882': 'Gonçalo Oliveira',
  '+351 966 933 582': 'Gustavo Sousa',
  '+351 912 518 239': 'JAC',
  '+351 962 147 211': 'Colegio Cedros',
  '+31 6 17324970': 'Colegio Cedros',
  '+351 938 660 054': 'Ricardo Pereira',
  '+351 918 744 791': 'Luis Gagliardini Graca',
};

const USER_ALIASES: Record<string, string> = {
  'Carvoeiro': 'Teresa',
  'Ligia Ribadouro': 'Ligia',
  'Xani': 'Alexandre',
  'Fernando Ramoa': 'Fernando',
  'Egla Pina de Morais': 'Egla',
  'Fatima Magro': 'Fatima',
  'Pilhas Ribadouro': 'Pilhas',
  'Pedro Herrera Ribadouro': 'Pedro',
  'Isabel Ribadouro': 'Isabel',
  'Mariza Ribadouro': 'Mariza',
  'Mariza Fontes Ribadouro': 'Mariza',
  'Mariza Fontes Ribadouto': 'Mariza',
  'Hugo Ribadouro': 'Hugo',
  'Patricia Ribadouro': 'Patricia',
  'Jorge Cunha Ribadouro': 'Jorge',
};

 function stripInvisibleMarks(input: string) {
   return input
     .replace(/[\u200E\u200F\u202A-\u202E\u2066-\u2069\uFEFF]/g, '')
     .trim();
 }

 function normalizeUserName(name: string) {
  const cleaned = stripInvisibleMarks(name);
  
  // Check if it's a phone number first
  if (PHONE_TO_NAME[cleaned]) {
    return PHONE_TO_NAME[cleaned];
  }
  
  // Then check user aliases
  return USER_ALIASES[cleaned] ?? cleaned;
 }
const SYSTEM_PATTERNS = [
  /criou o grupo/i,
  /adicionou/i,
  /saiu/i,
  /removeu/i,
  /alterou/i,
  /administrador/i,
  /encriptadas/i,
  /mensagens.*chamadas/i,
];

// WhatsApp exports mentions using the LRM-marked format: @⁨Name⁩.
// We intentionally do NOT match plain "@" to avoid treating emails (e.g. name@gmail.com) as mentions.
const MENTION_PATTERN = /@⁨([^⁩]+)⁩/g;

export function parseWhatsAppChat(content: string, onProgress?: (current: number, total: number) => void): Message[] {
  const lines = content.split('\n');
  const messages: Message[] = [];
  const total = lines.length;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    if (onProgress && i % 100 === 0) {
      onProgress(i, total);
    }

    const timestamp = parseDate(line);
    if (!timestamp) continue;

    const dateEndIndex = line.indexOf(' - ');
    if (dateEndIndex === -1) continue;

    const rest = line.substring(dateEndIndex + 3);
    
    const colonIndex = rest.indexOf(': ');
    if (colonIndex === -1) {
      const isSystem = SYSTEM_PATTERNS.some(p => p.test(rest));
      if (isSystem) {
        messages.push({
          timestamp,
          sender: 'Sistema',
          content: rest,
          isSystemMessage: true,
        });
      }
      continue;
    }

    const sender = normalizeUserName(rest.substring(0, colonIndex));
    const content = rest.substring(colonIndex + 2);

    const isSystem = SYSTEM_PATTERNS.some(p => p.test(content)) || sender === '';

    let replyTo: string | undefined;
    const mentions = content.match(MENTION_PATTERN);
    if (mentions && mentions.length > 0) {
      const raw = mentions[0].replace(/@⁨?/, '').replace(/⁩?/, '').trim();
      replyTo = normalizeUserName(raw);
    }

    messages.push({
      timestamp,
      sender,
      content,
      replyTo,
      isSystemMessage: isSystem,
    });
  }

  if (onProgress) {
    onProgress(total, total);
  }

  return messages;
}

export function calculateSummary(messages: Message[]): SummaryData {
  const nonSystemMessages = messages.filter(m => !m.isSystemMessage);
  const senders = new Set(nonSystemMessages.map(m => m.sender));
  
  const dates = nonSystemMessages.map(m => m.timestamp);
  const start = new Date(Math.min(...dates.map(d => d.getTime())));
  const end = new Date(Math.max(...dates.map(d => d.getTime())));

  const dayCount = new Map<string, number>();
  nonSystemMessages.forEach(m => {
    const dayKey = m.timestamp.toDateString();
    dayCount.set(dayKey, (dayCount.get(dayKey) || 0) + 1);
  });

  let mostActiveDay = { date: start, count: 0 };
  dayCount.forEach((count, dayStr) => {
    if (count > mostActiveDay.count) {
      mostActiveDay = { date: new Date(dayStr), count };
    }
  });

  return {
    totalMessages: messages.length,
    totalParticipants: senders.size,
    dateRange: { start, end },
    mostActiveDay,
  };
}

export function calculateUserStats(messages: Message[]): UserStats[] {
  const nonSystemMessages = messages.filter(m => !m.isSystemMessage);
  const stats = new Map<string, UserStats>();

  nonSystemMessages.forEach(m => {
    if (!stats.has(m.sender)) {
      stats.set(m.sender, {
        name: m.sender,
        messageCount: 0,
        repliesReceived: 0,
        avgResponseTime: 0,
        initiations: 0,
        responses: 0,
      });
    }
    stats.get(m.sender)!.messageCount++;
  });

  nonSystemMessages.forEach(m => {
    if (m.replyTo && stats.has(m.replyTo)) {
      stats.get(m.replyTo)!.repliesReceived++;
    }
  });

  const responseTimes = new Map<string, number[]>();
  for (let i = 1; i < nonSystemMessages.length; i++) {
    const prev = nonSystemMessages[i - 1];
    const curr = nonSystemMessages[i];
    
    if (curr.sender !== prev.sender) {
      const timeDiff = (curr.timestamp.getTime() - prev.timestamp.getTime()) / 1000;
      if (!responseTimes.has(curr.sender)) {
        responseTimes.set(curr.sender, []);
      }
      responseTimes.get(curr.sender)!.push(timeDiff);
      
      stats.get(curr.sender)!.responses++;
    }
  }

  const repliedMessages = new Set<number>();
  for (let i = 0; i < nonSystemMessages.length; i++) {
    const msg = nonSystemMessages[i];
    for (let j = i + 1; j < nonSystemMessages.length; j++) {
      const nextMsg = nonSystemMessages[j];
      if (nextMsg.sender !== msg.sender) {
        repliedMessages.add(i);
        break;
      }
    }
  }

  nonSystemMessages.forEach((m, i) => {
    if (repliedMessages.has(i)) {
      stats.get(m.sender)!.initiations++;
    }
  });

  responseTimes.forEach((times, sender) => {
    if (times.length > 0 && stats.has(sender)) {
      const avg = times.reduce((a, b) => a + b, 0) / times.length;
      stats.get(sender)!.avgResponseTime = avg;
    }
  });

  return Array.from(stats.values()).sort((a, b) => b.messageCount - a.messageCount);
}

export function calculateMessageIntervals(messages: Message[]): MessageIntervalData[] {
  const nonSystemMessages = messages.filter(m => !m.isSystemMessage);
  const byUser = new Map<string, Date[]>();

  for (const m of nonSystemMessages) {
    if (!byUser.has(m.sender)) byUser.set(m.sender, []);
    byUser.get(m.sender)!.push(m.timestamp);
  }

  const results: MessageIntervalData[] = [];

  for (const [name, timestamps] of byUser) {
    if (timestamps.length < 2) continue;
    timestamps.sort((a, b) => a.getTime() - b.getTime());
    let totalGap = 0;
    for (let i = 1; i < timestamps.length; i++) {
      totalGap += (timestamps[i].getTime() - timestamps[i - 1].getTime()) / 1000;
    }
    results.push({ name, avgInterval: totalGap / (timestamps.length - 1) });
  }

  return results.sort((a, b) => b.avgInterval - a.avgInterval);
}


