import React, { createContext, useContext, useState, useEffect } from 'react';
import { PayPalScriptProvider } from "@paypal/react-paypal-js";
import { supabaseClient } from '@/config/supabaseConfig';
import { Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const PayPalContext = createContext(null);

export const usePayPal = () => {
    const context = useContext(PayPalContext);
    if (!context) {
        // Return a safe default instead of throwing to prevent app crashes if provider fails
        return { 
            clientId: null, 
            isLoading: false, 
            error: "PayPalContext not initialized" 
        };
    }
    return context;
};

export const PayPalProvider = ({ children }) => {
    const [clientId, setClientId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchClientId = async () => {
        setLoading(true);
        setError(null);
        try {
            // Fetch the Client ID from our secure edge function
            const { data, error: functionError } = await supabaseClient.functions.invoke('get-paypal-client-id');
            
            if (functionError) throw functionError;
            if (data?.error) throw new Error(data.error);

            if (data?.clientId) {
                setClientId(data.clientId);
            } else {
                throw new Error("PayPal Client ID no encontrado en la respuesta del servidor.");
            }

        } catch (err) {
            console.error("Failed to load PayPal Client ID:", err);
            setError(err.message || "Error conectando con PayPal");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchClientId();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center p-4 min-h-[50px]">
                <Loader2 className="h-4 w-4 animate-spin text-primary mr-2" />
                <span className="text-sm text-muted-foreground">Inicializando sistema de pagos...</span>
            </div>
        );
    }

    // If we have a critical error fetching the ID, we render children but passing the error state
    // This allows the PaymentForm to display the error UI instead of the whole app crashing.
    if (error || !clientId) {
        return (
            <PayPalContext.Provider value={{ clientId: null, isLoading: false, error }}>
                {children}
            </PayPalContext.Provider>
        );
    }

    const initialOptions = {
        "client-id": clientId,
        currency: "USD",
        intent: "capture",
        "enable-funding": "card",
        "disable-funding": "credit,paylater",
        "data-sdk-integration-source": "react-paypal-js"
    };

    return (
        <PayPalScriptProvider options={initialOptions}>
            <PayPalContext.Provider value={{ clientId, isLoading: false, error: null }}>
                {children}
            </PayPalContext.Provider>
        </PayPalScriptProvider>
    );
};