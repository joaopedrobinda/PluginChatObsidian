// FIX: Using named imports from 'obsidian' instead of a namespace import ('* as obsidian') to ensure TypeScript correctly resolves the types and base class properties.
import { ItemView, WorkspaceLeaf } from "obsidian";
import React from "react";
import { createRoot, Root } from "react-dom/client";
import ChatViewContent from "../components/ChatViewContent";

export const RAG_CHAT_VIEW_TYPE = "rag-chat-view";

interface MyPluginSettings {
  apiKey: string;
}

export class ChatView extends ItemView {
  private root: Root | null = null;
  private settings: MyPluginSettings;

  constructor(leaf: WorkspaceLeaf, settings: MyPluginSettings) {
    super(leaf);
    this.settings = settings;
  }

  getViewType() {
    return RAG_CHAT_VIEW_TYPE;
  }

  getDisplayText() {
    return "Chat RAG";
  }

  getIcon() {
    return "messages-square";
  }

  async onOpen() {
    const container = this.containerEl.children[1];
    container.empty();
    
    this.root = createRoot(container);
    this.root.render(
      React.createElement(
        React.StrictMode,
        null,
        React.createElement(ChatViewContent, {
          obsidianApp: this.app,
          settings: this.settings
        })
      )
    );
  }

  async onClose() {
    if (this.root) {
      this.root.unmount();
    }
  }
}