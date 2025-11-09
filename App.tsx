import React from 'react';
import ChatViewContent from './components/ChatViewContent';
import type { App as ObsidianApp } from 'obsidian';

// Mock da aplicação Obsidian para desenvolvimento/teste standalone.
const mockObsidianApp = {
  vault: {
    getMarkdownFiles: () => [
        { basename: 'Nota de Teste 1', path: 'teste1.md' },
        { basename: 'Outra Nota Legal', path: 'outra.md' },
        { basename: 'Receita de Bolo', path: 'receitas/bolo.md' }
    ],
    cachedRead: (file: any) => Promise.resolve(`# Conteúdo de ${file.basename}`),
  },
} as unknown as ObsidianApp;

// Mock das configurações do plugin
const mockSettings = {
    apiKey: 'YOUR_API_KEY_HERE' // Coloque uma chave real aqui para testar a API no dev standalone
}


const App: React.FC = () => {
  return (
    <div className="app-container" style={{ height: '100vh', backgroundColor: '#1a202c' }}>
      <ChatViewContent
        obsidianApp={mockObsidianApp}
        settings={mockSettings}
      />
    </div>
  );
};

export default App;
