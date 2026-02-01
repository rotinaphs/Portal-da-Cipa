
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function generateElectionReport(stats: any) {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Gere um parágrafo profissional e formal de introdução para um relatório de eleição da CIPA baseado nos seguintes dados: Empresa: ${stats.companyName}, Candidatos: ${stats.approved}, Votos Totais: ${stats.votes}.`,
    });
    return response.text;
  } catch (error) {
    return "Relatório de eleição gerado conforme normas da NR-5.";
  }
}
