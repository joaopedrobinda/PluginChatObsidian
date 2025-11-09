import { ItemView, WorkspaceLeaf, App as ObsidianApp } from "obsidian";
import React from "react";
import { createRoot, Root } from "react-dom/client";
// FIX: Corrigido o caminho de importação para o componente App, que está na pasta raiz.
import AppComponent from "../App";

export const CHAT_VIEW_TYPE = "rag-chat-view";

export class ChatView extends ItemView {
  private root: Root | null = null;

  constructor(leaf: WorkspaceLeaf, private obsidianApp: ObsidianApp) {
    super(leaf);
  }

  getViewType() {
    return CHAT_VIEW_TYPE;
  }

  getDisplayText() {
    return "Chat com IA (RAG)";
  }

  async onOpen() {
    // FIX: Substituído `this.containerEl.children[1]` por `this.contentEl` para acessar o container de conteúdo da view.
    // Isso resolve o erro "Property 'containerEl' does not exist" e é uma forma mais robusta de acessar o elemento.
    const container = this.contentEl;
    container.empty(); // Limpa o container da view

    this.root = createRoot(container);
    // Renderiza o componente React principal, passando a instância do App do Obsidian
    // FIX: Substituído JSX por `React.createElement` para evitar erros de sintaxe em um arquivo .ts, resolvendo múltiplos erros de compilação.
    this.root.render(
      React.createElement(
        React.StrictMode,
        null,
        React.createElement(AppComponent, { obsidianApp: this.obsidianApp })
      )
    );
  }

  async onClose() {
    // Garante que o React seja "desmontado" corretamente para liberar recursos
    if (this.root) {
      this.root.unmount();
    }
  }
}
