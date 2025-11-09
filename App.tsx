import React from 'react';
import ChatViewContent from './components/ChatViewContent';
import type { App as ObsidianApp } from 'obsidian';

// Mock da aplicação Obsidian para desenvolvimento/teste standalone.
const mockObsidianApp = {
  vault: {
    getMarkdownFiles: () => [
        { basename: 'Nota de Teste 1', path: 'teste1.md', stat: { mtime: Date.now() } },
        { basename: 'Outra Nota Legal', path: 'outra.md', stat: { mtime: Date.now() - 86400000 } },
        { basename: 'Receita de Bolo', path: 'receitas/bolo.md', stat: { mtime: Date.now() - 604800000 * 2 } }
    ],
    cachedRead: (file: any) => Promise.resolve(`# Conteúdo de ${file.basename}`),
    getAbstractFileByPath: (path: string) => (mockObsidianApp.vault.getMarkdownFiles() as any[]).find(f => f.path === path) || null,
  },
} as unknown as ObsidianApp;

// Mock das configurações do plugin
const mockSettings = {
    apiKey: 'YOUR_API_KEY_HERE' // Coloque uma chave real aqui para testar a API no dev standalone
}


const App: React.FC = () => {
  return (
    <div className="app-container" style={{ height: '100vh' }}>
      <ChatViewContent
        obsidianApp={mockObsidianApp}
        settings={mockSettings}
      />
    </div>
  );
};

export default App;