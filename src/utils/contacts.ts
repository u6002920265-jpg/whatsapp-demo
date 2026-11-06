import type { Message } from '../types';
import contactsData from '../data/contacts.json';

function normalizePhone(phone: string): string {
  return phone.replace(/[\s\-()]/g, '');
}

const contactMap = new Map<string, string>(
  contactsData.mappings
    .filter((entry) => entry.number)
    .map((entry) => [normalizePhone(entry.number), entry.name]),
);

/**
 * Resolve um remetente para o nome de exibição do contacto.
 * Nomes já legíveis passam intactos; números sem correspondência ficam como estão.
 */
export function resolveContactName(sender: string): string {
  if (!sender.startsWith('+')) return sender;
  return contactMap.get(normalizePhone(sender)) ?? sender;
}

export function resolveMessageSenders(messages: Message[]): Message[] {
  return messages.map((message) =>
    message.sender.startsWith('+')
      ? { ...message, sender: resolveContactName(message.sender) }
      : message,
  );
}
