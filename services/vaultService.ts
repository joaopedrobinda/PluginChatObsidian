import { FileTreeNode, FolderNode, FileNode } from '../types';
import { TFile, TFolder, TAbstractFile, type App as ObsidianApp } from 'obsidian';

/**
 * Constrói uma árvore hierárquica de arquivos e pastas a partir do cofre do Obsidian.
 * @param app - A instância do App do Obsidian.
 * @returns Uma estrutura de nó raiz representando o cofre.
 */
export const getVaultFileTree = (app: ObsidianApp): FolderNode => {
  const root = app.vault.getRoot();
  return processFolder(root);
};

function processFolder(folder: TFolder): FolderNode {
  const children: FileTreeNode[] = [];
  
  // Ordena para que as pastas apareçam antes dos arquivos
  const sortedChildren = folder.children.sort((a, b) => {
    const aIsFolder = a instanceof TFolder;
    const bIsFolder = b instanceof TFolder;
    if (aIsFolder && !bIsFolder) return -1;
    if (!aIsFolder && bIsFolder) return 1;
    return a.name.localeCompare(b.name);
  });

  for (const child of sortedChildren) {
    if (child instanceof TFolder) {
      children.push(processFolder(child));
    } else if (child instanceof TFile && child.extension === 'md') {
      const fileNode: FileNode = {
        type: 'file',
        name: child.basename,
        path: child.path,
      };
      children.push(fileNode);
    }
  }

  return {
    type: 'folder',
    name: folder.name,
    path: folder.path,
    children: children,
  };
}


/**
 * Lê o conteúdo de um arquivo específico do cofre.
 * @param app - A instância do App do Obsidian.
 * @param filePath - O caminho do arquivo.
 * @returns Uma promessa que resolve para o conteúdo do arquivo.
 */
export const getFileContent = async (app: ObsidianApp, filePath: string): Promise<string> => {
  const file = app.vault.getAbstractFileByPath(filePath);
  if (file instanceof TFile) {
    return app.vault.cachedRead(file);
  }
  return '';
};
