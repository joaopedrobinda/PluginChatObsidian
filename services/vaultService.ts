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

/**
 * Encontra os arquivos mais relevantes no cofre com base em uma consulta de pesquisa.
 * @param app A instância do aplicativo Obsidian.
 * @param query A string de pesquisa do usuário.
 * @param topN O número de arquivos principais a serem retornados.
 * @returns Uma promessa que resolve para uma matriz de arquivos com seu conteúdo.
 */
export const findRelevantFiles = async (
  app: ObsidianApp,
  query: string,
  topN: number = 3
): Promise<{ file: TFile; content: string }[]> => {
  const allFiles = app.vault.getMarkdownFiles();
  const lowerQuery = query.toLowerCase();
  const queryWords = lowerQuery.split(/\s+/).filter(Boolean);

  if (queryWords.length === 0) {
    return [];
  }

  const fileScores = await Promise.all(
    allFiles.map(async (file) => {
      const content = await app.vault.cachedRead(file);
      const lowerContent = content.toLowerCase();
      const lowerBasename = file.basename.toLowerCase();
      let score = 0;

      // 1. Bônus por correspondência exata no nome do arquivo
      if (lowerBasename.includes(lowerQuery)) {
        score += 10;
      }
      
      // 2. Bônus por palavras-chave no nome do arquivo
      for (const word of queryWords) {
        if (lowerBasename.includes(word)) {
          score += 5;
        }
      }

      // 3. Bônus por correspondência exata da frase no conteúdo
      if (lowerContent.includes(lowerQuery)) {
          score += 5;
      }

      // 4. Pontuação por palavras-chave no conteúdo
      for (const word of queryWords) {
        if (lowerContent.includes(word)) {
          score += 1;
        }
      }
      
      // 5. Bônus de "Recência" (arquivos modificados recentemente são mais relevantes)
      const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
      if (file.stat.mtime > oneWeekAgo) {
          score += 2;
      }

      return { file, content, score };
    })
  );

  // Filtra arquivos com pontuação > 0 e ordena do maior para o menor
  const sortedFiles = fileScores
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);

  // Log para depuração
  console.log("Arquivos Relevantes Encontrados:", sortedFiles.slice(0, topN).map(f => ({ path: f.file.path, score: f.score })));

  // Retorna os top N arquivos
  return sortedFiles.slice(0, topN).map(item => ({ file: item.file, content: item.content }));
};