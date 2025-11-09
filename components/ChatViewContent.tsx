import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, MessageAuthor } from '../types';
import { getChatResponse } from '../services/geminiService';
import { getFileContent } from '../services/vaultService';
import Message from './Message';
import VaultFileSelector from './VaultFileSelector';
import Spinner from './Spinner';
import type { App as ObsidianApp } from 'obsidian';

interface MyPluginSettings {
  apiKey: string;
}

interface ChatViewContentProps {
  obsidianApp: ObsidianApp;
  settings: MyPluginSettings;
}

const ApiKeyMessage: React.FC = () => (
    <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <h2 className="text-2xl font-bold mb-4 text-purple-400">Bem-vindo ao Chat RAG!</h2>
        <p className="text-gray-400 mb-6">
            Para começar a conversar com a IA, você precisa adicionar sua chave da API do Gemini.
        </p>
        <p className="text-gray-400">
            Vá para <code className="bg-gray-900 p-1 rounded">Configurações</code> &gt; <code className="bg-gray-900 p-1 rounded">Chat RAG com Gemini</code> e insira sua chave.
        </p>
    </div>
);


const ChatViewContent: React.FC<ChatViewContentProps> = ({ obsidianApp, settings }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { author: MessageAuthor.SYSTEM, text: "Selecione as notas que servirão de contexto na barra à direita e faça sua pergunta." }
  ]);
  const [userInput, setUserInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || isLoading) return;

    const userMessage: ChatMessage = { author: MessageAuthor.USER, text: userInput };
    setMessages(prev => [...prev, userMessage]);
    setUserInput('');
    setIsLoading(true);

    try {
      const contextPromises = selectedFileIds.map(id => getFileContent(obsidianApp, id));
      const contextContents = await Promise.all(contextPromises);
      const combinedContext = contextContents.join('\n\n---\n\n');
      
      if (selectedFileIds.length > 0 && !combinedContext.trim()) {
        setMessages(prev => [...prev, { author: MessageAuthor.SYSTEM, text: "As notas selecionadas para contexto estão vazias." }]);
      }

      const modelResponseText = await getChatResponse(userInput, combinedContext, settings.apiKey);
      const modelMessage: ChatMessage = { author: MessageAuthor.MODEL, text: modelResponseText };
      setMessages(prev => [...prev, modelMessage]);

    } catch (error) {
      console.error(error);
      const errorMessage: ChatMessage = { author: MessageAuthor.SYSTEM, text: "Ocorreu um erro ao processar sua solicitação." };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Se não houver chave de API, mostra a mensagem de configuração.
  if (!settings.apiKey) {
      return <ApiKeyMessage />;
  }

  return (
    <div className="flex h-full bg-gray-800 text-gray-200 font-sans">
        {/* Painel de Chat (Esquerda) */}
        <div className="flex flex-col flex-grow h-full">
            <header className="p-4 border-b border-gray-700">
                <h2 className="text-xl font-bold text-purple-400">Assistente de Chat RAG</h2>
            </header>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg, index) => (
                <Message 
                    key={index} 
                    message={msg}
                    // A função de inserir na nota não é aplicável aqui, pois a view não está atrelada a um editor específico
                />
                ))}
                <div ref={messagesEndRef} />
            </div>
            
            <div className="p-4 border-t border-gray-700">
                <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
                <input
                    type="text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    placeholder="Pergunte sobre os contextos selecionados..."
                    className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    disabled={isLoading}
                />
                <button
                    type="submit"
                    disabled={isLoading || !userInput.trim()}
                    className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-900 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center justify-center w-24"
                >
                    {isLoading ? <Spinner /> : 'Enviar'}
                </button>
                </form>
            </div>
        </div>

        {/* Barra Lateral de Contexto (Direita) */}
        <div className="w-1/3 max-w-sm border-l border-gray-700 flex flex-col">
            <VaultFileSelector obsidianApp={obsidianApp} onSelectionChange={setSelectedFileIds} />
        </div>
    </div>
  );
};

export default ChatViewContent;
