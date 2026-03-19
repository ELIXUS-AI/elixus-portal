import { supabase } from './supabase';
import type {
  PortalClient,
  PortalClientInsert,
  PortalSystemStatus,
  PortalSystemStatusInsert,
  PortalA2PSubmission,
  PortalActivityInsert,
  PortalClientUpdate,
  PortalMessage,
} from './database.types';
import type { User, Session, AuthError } from '@supabase/supabase-js';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface SignUpData {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  companyName?: string;
}

export interface SignInData {
  email: string;
  password: string;
}

export interface AuthResult {
  user: User | null;
  session: Session | null;
  error: AuthError | null;
}

export interface PortalUserData {
  client: PortalClient;
  systemStatus: PortalSystemStatus | null;
  a2pSubmission: PortalA2PSubmission | null;
}

// -----------------------------------------------------------------------------
// Authentication Functions
// -----------------------------------------------------------------------------

/**
 * Sign up a new portal user.
 * Creates the auth user and the portal_clients record.
 * Email confirmation is required before they can log in.
 */
export async function signUp(data: SignUpData): Promise<AuthResult> {
  const { email, password, firstName, lastName, companyName } = data;

  // Sign up with Supabase Auth
  // Include metadata that will be used when creating the portal_clients record
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        first_name: firstName || '',
        last_name: lastName || '',
        company_name: companyName || '',
      },
      // User will need to confirm their email
      emailRedirectTo: `${window.location.origin}/`,
    },
  });

  if (authError) {
    return { user: null, session: null, error: authError };
  }

  // If user was created successfully, create their portal_clients record
  // Note: The session will be null until they confirm their email
  if (authData.user) {
    const clientData: PortalClientInsert = {
      id: authData.user.id,
      email: authData.user.email!,
      first_name: firstName || null,
      last_name: lastName || null,
      company_name: companyName || null,
    };

    const { error: clientError } = await supabase
      .from('portal_clients')
      .insert(clientData as unknown as Record<string, unknown>);

    if (clientError) {
      console.error('Error creating portal_clients record:', clientError);
      // Note: The auth user was still created. You may want to handle this case
      // by deleting the auth user or logging for manual cleanup.
    }

    // Create their initial system status record (all phases pending until admin marks complete)
    const statusData: PortalSystemStatusInsert = {
      client_id: authData.user.id,
      current_phase: 1,
    };
    const { error: statusError } = await supabase
      .from('portal_system_status')
      .insert(statusData as unknown as Record<string, unknown>);

    if (statusError) {
      console.error('Error creating portal_system_status record:', statusError);
    }

    // Log the signup activity
    await logActivity(authData.user.id, 'account_created', 'Portal account created');
  }

  return {
    user: authData.user,
    session: authData.session,
    error: null,
  };
}

/**
 * Sign in an existing portal user.
 */
export async function signIn(data: SignInData): Promise<AuthResult> {
  const { email, password } = data;

  const { data: authData, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (!error && authData.user) {
    // Log the sign in activity
    await logActivity(authData.user.id, 'sign_in', 'User signed in');
  }

  return {
    user: authData.user,
    session: authData.session,
    error,
  };
}

/**
 * Sign out the current user.
 */
export async function signOut(): Promise<{ error: AuthError | null }> {
  const { error } = await supabase.auth.signOut();
  return { error };
}

/**
 * Get the current session.
 */
export async function getSession(): Promise<Session | null> {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

/**
 * Get the current user.
 */
export async function getUser(): Promise<User | null> {
  const { data } = await supabase.auth.getUser();
  return data.user;
}

/**
 * Send a password reset email.
 */
export async function resetPassword(email: string): Promise<{ error: AuthError | null }> {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  return { error };
}

/**
 * Update password (for logged-in users).
 */
export async function updatePassword(newPassword: string): Promise<{ error: AuthError | null }> {
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });
  return { error };
}

/**
 * Resend confirmation email.
 */
export async function resendConfirmationEmail(email: string): Promise<{ error: AuthError | null }> {
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email,
  });
  return { error };
}

// -----------------------------------------------------------------------------
// Portal Data Functions
// -----------------------------------------------------------------------------

/**
 * Ensure a portal_clients record exists for the given user.
 * Creates portal_clients and portal_system_status if missing.
 */
export async function ensurePortalClient(userId: string, email: string): Promise<void> {
  const { data } = await supabase
    .from('portal_clients')
    .select('id')
    .eq('id', userId)
    .single();

  if (!data) {
    const clientData: PortalClientInsert = { id: userId, email };
    await supabase
      .from('portal_clients')
      .insert(clientData as unknown as Record<string, unknown>);

    const statusData: PortalSystemStatusInsert = { client_id: userId, current_phase: 2 };
    await supabase
      .from('portal_system_status')
      .insert(statusData as unknown as Record<string, unknown>);
  }
}

/**
 * Get the portal client record for the current user.
 */
export async function getPortalClient(userId: string): Promise<PortalClient | null> {
  const { data, error } = await supabase
    .from('portal_clients')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching portal client:', error);
    return null;
  }

  return data as PortalClient;
}

/**
 * Get all portal data for the current user.
 * Includes client record, system status, and A2P submission if exists.
 */
