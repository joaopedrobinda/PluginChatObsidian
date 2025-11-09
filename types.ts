
export enum MessageAuthor {
  USER = 'user',
  MODEL = 'model',
  SYSTEM = 'system',
}

export interface ChatMessage {
  author: MessageAuthor;
  text: string;
}

// Tipos para a nova estrutura de árvore de arquivos
export interface FileNode {
  type: 'file';
  name: string;
  path: string;
}

export interface FolderNode {
  type: 'folder';
  name:string;
  path: string;
  children: FileTreeNode[];
}

export type FileTreeNode = FileNode | FolderNode;
