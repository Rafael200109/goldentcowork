
import { useState, useCallback } from 'react';
import { supabaseClient } from '@/config/supabaseConfig';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { retryWithBackoff } from '@/lib/supabaseValidator';
import { useSupabaseConnection } from '@/hooks/useSupabaseConnection';

export const useChat = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { isConnected } = useSupabaseConnection();

  const createSession = useCallback(async () => {
    if (!user || !isConnected) return null;
    setLoading(true);
    setError(null);
    
    try {
      const createOperation = async () => {
        const { data, error: err } = await supabaseClient
          .from('chat_sessions')
          .insert([{ user_id: user.id, status: 'active' }])
          .select('*')
          .single();

        if (err) throw err;
        return data;
      };

      return await retryWithBackoff(createOperation);
    } catch (err) {
      console.error('❌ [useChat] Create session error:', err);
      setError(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [user, isConnected]);

  const fetchMessages = useCallback(async (sessionId) => {
    if (!isConnected) {
      setError('No hay conexión con Supabase');
      return [];
    }

    setLoading(true);
    setError(null);
    
    try {
      const fetchOperation = async () => {
        const { data, error: err } = await supabaseClient
          .from('chat_messages')
          .select('*')
          .eq('session_id', sessionId)
          .order('created_at', { ascending: true });

        if (err) throw err;
        return data || [];
      };

      return await retryWithBackoff(fetchOperation);
    } catch (err) {
      console.error('❌ [useChat] Fetch messages error:', err);
      setError(err);
      return [];
    } finally {
      setLoading(false);
    }
  }, [isConnected]);

  const sendMessage = useCallback(async (sessionId, message, senderType = 'user') => {
    if (!user || !isConnected) return null;
    setError(null);
    
    try {
      const sendOperation = async () => {
        const { data, error: err } = await supabaseClient
          .from('chat_messages')
          .insert([{ 
            session_id: sessionId, 
            sender_id: user.id, 
            sender_type: senderType, 
            message 
          }])
          .select('*')
          .single();

        if (err) throw err;
        return data;
      };

      return await retryWithBackoff(sendOperation);
    } catch (err) {
      console.error('❌ [useChat] Send message error:', err);
      setError(err);
      return null;
    }
  }, [user, isConnected]);

  const closeSession = useCallback(async (sessionId) => {
    if (!isConnected) {
      setError('No hay conexión con Supabase');
      return false;
    }

    setLoading(true);
    setError(null);
    
    try {
      const closeOperation = async () => {
        const { data, error: err } = await supabaseClient.rpc('delete_chat_session', { session_id: sessionId });
        if (err) throw err;
        return data;
      };

      return await retryWithBackoff(closeOperation);
    } catch (err) {
      console.error('❌ [useChat] Close session error:', err);
      setError(err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [isConnected]);

  const getActiveUserSession = useCallback(async () => {
    if (!user || !isConnected) return null;
    
    try {
      const fetchOperation = async () => {
        const { data, error: err } = await supabaseClient
          .from('chat_sessions')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        
        if (err) throw err;
        return data;
      };

      return await retryWithBackoff(fetchOperation);
    } catch (err) {
      console.error('❌ [useChat] Get active session error:', err);
      return null;
    }
  }, [user, isConnected]);

  return {
    createSession,
    fetchMessages,
    sendMessage,
    closeSession,
    getActiveUserSession,
    loading,
    error
  };
};
