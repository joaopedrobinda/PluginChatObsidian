import { App, PluginSettingTab, Setting } from 'obsidian';
import MyRagChatPlugin from '../main';

export class MyPluginSettingTab extends PluginSettingTab {
	plugin: MyRagChatPlugin;

	constructor(app: App, plugin: MyRagChatPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		containerEl.createEl('h2', {text: 'Configurações do Chat RAG com Gemini'});

		new Setting(containerEl)
			.setName('Chave da API do Gemini')
			.setDesc('Cole aqui sua chave da API do Google AI Studio. É necessário para que o chat funcione.')
			.addText(text => text
				.setPlaceholder('Insira sua chave...')
				.setValue(this.plugin.settings.apiKey)
				.onChange(async (value) => {
					this.plugin.settings.apiKey = value;
					await this.plugin.saveSettings();
				}));
	}
}