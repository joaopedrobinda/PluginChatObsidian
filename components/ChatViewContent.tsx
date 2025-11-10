import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { App as ObsidianApp, TFile } from 'obsidian';
import { ChatMessage, MessageAuthor } from '../types';
import { getChatResponse } from '../services/geminiService';
import { getFileContent, findRelevantFiles } from '../services/vaultService';
import Message from './Message';
import WelcomeScreen from './WelcomeScreen';
import ChatInput from './ChatInput';

interface MyPluginSettings {
  apiKey: string;
}

interface ChatViewContentProps {
  obsidianApp: ObsidianApp;
  settings: MyPluginSettings;
}

type LoadingState = 'idle' | 'searching' | 'processing' | 'error';

const ApiKeyMessage: React.FC = () => (
    <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-gray-800">
        <div className="w-16 h-16 mb-6 rounded-2xl bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center">
             <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.45 4.9-4.9 1.45 4.9 1.45 1.45 4.9 1.45-4.9 4.9-1.45-4.9-1.45z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/></svg>
        </div>
        <h2 className="text-2xl font-bold mb-4 text-gray-100">Bem-vindo ao Chat RAG</h2>
        <p className="text-gray-400 mb-6 max-w-sm">Para começar a conversar com o assistente e usar suas notas como contexto, adicione sua chave da API do Gemini nas configurações do plugin.</p>
        <p className="text-gray-400 text-sm">Vá para <code className="bg-gray-900 px-1.5 py-1 rounded-md text-gray-300">Configurações</code> → <code className="bg-gray-900 px-1.5 py-1 rounded-md text-gray-300">Chat RAG com Gemini</code>.</p>
    </div>
);

const ChatHeader: React.FC<{ onNewChat: () => void }> = ({ onNewChat }) => (
  <header className="flex-shrink-0 p-4 border-b border-[var(--border-color)] flex justify-between items-center">
    <h1 className="text-lg font-semibold">Chat Gemini</h1>
    <button
      onClick={onNewChat}
      className="flex items-center gap-2 px-3 py-1.5 text-sm bg-[var(--surface-color)] hover:bg-gray-700 rounded-md transition-colors"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14"/><path d="M5 12h14"/></svg>
      Nova Conversa
    </button>
  </header>
);

const ChatViewContent: React.FC<ChatViewContentProps> = ({ obsidianApp, settings }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingState, setLoadingState] = useState<LoadingState>('idle');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    // A small delay ensures the new message is rendered before scrolling
    setTimeout(scrollToBottom, 100);
  }, [messages]);

  const handleNewChat = () => {
    setMessages([]);
    setLoadingState('idle');
  };

  const handleSendMessage = async (userInput: string, attachedFiles: TFile[]) => {
    if (!userInput.trim() || loadingState !== 'idle') return;

    const userMessage: ChatMessage = { author: MessageAuthor.USER, text: userInput };
    const loadingMessage: ChatMessage = { author: MessageAuthor.MODEL, text: 'loading' };
    
    setMessages(prev => [...prev, userMessage, loadingMessage]);
    setLoadingState('searching');
    
    try {
      let combinedContext = '';
      let systemMessageText = '';
      
      const contextMode = attachedFiles.length > 0 ? 'manual' : 'auto';

      if (contextMode === 'auto') {
          const relevantFiles = await findRelevantFiles(obsidianApp, userInput);
          if (relevantFiles.length > 0) {
              combinedContext = relevantFiles.map(f => `## Nota: ${f.file.basename}\n\n${f.content}`).join('\n\n---\n\n');
              systemMessageText = `Usando ${relevantFiles.length} nota(s) relevante(s) como contexto.`;
          } else {
              systemMessageText = "Nenhuma nota relevante encontrada. Respondendo com conhecimento geral.";
          }
      } else { // Manual Mode
          const contextPromises = attachedFiles.map(file => getFileContent(obsidianApp, file.path));
          const contextContents = await Promise.all(contextPromises);
          combinedContext = contextContents.join('\n\n---\n\n');
          if (!combinedContext.trim()) {
              systemMessageText = "As notas selecionadas estão vazias.";
          } else {
              systemMessageText = `Usando ${attachedFiles.length} nota(s) selecionada(s) como contexto.`;
          }
      }

      // Update messages with system info, replacing the loading state temporarily
      const systemMessage: ChatMessage = { author: MessageAuthor.SYSTEM, text: systemMessageText };
      setMessages(prev => [...prev.slice(0, -1), systemMessage, loadingMessage]);
      
      setLoadingState('processing');

      // Build history, excluding system messages
      const chatHistory = messages
          .filter(m => m.author === MessageAuthor.USER || m.author === MessageAuthor.MODEL)
          .map(m => ({
              role: m.author as 'user' | 'model',
              parts: [{ text: m.text }]
          }));

      const modelResponseText = await getChatResponse(userInput, combinedContext, settings.apiKey, chatHistory);
      const modelMessage: ChatMessage = { author: MessageAuthor.MODEL, text: modelResponseText };
      
      // Replace the loading message with the actual response
      setMessages(prev => [...prev.slice(0, -1), modelMessage]);

    } catch (error) {
      console.error(error);
      setLoadingState('error');
      const errorMessage: ChatMessage = { author: MessageAuthor.SYSTEM, text: "Ocorreu um erro ao processar sua solicitação. Verifique o console." };
      setMessages(prev => [...prev.slice(0, -1), errorMessage]);
    } finally {
      setLoadingState('idle');
    }
  };
  
  if (!settings.apiKey) {
      return <ApiKeyMessage />;
  }

  return (
    <div className="flex flex-col h-full bg-[var(--bg-color)] text-[var(--text-primary)] font-sans overflow-hidden">
        <ChatHeader onNewChat={handleNewChat} />
        
        <main className="flex-1 overflow-y-auto p-4 w-full max-w-4xl mx-auto">
            <div className="space-y-8">
              {messages.length === 0 ? (
                  <WelcomeScreen />
              ) : (
                  messages.map((msg, index) => <Message key={index} message={msg} />)
              )}
              <div ref={messagesEndRef} />
            </div>
        </main>
        
        <ChatInput 
          onSendMessage={handleSendMessage}
          isLoading={loadingState !== 'idle'}
          obsidianApp={obsidianApp}
        />
    </div>
  );
};

export default ChatViewContent;