export async function getPortalUserData(userId: string): Promise<PortalUserData | null> {
  // Fetch all data in parallel
  const [clientResult, statusResult, a2pResult] = await Promise.all([
    supabase.from('portal_clients').select('*').eq('id', userId).single(),
    supabase.from('portal_system_status').select('*').eq('client_id', userId).single(),
    supabase.from('portal_a2p_submissions').select('*').eq('client_id', userId).single(),
  ]);

  if (clientResult.error) {
    console.error('Error fetching portal client:', clientResult.error);
    return null;
  }

  return {
    client: clientResult.data as PortalClient,
    systemStatus: (statusResult.data as PortalSystemStatus) || null,
    a2pSubmission: (a2pResult.data as PortalA2PSubmission) || null,
  };
}

/**
 * Update the portal client record.
 */
export async function updatePortalClient(
  userId: string,
  updates: PortalClientUpdate
): Promise<{ error: Error | null }> {
  const { error } = await supabase
    .from('portal_clients')
    .update(updates as unknown as Record<string, unknown>)
    .eq('id', userId);

  return { error };
}

// -----------------------------------------------------------------------------
// Activity Logging
// -----------------------------------------------------------------------------

/**
 * Log an activity for a client.
 */
export async function logActivity(
  clientId: string,
  action: string,
  details?: string
): Promise<void> {
  const activityData: PortalActivityInsert = {
    client_id: clientId,
    action,
    details: details || null,
  };

  const { error } = await supabase
    .from('portal_activity')
    .insert(activityData as unknown as Record<string, unknown>);

  if (error) {
    console.error('Error logging activity:', error);
  }
}

/**
 * Get activity history for a client.
 */
export async function getActivityHistory(
  clientId: string,
  limit = 50
): Promise<{ id: string; action: string; details: string | null; created_at: string }[]> {
  const { data, error } = await supabase
    .from('portal_activity')
    .select('id, action, details, created_at')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching activity history:', error);
    return [];
  }

  return (data as { id: string; action: string; details: string | null; created_at: string }[]) || [];
}

// -----------------------------------------------------------------------------
// Messaging Functions
// -----------------------------------------------------------------------------

/**
 * Get all messages for a client, ordered oldest to newest.
 */
export async function getMessages(clientId: string): Promise<PortalMessage[]> {
  const { data, error } = await supabase
    .from('portal_messages')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching messages:', error);
    return [];
  }

  return (data as PortalMessage[]) || [];
}

/**
 * Send a message from the portal client, optionally with a file attachment.
 */
export async function sendMessage(
  clientId: string,
  message: string,
  senderName?: string,
  file?: File
): Promise<{ error: Error | null }> {
  let attachmentUrl: string | null = null;
  let attachmentName: string | null = null;
  let attachmentType: string | null = null;

  if (file) {
    const filePath = `${clientId}/${Date.now()}_${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from('portal-attachments')
      .upload(filePath, file);

    if (uploadError) return { error: new Error('File upload failed: ' + uploadError.message) };

    const { data: urlData } = supabase.storage
      .from('portal-attachments')
      .getPublicUrl(filePath);

    attachmentUrl = urlData.publicUrl;
    attachmentName = file.name;
    attachmentType = file.type;
  }

  const { error } = await supabase
    .from('portal_messages')
    .insert({
      client_id: clientId,
      sender_type: 'client',
      sender_name: senderName || null,
      message: message || (file ? file.name : ''),
      attachment_url: attachmentUrl,
      attachment_name: attachmentName,
      attachment_type: attachmentType,
    } as unknown as Record<string, unknown>);

  return { error };
}

/**
 * Mark all admin messages as read for a client.
 */
export async function markMessagesRead(clientId: string): Promise<void> {
  await supabase
    .from('portal_messages')
    .update({ read: true } as unknown as Record<string, unknown>)
    .eq('client_id', clientId)
    .eq('sender_type', 'admin')
    .eq('read', false);
}

/**
 * Delete a specific message (client can only delete their own).
 */
export async function deleteMessage(messageId: string): Promise<{ error: Error | null }> {
  const { error } = await supabase
    .from('portal_messages')
    .delete()
    .eq('id', messageId);

  return { error };
}

/**
 * Subscribe to new messages in real-time for a client.
 * Returns an unsubscribe function.
 */
export function subscribeToMessages(
  clientId: string,
  onNewMessage: (message: PortalMessage) => void,
  onDeleteMessage?: (old: { id: string }) => void
): () => void {
  const channel = supabase
    .channel(`portal_messages:${clientId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'portal_messages',
        filter: `client_id=eq.${clientId}`,
      },
      (payload) => {
        onNewMessage(payload.new as PortalMessage);
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'DELETE',
        schema: 'public',
        table: 'portal_messages',
      },
      (payload) => {
        if (onDeleteMessage && payload.old && (payload.old as any).id) {
          onDeleteMessage(payload.old as { id: string });
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

// -----------------------------------------------------------------------------
// Auth State Listener
// -----------------------------------------------------------------------------

/**
 * Subscribe to auth state changes.
 * Returns an unsubscribe function.
 */
export function onAuthStateChange(
  callback: (event: string, session: Session | null) => void
): () => void {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(callback);
  return () => subscription.unsubscribe();
}
