import React, { useState, useRef, useEffect } from 'react';
import type { App as ObsidianApp, TFile } from 'obsidian';
import AttachmentButton from './AttachmentButton';
import Spinner from './Spinner';

const SendIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="m22 2-7 20-4-9-9-4Z"></path><path d="M22 2 11 13"></path>
    </svg>
);

const CloseIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
);

const FileIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
);

interface ChatInputProps {
  onSendMessage: (input: string, attachedFiles: TFile[]) => void;
  isLoading: boolean;
  obsidianApp: ObsidianApp;
}

const AttachmentChip: React.FC<{ file: TFile, onRemove: (file: TFile) => void }> = ({ file, onRemove }) => (
    <div className="flex items-center gap-2 bg-gray-600/70 text-gray-200 text-sm pl-2.5 pr-1.5 py-1 rounded-full animate-fade-in">
        <FileIcon className="flex-shrink-0" />
        <span className="truncate max-w-40" title={file.path}>{file.basename}</span>
        <button onClick={() => onRemove(file)} className="p-1 rounded-full hover:bg-gray-500/50 transition-colors">
            <CloseIcon />
        </button>
    </div>
);


const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isLoading, obsidianApp }) => {
  const [userInput, setUserInput] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<TFile[]>([]);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textAreaRef.current) {
      textAreaRef.current.style.height = 'auto';
      const scrollHeight = textAreaRef.current.scrollHeight;
      textAreaRef.current.style.height = `${scrollHeight}px`;
    }
  }, [userInput]);

  const handleSendMessage = (e?: React.FormEvent) => {
    e?.preventDefault();
    onSendMessage(userInput, attachedFiles);
    setUserInput('');
    setAttachedFiles([]);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
    }
  };

  const handleAddAttachments = (files: TFile[]) => {
    setAttachedFiles(prev => {
        const newFiles = files.filter(f => !prev.some(pf => pf.path === f.path));
        return [...prev, ...newFiles];
    });
  };

  const handleRemoveAttachment = (fileToRemove: TFile) => {
    setAttachedFiles(prev => prev.filter(f => f.path !== fileToRemove.path));
  };
  
  return (
    <div className="flex-shrink-0 p-4 w-full max-w-4xl mx-auto flex flex-col gap-2">
      {attachedFiles.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap mb-1">
              {attachedFiles.map(file => (
                  <AttachmentChip key={file.path} file={file} onRemove={handleRemoveAttachment} />
              ))}
          </div>
      )}
      
      <form
          onSubmit={handleSendMessage}
          className="bg-[var(--surface-color)] border border-[var(--border-color)] rounded-2xl p-2 flex items-start space-x-2 relative"
      >
          <AttachmentButton 
              obsidianApp={obsidianApp}
              onFilesSelected={handleAddAttachments}
              disabled={isLoading}
          />
          <textarea
              ref={textAreaRef}
              rows={1}
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isLoading ? 'Aguardando resposta...' : 'Pergunte algo...'}
              className="flex-1 bg-transparent px-2 py-2.5 focus:outline-none resize-none max-h-48 text-base placeholder:text-gray-500"
              disabled={isLoading}
          />
          <button
              type="submit"
              disabled={isLoading || !userInput.trim()}
              className="bg-gray-700 hover:bg-purple-600 disabled:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed text-white p-2.5 rounded-full transition-colors flex items-center justify-center self-end"
          >
              {isLoading ? <Spinner/> : <SendIcon />}
          </button>
      </form>
      <p className="text-xs text-center text-gray-500 mt-1">
        Contexto {attachedFiles.length > 0 ? `Manual com ${attachedFiles.length} nota(s)` : 'Automático'}
      </p>
    </div>
  );
};

export default ChatInput;
