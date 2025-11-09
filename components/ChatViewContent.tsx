import React, { useState, useRef, useEffect } from 'react';
import type { App as ObsidianApp, TFile } from 'obsidian';
import { ChatMessage, MessageAuthor } from '../types';
import { getChatResponse } from '../services/geminiService';
import { getFileContent, findRelevantFiles } from '../services/vaultService';
import Message from './Message';
import VaultFileSelector from './VaultFileSelector';
import Spinner from './Spinner';

// --- Ícones ---
const AtSignIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <circle cx="12" cy="12" r="4"></circle><path d="M16 8v5a4 4 0 0 0-4 4h-4a4 4 0 0 0-4-4V8z"></path><path d="M16 12A4 4 0 0 1 12 16"></path>
    </svg>
);

const SendIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="m22 2-7 20-4-9-9-4Z"></path><path d="M22 2 11 13"></path>
    </svg>
);

const CloseIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
);
// --- Fim dos Ícones ---


interface MyPluginSettings {
  apiKey: string;
}

interface ChatViewContentProps {
  obsidianApp: ObsidianApp;
  settings: MyPluginSettings;
}

type ContextMode = 'manual' | 'auto';
type LoadingState = 'idle' | 'searching' | 'processing' | 'error';

// Componente de pop-up (Modal) para seleção de contexto
const ContextModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    obsidianApp: ObsidianApp;
    contextMode: ContextMode;
    setContextMode: (mode: ContextMode) => void;
    onSelectionChange: (paths: string[]) => void;
}> = ({ isOpen, onClose, obsidianApp, contextMode, setContextMode, onSelectionChange }) => {
    if (!isOpen) return null;

    return (
        <div 
            className="absolute inset-0 bg-gray-900 bg-opacity-75 z-10 flex items-center justify-center"
            onClick={onClose}
        >
            <div 
                className="bg-gray-800 rounded-lg shadow-xl w-3/4 max-w-2xl h-3/4 flex flex-col"
                onClick={(e) => e.stopPropagation()} // Impede o fechamento ao clicar dentro
            >
                <header className="p-4 border-b border-gray-700 flex justify-between items-center">
                    <h3 className="font-bold text-lg">Configurar Contexto</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        <CloseIcon />
                    </button>
                </header>
                
                <div className="p-4 border-b border-gray-700">
                    <h3 className="font-semibold text-sm mb-3">Modo de Contexto</h3>
                    <div className="flex space-x-2">
                        <button onClick={() => setContextMode('auto')} className={`flex-1 py-1 text-sm rounded-md transition-colors ${contextMode === 'auto' ? 'bg-purple-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>Automático</button>
                        <button onClick={() => setContextMode('manual')} className={`flex-1 py-1 text-sm rounded-md transition-colors ${contextMode === 'manual' ? 'bg-purple-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>Manual</button>
                    </div>
                </div>

                {contextMode === 'manual' && (
                    <VaultFileSelector obsidianApp={obsidianApp} onSelectionChange={onSelectionChange} />
                )}
                {contextMode === 'auto' && (
                    <div className="p-4 text-sm text-gray-400 flex-1">
                        <p className="font-bold text-gray-300 mb-2">Como funciona:</p>
                        <p>Neste modo, o assistente buscará em todo o seu cofre por notas relevantes para sua pergunta e as usará como contexto automaticamente.</p>
                    </div>
                )}
            </div>
        </div>
    );
};


// Componente para a mensagem de falta de API Key
const ApiKeyMessage: React.FC = () => (
    <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <h2 className="text-2xl font-bold mb-4 text-purple-400">Bem-vindo ao Assistente Pessoal!</h2>
        <p className="text-gray-400 mb-6">
            Para começar, você precisa adicionar sua chave da API do Gemini.
        </p>
        <p className="text-gray-400">
            Vá para <code className="bg-gray-900 p-1 rounded">Configurações</code> &gt; <code className="bg-gray-900 p-1 rounded">Chat RAG com Gemini</code> e insira sua chave.
        </p>
    </div>
);


// --- Componente Principal do Chat ---
const ChatViewContent: React.FC<ChatViewContentProps> = ({ obsidianApp, settings }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { author: MessageAuthor.SYSTEM, text: "Faça uma pergunta ou clique no ícone '@' para configurar o contexto." }
  ]);
  const [userInput, setUserInput] = useState<string>('');
  const [loadingState, setLoadingState] = useState<LoadingState>('idle');
  const [selectedFilePaths, setSelectedFilePaths] = useState<string[]>([]);
  const [contextMode, setContextMode] = useState<ContextMode>('auto');
  const [lastUsedFiles, setLastUsedFiles] = useState<TFile[]>([]);
  const [isContextModalOpen, setIsContextModalOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  // Ajusta a altura do textarea dinamicamente
  useEffect(() => {
    if (textAreaRef.current) {
      textAreaRef.current.style.height = 'auto';
      textAreaRef.current.style.height = `${textAreaRef.current.scrollHeight}px`;
    }
  }, [userInput]);

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
                 setMessages(prev => [...prev, { author: MessageAuthor.SYSTEM, text: "Nenhuma nota relevante encontrada. Respondendo com conhecimento geral." }]);
            }
        } else { // Manual Mode
            if (selectedFilePaths.length > 0) {
                const contextPromises = selectedFilePaths.map(path => getFileContent(obsidianApp, path));
                const contextContents = await Promise.all(contextPromises);
                combinedContext = contextContents.join('\n\n---\n\n');
                if (!combinedContext.trim()) {
                    setMessages(prev => [...prev, { author: MessageAuthor.SYSTEM, text: "As notas selecionadas estão vazias." }]);
                }
            } else {
                setMessages(prev => [...prev, { author: MessageAuthor.SYSTEM, text: "Modo manual ativado, mas nenhuma nota foi selecionada. Respondendo com conhecimento geral." }]);
            }
        }
      
      setLoadingState('processing');

      const chatHistory = messages
          .filter(m => m.author === MessageAuthor.USER || m.author === MessageAuthor.MODEL)
          .map(m => ({
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

  const getContextLabel = () => {
      if (contextMode === 'auto') {
          return "Contexto: Automático";
      }
      if (selectedFilePaths.length === 0) {
          return "Contexto: Manual (0 arquivos)";
      }
      const fileText = selectedFilePaths.length === 1 ? "arquivo" : "arquivos";
      return `Contexto: ${selectedFilePaths.length} ${fileText}`;
  }

  return (
    <div className="flex flex-col h-full bg-gray-800 text-gray-200 font-sans overflow-hidden relative">
        {/* Header */}
        <header className="p-4 border-b border-gray-700 flex justify-center items-center relative">
            <h2 className="text-xl font-bold text-purple-400">Assistente Pessoal</h2>
        </header>
        
        {/* Lista de Mensagens */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, index) => (
                <React.Fragment key={index}>
                    <Message message={msg} />
                    {msg.author === MessageAuthor.MODEL && lastUsedFiles.length > 0 && (
                         <div className="flex justify-start text-xs text-gray-400 pl-2">
                            <span className="mr-2 font-semibold">Contexto usado:</span>
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
        
        {/* Área de Input (Formulário) */}
        <div className="p-4 border-t border-gray-700">
            {/* Indicador de Contexto */}
            <div className="flex items-center text-xs text-gray-400 mb-2">
                <button 
                    onClick={() => setIsContextModalOpen(true)}
                    className="p-1 mr-2 bg-gray-700 hover:bg-gray-600 rounded-md"
                    title="Configurar Contexto"
                >
                    <AtSignIcon className="w-4 h-4" />
                </button>
                <span>{getContextLabel()}</span>
            </div>

            {/* Caixa de Texto Estilo Gemini */}
            <form onSubmit={handleSendMessage} className="bg-gray-700 rounded-xl p-2 flex items-start space-x-2">
                <textarea
                    ref={textAreaRef}
                    rows={1}
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={
                        loadingState === 'searching' ? 'Buscando...' :
                        loadingState === 'processing' ? 'Processando...' :
                        'Pergunte algo...'
                    }
                    className="flex-1 bg-transparent px-2 py-3 focus:outline-none resize-none max-h-40"
                    disabled={loadingState !== 'idle'}
                />
                <button
                    type="submit"
                    disabled={loadingState !== 'idle' || !userInput.trim()}
                    className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-900 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold p-3 rounded-lg transition-colors flex items-center justify-center self-end"
                >
                    {loadingState !== 'idle' ? <Spinner /> : <SendIcon className="w-5 h-5" />}
                </button>
            </form>
        </div>

        {/* Modal de Contexto */}
        <ContextModal 
            isOpen={isContextModalOpen}
            onClose={() => setIsContextModalOpen(false)}
            obsidianApp={obsidianApp}
            contextMode={contextMode}
            setContextMode={setContextMode}
            onSelectionChange={setSelectedFilePaths}
        />
    </div>
  );
};

export default ChatViewContent;