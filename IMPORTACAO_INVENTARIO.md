# Guia de Importação do Inventário

Este guia explica como importar o arquivo `inventario_final.xlsx` para a tabela `enderecos` do Supabase.

## Pré-requisitos

1. Python 3.8 ou superior instalado
2. Arquivo `inventario_final.xlsx` na mesma pasta do script
3. Credenciais do Supabase (URL e Service Role Key)

## Instalação

### 1. Instalar dependências Python

```bash
pip install -r requirements.txt
```

Ou instalar manualmente:

```bash
pip install pandas openpyxl supabase python-dotenv
```

### 2. Configurar variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto (ou configure as variáveis no sistema):

```bash
SUPABASE_URL=https://ompimrxcmajdxwpahbub.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9tcGltcnhjbWFqZHh3cGFoYnViIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDYzODM5NiwiZXhwIjoyMDg2MjE0Mzk2fQ.xRKq5iB4X3vF6YMiYk215IctVoYuIsY8g5ZUoMnS2iI
```

**Importante:** Nunca commite o arquivo `.env` com suas credenciais reais!

### 3. Preparar o arquivo Excel

Certifique-se de que o arquivo `inventario_final.xlsx` possui as seguintes colunas:

- `UF` - Unidade Federativa (ex: RJ, SP)
- `CIDADE` - Nome da cidade
- `COMUNIDADE` - Nome da comunidade
- `ENDEREÇO` - Endereço completo
- `LAT` - Latitude (número decimal)
- `LONG` - Longitude (número decimal)

## Execução

### Opção 1: Usando variáveis de ambiente do sistema

```bash
# Windows (PowerShell)
$env:SUPABASE_URL="https://ompimrxcmajdxwpahbub.supabase.co"
$env:SUPABASE_SERVICE_KEY="sua_service_key_aqui"
python import_inventario.py

# Linux/Mac
export SUPABASE_URL="https://ompimrxcmajdxwpahbub.supabase.co"
export SUPABASE_SERVICE_KEY="sua_service_key_aqui"
python import_inventario.py
```

### Opção 2: Usando arquivo .env

```bash
# Instalar python-dotenv se ainda não tiver
pip install python-dotenv

# Executar o script (ele lerá automaticamente o .env)
python import_inventario.py
```

Para usar o arquivo .env, adicione estas linhas no início do script:

```python
from dotenv import load_dotenv
load_dotenv()  # Adicionar após os imports
```

## Funcionamento do Script

O script realiza as seguintes operações:

1. **Validação inicial**
   - Verifica se o arquivo Excel existe
   - Verifica se as variáveis de ambiente estão configuradas
   - Valida as colunas do arquivo

2. **Leitura dos dados**
   - Lê o arquivo Excel usando pandas
   - Mostra o total de linhas encontradas

3. **Confirmação**
   - Solicita confirmação antes de iniciar a importação

4. **Importação em lotes**
   - Insere registros em lotes de 50 para melhor performance
   - Mostra progresso a cada lote inserido
   - Captura e registra erros

5. **Mapeamento de campos**
   ```
   UF → uf
   CIDADE → cidade
   COMUNIDADE → comunidade
   ENDEREÇO → endereco
   LAT → lat
   LONG → long
   status → "disponivel" (fixo)
   ```

6. **Resumo final**
   - Total de registros inseridos
   - Total de erros
   - Taxa de sucesso
   - Lista dos primeiros 10 erros (se houver)

## Exemplo de Saída

```
============================================================
🗂️  IMPORTADOR DE INVENTÁRIO - SUPABASE
============================================================
✅ Conectado ao Supabase

📖 Lendo arquivo inventario_final.xlsx...
✅ Arquivo lido com sucesso: 847 linhas encontradas

⚠️  Você está prestes a importar 847 registros
Deseja continuar? (s/n): s

🚀 Iniciando importação de 847 registros...
📦 Tamanho do lote: 50 registros

✓ Progresso: 50/847 registros inseridos
✓ Progresso: 100/847 registros inseridos
✓ Progresso: 150/847 registros inseridos
...
✓ Progresso: 847/847 registros inseridos

============================================================
📊 RESUMO DA IMPORTAÇÃO
============================================================
✅ Total de registros inseridos: 847
❌ Total de erros: 0
📈 Taxa de sucesso: 100.0%
============================================================

✅ Importação concluída!
```

## Tratamento de Erros

O script trata os seguintes tipos de erros:

- **Arquivo não encontrado**: Verifica se o Excel existe
- **Colunas faltando**: Valida se todas as colunas necessárias estão presentes
- **Dados inválidos**: Converte valores vazios para None
- **Erros de conexão**: Captura erros de rede/API
- **Erros de inserção**: Registra linhas que falharam

## Dicas

1. **Backup**: Faça backup da tabela antes de importar
2. **Teste**: Teste primeiro com um arquivo pequeno
3. **Limpeza**: Se precisar reimportar, limpe a tabela primeiro:
   ```sql
   DELETE FROM enderecos WHERE status = 'disponivel';
   ```
4. **Performance**: O script usa lotes de 50 registros para otimizar a importação
5. **Logs**: Salve a saída do script para referência futura:
   ```bash
   python import_inventario.py > importacao.log 2>&1
   ```

## Solução de Problemas

### Erro: "Variáveis de ambiente não configuradas"
- Verifique se definiu SUPABASE_URL e SUPABASE_SERVICE_KEY

### Erro: "Arquivo não encontrado"
- Certifique-se de que `inventario_final.xlsx` está na mesma pasta do script

### Erro: "Colunas faltando"
- Verifique se o Excel tem exatamente as colunas: UF, CIDADE, COMUNIDADE, ENDEREÇO, LAT, LONG

### Erro de permissão no Supabase
- Verifique se está usando a SERVICE_ROLE_KEY (não a anon key)
- Verifique as políticas RLS da tabela enderecos

## Segurança

⚠️ **IMPORTANTE**: 
- A SERVICE_ROLE_KEY tem acesso total ao banco
- Nunca exponha esta chave em código público
- Não commite o arquivo `.env` no Git
- Use variáveis de ambiente em produção
