
import React, { useState, useEffect, useMemo } from 'react';
import { getVaultFileTree } from '../services/vaultService';
import { FileTreeNode, FolderNode, FileNode } from '../types';
import type { App as ObsidianApp } from 'obsidian';
import { FileTree } from './FileTree';

interface VaultFileSelectorProps {
  onSelectionChange: (selectedPaths: string[]) => void;
  obsidianApp: ObsidianApp;
}

const VaultFileSelector: React.FC<VaultFileSelectorProps> = ({ onSelectionChange, obsidianApp }) => {
  const [rootNode, setRootNode] = useState<FolderNode | null>(null);
  const [selectedPaths, setSelectedPaths] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [filter, setFilter] = useState<string>('');

  useEffect(() => {
    try {
      const tree = getVaultFileTree(obsidianApp);
      setRootNode(tree);
    } catch (error) {
      console.error("Erro ao construir a árvore de arquivos do cofre:", error);
    } finally {
      setIsLoading(false);
    }
  }, [obsidianApp]);
  
  const handleToggleSelection = (filePath: string) => {
    const newSelection = new Set(selectedPaths);
    if (newSelection.has(filePath)) {
      newSelection.delete(filePath);
    } else {
      newSelection.add(filePath);
    }
    setSelectedPaths(newSelection);
    onSelectionChange(Array.from(newSelection));
  };

  return (
    <div className="p-4 bg-gray-800/50 flex flex-col h-full text-gray-300">
      <h3 className="font-bold text-lg mb-2">Notas para Contexto</h3>
      <p className="text-xs text-gray-400 mb-3">Selecionadas: {selectedPaths.size}</p>
      <input
        type="text"
        placeholder="Filtrar notas..."
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-1 mb-3 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
      />
      
      <div className="flex-1 overflow-y-auto text-sm pr-2">
        {isLoading ? (
          <p>Carregando notas do cofre...</p>
        ) : rootNode ? (
          <FileTree 
            node={rootNode}
            filter={filter}
            selectedPaths={selectedPaths}
            onToggleSelection={handleToggleSelection}
          />
        ) : (
          <p>Nenhuma nota encontrada.</p>
        )}
      </div>
    </div>
  );
};

export default VaultFileSelector;
