import * as obsidian from "obsidian";
import React from "react";
import { createRoot, Root } from "react-dom/client";
import ChatModalContent from "../components/ChatModalContent";

export class ChatModal extends obsidian.Modal {
  private root: Root | null = null;
  private initialContext: string;
  private onInsert: ((text: string) => void) | null;

  constructor(app: obsidian.App, initialContext: string, onInsert: ((text: string) => void) | null) {
    super(app);
    this.initialContext = initialContext;
    this.onInsert = onInsert;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass('rag-chat-modal');

    this.root = createRoot(contentEl);
    this.root.render(
      React.createElement(
        React.StrictMode,
        null,
        React.createElement(ChatModalContent, {
          obsidianApp: this.app,
          initialContext: this.initialContext,
          onClose: () => this.close(),
          onInsert: this.onInsert,
        })
      )
    );
  }

  onClose() {
    const { contentEl } = this;
    if (this.root) {
      this.root.unmount();
    }
    contentEl.empty();
  }
}
