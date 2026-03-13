// =============================================================================
// Database Types for Elixus Portal
// =============================================================================
// These types match the portal_ prefixed tables in the Supabase schema.
// =============================================================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// -----------------------------------------------------------------------------
// Enum Types
// -----------------------------------------------------------------------------

export type OnboardingStatus = 'in_progress' | 'complete';

export type A2PStatus =
  | 'submitted'
  | 'under_review'
  | 'action_required'
  | 'processing'
  | 'approved'
  | 'rejected';

export type IntegrationStatus = 'pending' | 'in_progress' | 'connected';

export type SMSRegistrationStatus = 'pending' | 'in_progress' | 'approved' | 'rejected';

export type WorkflowStatus = 'pending' | 'in_progress' | 'active';

// -----------------------------------------------------------------------------
// Table Row Types
// -----------------------------------------------------------------------------

export interface PortalClient {
  id: string; // UUID, matches auth.users.id
  email: string;
  first_name: string | null;
  last_name: string | null;
  company_name: string | null;
  user_type: string;
  ghl_location_id: string | null;
  onboarding_status: OnboardingStatus;
  created_at: string;
  updated_at: string;
}

export interface PortalA2PSubmission {
  id: string;
  client_id: string;
  status: A2PStatus;

  // Business Information
  legal_business_name: string;
  street_address: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  business_phone: string;
  business_email: string;
  business_website: string | null;

  // Authorized Representative
  rep_first_name: string;
  rep_last_name: string;
  rep_email: string;
  rep_job_title: string;
  rep_phone: string;

  // Business Classification
  business_type: string;
  business_industry: string;
  tax_id: string;

  // Compliance Assets
  privacy_policy_url: string | null;
  terms_url: string | null;
  opt_in_url: string | null;

  // Admin fields
  admin_notes: string | null;

  // Timestamps
  submitted_at: string;
  updated_at: string;
}

export interface PortalActivity {
  id: string;
  client_id: string;
  action: string;
  details: string | null;
  created_at: string;
}

export interface PortalSystemStatus {
  id: string;
  client_id: string;
  crm_integration: IntegrationStatus;
  sms_registration: SMSRegistrationStatus;
  workflow_automation: WorkflowStatus;
  calendar_sync: IntegrationStatus;
  estimated_go_live: string | null; // DATE as ISO string
  current_phase: number; // 1-5
  created_at: string;
  updated_at: string;
}

export interface PortalMessage {
  id: string;
  client_id: string;
  sender_type: 'client' | 'admin';
  sender_name: string | null;
  message: string;
  read: boolean;
  attachment_url: string | null;
  attachment_name: string | null;
  attachment_type: string | null;
  created_at: string;
}

export interface PortalMessageInsert {
  id?: string;
  client_id: string;
  sender_type: 'client' | 'admin';
  sender_name?: string | null;
  message: string;
  attachment_url?: string | null;
  attachment_name?: string | null;
  attachment_type?: string | null;
}

