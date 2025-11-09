// FIX: Usando a importação de namespace para 'obsidian' para resolver corretamente os tipos das classes base e suas propriedades.
import * as obsidian from 'obsidian';
import { ChatView, RAG_CHAT_VIEW_TYPE } from './src/ChatView';
import { MyPluginSettingTab } from './src/SettingTab';

// Interface para definir a estrutura das nossas configurações
interface MyPluginSettings {
  apiKey: string;
}

// Configurações padrão ao carregar o plugin pela primeira vez
const DEFAULT_SETTINGS: MyPluginSettings = {
  apiKey: ''
}

export default class MyRagChatPlugin extends obsidian.Plugin {
  settings: MyPluginSettings;

  async onload() {
    console.log('Carregando o plugin de Chat RAG v3 (View Dedicada)...');

    // Carrega as configurações do plugin
    await this.loadSettings();

    // Adiciona a aba de configurações
    this.addSettingTab(new MyPluginSettingTab(this.app, this));

    // Registra a nossa View customizada
    this.registerView(
      RAG_CHAT_VIEW_TYPE,
      (leaf) => new ChatView(leaf, this.settings)
    );

    // Adiciona um ícone na faixa lateral para ativar a nossa View
    this.addRibbonIcon('messages-square', 'Abrir Chat RAG', () => {
      this.activateView();
    });
  }

  onunload() {
    console.log('Descarregando o plugin de Chat RAG.');
  }

  // Função para carregar as configurações salvas
  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  // Função para salvar as configurações
  async saveSettings() {
    await this.saveData(this.settings);
  }

  // Função para abrir ou focar na nossa view
  async activateView() {
    const { workspace } = this.app;

    let leaf: obsidian.WorkspaceLeaf | null = null;
    const leaves = workspace.getLeavesOfType(RAG_CHAT_VIEW_TYPE);

    if (leaves.length > 0) {
      // A view já está aberta, vamos focar nela
      leaf = leaves[0];
    } else {
      // A view não está aberta, vamos abrir em uma nova aba
      leaf = workspace.getLeaf(true);
      await leaf.setViewState({
        type: RAG_CHAT_VIEW_TYPE,
        active: true,
      });
    }

    // Revela a aba
    if (leaf) {
        workspace.revealLeaf(leaf);
    }
  }
}