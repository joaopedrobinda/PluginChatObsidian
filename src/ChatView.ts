import { ItemView, WorkspaceLeaf, App as ObsidianApp } from "obsidian";
import React from "react";
import { createRoot, Root } from "react-dom/client";
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
    // Corrigido: Acessa o elemento de conteúdo 'contentEl' fornecido pela API ItemView.
    // Isso garante que o React seja renderizado no local correto dentro da UI do Obsidian.
    const container = this.contentEl;
    container.empty(); // Limpa o container da view

    this.root = createRoot(container);
    // Renderiza o componente React principal, passando a instância do App do Obsidian
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
