
import React, { useState, useEffect } from 'react';
import { getVaultFiles } from '../services/vaultService';
import { VaultFile } from '../types';
import type { App as ObsidianApp } from 'obsidian';

interface VaultFileSelectorProps {
  onSelectionChange: (selectedIds: string[]) => void;
  obsidianApp: ObsidianApp;
}

const VaultFileSelector: React.FC<VaultFileSelectorProps> = ({ onSelectionChange, obsidianApp }) => {
  const [files, setFiles] = useState<VaultFile[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isOpen, setIsOpen] = useState<boolean>(false); // Começa fechado por padrão

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const vaultFiles = await getVaultFiles(obsidianApp);
        setFiles(vaultFiles);
      } catch (error) {
        console.error("Erro ao buscar arquivos do cofre:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchFiles();
  }, [obsidianApp]);

  const handleToggleSelection = (fileId: string) => {
    const newSelection = new Set(selectedIds);
    if (newSelection.has(fileId)) {
      newSelection.delete(fileId);
    } else {
      newSelection.add(fileId);
    }
    setSelectedIds(newSelection);
    onSelectionChange(Array.from(newSelection));
  };

  return (
    <div className="p-4 border-b border-gray-700 bg-gray-800/50">
      <button onClick={() => setIsOpen(!isOpen)} className="w-full text-left font-bold text-lg mb-2 flex justify-between items-center">
        <span>Adicionar mais notas ao contexto</span>
        <span className={`transform transition-transform ${isOpen ? 'rotate-180' : 'rotate-0'}`}>▼</span>
      </button>
      {isOpen && (
        <div className="text-gray-400 text-sm max-h-48 overflow-y-auto">
          {isLoading ? (
            <p>Carregando notas do cofre...</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {files.map(file => (
                <label key={file.id} className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-700 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    className="form-checkbox h-4 w-4 bg-gray-600 border-gray-500 rounded text-purple-500 focus:ring-purple-500"
                    checked={selectedIds.has(file.id)}
                    onChange={() => handleToggleSelection(file.id)}
                  />
                  <span className="truncate" title={file.path}>{file.name}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VaultFileSelector;
