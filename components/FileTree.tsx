import React, { useState } from 'react';
import { FileTreeNode, FolderNode, FileNode } from '../types';

// Ícones SVG para uma melhor aparência
const FolderIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"></path>
    </svg>
);

const FileIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline>
    </svg>
);

const ChevronRightIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="m9 18 6-6-6-6"></path>
    </svg>
);


interface FileTreeProps {
  node: FileTreeNode;
  filter: string;
  selectedPaths: Set<string>;
  onToggleSelection: (filePath: string) => void;
  level?: number;
}

// Função auxiliar para verificar se um nó ou seus filhos correspondem ao filtro
const doesNodeMatchFilter = (node: FileTreeNode, filter: string): boolean => {
    if (node.name.toLowerCase().includes(filter.toLowerCase())) {
        return true;
    }
    if (node.type === 'folder') {
        return node.children.some(child => doesNodeMatchFilter(child, filter));
    }
    return false;
};

export const FileTree: React.FC<FileTreeProps> = ({ node, filter, selectedPaths, onToggleSelection, level = 0 }) => {
  const [isExpanded, setIsExpanded] = useState(level < 2); // Auto-expande os primeiros níveis

  if (!doesNodeMatchFilter(node, filter)) {
    return null;
  }

  if (node.type === 'file') {
    return (
      <div style={{ paddingLeft: `${level * 16}px` }} className="flex items-center space-x-2 p-1 rounded-md hover:bg-gray-700/50 transition-colors">
        <label className="flex items-center space-x-2 cursor-pointer w-full">
            <input
              type="checkbox"
              className="form-checkbox h-4 w-4 bg-gray-600 border-gray-500 rounded text-purple-500 focus:ring-purple-500 flex-shrink-0"
              checked={selectedPaths.has(node.path)}
              onChange={() => onToggleSelection(node.path)}
            />
            <FileIcon className="text-gray-400 flex-shrink-0"/>
            <span className="truncate" title={node.path}>{node.name}</span>
        </label>
      </div>
    );
  }

  if (node.type === 'folder') {
    // Não renderizar o diretório raiz (/)
    const isRoot = node.path === '/';

    return (
      <div>
        {!isRoot && (
            <div 
                style={{ paddingLeft: `${level * 16}px` }} 
                className="flex items-center space-x-2 p-1 rounded-md hover:bg-gray-700/50 transition-colors cursor-pointer"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <ChevronRightIcon className={`transform transition-transform flex-shrink-0 ${isExpanded ? 'rotate-90' : ''}`} />
                <FolderIcon className="text-yellow-500/80 flex-shrink-0" />
                <span className="font-semibold truncate">{node.name}</span>
            </div>
        )}
        {(isExpanded || isRoot) && (
          <div className={`${!isRoot ? 'ml-4 border-l border-gray-700' : ''}`}>
            {node.children.map(child => (
              <FileTree 
                key={child.path} 
                node={child}
                filter={filter}
                selectedPaths={selectedPaths}
                onToggleSelection={onToggleSelection}
                level={isRoot ? 0 : level + 1}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return null;
};