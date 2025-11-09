import React from 'react';
import ChatModalContent from './components/ChatModalContent';
import type { App as ObsidianApp } from 'obsidian';

// Mock da aplicação Obsidian para desenvolvimento/teste standalone, se necessário.
// Isso fornece um objeto com a estrutura esperada pelos componentes.
const mockObsidianApp = {
  vault: {
    getMarkdownFiles: () => [],
    getAbstractFileByPath: () => null,
    cachedRead: () => Promise.resolve(''),
  },
  workspace: {
      getActiveViewOfType: () => null,
  }
} as unknown as ObsidianApp;


const App: React.FC = () => {
  return (
    <div className="app-container" style={{ height: '100vh', backgroundColor: '#1a202c' }}>
      {/* 
        Este componente foi projetado para estar em um modal dentro do Obsidian,
        mas podemos renderizá-lo aqui para desenvolvimento visual.
      */}
      <ChatModalContent
        obsidianApp={mockObsidianApp}
        initialContext="Este é um contexto inicial para fins de teste."
        onClose={() => console.log('Fechamento do modal solicitado.')}
        onInsert={(text) => console.log('Inserção de texto solicitada:', text)}
      />
    </div>
  );
};

export default App;
