import React from 'react';
import ChatViewContent from './components/ChatViewContent';
import type { App as ObsidianApp } from 'obsidian';

// Mock da aplicação Obsidian para desenvolvimento/teste standalone.
const mockObsidianApp = {
  vault: {
    getMarkdownFiles: () => [
        { basename: 'Nota de Teste 1', path: 'teste1.md', stat: { mtime: Date.now() } },
        { basename: 'Outra Nota Legal', path: 'outra.md', stat: { mtime: Date.now() - 86400000 } },
        { basename: 'Receita de Bolo', path: 'receitas/bolo.md', stat: { mtime: Date.now() - 604800000 * 2 } },
        { basename: 'Root File', path: 'rootfile.md', stat: { mtime: Date.now() } }
    ],
    cachedRead: (file: any) => Promise.resolve(`# Conteúdo de ${file.basename}\n\nEste é um texto de exemplo para a nota.`),
    getAbstractFileByPath: (path: string) => (mockObsidianApp.vault.getMarkdownFiles() as any[]).find(f => f.path === path) || null,
    getRoot: () => ({
      path: '/',
      name: 'root',
      children: (mockObsidianApp.vault.getMarkdownFiles() as any[]).map(f => ({...f, parent: { path: '/' }})), // Simple mock
    }),
  },
} as unknown as ObsidianApp;

// Mock das configurações do plugin
const mockSettings = {
    apiKey: 'YOUR_API_KEY_HERE' // Coloque uma chave real aqui para testar a API no dev standalone
}


const App: React.FC = () => {
  return (
    <ChatViewContent
      obsidianApp={mockObsidianApp}
      settings={mockSettings}
    />
  );
};

export default App;
