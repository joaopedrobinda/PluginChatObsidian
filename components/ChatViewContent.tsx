import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { App as ObsidianApp, TFile } from 'obsidian';
import { ChatMessage, MessageAuthor } from '../types';
import { getChatResponse } from '../services/geminiService';
import { getFileContent, findRelevantFiles } from '../services/vaultService';
import Message from './Message';
import Spinner from './Spinner';
import AttachmentButton from './AttachmentButton';

// --- Ícones ---
const SendIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="m22 2-7 20-4-9-9-4Z"></path><path d="M22 2 11 13"></path>
    </svg>
);

const FileIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
);

const CloseIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
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

// --- Componentes da UI ---

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

const WelcomeScreen: React.FC<{ onCardClick: (prompt: string) => void }> = ({ onCardClick }) => {
    const cards = [
        { title: "Resumir uma nota", description: "Peça um resumo de uma nota longa anexada.", prompt: "Resuma a nota anexada em 3 pontos principais." },
        { title: "Criar um plano de ação", description: "Use suas notas de projeto para gerar os próximos passos.", prompt: "Com base nas notas do projeto, crie um plano de ação para a próxima semana." },
        { title: "Explicar um conceito", description: "Anexe uma nota sobre um tópico complexo e peça uma explicação simples.", prompt: "Explique o conceito principal da nota anexada como se eu tivesse 5 anos." },
        { title: "Brainstorm de ideias", description: "Combine ideias de várias notas para gerar novas perspectivas.", prompt: "Combine as ideias das notas anexadas e sugira 3 novos tópicos para explorar." },
    ];

    return (
        <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <div className="w-16 h-16 mb-6 rounded-2xl bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.45 4.9-4.9 1.45 4.9 1.45 1.45 4.9 1.45-4.9 4.9-1.45-4.9-1.45z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/></svg>
            </div>
            <h1 className="text-4xl font-bold text-gray-200 mb-2">Olá!</h1>
            <p className="text-lg text-gray-400 mb-10">Como posso te ajudar a conectar as ideias hoje?</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-4xl">
                {cards.map((card, i) => (
                    <button key={i} onClick={() => onCardClick(card.prompt)} className="p-4 bg-gray-700/50 hover:bg-gray-700 rounded-xl text-left transition-colors">
                        <h3 className="font-semibold text-gray-200">{card.title}</h3>
                        <p className="text-sm text-gray-400">{card.description}</p>
                    </button>
                ))}
            </div>
        </div>
    );
};


const AttachmentChip: React.FC<{ file: TFile, onRemove: (file: TFile) => void }> = ({ file, onRemove }) => (
    <div className="flex items-center gap-2 bg-gray-600/70 text-gray-200 text-sm pl-2.5 pr-1.5 py-1 rounded-full animate-fade-in">
        <FileIcon className="flex-shrink-0" />
        <span className="truncate max-w-40" title={file.path}>{file.basename}</span>
        <button onClick={() => onRemove(file)} className="p-1 rounded-full hover:bg-gray-500/50 transition-colors">
            <CloseIcon />
        </button>
    </div>
);


