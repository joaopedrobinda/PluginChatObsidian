
import React from 'react';
import ChatInterface from './components/ChatInterface';
import type { App as ObsidianApp } from 'obsidian';

interface AppProps {
  // Tornamos a prop opcional para que o app continue funcionando em modo de protótipo
  obsidianApp?: ObsidianApp;
}

function App({ obsidianApp }: AppProps) {
  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 font-sans flex flex-col items-center p-4">
      <div className="w-full max-w-4xl mx-auto">
        <header className="text-center mb-6">
          <h1 className="text-4xl font-bold text-purple-400">Plugin de Chat RAG para Obsidian</h1>
          <p className="text-gray-400 mt-2">Protótipo de Interface com React & Gemini</p>
        </header>

        <main className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl shadow-purple-900/20 flex flex-col h-[80vh]">
          {/* Passamos a prop para o componente de chat */}
          <ChatInterface obsidianApp={obsidianApp} />
        </main>

        <footer className="mt-6 text-center text-gray-500 text-sm p-4 bg-gray-800 border border-gray-700 rounded-lg">
          <h3 className="font-bold text-lg text-gray-300 mb-2">Como integrar esta UI em um plugin do Obsidian:</h3>
          <p className="text-left">
            1. <strong>Estrutura do Plugin:</strong> No seu plugin Obsidian, você terá um arquivo principal (ex: `main.ts`). Nele, você usará a API do Obsidian para criar uma nova "view" (uma aba ou painel lateral).
          </p>
          <p className="mt-2 text-left">
            2. <strong>Renderização do React:</strong> Dentro dessa view, em vez de manipular o DOM diretamente, você renderizará este componente React. A API do Obsidian te dá acesso ao elemento HTML da view (`view.containerEl`), que servirá como o 'root' para o `ReactDOM.createRoot()`.
          </p>
          <p className="mt-2 text-left">
            3. <strong>Acesso aos Arquivos (RAG):</strong> O seletor de arquivos que você vê na UI é uma **simulação**. Em um plugin real, o `vaultService.ts` usaria a API do Obsidian (`this.app.vault.getMarkdownFiles()` e `this.app.vault.cachedRead(file)`) para ler os arquivos de verdade e fornecer o contexto para o Gemini.
          </p>
          <p className="mt-2 text-left">
            4. <strong>Chave de API:</strong> Em um plugin, você criaria uma tela de configurações onde o usuário poderia salvar a própria chave da API do Gemini de forma segura, usando `this.addSettingTab()`.
          </p>
        </footer>
      </div>
    </div>
  );
}

export default App;
