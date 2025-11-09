import { VaultFile } from '../types';
// FIX: TFile must be imported as a value to be used in `instanceof`.
import { TFile, type App as ObsidianApp } from 'obsidian';

/**
 * Lê todos os arquivos markdown do cofre do Obsidian.
 * @param app - A instância do App do Obsidian.
 * @returns Uma promessa que resolve para uma lista de VaultFile.
 */
export const getVaultFiles = async (app: ObsidianApp): Promise<VaultFile[]> => {
  const markdownFiles = app.vault.getMarkdownFiles();
  return markdownFiles.map(file => ({
    id: file.path, // Usar o caminho como ID único é mais robusto
    name: file.basename,
    path: file.path,
  }));
};

/**
 * Lê o conteúdo de um arquivo específico do cofre.
 * @param app - A instância do App do Obsidian.
 * @param fileId - O caminho do arquivo (que estamos usando como ID).
 * @returns Uma promessa que resolve para o conteúdo do arquivo.
 */
export const getFileContent = async (app: ObsidianApp, fileId: string): Promise<string> => {
  const file = app.vault.getAbstractFileByPath(fileId);
  if (file instanceof TFile) {
    return app.vault.cachedRead(file);
  }
  return '';
};
