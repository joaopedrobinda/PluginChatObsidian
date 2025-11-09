import { GoogleGenAI, Chat } from "@google/genai";

export const getChatResponse = async (userMessage: string, context: string, apiKey: string): Promise<string> => {
  if (!apiKey) {
    return "A chave da API do Gemini não foi configurada. Por favor, adicione-a nas configurações do plugin.";
  }
  
  try {
    const ai = new GoogleGenAI({ apiKey });

    const chat: Chat = ai.chats.create({
      model: 'gemini-2.5-flash',
    });

    // Se não houver contexto, podemos usar um prompt um pouco diferente
    const contextPrompt = context.trim() 
        ? `---
CONTEXTO (Notas do usuário):
${context}
---` 
        : `---
CONTEXTO: Nenhuma nota foi fornecida como contexto. Responda com base em seu conhecimento geral.
---`;

    const ragPrompt = `
      Você é um assistente de produtividade e coach pessoal que analisa as notas de um usuário do Obsidian.
      Sua tarefa é fornecer insights, resumos e conselhos com base no CONTEXTO fornecido.
      Seja conciso, prestativo e responda sempre em português do Brasil.

      ${contextPrompt}

      PERGUNTA DO USUÁRIO:
      ${userMessage}
    `;

    const response = await chat.sendMessage({ message: ragPrompt });

    return response.text;

  } catch (error) {
    console.error("Erro ao chamar a API do Gemini:", error);
    if (error.message.includes('API key not valid')) {
        return "Desculpe, a chave da API do Gemini fornecida não é válida. Verifique-a nas configurações do plugin.";
    }
    return "Desculpe, ocorreu um erro ao tentar me comunicar com a IA. Verifique o console para mais detalhes.";
  }
};
