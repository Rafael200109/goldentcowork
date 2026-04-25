import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabaseClient } from '@/config/supabaseConfig';
import { useAuth } from './SupabaseAuthContext';
import { handleSupabaseError } from '@/lib/utils';

const SystemConfigContext = createContext(undefined);

export const SystemConfigProvider = ({ children }) => {
  const [config, setConfig] = useState({
    platform_settings: { 
      fee_percentage: 25, 
      currency: 'DOP', 
      maintenance_mode: false, 
      support_email: 'soporte@goldent.com' 
    },
    policies: { cancellation: '', refund: '', privacy: '' },
    integrations: { paypal_enabled: true, cardnet_enabled: true, maps_provider: 'openstreetmap' }
  });
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  
  // Fetch initial config
  const fetchConfig = async () => {
    try {
      const { data, error } = await supabaseClient.from('system_config').select('*');
      if (error) throw error;
      
      const newConfig = { ...config };
      if (data && data.length > 0) {
        data.forEach(item => {
          if (config[item.key]) {
             // Merge default config with db config to ensure all keys exist
             newConfig[item.key] = { ...config[item.key], ...item.value };
          }
        });
      }
      setConfig(newConfig);
    } catch (error) {
      handleSupabaseError(error, "Error cargando configuración del sistema");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();

    // Subscribe to realtime changes
    const channel = supabaseClient
      .channel('system_config_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'system_config' },
        (payload) => {
           if (payload.new && payload.new.key) {
             setConfig(prev => ({
               ...prev,
               [payload.new.key]: { ...prev[payload.new.key], ...payload.new.value }
             }));
           }
        }
      )
      .subscribe();

    return () => {
      supabaseClient.removeChannel(channel);
    };
  }, []);

  const updateConfig = (section, key, value) => {
    setConfig(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
  };

  const saveConfig = async (sectionKey) => {
    try {
        const { error } = await supabaseClient
        .from('system_config')
        .upsert({ 
            key: sectionKey, 
            value: config[sectionKey],
            updated_at: new Date().toISOString()
        });
        if (error) throw error;
        return { success: true };
    } catch (error) {
        handleSupabaseError(error, "Error guardando configuración");
        return { success: false, error };
    }
  };

  // Check maintenance mode
  // It is active if the flag is true AND the user is NOT an admin
  const isMaintenanceActive = config.platform_settings?.maintenance_mode;

  return (
    <SystemConfigContext.Provider value={{ config, loading, updateConfig, saveConfig, isMaintenanceActive }}>
      {children}
    </SystemConfigContext.Provider>
  );
};

export const useSystemConfig = () => {
  const context = useContext(SystemConfigContext);
  if (context === undefined) {
    throw new Error('useSystemConfig must be used within a SystemConfigProvider');
  }
  return context;
};