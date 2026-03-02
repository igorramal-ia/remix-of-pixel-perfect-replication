// Script de teste para verificar interpretação de perguntas

import { interpretQuestion } from "./src/services/questionInterpreter";

const perguntas = [
  "Quantos endereços estão disponíveis?",
  "Quantos endereços existem em SP?",
  "Quantos endereços estão ocupados?",
  "Quantas campanhas ativas existem?",
  "Quantos relatórios foram gerados?",
  "Quantas instalações ativas existem?",
];

console.log("=== TESTE DE INTERPRETAÇÃO ===\n");

perguntas.forEach((pergunta, index) => {
  console.log(`\n${index + 1}. Pergunta: "${pergunta}"`);
  const intent = interpretQuestion(pergunta);
  console.log("   Resultado:", JSON.stringify(intent, null, 2));
});
