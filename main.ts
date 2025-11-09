import * as obsidian from 'obsidian';
import { ChatModal } from './src/ChatModal';

export default class MyRagChatPlugin extends obsidian.Plugin {

  constructor(app: obsidian.App, manifest: obsidian.PluginManifest) {
    super(app, manifest);
  }

  async onload() {
    console.log('Carregando o plugin de Chat RAG v2 (Estilo Copilot)...');

    // Adiciona um comando na paleta de comandos para abrir o modal
    this.addCommand({
      id: 'open-rag-chat-modal',
      name: 'Abrir Chat com a nota atual',
      editorCallback: (editor: obsidian.Editor, view: obsidian.MarkdownView) => {
        const fileContent = editor.getDoc().getValue();
        new ChatModal(this.app, fileContent, (response) => {
          editor.replaceSelection(response);
        }).open();
      },
    });
    
    // Adiciona um ícone na faixa lateral (ribbon) que também abre o modal
    this.addRibbonIcon('messages-square', 'Abrir Chat com IA', () => {
        const activeView = this.app.workspace.getActiveViewOfType(obsidian.MarkdownView);
        if (activeView) {
            const editor = activeView.editor;
            const fileContent = editor.getDoc().getValue();
            new ChatModal(this.app, fileContent, (response) => {
              editor.replaceSelection(response);
            }).open();
        } else {
            // Se não houver uma nota ativa, abre com contexto vazio
            new ChatModal(this.app, "", null).open();
        }
    });
  }

  onunload() {
    console.log('Descarregando o plugin de Chat RAG.');
  }
}
