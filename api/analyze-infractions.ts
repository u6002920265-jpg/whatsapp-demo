import type { VercelRequest, VercelResponse } from '@vercel/node';
import { generateText, Output } from 'ai';
import { z } from 'zod';

// Simple in-memory rate limiter (per-instance; resets on cold start)
const DAILY_LIMIT = 50;
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): { limited: boolean; remaining: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now >= entry.resetAt) {
    // New day window: midnight UTC rollover
    const tomorrow = new Date();
    tomorrow.setUTCHours(24, 0, 0, 0);
    rateLimitMap.set(ip, { count: 1, resetAt: tomorrow.getTime() });
    return { limited: false, remaining: DAILY_LIMIT - 1 };
  }

  if (entry.count >= DAILY_LIMIT) {
    return { limited: true, remaining: 0 };
  }

  entry.count++;
  return { limited: false, remaining: DAILY_LIMIT - entry.count };
}

const InfractionSchema = z.object({
  rule: z.string().describe('The specific rule or statute that was violated'),
  message: z.string().describe('The exact message content that triggered the infraction'),
  severity: z.enum(['low', 'medium', 'high']).describe('Severity of the infraction'),
});

const UserInfractionsSchema = z.object({
  user: z.string().describe('Display name of the user'),
  infractions: z.array(InfractionSchema).describe('List of infractions committed by this user'),
});

const ResponseSchema = z.object({
  results: z.array(UserInfractionsSchema).describe('Infraction analysis results per user'),
});

interface UserMessages {
  user: string;
  messages: string[];
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ?? 'unknown';
  const { limited, remaining } = isRateLimited(ip);
  res.setHeader('X-RateLimit-Limit', DAILY_LIMIT);
  res.setHeader('X-RateLimit-Remaining', remaining);

  if (limited) {
    return res.status(429).json({ error: 'Limite diário de análises atingido. Tente novamente amanhã.' });
  }

  const { statutes, userMessages } = req.body as {
    statutes: string;
    userMessages: UserMessages[];
  };

  if (!statutes || !userMessages?.length) {
    return res.status(400).json({ error: 'statutes and userMessages are required' });
  }

  const usersText = userMessages
    .map(({ user, messages }) => {
      const sample = messages.slice(0, 50); // cap at 50 messages per user to control token usage
      return `--- Utilizador: ${user} ---\n${sample.map((m, i) => `[${i + 1}] ${m}`).join('\n')}`;
    })
    .join('\n\n');

  try {
    const { output } = await generateText({
      model: 'anthropic/claude-sonnet-4.6',
      providerOptions: {
        gateway: {
          tags: ['feature:infractions-analysis'],
          fallback: ['google/gemini-2.5-flash'],
        },
      },
      output: Output.object({ schema: ResponseSchema }),
      system: `És um moderador de grupos de WhatsApp. A tua tarefa é analisar mensagens enviadas pelos membros do grupo e identificar infrações aos estatutos e boas práticas definidos.

Para cada utilizador, analisa as suas mensagens e identifica apenas as infrações claras e objetivas. Não inventes infrações — só reporta quando há uma violação genuína de uma regra específica.

Retorna um array "results" com um objeto por utilizador. Se um utilizador não cometeu infrações, inclui-o com uma lista "infractions" vazia.

Regras de severidade:
- "low": comportamento levemente inadequado, tom menos cordial
- "medium": violação clara de uma regra (spam, irrelevância repetida, linguagem imprópria)
- "high": violação grave (insultos, conteúdo proibido, desinformação, ataques pessoais)`,
      prompt: `## Estatutos do Grupo\n\n${statutes}\n\n## Mensagens por Utilizador\n\n${usersText}`,
    });

    return res.status(200).json(output);
  } catch (error) {
    console.error('AI Gateway error:', error);
    return res.status(500).json({ error: 'Falha ao analisar mensagens. Tente novamente.' });
  }
}
