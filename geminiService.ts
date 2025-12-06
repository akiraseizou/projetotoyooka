import { GoogleGenAI } from "@google/genai";
import { Transaction } from "../types";

const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key not found");
  return new GoogleGenAI({ apiKey });
};

export const generateReportAnalysis = async (
  transactions: Transaction[],
  type: 'ENTRY' | 'EXIT' | 'GENERAL',
  month: string
): Promise<string> => {
  try {
    const ai = getAiClient();
    
    // Summarize data to send to LLM to save tokens
    const totalValue = transactions.reduce((acc, t) => acc + t.totalValue, 0);
    const topClients = Object.entries(transactions.reduce((acc, t) => {
      acc[t.clientName] = (acc[t.clientName] || 0) + t.totalValue;
      return acc;
    }, {} as Record<string, number>))
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

    const prompt = `
      Atue como um analista de negócios sênior. Analise os seguintes dados de estoque referentes ao mês de ${month}.
      Tipo de Relatório: ${type === 'ENTRY' ? 'Entrada de Materiais' : type === 'EXIT' ? 'Saída de Produtos' : 'Geral'}.
      
      Dados Resumidos:
      - Valor Total Movimentado: R$ ${totalValue.toFixed(2)}
      - Top Clientes/Fornecedores: ${JSON.stringify(topClients)}
      - Quantidade de Transações: ${transactions.length}

      Por favor, forneça:
      1. Um resumo executivo da movimentação.
      2. Insights sobre os principais clientes/fornecedores.
      3. Sugestões de ação (ex: renegociar com fornecedores, focar em clientes VIP).
      
      Mantenha o tom profissional e direto. Responda em Português do Brasil.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "Não foi possível gerar a análise.";
  } catch (error) {
    console.error("Erro ao chamar Gemini:", error);
    return "Erro ao gerar análise. Verifique sua chave de API.";
  }
};