import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { supabaseClient } from '@/config/supabaseConfig';
import { useToast } from '@/components/ui/use-toast.js';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const { toast } = useToast();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  const getProfile = useCallback(async (userId) => {
    if (!userId) return null;
    try {
      const { data, error } = await supabaseClient
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error("Error fetching profile:", error);
        throw error;
      }
      return data;
    } catch (error) {
        toast({
          variant: "destructive",
          title: "Error al cargar el perfil",
          description: "No se pudo recuperar la información del usuario.",
        });
        return null;
    }
  }, [toast]);
  

  const handleSession = useCallback(async (session) => {
    setSession(session);
    const currentUser = session?.user ?? null;
    setUser(currentUser);

    if (currentUser) {
      const profileData = await getProfile(currentUser.id);
      setProfile(profileData);
    } else {
      setProfile(null);
    }
    setLoading(false);
  }, [getProfile]);


  useEffect(() => {
    setLoading(true);
    supabaseClient.auth.getSession().then(({ data: { session } }) => {
      handleSession(session);
    });

    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange(
      (event, session) => {
        handleSession(session);
      }
    );

    return () => subscription.unsubscribe();
  }, [handleSession]);

  const signUp = useCallback(async (email, password, options) => {
    setLoading(true);
    const { data, error } = await supabaseClient.auth.signUp({
      email,
      password,
      options,
    });
    
    if (error) {
      toast({
        variant: "destructive",
        title: "Error en el registro",
        description: error.message || "Algo salió mal. Es posible que el correo ya esté en uso.",
      });
    }
    
    setLoading(false);
    return { data, error };
  }, [toast]);

  const signIn = useCallback(async (email, password) => {
    setLoading(true);
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast({
        variant: "destructive",
        title: "Error al iniciar sesión",
        description: error.message || "Correo o contraseña incorrectos.",
      });
    } 
    setLoading(false);
    return { data, error };
  }, [toast]);

  const signOut = useCallback(async () => {
    setLoading(true);
    const { error } = await supabaseClient.auth.signOut();
    if (error) {
      toast({
        variant: "destructive",
        title: "Error al cerrar sesión",
        description: error.message || "Algo salió mal",
      });
      setLoading(false);
    } else {
      setProfile(null);
      setUser(null);
      setSession(null);
      toast({
        title: "Sesión cerrada",
        description: "Has cerrado sesión exitosamente.",
      });
      navigate('/');
    }
    setLoading(false);
    return { error };
  }, [toast, navigate]);

  const value = useMemo(() => ({
    user,
    session,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    refreshProfile: () => user ? getProfile(user.id).then(setProfile) : Promise.resolve(),
  }), [user, session, profile, loading, signUp, signIn, signOut, getProfile]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};