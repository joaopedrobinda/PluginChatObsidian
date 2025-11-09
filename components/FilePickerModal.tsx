import React, { useState } from 'react';
// Fix: Import TFile as a value for runtime checks (`instanceof`), and keep ObsidianApp as a type.
import { TFile, type App as ObsidianApp } from 'obsidian';
import VaultFileSelector from './VaultFileSelector';

interface FilePickerModalProps {
    isOpen: boolean;
    onClose: (selectedFiles?: TFile[]) => void;
    obsidianApp: ObsidianApp;
}

const FilePickerModal: React.FC<FilePickerModalProps> = ({ isOpen, onClose, obsidianApp }) => {
    const [selectedPaths, setSelectedPaths] = useState<string[]>([]);

    if (!isOpen) return null;

    const handleConfirm = () => {
        const selectedFiles = selectedPaths.map(path => {
            const file = obsidianApp.vault.getAbstractFileByPath(path);
            if (file instanceof TFile) {
                return file;
            }
            return null;
        }).filter((file): file is TFile => file !== null);
        onClose(selectedFiles);
    };

    return (
        <div 
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center transition-opacity animate-fade-in"
            onClick={() => onClose()}
        >
            <div 
                className="bg-gray-800 rounded-2xl shadow-xl w-[90%] max-w-3xl h-[80%] flex flex-col overflow-hidden border border-gray-700"
                onClick={(e) => e.stopPropagation()}
            >
                <header className="p-4 border-b border-gray-700 flex justify-between items-center flex-shrink-0">
                    <h2 className="font-semibold text-lg text-gray-100">Selecionar Notas para Contexto</h2>
                    <button onClick={() => onClose()} className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-gray-700">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </header>
                
                <div className="flex-grow overflow-hidden">
                    <VaultFileSelector obsidianApp={obsidianApp} onSelectionChange={setSelectedPaths} />
                </div>

                <footer className="p-4 border-t border-gray-700 flex justify-end items-center gap-3 flex-shrink-0 bg-gray-800/80 backdrop-blur-sm">
                    <button 
                        onClick={() => onClose()}
                        className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-700 text-gray-200 hover:bg-gray-600 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleConfirm}
                        className="px-5 py-2 rounded-lg text-sm font-medium bg-purple-600 text-white hover:bg-purple-700 transition-colors disabled:bg-purple-900 disabled:opacity-60"
                        disabled={selectedPaths.length === 0}
                    >
                        Anexar ({selectedPaths.length})
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default FilePickerModal;