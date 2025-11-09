
import { VaultFile } from '../types';

// SIMULAÇÃO: Lista de arquivos que seriam lidos do cofre do Obsidian.
const MOCK_VAULT_FILES: VaultFile[] = [
  { id: 'daily-2024-07-29', name: 'Nota Diária 2024-07-29.md', path: 'Diário/' },
  { id: 'project-alpha', name: 'Projeto Alpha - Planejamento.md', path: 'Projetos/' },
  { id: 'meeting-recap', name: 'Resumo Reunião de Kickoff.md', path: 'Reuniões/' },
  { id: 'weekly-review', name: 'Revisão Semanal - S30.md', path: 'Reviews/' },
];

// SIMULAÇÃO: Conteúdo dos arquivos.
const MOCK_FILE_CONTENT: Record<string, string> = {
  'daily-2024-07-29': `
# Nota Diária 29/07/2024
- [x] Finalizar o relatório de performance.
- [ ] Iniciar a refatoração do módulo de autenticação.
- Sentimento do dia: Focado. O café ajudou.
- Dificuldade: A API externa está instável.
  `,
  'project-alpha': `
# Planejamento do Projeto Alpha
- **Objetivo:** Lançar o novo dashboard de métricas até o final do Q3.
- **Stakeholders:** Maria (Produto), João (Engenharia).
- **Riscos:** Dependência da API de terceiros que está apresentando instabilidade.
  `,
  'meeting-recap': `
# Resumo da Reunião de Kickoff - Projeto Alpha
- **Participantes:** Eu, Maria, João.
- **Decisões:** A prioridade é a visualização de dados em tempo real. O backend será em .NET 8 com Minimal APIs. O frontend será em React.
- **Próximos Passos:** Criar o repositório no GitHub e definir as primeiras tarefas.
  `,
  'weekly-review': `
# Revisão Semanal - Semana 30
- **Conquistas:** Relatório de performance entregue. Protótipo inicial do dashboard concluído.
- **Bloqueios:** A instabilidade da API externa nos atrasou em 1 dia.
- **Plano para próxima semana:** Focar na integração com a API de autenticação e começar os testes de carga.
  `,
};

// SIMULAÇÃO: Esta função, em um plugin real, usaria `this.app.vault.getMarkdownFiles()`
export const getVaultFiles = async (): Promise<VaultFile[]> => {
  console.log('Simulando a busca de arquivos no cofre do Obsidian...');
  return new Promise(resolve => setTimeout(() => resolve(MOCK_VAULT_FILES), 500));
};

// SIMULAÇÃO: Esta função, em um plugin real, usaria `this.app.vault.cachedRead(file)`
export const getFileContent = async (fileId: string): Promise<string> => {
  console.log(`Simulando a leitura do conteúdo do arquivo: ${fileId}`);
  return new Promise(resolve => setTimeout(() => resolve(MOCK_FILE_CONTENT[fileId] || ''), 200));
};