export interface PortalAppointment {
  id: string;
  google_event_id: string;
  client_id: string;
  portal_user_id: string | null;
  summary: string;
  description: string | null;
  location: string | null;
  start_time: string;
  end_time: string;
  all_day: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// -----------------------------------------------------------------------------
// Insert Types (for creating new records)
// -----------------------------------------------------------------------------

export interface PortalClientInsert {
  id: string; // Must match auth.users.id
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  company_name?: string | null;
  user_type?: string;
  ghl_location_id?: string | null;
  onboarding_status?: OnboardingStatus;
}

export interface PortalA2PSubmissionInsert {
  id?: string;
  client_id: string;
  status?: A2PStatus;
  legal_business_name: string;
  street_address: string;
  city: string;
  state: string;
  zip: string;
  country?: string;
  business_phone: string;
  business_email: string;
  business_website?: string | null;
  rep_first_name: string;
  rep_last_name: string;
  rep_email: string;
  rep_job_title: string;
  rep_phone: string;
  business_type: string;
  business_industry: string;
  tax_id: string;
  privacy_policy_url?: string | null;
  terms_url?: string | null;
  opt_in_url?: string | null;
}

export interface PortalActivityInsert {
  id?: string;
  client_id: string;
  action: string;
  details?: string | null;
}

export interface PortalSystemStatusInsert {
  id?: string;
  client_id: string;
  crm_integration?: IntegrationStatus;
  sms_registration?: SMSRegistrationStatus;
  workflow_automation?: WorkflowStatus;
  calendar_sync?: IntegrationStatus;
  estimated_go_live?: string | null;
  current_phase?: number;
}

// -----------------------------------------------------------------------------
// Update Types (for updating existing records)
// -----------------------------------------------------------------------------

export interface PortalClientUpdate {
  email?: string;
  first_name?: string | null;
  last_name?: string | null;
  company_name?: string | null;
  ghl_location_id?: string | null;
  onboarding_status?: OnboardingStatus;
}

export interface PortalA2PSubmissionUpdate {
  status?: A2PStatus;
  legal_business_name?: string;
  street_address?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  business_phone?: string;
  business_email?: string;
  business_website?: string | null;
  rep_first_name?: string;
  rep_last_name?: string;
  rep_email?: string;
  rep_job_title?: string;
  rep_phone?: string;
  business_type?: string;
  business_industry?: string;
  tax_id?: string;
  privacy_policy_url?: string | null;
  terms_url?: string | null;
  opt_in_url?: string | null;
  admin_notes?: string | null;
}

export interface PortalSystemStatusUpdate {
  crm_integration?: IntegrationStatus;
  sms_registration?: SMSRegistrationStatus;
  workflow_automation?: WorkflowStatus;
  calendar_sync?: IntegrationStatus;
  estimated_go_live?: string | null;
  current_phase?: number;
}

// -----------------------------------------------------------------------------
// Database Schema Type (for Supabase client)
// Matches the format generated by Supabase CLI
// -----------------------------------------------------------------------------

export type Database = {
  public: {
    Tables: {
      portal_clients: {
        Row: PortalClient;
        Insert: PortalClientInsert;
        Update: PortalClientUpdate;
        Relationships: [];
      };
      portal_a2p_submissions: {
        Row: PortalA2PSubmission;
        Insert: PortalA2PSubmissionInsert;
        Update: PortalA2PSubmissionUpdate;
        Relationships: [
          {
            foreignKeyName: 'portal_a2p_submissions_client_id_fkey';
            columns: ['client_id'];
            referencedRelation: 'portal_clients';
            referencedColumns: ['id'];
          }
        ];
      };
      portal_activity: {
        Row: PortalActivity;
        Insert: PortalActivityInsert;
        Update: Record<string, never>;
        Relationships: [
          {
            foreignKeyName: 'portal_activity_client_id_fkey';
            columns: ['client_id'];
            referencedRelation: 'portal_clients';
            referencedColumns: ['id'];
          }
        ];
      };
      portal_system_status: {
        Row: PortalSystemStatus;
        Insert: PortalSystemStatusInsert;
        Update: PortalSystemStatusUpdate;
        Relationships: [
          {
            foreignKeyName: 'portal_system_status_client_id_fkey';
            columns: ['client_id'];
            referencedRelation: 'portal_clients';
            referencedColumns: ['id'];
          }
        ];
      };
      portal_messages: {
        Row: PortalMessage;
        Insert: PortalMessageInsert;
        Update: { read?: boolean };
        Relationships: [
          {
            foreignKeyName: 'portal_messages_client_id_fkey';
            columns: ['client_id'];
            referencedRelation: 'portal_clients';
            referencedColumns: ['id'];
          }
        ];
      };
      portal_appointments: {
        Row: PortalAppointment;
        Insert: never;
        Update: never;
        Relationships: [
          {
            foreignKeyName: 'portal_appointments_portal_user_id_fkey';
            columns: ['portal_user_id'];
            referencedRelation: 'portal_clients';
            referencedColumns: ['id'];
          }
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

// -----------------------------------------------------------------------------
// Helper types for Supabase queries
// -----------------------------------------------------------------------------

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];

export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];

export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];
