import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const supabaseUrl = 'https://ompimrxcmajdxwpahbub.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9tcGltcnhjbWFqZHh3cGFoYnViIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDYzODM5NiwiZXhwIjoyMDg2MjE0Mzk2fQ.xRKq5iB4X3vF6YMiYk215IctVoYuIsY8g5ZUoMnS2iI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
  try {
    console.log('Aplicando migration...');
    
    const sql = readFileSync('test-cidades-cobertura.sql', 'utf8');
    
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      console.error('Erro ao aplicar migration:', error);
      return;
    }
    
    console.log('Migration aplicada com sucesso!');
    console.log('Dados:', data);
  } catch (err) {
    console.error('Erro:', err);
  }
}

applyMigration();
