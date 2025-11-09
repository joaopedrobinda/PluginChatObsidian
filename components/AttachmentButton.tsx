import React, { useState, useRef, useEffect } from 'react';
import type { App as ObsidianApp, TFile } from 'obsidian';
import FilePickerModal from './FilePickerModal';

const PaperclipIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
    </svg>
);

const CheckIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
);

interface AttachmentButtonProps {
    obsidianApp: ObsidianApp;
    onFilesSelected: (files: TFile[]) => void;
    contextMode: 'auto' | 'manual';
    onContextModeChange: (mode: 'auto' | 'manual') => void;
}

const AttachmentButton: React.FC<AttachmentButtonProps> = ({ 
    obsidianApp, 
    onFilesSelected,
    contextMode,
    onContextModeChange
}) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        if (isMenuOpen) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isMenuOpen]);

    const handleSelectFiles = () => {
        setIsMenuOpen(false);
        setIsModalOpen(true);
    };

    const handleModalClose = (selectedFiles?: TFile[]) => {
        setIsModalOpen(false);
        if (selectedFiles && selectedFiles.length > 0) {
            onFilesSelected(selectedFiles);
        }
    };

    return (
        <div className="relative" ref={menuRef}>
            <button
                type="button"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-gray-400 hover:text-gray-200 p-2.5 rounded-lg hover:bg-gray-600 transition-colors"
                title="Anexar arquivos e configurar contexto"
            >
                <PaperclipIcon />
            </button>

            {isMenuOpen && (
                <div className="absolute bottom-full left-0 mb-2 w-64 bg-gray-800 border border-gray-700 rounded-xl shadow-xl overflow-hidden z-10 animate-fade-in-up">
                    <div className="p-3 border-b border-gray-700">
                        <h3 className="text-sm font-semibold text-gray-200 mb-3">Modo de Contexto</h3>
                        <div className="space-y-2">
                            <button
                                onClick={() => {
                                    onContextModeChange('auto');
                                    setIsMenuOpen(false);
                                }}
                                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                                    contextMode === 'auto' 
                                        ? 'bg-purple-600 text-white' 
                                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                }`}
                            >
                                <div className="flex flex-col items-start">
                                    <span className="font-medium">Automático</span>
                                    <span className="text-xs opacity-80">Busca notas relevantes</span>
                                </div>
                                {contextMode === 'auto' && <CheckIcon />}
                            </button>
                            
                            <button
                                onClick={() => {
                                    onContextModeChange('manual');
                                    handleSelectFiles();
                                }}
                                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                                    contextMode === 'manual' 
                                        ? 'bg-purple-600 text-white' 
                                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                }`}
                            >
                                <div className="flex flex-col items-start">
                                    <span className="font-medium">Manual</span>
                                    <span className="text-xs opacity-80">Escolha os arquivos</span>
                                </div>
                                {contextMode === 'manual' && <CheckIcon />}
                            </button>
                        </div>
                    </div>
                    
                    {contextMode === 'manual' && (
                         <div className="p-3">
                            <button
                                onClick={handleSelectFiles}
                                className="w-full flex items-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg text-sm transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><path d="M12 11v6"></path><path d="M9 14h6"></path>
                                </svg>
                                <span>Adicionar mais arquivos</span>
                            </button>
                        </div>
                    )}


                    <div className="p-3 bg-gray-900/50 border-t border-gray-700">
                        <p className="text-xs text-gray-400">
                            {contextMode === 'auto' 
                                ? 'As notas mais relevantes serão usadas automaticamente como contexto.' 
                                : 'Selecione manualmente quais notas deseja usar como contexto.'}
                        </p>
                    </div>
                </div>
            )}

            <FilePickerModal
                isOpen={isModalOpen}
                onClose={handleModalClose}
                obsidianApp={obsidianApp}
            />
        </div>
    );
};

export default AttachmentButton;