export type Json =
  string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '14.18'
  }
  fieldnotes: {
    Tables: {
      academic_terms: {
        Row: {
          ends_on: string | null
          id: string
          label: string
          starts_on: string | null
        }
        Insert: {
          ends_on?: string | null
          id?: string
          label: string
          starts_on?: string | null
        }
        Update: {
          ends_on?: string | null
          id?: string
          label?: string
          starts_on?: string | null
        }
        Relationships: []
      }
      account_transactions: {
        Row: {
          amount: number
          balance: number
          currency: string
          description: string
          id: string
          occurred_on: string
          source_reference: string
          student_id: string
          transaction_type: string
        }
        Insert: {
          amount: number
          balance: number
          currency: string
          description: string
          id?: string
          occurred_on: string
          source_reference: string
          student_id: string
          transaction_type: string
        }
        Update: {
          amount?: number
          balance?: number
          currency?: string
          description?: string
          id?: string
          occurred_on?: string
          source_reference?: string
          student_id?: string
          transaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: 'account_transactions_student_id_fkey'
            columns: ['student_id']
            isOneToOne: false
            referencedRelation: 'students'
            referencedColumns: ['id']
          },
        ]
      }
      assessments: {
        Row: {
          id: string
          kind: string
          label: string
          max_score: number
          offering_id: string
        }
        Insert: {
          id?: string
          kind: string
          label: string
          max_score: number
          offering_id: string
        }
        Update: {
          id?: string
          kind?: string
          label?: string
          max_score?: number
          offering_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'assessments_offering_id_fkey'
            columns: ['offering_id']
            isOneToOne: false
            referencedRelation: 'course_offerings'
            referencedColumns: ['id']
          },
        ]
      }
      course_offerings: {
        Row: {
          course_id: string
          credits: number
          id: string
          programme_code: string
          term_id: string
        }
        Insert: {
          course_id: string
          credits: number
          id?: string
          programme_code: string
          term_id: string
        }
        Update: {
          course_id?: string
          credits?: number
          id?: string
          programme_code?: string
          term_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'course_offerings_course_id_fkey'
            columns: ['course_id']
            isOneToOne: false
            referencedRelation: 'courses'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'course_offerings_term_id_fkey'
            columns: ['term_id']
            isOneToOne: false
            referencedRelation: 'academic_terms'
            referencedColumns: ['id']
          },
        ]
      }
      courses: {
        Row: {
          code: string
          id: string
          name: string
        }
        Insert: {
          code: string
          id?: string
          name: string
        }
        Update: {
          code?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      enrollments: {
        Row: {
          id: string
          offering_id: string
          student_id: string
        }
        Insert: {
          id?: string
          offering_id: string
          student_id: string
        }
        Update: {
          id?: string
          offering_id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'enrollments_offering_id_fkey'
            columns: ['offering_id']
            isOneToOne: false
            referencedRelation: 'course_offerings'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'enrollments_student_id_fkey'
            columns: ['student_id']
            isOneToOne: false
            referencedRelation: 'students'
            referencedColumns: ['id']
          },
        ]
      }
      exam_sessions: {
        Row: {
          ends_at: string
          id: string
          offering_id: string
          published: boolean
          starts_at: string
          venue: string
        }
        Insert: {
          ends_at: string
          id?: string
          offering_id: string
          published?: boolean
          starts_at: string
          venue: string
        }
        Update: {
          ends_at?: string
          id?: string
          offering_id?: string
          published?: boolean
          starts_at?: string
          venue?: string
        }
        Relationships: [
          {
            foreignKeyName: 'exam_sessions_offering_id_fkey'
            columns: ['offering_id']
            isOneToOne: false
            referencedRelation: 'course_offerings'
            referencedColumns: ['id']
          },
        ]
      }
      marks: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          assessment_id: string
          enrollment_id: string
          id: string
          offering_id: string
          score: number
          state: string
          submitted_at: string | null
          submitted_by: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          assessment_id: string
          enrollment_id: string
          id?: string
          offering_id: string
          score: number
          state?: string
          submitted_at?: string | null
          submitted_by?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          assessment_id?: string
          enrollment_id?: string
          id?: string
          offering_id?: string
          score?: number
          state?: string
          submitted_at?: string | null
          submitted_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'marks_assessment_id_offering_id_fkey'
            columns: ['assessment_id', 'offering_id']
            isOneToOne: false
            referencedRelation: 'assessments'
            referencedColumns: ['id', 'offering_id']
          },
          {
            foreignKeyName: 'marks_enrollment_id_offering_id_fkey'
            columns: ['enrollment_id', 'offering_id']
            isOneToOne: false
            referencedRelation: 'enrollments'
            referencedColumns: ['id', 'offering_id']
          },
          {
            foreignKeyName: 'marks_offering_id_fkey'
            columns: ['offering_id']
            isOneToOne: false
            referencedRelation: 'course_offerings'
            referencedColumns: ['id']
          },
        ]
      }
      released_results: {
        Row: {
          enrollment_id: string
          grade: string
          id: string
          registry_rule_version: string
          released_at: string
          released_by: string
          score: number
        }
        Insert: {
          enrollment_id: string
          grade: string
          id?: string
          registry_rule_version: string
          released_at: string
          released_by: string
          score: number
        }
        Update: {
          enrollment_id?: string
          grade?: string
          id?: string
          registry_rule_version?: string
          released_at?: string
          released_by?: string
          score?: number
        }
        Relationships: [
          {
            foreignKeyName: 'released_results_enrollment_id_fkey'
            columns: ['enrollment_id']
            isOneToOne: true
            referencedRelation: 'enrollments'
            referencedColumns: ['id']
          },
        ]
      }
      resources: {
        Row: {
          id: string
          offering_id: string
          published: boolean
          title: string
          url: string
        }
        Insert: {
          id?: string
          offering_id: string
          published?: boolean
          title: string
          url: string
        }
        Update: {
          id?: string
          offering_id?: string
          published?: boolean
          title?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: 'resources_offering_id_fkey'
            columns: ['offering_id']
            isOneToOne: false
            referencedRelation: 'course_offerings'
            referencedColumns: ['id']
          },
        ]
      }
      students: {
        Row: {
          academic_year: string | null
          account_balance: number
          auth_user_id: string | null
          created_at: string
          display_name: string
          id: string
          part: number | null
          programme_code: string
          programme_name: string | null
          registration_status: string | null
          semester: number | null
          student_number: string
        }
        Insert: {
          academic_year?: string | null
          account_balance?: number
          auth_user_id?: string | null
          created_at?: string
          display_name: string
          id?: string
          part?: number | null
          programme_code: string
          programme_name?: string | null
          registration_status?: string | null
          semester?: number | null
          student_number: string
        }
        Update: {
          academic_year?: string | null
          account_balance?: number
          auth_user_id?: string | null
          created_at?: string
          display_name?: string
          id?: string
          part?: number | null
          programme_code?: string
          programme_name?: string | null
          registration_status?: string | null
          semester?: number | null
          student_number?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_registration_requests: {
        Args: never
        Returns: {
          request_id: string
          student_id: string
          student_number: string
          student_name: string
          programme_code: string
          course_code: string
          course_name: string
          term_label: string
          credits: number
          status: string
          submitted_at: string | null
        }[]
      }
      admin_review_registration: {
        Args: { decision: 'approved' | 'rejected' | 'reversed' | string; target_request: string }
        Returns: undefined
      }
      admin_reset_student_registration: {
        Args: { target_student: string }
        Returns: undefined
      }
      admin_save_registry_configuration: {
        Args: {
          enable_grade_calculation: boolean
          enable_registration_submission: boolean
          enable_result_publication: boolean
        }
        Returns: undefined
      }
      admin_delete_resource: { Args: { target_resource: string }; Returns: undefined }
      admin_publish_mark: {
        Args: { result_grade: string; target_mark: string }
        Returns: undefined
      }
      admin_upsert_assessment: {
        Args: {
          assessment_kind: string
          assessment_label: string
          maximum: number
          target_id: string | null
          target_offering: string
        }
        Returns: string
      }
      admin_upsert_course: {
        Args: { course_code: string; course_name: string; target_id: string | null }
        Returns: string
      }
      admin_upsert_exam: {
        Args: {
          end_time: string
          exam_venue: string
          is_published: boolean
          start_time: string
          target_id: string | null
          target_offering: string
        }
        Returns: string
      }
      admin_upsert_offering: {
        Args: {
          target_course: string
          target_credits: number
          target_id: string | null
          target_programme: string
          target_term: string
        }
        Returns: string
      }
      admin_upsert_term: {
        Args: {
          end_date: string | null
          start_date: string | null
          target_id: string | null
          term_label: string
        }
        Returns: string
      }
      approve_mark: { Args: { target_mark: string }; Returns: undefined }
      my_staff_assignments: {
        Args: never
        Returns: {
          offering_id: string
          role: string
        }[]
      }
      publish_results: { Args: never; Returns: undefined }
      registry_capability: { Args: { capability: string }; Returns: boolean }
      registration_offerings: {
        Args: never
        Returns: {
          offering_id: string
          course_code: string
          course_name: string
          term_label: string
          credits: number
          selected: boolean
        }[]
      }
      resolve_student_login: {
        Args: { student_number_input: string }
        Returns: string
      }
      save_mark: {
        Args: {
          raw_score: number
          target_assessment: string
          target_enrollment: string
        }
        Returns: string
      }
      save_resource: {
        Args: {
          is_published: boolean
          resource_title: string
          resource_url: string
          target_offering: string
        }
        Returns: string
      }
      staff_roster: {
        Args: { target_offering: string }
        Returns: {
          display_name: string
          enrollment_id: string
          student_number: string
        }[]
      }
      submit_mark: { Args: { target_mark: string }; Returns: undefined }
      submit_registration: { Args: never; Returns: undefined }
      set_registration_choice: {
        Args: { selected: boolean; target_offering: string }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] &
        DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] &
        DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema['Enums'] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema['CompositeTypes'] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  fieldnotes: {
    Enums: {},
  },
} as const
