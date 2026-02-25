#!/usr/bin/env python3
"""
Script para importar inventário de endereços do Excel para o Supabase
Uso: python import_inventario.py
Requer variáveis de ambiente: SUPABASE_URL e SUPABASE_SERVICE_KEY
"""

import os
import sys
from typing import List, Dict, Any
import pandas as pd
from supabase import create_client, Client

# Configurações
EXCEL_FILE = "inventario_final.xlsx"
BATCH_SIZE = 50

def get_supabase_client() -> Client:
    """Cria e retorna cliente do Supabase"""
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_KEY")
    
    if not url or not key:
        print("❌ Erro: Variáveis de ambiente não configuradas")
        print("Configure SUPABASE_URL e SUPABASE_SERVICE_KEY")
        sys.exit(1)
    
    return create_client(url, key)

def read_excel_file(filename: str) -> pd.DataFrame:
    """Lê o arquivo Excel e retorna um DataFrame"""
    try:
        print(f"📖 Lendo arquivo {filename}...")
        df = pd.read_excel(filename)
        print(f"✅ Arquivo lido com sucesso: {len(df)} linhas encontradas")
        return df
    except FileNotFoundError:
        print(f"❌ Erro: Arquivo {filename} não encontrado")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Erro ao ler arquivo: {e}")
        sys.exit(1)

def prepare_row(row: pd.Series) -> Dict[str, Any]:
    """Prepara uma linha do Excel para inserção no Supabase"""
    return {
        "uf": str(row["UF"]).strip() if pd.notna(row["UF"]) else "",
        "cidade": str(row["CIDADE"]).strip() if pd.notna(row["CIDADE"]) else "",
        "comunidade": str(row["COMUNIDADE"]).strip() if pd.notna(row["COMUNIDADE"]) else "",
        "endereco": str(row["ENDEREÇO"]).strip() if pd.notna(row["ENDEREÇO"]) else "",
        "lat": float(row["LAT"]) if pd.notna(row["LAT"]) else None,
        "long": float(row["LONG"]) if pd.notna(row["LONG"]) else None,
        "status": "disponivel"
    }

def insert_batch(client: Client, batch: List[Dict[str, Any]]) -> tuple[int, List[str]]:
    """Insere um lote de registros no Supabase"""
    try:
        response = client.table("enderecos").insert(batch).execute()
        return len(batch), []
    except Exception as e:
        error_msg = str(e)
        print(f"⚠️  Erro ao inserir lote: {error_msg}")
        return 0, [error_msg]

def import_data(client: Client, df: pd.DataFrame) -> None:
    """Importa os dados do DataFrame para o Supabase"""
    total_rows = len(df)
    inserted_count = 0
    error_count = 0
    errors = []
    
    print(f"\n🚀 Iniciando importação de {total_rows} registros...")
    print(f"📦 Tamanho do lote: {BATCH_SIZE} registros\n")
    
    batch = []
    
    for idx, row in df.iterrows():
        try:
            prepared_row = prepare_row(row)
            batch.append(prepared_row)
            
            # Inserir quando o lote estiver cheio
            if len(batch) >= BATCH_SIZE:
                success, batch_errors = insert_batch(client, batch)
                inserted_count += success
                error_count += len(batch_errors)
                errors.extend(batch_errors)
                
                print(f"✓ Progresso: {inserted_count}/{total_rows} registros inseridos")
                batch = []
                
        except Exception as e:
            error_msg = f"Linha {idx + 2}: {str(e)}"
            errors.append(error_msg)
            error_count += 1
            print(f"⚠️  {error_msg}")
    
    # Inserir registros restantes
    if batch:
        success, batch_errors = insert_batch(client, batch)
        inserted_count += success
        error_count += len(batch_errors)
        errors.extend(batch_errors)
        print(f"✓ Progresso: {inserted_count}/{total_rows} registros inseridos")
    
    # Resumo final
    print("\n" + "="*60)
    print("📊 RESUMO DA IMPORTAÇÃO")
    print("="*60)
    print(f"✅ Total de registros inseridos: {inserted_count}")
    print(f"❌ Total de erros: {error_count}")
    print(f"📈 Taxa de sucesso: {(inserted_count/total_rows*100):.1f}%")
    
    if errors:
        print(f"\n⚠️  ERROS ENCONTRADOS ({len(errors)}):")
        for i, error in enumerate(errors[:10], 1):  # Mostrar apenas os 10 primeiros
            print(f"  {i}. {error}")
        if len(errors) > 10:
            print(f"  ... e mais {len(errors) - 10} erros")
    
    print("="*60)

def main():
    """Função principal"""
    print("="*60)
    print("🗂️  IMPORTADOR DE INVENTÁRIO - SUPABASE")
    print("="*60)
    
    # Verificar se o arquivo existe
    if not os.path.exists(EXCEL_FILE):
        print(f"\n❌ Erro: Arquivo '{EXCEL_FILE}' não encontrado")
        print(f"📁 Coloque o arquivo na mesma pasta do script")
        sys.exit(1)
    
    # Criar cliente Supabase
    client = get_supabase_client()
    print("✅ Conectado ao Supabase\n")
    
    # Ler arquivo Excel
    df = read_excel_file(EXCEL_FILE)
    
    # Validar colunas
    required_columns = ["UF", "CIDADE", "COMUNIDADE", "ENDEREÇO", "LAT", "LONG"]
    missing_columns = [col for col in required_columns if col not in df.columns]
    
    if missing_columns:
        print(f"❌ Erro: Colunas faltando no arquivo: {', '.join(missing_columns)}")
        print(f"📋 Colunas encontradas: {', '.join(df.columns)}")
        sys.exit(1)
    
    # Confirmar importação
    print(f"\n⚠️  Você está prestes a importar {len(df)} registros")
    response = input("Deseja continuar? (s/n): ").lower().strip()
    
    if response != 's':
        print("❌ Importação cancelada")
        sys.exit(0)
    
    # Importar dados
    import_data(client, df)
    
    print("\n✅ Importação concluída!")

if __name__ == "__main__":
    main()
