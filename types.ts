
export enum MessageAuthor {
  USER = 'user',
  MODEL = 'model',
  SYSTEM = 'system',
}

export interface ChatMessage {
  author: MessageAuthor;
  text: string;
}

export interface VaultFile {
  id: string;
  name: string;
  path: string;
}
