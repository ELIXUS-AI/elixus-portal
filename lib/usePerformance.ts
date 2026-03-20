import { useState, useCallback } from 'react';
import { supabase } from './supabase';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

const QUALIFYING_STAGES = ['Call Now 📞', 'Booked a Call 📅'];

export interface PerformanceStats {
  leadsCount: number;
  activeChatsCount: number;
  bookedCallsCount: number;
  totalPipelineValue: number;
  pricePerBooking: number | null;
}

export function usePerformance(clientId: string | null, ghlConnected: boolean) {
  const [data, setData] = useState<PerformanceStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPerformance = useCallback(async () => {
    if (!clientId || !ghlConnected) {
      console.log('[Performance] Skip: clientId=', clientId, 'ghlConnected=', ghlConnected);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error('Not authenticated');

      console.log('[Performance] Fetching stats for', clientId);

      const response = await fetch(`${SUPABASE_URL}/functions/v1/ghl-proxy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: 'fetch_client_stats',
          client_id: clientId,
        }),
      });

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        console.error('[Performance] Error', response.status, errBody);
        throw new Error(errBody.error || `Edge function returned ${response.status}`);
      }

      const raw = await response.json();
      console.log('[Performance] Response:', JSON.stringify(raw).slice(0, 500));

      const contactsList = raw.contacts || [];
      const conversationsList = raw.conversations || [];
      const eventsList = raw.calendarEvents || [];
      const opportunitiesList = raw.opportunities || [];
      const pipelinesList = raw.pipelines || [];
      const pricePerBooking: number | null = raw.pricePerBooking ?? null;

      const leadsCount = contactsList.length;
      const activeChatsCount = conversationsList.filter(
        (c: any) => c.type !== 'TYPE_PHONE' && !c.deleted
      ).length;
      const bookedCallsCount = eventsList.filter(
        (e: any) => e.status !== 'cancelled'
      ).length;

      // Build stage ID → name map from pipelines data
      const stageIdToName = new Map<string, string>();
      for (const pipeline of pipelinesList) {
        for (const stage of pipeline.stages || []) {
          stageIdToName.set(stage.id, stage.name);
        }
      }

      // Count opportunities in qualifying stages
      const qualifyingCount = opportunitiesList.filter((o: any) => {
        if (o.status !== 'open') return false;
        const stageName = stageIdToName.get(o.pipelineStageId) || '';
        return QUALIFYING_STAGES.includes(stageName);
      }).length;

      const totalPipelineValue = pricePerBooking != null
        ? qualifyingCount * pricePerBooking
        : 0;

      setData({ leadsCount, activeChatsCount, bookedCallsCount, totalPipelineValue, pricePerBooking });
    } catch (err: any) {
      console.error('[Performance] Fetch failed:', err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [clientId, ghlConnected]);

  return { data, loading, error, refetch: fetchPerformance };
}
