import React, { useState, useRef, useEffect } from 'react';
import type { App as ObsidianApp, TFile } from 'obsidian';
import { ChatMessage, MessageAuthor } from '../types';
import { getChatResponse } from '../services/geminiService';
import { getFileContent, findRelevantFiles } from '../services/vaultService';
import Message from './Message';
import VaultFileSelector from './VaultFileSelector';
import Spinner from './Spinner';

interface MyPluginSettings {
  apiKey: string;
}

interface ChatViewContentProps {
  obsidianApp: ObsidianApp;
  settings: MyPluginSettings;
}

type ContextMode = 'manual' | 'auto';
type LoadingState = 'idle' | 'searching' | 'processing' | 'error';

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

const PanelRightIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <rect width="18" height="18" x="3" y="3" rx="2"/><path d="M15 3v18"/>
    </svg>
);


const ChatViewContent: React.FC<ChatViewContentProps> = ({ obsidianApp, settings }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { author: MessageAuthor.SYSTEM, text: "Faça uma pergunta sobre seu cofre no modo automático, ou mude para o modo manual para selecionar arquivos específicos." }
  ]);
  const [userInput, setUserInput] = useState<string>('');
  const [loadingState, setLoadingState] = useState<LoadingState>('idle');
  const [selectedFilePaths, setSelectedFilePaths] = useState<string[]>([]);
  const [isSidebarVisible, setIsSidebarVisible] = useState<boolean>(true);
  const [contextMode, setContextMode] = useState<ContextMode>('auto');
  const [lastUsedFiles, setLastUsedFiles] = useState<TFile[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || loadingState !== 'idle') return;

    const userMessage: ChatMessage = { author: MessageAuthor.USER, text: userInput };
    setMessages(prev => [...prev, userMessage]);
    const currentInput = userInput;
    setUserInput('');
    setLoadingState('searching');
    setLastUsedFiles([]);

    try {
        let combinedContext = '';
        let filesUsed: TFile[] = [];

        if (contextMode === 'auto') {
            const relevantFiles = await findRelevantFiles(obsidianApp, currentInput);
            if (relevantFiles.length > 0) {
                filesUsed = relevantFiles.map(f => f.file);
                combinedContext = relevantFiles.map(f => `## Nota: ${f.file.basename}\n\n${f.content}`).join('\n\n---\n\n');
                setLastUsedFiles(filesUsed);
            } else {
                 setMessages(prev => [...prev, { author: MessageAuthor.SYSTEM, text: "Nenhuma nota relevante encontrada para sua pergunta. Respondendo com conhecimento geral." }]);
            }
        } else { // Manual Mode
            if (selectedFilePaths.length > 0) {
                const contextPromises = selectedFilePaths.map(path => getFileContent(obsidianApp, path));
                const contextContents = await Promise.all(contextPromises);
                combinedContext = contextContents.join('\n\n---\n\n');
                if (!combinedContext.trim()) {
                    setMessages(prev => [...prev, { author: MessageAuthor.SYSTEM, text: "As notas selecionadas para contexto estão vazias." }]);
                }
            }
        }
      
      setLoadingState('processing');

      const chatHistory = messages
          .filter(m => m.author === MessageAuthor.USER || m.author === MessageAuthor.MODEL)
          .map(m => ({
              // FIX: The `role` property for chat history expects a string literal 'user' or 'model'.
              // Although MessageAuthor enum values match these strings, TypeScript requires an explicit cast
              // to satisfy the type checking, as the filter doesn't automatically narrow the enum type.
              role: m.author as 'user' | 'model',
              parts: [{ text: m.text }]
          }));

      const modelResponseText = await getChatResponse(currentInput, combinedContext, settings.apiKey, chatHistory);
      const modelMessage: ChatMessage = { author: MessageAuthor.MODEL, text: modelResponseText };
      setMessages(prev => [...prev, modelMessage]);

    } catch (error) {
      console.error(error);
      setLoadingState('error');
      const errorMessage: ChatMessage = { author: MessageAuthor.SYSTEM, text: "Ocorreu um erro ao processar sua solicitação." };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoadingState('idle');
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage(e as any);
    }
  };

  if (!settings.apiKey) {
      return <ApiKeyMessage />;
  }

  return (
    <div className="flex h-full bg-gray-800 text-gray-200 font-sans overflow-hidden">
        {/* Painel de Chat (Esquerda) */}
        <div className="flex flex-col flex-grow h-full">
            <header className="p-4 border-b border-gray-700 flex justify-between items-center">
                <h2 className="text-xl font-bold text-purple-400">Assistente de Chat RAG</h2>
                <button 
                    onClick={() => setIsSidebarVisible(!isSidebarVisible)} 
                    className="p-1 text-gray-400 hover:text-white transition-colors"
                    title={isSidebarVisible ? "Ocultar Contexto" : "Mostrar Contexto"}
                >
                    <PanelRightIcon className={`transform transition-transform ${isSidebarVisible ? '' : 'rotate-180'}`}/>
                </button>
            </header>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg, index) => (
                    <React.Fragment key={index}>
                        <Message message={msg} />
                        {msg.author === MessageAuthor.MODEL && lastUsedFiles.length > 0 && (
                             <div className="flex justify-start text-xs text-gray-400 pl-2">
                                <span className="mr-2 font-semibold">Contexto:</span>
                                <div className="flex flex-wrap gap-2">
                                    {lastUsedFiles.map(file => (
                                        <span key={file.path} className="bg-gray-700 px-2 py-0.5 rounded-md">{file.basename}</span>
                                    ))}
                                </div>
                             </div>
                        )}
                    </React.Fragment>
                ))}
                <div ref={messagesEndRef} />
            </div>
            
            <div className="p-4 border-t border-gray-700">
                <form onSubmit={handleSendMessage} className="flex items-start space-x-2">
                <textarea
                    rows={1}
                    value={userInput}
                    onChange={(e) => {
                        setUserInput(e.target.value);
                        e.target.style.height = 'auto';
                        e.target.style.height = `${e.target.scrollHeight}px`;
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder={
                        loadingState === 'searching' ? 'Buscando notas relevantes...' :
                        loadingState === 'processing' ? 'Processando com a IA...' :
                        contextMode === 'auto' ? 'Faça uma pergunta sobre seu cofre...' : 'Pergunte sobre os contextos selecionados...'
                    }
                    className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none max-h-40"
                    disabled={loadingState !== 'idle'}
                />
                <button
                    type="submit"
                    disabled={loadingState !== 'idle' || !userInput.trim()}
                    className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-900 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center justify-center self-end"
                    style={{height: '42px', width: '96px'}}
                >
                    {loadingState !== 'idle' ? <Spinner /> : 'Enviar'}
                </button>
                </form>
            </div>
        </div>

        {/* Barra Lateral de Contexto (Direita) */}
        <div className={`transition-all duration-300 ease-in-out flex-shrink-0 ${isSidebarVisible ? 'w-1/3 max-w-sm' : 'w-0'}`}>
            <div className={`h-full border-l border-gray-700 flex flex-col overflow-hidden ${isSidebarVisible ? 'opacity-100' : 'opacity-0'}`}>
                <div className="p-4 border-b border-gray-700">
                    <h3 className="font-bold text-lg mb-3">Modo de Contexto</h3>
                    <div className="flex space-x-2">
                        <button onClick={() => setContextMode('auto')} className={`flex-1 py-1 text-sm rounded-md transition-colors ${contextMode === 'auto' ? 'bg-purple-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>Automático</button>
                        <button onClick={() => setContextMode('manual')} className={`flex-1 py-1 text-sm rounded-md transition-colors ${contextMode === 'manual' ? 'bg-purple-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>Manual</button>
                    </div>
                </div>
                {contextMode === 'manual' && (
                    <VaultFileSelector obsidianApp={obsidianApp} onSelectionChange={setSelectedFilePaths} />
                )}
                 {contextMode === 'auto' && (
                    <div className="p-4 text-sm text-gray-400">
                        <p className="font-bold text-gray-300 mb-2">Como funciona:</p>
                        <p>Neste modo, o assistente buscará em todo o seu cofre por notas relevantes para sua pergunta e as usará como contexto automaticamente.</p>
                    </div>
                 )}
            </div>
        </div>
    </div>
  );
};

export default ChatViewContent;