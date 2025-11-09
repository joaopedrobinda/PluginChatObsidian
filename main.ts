import { App, Plugin, PluginManifest } from 'obsidian';
import { ChatView, CHAT_VIEW_TYPE } from './src/ChatView';

export default class MyRagChatPlugin extends Plugin {

  // FIX: Adicionado construtor explícito para garantir a inicialização correta
  // e ajudar o TypeScript a resolver as propriedades e métodos herdados da classe Plugin.
  constructor(app: App, manifest: PluginManifest) {
    super(app, manifest);
  }

  async onload() {
    console.log('Carregando o plugin de Chat RAG...');

    this.registerView(
      CHAT_VIEW_TYPE,
      (leaf) => new ChatView(leaf, this.app)
    );

    this.addRibbonIcon('messages-square', 'Abrir Chat com IA', () => {
      this.activateView();
    });
  }

  onunload() {
    console.log('Descarregando o plugin de Chat RAG.');
  }

  async activateView() {
    // Remove qualquer aba do nosso tipo que já esteja aberta para não duplicar
    this.app.workspace.detachLeavesOfType(CHAT_VIEW_TYPE);

    // Abre a nossa view em uma nova aba
    await this.app.workspace.getLeaf(false).setViewState({
      type: CHAT_VIEW_TYPE,
      active: true,
    });

    // Coloca o foco na nossa view
    this.app.workspace.revealLeaf(
      this.app.workspace.getLeavesOfType(CHAT_VIEW_TYPE)[0]
    );
  }
}
