export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      campanha_coordenadores: {
        Row: {
          campanha_id: string
          coordenador_id: string
          criado_em: string
          endereco_ids: string[]
          id: string
        }
        Insert: {
          campanha_id: string
          coordenador_id: string
          criado_em?: string
          endereco_ids?: string[]
          id?: string
        }
        Update: {
          campanha_id?: string
          coordenador_id?: string
          criado_em?: string
          endereco_ids?: string[]
          id?: string
        }
        Relationships: []
      }
      campanhas: {
        Row: {
          cidade: string | null
          cliente: string
          criado_em: string
          data_fim: string | null
          data_inicio: string | null
          gestor_id: string | null
          id: string
          nome: string
        }
        Insert: {
          cidade?: string | null
          cliente: string
          criado_em?: string
          data_fim?: string | null
          data_inicio?: string | null
          gestor_id?: string | null
          id?: string
          nome: string
        }
        Update: {
          cidade?: string | null
          cliente?: string
          criado_em?: string
          data_fim?: string | null
          data_inicio?: string | null
          gestor_id?: string | null
          id?: string
          nome?: string
        }
        Relationships: []
      }
      cidades_cobertura: {
        Row: {
          cidade: string
          criado_em: string
          id: string
          uf: string
        }
        Insert: {
          cidade: string
          criado_em?: string
          id?: string
          uf: string
        }
        Update: {
          cidade?: string
          criado_em?: string
          id?: string
          uf?: string
        }
        Relationships: []
      }
      enderecos: {
        Row: {
          cidade: string
          comunidade: string
          criado_em: string
          criado_por: string | null
          endereco: string
          id: string
          lat: number | null
          long: number | null
          status: Database["public"]["Enums"]["endereco_status"]
          uf: string
        }
        Insert: {
          cidade: string
          comunidade: string
          criado_em?: string
          criado_por?: string | null
          endereco: string
          id?: string
          lat?: number | null
          long?: number | null
          status?: Database["public"]["Enums"]["endereco_status"]
          uf: string
        }
        Update: {
          cidade?: string
          comunidade?: string
          criado_em?: string
          criado_por?: string | null
          endereco?: string
          id?: string
          lat?: number | null
          long?: number | null
          status?: Database["public"]["Enums"]["endereco_status"]
          uf?: string
        }
        Relationships: []
      }
      instalacoes: {
        Row: {
          campanha_id: string
          criado_em: string
          data_expiracao: string | null
          data_instalacao: string | null
          endereco_id: string
          finalizado_em: string | null
          foto_url: string | null
          id: string
          representante_id: string | null
          status: Database["public"]["Enums"]["instalacao_status"]
        }
        Insert: {
          campanha_id: string
          criado_em?: string
          data_expiracao?: string | null
          data_instalacao?: string | null
          endereco_id: string
          finalizado_em?: string | null
          foto_url?: string | null
          id?: string
          representante_id?: string | null
          status?: Database["public"]["Enums"]["instalacao_status"]
        }
        Update: {
          campanha_id?: string
          criado_em?: string
          data_expiracao?: string | null
          data_instalacao?: string | null
          endereco_id?: string
          finalizado_em?: string | null
          foto_url?: string | null
          id?: string
          representante_id?: string | null
          status?: Database["public"]["Enums"]["instalacao_status"]
        }
        Relationships: [
          {
            foreignKeyName: "instalacoes_campanha_id_fkey"
            columns: ["campanha_id"]
            isOneToOne: false
            referencedRelation: "campanhas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instalacoes_endereco_id_fkey"
            columns: ["endereco_id"]
            isOneToOne: false
            referencedRelation: "enderecos"
            referencedColumns: ["id"]
          },
        ]
      }
      inventario_historico: {
        Row: {
          alterado_em: string
          alterado_por: string | null
          endereco_id: string
          id: string
          status_anterior: Database["public"]["Enums"]["endereco_status"] | null
          status_novo: Database["public"]["Enums"]["endereco_status"]
        }
        Insert: {
          alterado_em?: string
          alterado_por?: string | null
          endereco_id: string
          id?: string
          status_anterior?:
            | Database["public"]["Enums"]["endereco_status"]
            | null
          status_novo: Database["public"]["Enums"]["endereco_status"]
        }
        Update: {
          alterado_em?: string
          alterado_por?: string | null
          endereco_id?: string
          id?: string
          status_anterior?:
            | Database["public"]["Enums"]["endereco_status"]
            | null
          status_novo?: Database["public"]["Enums"]["endereco_status"]
        }
        Relationships: [
          {
            foreignKeyName: "inventario_historico_endereco_id_fkey"
            columns: ["endereco_id"]
            isOneToOne: false
            referencedRelation: "enderecos"
            referencedColumns: ["id"]
          },
        ]
      }
      notificacoes: {
        Row: {
          criado_em: string
          id: string
          lida: boolean
          mensagem: string
          titulo: string
          user_id: string
        }
        Insert: {
          criado_em?: string
          id?: string
          lida?: boolean
          mensagem: string
          titulo: string
          user_id: string
        }
        Update: {
          criado_em?: string
          id?: string
          lida?: boolean
          mensagem?: string
          titulo?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          criado_em: string
          email: string
          id: string
          nome: string
          territorios: Json | null
        }
        Insert: {
          criado_em?: string
          email: string
          id: string
          nome: string
          territorios?: Json | null
        }
        Update: {
          criado_em?: string
          email?: string
          id?: string
          nome?: string
          territorios?: Json | null
        }
        Relationships: []
      }
      proprietarios: {
        Row: {
          audio_url: string | null
          cpf: string | null
          criado_em: string
          endereco_id: string | null
          id: string
          nome: string
          telefone: string | null
        }
        Insert: {
          audio_url?: string | null
          cpf?: string | null
          criado_em?: string
          endereco_id?: string | null
          id?: string
          nome: string
          telefone?: string | null
        }
        Update: {
          audio_url?: string | null
          cpf?: string | null
          criado_em?: string
          endereco_id?: string | null
          id?: string
          nome?: string
          telefone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "proprietarios_endereco_id_fkey"
            columns: ["endereco_id"]
            isOneToOne: false
            referencedRelation: "enderecos"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      contar_notificacoes_nao_lidas: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      coordenador_cobre_endereco: {
        Args: {
          _coordenador_id: string
          _endereco_id: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      marcar_notificacao_lida: {
        Args: {
          notificacao_id: string
        }
        Returns: undefined
      }
      marcar_todas_notificacoes_lidas: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      app_role: "administrador" | "operacoes" | "coordenador"
      endereco_status: "disponivel" | "ocupado" | "inativo" | "manutencao"
      instalacao_status: "ativa" | "finalizada" | "cancelada" | "pendente"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["administrador", "operacoes", "coordenador"],
      endereco_status: ["disponivel", "ocupado", "inativo", "manutencao"],
      instalacao_status: ["ativa", "finalizada", "cancelada", "pendente"],
    },
  },
} as const
