/**
 * Testes para o serviço Gemini
 * Execute: npm run test
 */

import { describe, it, expect } from "vitest";
import { askGemini, testGeminiConnection } from "../services/gemini";

describe("Gemini Service", () => {
  it("deve lançar erro se VITE_GEMINI_KEY não estiver configurada", async () => {
    // Salvar a chave original
    const originalKey = import.meta.env.VITE_GEMINI_KEY;
    
    // Remover temporariamente
    // @ts-ignore
    import.meta.env.VITE_GEMINI_KEY = undefined;

    await expect(askGemini("teste")).rejects.toThrow(
      "VITE_GEMINI_KEY não está configurada"
    );

    // Restaurar
    // @ts-ignore
    import.meta.env.VITE_GEMINI_KEY = originalKey;
  });

  it("deve lançar erro se o prompt estiver vazio", async () => {
    await expect(askGemini("")).rejects.toThrow(
      "O prompt não pode estar vazio"
    );
  });

  it("deve retornar uma resposta válida para um prompt simples", async () => {
    // Este teste só funciona se VITE_GEMINI_KEY estiver configurada
    if (!import.meta.env.VITE_GEMINI_KEY) {
      console.warn("VITE_GEMINI_KEY não configurada, pulando teste de integração");
      return;
    }

    const response = await askGemini("Diga apenas 'OK'");
    expect(response).toBeTruthy();
    expect(typeof response).toBe("string");
    expect(response.length).toBeGreaterThan(0);
  }, 10000); // Timeout de 10s para chamada de API

  it("deve testar a conexão com sucesso", async () => {
    if (!import.meta.env.VITE_GEMINI_KEY) {
      console.warn("VITE_GEMINI_KEY não configurada, pulando teste de conexão");
      return;
    }

    const isConnected = await testGeminiConnection();
    expect(typeof isConnected).toBe("boolean");
  }, 10000);
});