// --- Componente Principal do Chat ---
const ChatViewContent: React.FC<ChatViewContentProps> = ({ obsidianApp, settings }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState<string>('');
  const [loadingState, setLoadingState] = useState<LoadingState>('idle');
  const [attachedFiles, setAttachedFiles] = useState<TFile[]>([]);
  const [contextMode, setContextMode] = useState<ContextMode>('auto');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  // Ajusta a altura do textarea
  useEffect(() => {
    if (textAreaRef.current) {
      textAreaRef.current.style.height = 'auto';
      const scrollHeight = textAreaRef.current.scrollHeight;
      textAreaRef.current.style.height = `${scrollHeight}px`;
    }
  }, [userInput]);

  const handleWelcomeCardClick = (prompt: string) => {
    setUserInput(prompt);
    textAreaRef.current?.focus();
  }

  const handleAddAttachments = useCallback((files: TFile[]) => {
    setAttachedFiles(prev => {
        const newFiles = files.filter(f => !prev.some(pf => pf.path === f.path));
        return [...prev, ...newFiles];
    });
    setContextMode('manual'); // Selecting files forces manual mode
  }, []);

  const handleRemoveAttachment = (fileToRemove: TFile) => {
    setAttachedFiles(prev => prev.filter(f => f.path !== fileToRemove.path));
  }
  
  const handleContextModeChange = (mode: ContextMode) => {
      if (mode === 'auto') {
          setAttachedFiles([]); // Clear attachments when switching to auto
      }
      setContextMode(mode);
  }

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!userInput.trim() || loadingState !== 'idle') return;

    const userMessage: ChatMessage = { author: MessageAuthor.USER, text: userInput };
    const currentInput = userInput;
    const currentAttachments = [...attachedFiles];
    
    setMessages(prev => [...prev, userMessage]);
    setUserInput('');
    setLoadingState('searching');
    
    // Clear attachments after sending if in manual mode
    if (contextMode === 'manual') {
        setAttachedFiles([]);
    }

    try {
        let combinedContext = '';
        let filesUsed: TFile[] = [];

        if (contextMode === 'auto') {
            const relevantFiles = await findRelevantFiles(obsidianApp, currentInput);
            if (relevantFiles.length > 0) {
                filesUsed = relevantFiles.map(f => f.file);
                combinedContext = relevantFiles.map(f => `## Nota: ${f.file.basename}\n\n${f.content}`).join('\n\n---\n\n');
                 setMessages(prev => [...prev, { author: MessageAuthor.SYSTEM, text: `Usando ${filesUsed.length} nota(s) relevante(s) como contexto.` }]);
            } else {
                 setMessages(prev => [...prev, { author: MessageAuthor.SYSTEM, text: "Nenhuma nota relevante encontrada. Respondendo com conhecimento geral." }]);
            }
        } else { // Manual Mode
            if (currentAttachments.length > 0) {
                const contextPromises = currentAttachments.map(file => getFileContent(obsidianApp, file.path));
                const contextContents = await Promise.all(contextPromises);
                combinedContext = contextContents.join('\n\n---\n\n');
                filesUsed = currentAttachments;
                if (!combinedContext.trim()) {
                    setMessages(prev => [...prev, { author: MessageAuthor.SYSTEM, text: "As notas selecionadas estão vazias." }]);
                } else {
                    setMessages(prev => [...prev, { author: MessageAuthor.SYSTEM, text: `Usando ${filesUsed.length} nota(s) selecionada(s) como contexto.` }]);
                }
            } else {
                setMessages(prev => [...prev, { author: MessageAuthor.SYSTEM, text: "Modo manual ativado, mas nenhuma nota foi selecionada. Respondendo com conhecimento geral." }]);
            }
        }
      
      setLoadingState('processing');

      // Build history, excluding system messages
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
      const errorMessage: ChatMessage = { author: MessageAuthor.SYSTEM, text: "Ocorreu um erro ao processar sua solicitação. Verifique o console." };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoadingState('idle');
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
    }
  };

  if (!settings.apiKey) {
      return <ApiKeyMessage />;
  }

  return (
    <div className="flex flex-col h-full bg-gray-800 text-gray-200 font-sans overflow-hidden" style={{ background: 'radial-gradient(circle at top, #2d3748, #1a202c)' }}>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {messages.length === 0 ? (
                <WelcomeScreen onCardClick={handleWelcomeCardClick} />
            ) : (
                messages.map((msg, index) => <Message key={index} message={msg} />)
            )}
            <div ref={messagesEndRef} />
        </div>
        
        <div className="p-4 w-full max-w-4xl mx-auto flex flex-col gap-2">
            {/* Attachment Chips */}
            {attachedFiles.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap mb-2">
                    {attachedFiles.map(file => (
                        <AttachmentChip key={file.path} file={file} onRemove={handleRemoveAttachment} />
                    ))}
                </div>
            )}
            
            {/* Input Form */}
            <div className="bg-gray-700/50 border border-gray-600/80 rounded-2xl p-2 flex items-start space-x-2 relative">
                 {loadingState !== 'idle' && (
                    <div className="absolute inset-0 bg-gray-800/50 rounded-2xl flex items-center justify-center z-10">
                         <div className="flex items-center gap-2 text-sm text-gray-300">
                             <Spinner/>
                             <span>{loadingState === 'searching' ? 'Buscando contexto...' : 'Processando...'}</span>
                         </div>
                    </div>
                 )}
                <AttachmentButton 
                    obsidianApp={obsidianApp}
                    onFilesSelected={handleAddAttachments}
                    contextMode={contextMode}
                    onContextModeChange={handleContextModeChange}
                />
                <textarea
                    ref={textAreaRef}
                    rows={1}
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={'Pergunte algo...'}
                    className="flex-1 bg-transparent px-2 py-2.5 focus:outline-none resize-none max-h-48 text-base"
                    disabled={loadingState !== 'idle'}
                />
                <button
                    type="button"
                    onClick={handleSendMessage}
                    disabled={loadingState !== 'idle' || !userInput.trim()}
                    className="bg-gray-600 hover:bg-purple-600 disabled:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white p-2.5 rounded-lg transition-colors flex items-center justify-center self-end"
                >
                    <SendIcon />
                </button>
            </div>
            <p className="text-xs text-center text-gray-500 mt-2">
                Modo de Contexto: <span className="font-semibold text-gray-400">{contextMode === 'auto' ? 'Automático' : 'Manual'}</span>.
            </p>
        </div>
    </div>
  );
};

export default ChatViewContent;