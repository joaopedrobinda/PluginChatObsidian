
import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, MessageAuthor } from '../types';
import { getChatResponse } from '../services/geminiService';
import { getFileContent } from '../services/vaultService';
import Message from './Message';
import VaultFileSelector from './VaultFileSelector';
import Spinner from './Spinner';
import type { App as ObsidianApp } from 'obsidian';

interface ChatInterfaceProps {
  obsidianApp?: ObsidianApp;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ obsidianApp }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { author: MessageAuthor.SYSTEM, text: "Olá! Sou seu assistente de produtividade. Selecione algumas notas abaixo para me dar contexto e faça uma pergunta." }
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
      // RAG: Buscar conteúdo dos arquivos selecionados
      // NO FUTURO: Aqui você passaria o obsidianApp para getFileContent
      // ex: const contextPromises = selectedFileIds.map(id => getFileContent(obsidianApp, id));
      const contextPromises = selectedFileIds.map(id => getFileContent(id));
      const contextContents = await Promise.all(contextPromises);
      const context = contextContents.join('\n\n---\n\n');
      
      if (selectedFileIds.length > 0 && !context.trim()) {
         setMessages(prev => [...prev, { author: MessageAuthor.SYSTEM, text: "As notas selecionadas parecem estar vazias. Tente outras." }]);
      }

      const modelResponseText = await getChatResponse(userInput, context);
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

  return (
    <div className="flex flex-col h-full">
      {/* NO FUTURO: Aqui você passaria o obsidianApp para VaultFileSelector */}
      <VaultFileSelector onSelectionChange={setSelectedFileIds} />
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, index) => (
          <Message key={index} message={msg} />
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-4 border-t border-gray-700">
        <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
          <input
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder={selectedFileIds.length > 0 ? "Pergunte sobre suas notas..." : "Selecione uma nota para começar..."}
            className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
            disabled={isLoading || selectedFileIds.length === 0}
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
  );
};

export default ChatInterface;
