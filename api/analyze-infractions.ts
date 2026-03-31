import type { VercelRequest, VercelResponse } from '@vercel/node';
import { generateText, Output } from 'ai';
import { z } from 'zod';

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
      output: Output.object({ schema: ResponseSchema }),
      system: `És um moderador de grupos de WhatsApp. A tua tarefa é analisar mensagens enviadas pelos membros do grupo e identificar infrações aos estatutos e boas práticas definidos.

Para cada utilizador, analisa as suas mensagens e identifica apenas as infrações claras e objetivas. Não inventes infrações — só reporta quando há uma violação genuína de uma regra específica.

Retorna um array "results" com um objeto por utilizador. Se um utilizador não cometeu infrações, inclui-o com uma lista "infractions" vazia.

Regras de severidade:
- "low": comportamento levemente inadequado, tom menos cordial
- "medium": violação clara de uma regra (spam, irrelevância repetida, linguagem imprópria)
- "high": violação grave (insultos, conteúdo proibido, desinformação, ataques pessoais)`,
      prompt: `## Estatutos do Grupo\n\n${statutes}\n\n## Mensagens por Utilizador\n\n${usersText}`,
      providerOptions: {
        gateway: {
          tags: ['feature:infractions-analysis'],
        },
      },
    });

    return res.status(200).json(output);
  } catch (error) {
    console.error('AI Gateway error:', error);
    return res.status(500).json({ error: 'Falha ao analisar mensagens. Tente novamente.' });
  }
}
