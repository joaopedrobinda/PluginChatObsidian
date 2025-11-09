
import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, MessageAuthor } from '../types';
import { getChatResponse } from '../services/geminiService';
import { getFileContent } from '../services/vaultService';
import Message from './Message';
import VaultFileSelector from './VaultFileSelector';
import Spinner from './Spinner';
import type { App as ObsidianApp } from 'obsidian';

interface ChatModalContentProps {
  obsidianApp: ObsidianApp;
  initialContext: string;
  onClose: () => void;
  onInsert: ((text: string) => void) | null;
}

const ChatModalContent: React.FC<ChatModalContentProps> = ({ obsidianApp, initialContext, onClose, onInsert }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { author: MessageAuthor.SYSTEM, text: "O conteúdo da nota ativa foi adicionado como contexto. Faça sua pergunta ou adicione mais notas." }
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
      const combinedContext = [initialContext, ...contextContents].join('\n\n---\n\n');

      const modelResponseText = await getChatResponse(userInput, combinedContext);
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
    <div className="flex flex-col h-[70vh] bg-gray-800 text-gray-200 font-sans">
        <header className="p-4 border-b border-gray-700">
            <h2 className="text-xl font-bold text-purple-400">Assistente de Chat RAG</h2>
        </header>
        
      <VaultFileSelector obsidianApp={obsidianApp} onSelectionChange={setSelectedFileIds} />
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, index) => (
          <Message 
            key={index} 
            message={msg}
            onInsert={msg.author === MessageAuthor.MODEL && onInsert ? () => onInsert(msg.text) : undefined}
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
            placeholder="Pergunte sobre suas notas..."
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
  );
};

export default ChatModalContent;
