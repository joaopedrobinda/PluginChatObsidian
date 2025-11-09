
import { GoogleGenAI, Chat } from "@google/genai";

// A chave da API deve ser gerenciada por variáveis de ambiente.
// Em um plugin real, viria das configurações do plugin.
const apiKey = process.env.API_KEY;
if (!apiKey) {
  // Em um app real, você teria um tratamento de erro melhor
  // mas aqui vamos lançar um erro para deixar claro.
  console.error("A variável de ambiente API_KEY não está definida.");
}
const ai = new GoogleGenAI({ apiKey: apiKey || 'YOUR_API_KEY_HERE' });

export const getChatResponse = async (userMessage: string, context: string): Promise<string> => {
  if (!apiKey) {
    return "A chave da API do Gemini não foi configurada. Em um plugin real, você a adicionaria nas configurações.";
  }
  
  try {
    const chat: Chat = ai.chats.create({
      model: 'gemini-2.5-flash',
      // Não estamos usando histórico de chat aqui para que cada RAG seja independente.
      // Você poderia adaptar para manter o histórico se quisesse.
    });

    const ragPrompt = `
      Você é um assistente de produtividade e coach pessoal que analisa as notas de um usuário do Obsidian.
      Sua tarefa é fornecer insights, resumos e conselhos com base no CONTEXTO fornecido.
      Seja conciso, prestativo e responda sempre em português do Brasil.

      ---
      CONTEXTO (Notas do usuário):
      ${context}
      ---

      PERGUNTA DO USUÁRIO:
      ${userMessage}
    `;

    const response = await chat.sendMessage({ message: ragPrompt });

    return response.text;

  } catch (error) {
    console.error("Erro ao chamar a API do Gemini:", error);
    return "Desculpe, ocorreu um erro ao tentar me comunicar com a IA. Verifique o console para mais detalhes.";
  }
};
