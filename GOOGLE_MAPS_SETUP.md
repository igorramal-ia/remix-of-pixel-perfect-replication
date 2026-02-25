# Configuração do Google Maps

Este guia explica como configurar a API do Google Maps para a página de mapa do sistema.

## Pré-requisitos

1. Conta Google (Gmail)
2. Cartão de crédito (Google oferece $200 de crédito gratuito por mês)

## Passo a Passo

### 1. Acessar o Google Cloud Console

Acesse: https://console.cloud.google.com/

### 2. Criar um novo projeto (ou usar existente)

1. Clique no seletor de projetos no topo da página
2. Clique em "Novo Projeto"
3. Nome do projeto: "Digital Favela" (ou outro nome)
4. Clique em "Criar"

### 3. Ativar a API do Google Maps

1. No menu lateral, vá em "APIs e Serviços" > "Biblioteca"
2. Procure e ative as seguintes APIs:
   - **Maps JavaScript API** (obrigatória)
   - **Geocoding API** (opcional, para futuras funcionalidades)
   - **Places API** (opcional, para futuras funcionalidades)

### 4. Criar credenciais (API Key)

1. No menu lateral, vá em "APIs e Serviços" > "Credenciais"
2. Clique em "Criar Credenciais" > "Chave de API"
3. Sua chave será gerada automaticamente
4. **IMPORTANTE**: Clique em "Restringir chave" para configurar segurança

### 5. Configurar restrições da API Key (IMPORTANTE)

#### Restrições de aplicativo:
1. Selecione "Referenciadores HTTP (sites)"
2. Adicione seus domínios permitidos:
   ```
   localhost:*
   127.0.0.1:*
   seu-dominio.com/*
   *.seu-dominio.com/*
   ```

#### Restrições de API:
1. Selecione "Restringir chave"
2. Marque apenas:
   - Maps JavaScript API
   - (Outras APIs que você ativou)

3. Clique em "Salvar"

### 6. Configurar no projeto

#### Opção 1: Arquivo .env (Desenvolvimento)

Crie ou edite o arquivo `.env` na raiz do projeto:

```bash
VITE_GOOGLE_MAPS_KEY="sua_chave_api_aqui"
```

#### Opção 2: Variáveis de ambiente (Produção)

Configure a variável de ambiente no seu servidor/plataforma:

**Vercel:**
```bash
vercel env add VITE_GOOGLE_MAPS_KEY
```

**Netlify:**
- Vá em Site settings > Environment variables
- Adicione: `VITE_GOOGLE_MAPS_KEY` = `sua_chave_api_aqui`

**Outras plataformas:**
- Configure a variável de ambiente `VITE_GOOGLE_MAPS_KEY`

### 7. Instalar dependências

```bash
npm install
```

Ou se estiver usando outro gerenciador:

```bash
yarn install
# ou
pnpm install
# ou
bun install
```

### 8. Testar

1. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

2. Acesse a página do mapa: http://localhost:5173/mapa

3. Você deve ver o mapa carregado com os marcadores

## Funcionalidades Implementadas

### Mapa
- ✅ Centralizado no Brasil (lat: -15.7801, lng: -47.9292, zoom: 4)
- ✅ Controles de navegação (zoom, street view, etc)
- ✅ Gestos de toque otimizados

### Marcadores
- ✅ Busca todos os endereços com lat/long do Supabase
- ✅ Cores por status:
  - 🟢 Verde: Disponível
  - 🔴 Vermelho: Ocupado
  - ⚪ Cinza: Inativo
  - 🟠 Laranja: Manutenção

### Popup (InfoWindow)
- ✅ Endereço completo
- ✅ Comunidade
- ✅ Cidade
- ✅ UF
- ✅ Status com cor

### Legenda
- ✅ Exibida no canto superior direito
- ✅ Mostra todas as cores e seus significados

## Estrutura de Dados

A página busca dados da tabela `enderecos` com a seguinte estrutura:

```typescript
interface Endereco {
  id: string;
  uf: string;
  cidade: string;
  comunidade: string;
  endereco: string;
  lat: number;
  long: number;
  status: "disponivel" | "ocupado" | "inativo" | "manutencao";
}
```

## Custos

### Crédito Gratuito
- Google oferece **$200 de crédito gratuito por mês**
- Suficiente para aproximadamente:
  - 28.000 carregamentos de mapa por mês
  - 40.000 requisições de geocoding por mês

### Após o crédito gratuito
- Maps JavaScript API: $7 por 1.000 carregamentos
- Geocoding API: $5 por 1.000 requisições

### Dicas para economizar
1. Implemente cache de coordenadas
2. Use lazy loading para o mapa
3. Configure limites de uso no Google Cloud Console
4. Monitore o uso regularmente

## Solução de Problemas

### Erro: "This page can't load Google Maps correctly"
- Verifique se a API Key está correta
- Verifique se a Maps JavaScript API está ativada
- Verifique as restrições de domínio

### Mapa não carrega
- Verifique se `VITE_GOOGLE_MAPS_KEY` está definida
- Verifique o console do navegador para erros
- Reinicie o servidor de desenvolvimento após adicionar a variável

### Marcadores não aparecem
- Verifique se há endereços com lat/long no banco
- Verifique as políticas RLS do Supabase
- Verifique o console para erros de API

### Erro de CORS
- Adicione seu domínio nas restrições da API Key
- Para desenvolvimento local, adicione `localhost:*`

## Segurança

⚠️ **IMPORTANTE**:

1. **Nunca commite a API Key no Git**
   - Use `.env` (já está no .gitignore)
   - Use variáveis de ambiente em produção

2. **Sempre configure restrições**
   - Restrinja por domínio
   - Restrinja por API
   - Configure alertas de uso

3. **Monitore o uso**
   - Configure alertas no Google Cloud Console
   - Defina limites de uso diário
   - Revise o uso mensalmente

## Recursos Adicionais

- [Documentação oficial do Google Maps](https://developers.google.com/maps/documentation)
- [Preços do Google Maps](https://mapsplatform.google.com/pricing/)
- [Biblioteca React Google Maps](https://visgl.github.io/react-google-maps/)
- [Exemplos de código](https://github.com/visgl/react-google-maps/tree/main/examples)

## Próximas Funcionalidades

Possíveis melhorias futuras:

- [ ] Filtros por status
- [ ] Busca de endereços
- [ ] Clustering de marcadores (para muitos pontos)
- [ ] Rotas entre pontos
- [ ] Heatmap de densidade
- [ ] Exportar dados visíveis
- [ ] Modo Street View
- [ ] Desenhar áreas no mapa
