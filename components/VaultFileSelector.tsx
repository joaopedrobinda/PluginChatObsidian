import React, { useState, useEffect, useMemo } from 'react';
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
  const [filter, setFilter] = useState<string>('');

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

  const filteredFiles = useMemo(() => {
    return files.filter(file => file.name.toLowerCase().includes(filter.toLowerCase()));
  }, [files, filter]);

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
  
  const handleSelectAll = (isChecked: boolean) => {
    const newSelection = new Set<string>();
    if (isChecked) {
      filteredFiles.forEach(file => newSelection.add(file.id));
    }
    setSelectedIds(newSelection);
    onSelectionChange(Array.from(newSelection));
  };

  const allFilteredSelected = filteredFiles.length > 0 && filteredFiles.every(file => selectedIds.has(file.id));

  return (
    <div className="p-4 bg-gray-800/50 flex flex-col h-full">
      <h3 className="font-bold text-lg mb-2 text-gray-300">Notas para Contexto</h3>
      <input
        type="text"
        placeholder="Filtrar notas..."
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-1 mb-3 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
      />
      <div className="flex items-center mb-3 border-b border-gray-700 pb-3">
          <input
            type="checkbox"
            id="select-all"
            className="form-checkbox h-4 w-4 bg-gray-600 border-gray-500 rounded text-purple-500 focus:ring-purple-500"
            checked={allFilteredSelected}
            onChange={(e) => handleSelectAll(e.target.checked)}
            disabled={filteredFiles.length === 0}
          />
          <label htmlFor="select-all" className="ml-2 text-sm text-gray-400">
            Selecionar todos os filtrados ({selectedIds.size}/{filteredFiles.length})
          </label>
      </div>

      <div className="flex-1 overflow-y-auto text-gray-400 text-sm">
        {isLoading ? (
          <p>Carregando notas do cofre...</p>
        ) : (
          <div className="space-y-1">
            {filteredFiles.map(file => (
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
    </div>
  );
};

export default VaultFileSelector;
