import React, { useState, useEffect } from 'react';
import { getVaultFileTree } from '../services/vaultService';
import { FileTreeNode, FolderNode, FileNode } from '../types';
import type { App as ObsidianApp } from 'obsidian';
import { FileTree } from './FileTree';

// --- Funções Auxiliares ---
function getAllFilePathsFromNode(node: FileTreeNode): string[] {
  if (node.type === 'file') {
    return [node.path];
  }
  
  if (node.type === 'folder') {
    return node.children.flatMap(getAllFilePathsFromNode);
  }
  
  return [];
}

// Encontra um nó na árvore pelo caminho (necessário para seleção de pasta)
function findNodeByPath(root: FolderNode, path: string): FileTreeNode | null {
    if (root.path === path) return root;
    
    for (const child of root.children) {
        if (child.path === path) return child;
        if (child.type === 'folder') {
            const found = findNodeByPath(child, path);
            if (found) return found;
        }
    }
    return null;
}
// --- Fim Funções Auxiliares ---


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
  
  const handleToggleSelection = (nodePath: string, nodeType: 'file' | 'folder') => {
    const newSelection = new Set(selectedPaths);
    
    let pathsToToggle: string[] = [];

    if (nodeType === 'file') {
        pathsToToggle = [nodePath];
    } else if (nodeType === 'folder' && rootNode) {
        const folderNode = findNodeByPath(rootNode, nodePath);
        if (folderNode) {
            pathsToToggle = getAllFilePathsFromNode(folderNode);
        }
    }

    if (pathsToToggle.length === 0) return;

    // Decide se deve adicionar ou remover
    // Se *qualquer* arquivo do grupo não estiver selecionado, adicionamos todos.
    // Se *todos* já estiverem selecionados, removemos todos.
    const shouldAdd = pathsToToggle.some(path => !newSelection.has(path));

    if (shouldAdd) {
        pathsToToggle.forEach(path => newSelection.add(path));
    } else {
        pathsToToggle.forEach(path => newSelection.delete(path));
    }

    setSelectedPaths(newSelection);
    onSelectionChange(Array.from(newSelection));
  };

  const handleClearSelection = () => {
    setSelectedPaths(new Set());
    onSelectionChange([]);
  };

  return (
    // Note: A div principal agora é flex-1 para preencher o espaço do modal
    <div className="bg-gray-800/50 flex flex-col h-full text-gray-300 flex-1 overflow-hidden">
      <div className="p-4">
        <div className="flex justify-between items-center mb-3">
            <p className="text-xs text-gray-400">Selecionadas: {selectedPaths.size}</p>
            {selectedPaths.size > 0 && (
                <button 
                    onClick={handleClearSelection}
                    className="text-xs text-purple-400 hover:text-purple-300"
                >
                    Limpar
                </button>
            )}
        </div>
        <input
          type="text"
          placeholder="Filtrar notas..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-1 mb-3 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
        />
      </div>
      
      <div className="flex-1 overflow-y-auto text-sm px-4 pb-4">
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