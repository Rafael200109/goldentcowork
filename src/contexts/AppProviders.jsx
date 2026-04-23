import React from 'react';
import { AuthProvider } from '@/contexts/SupabaseAuthContext.jsx';
import { UserProvider } from '@/contexts/UserContext.jsx';
import { PayPalProvider } from '@/contexts/PayPalContext.jsx';
import { NotificationsProvider } from '@/contexts/NotificationsContext.jsx';
import { SupportChatProvider } from '@/contexts/SupportChatContext.jsx';
import { SystemConfigProvider } from '@/contexts/SystemConfigContext.jsx';
import { PublishClinicProvider } from '@/contexts/PublishClinicContext.jsx';
import { ChatProvider } from '@/contexts/ChatContext.jsx';
import { Toaster } from '@/components/ui/toaster.jsx';

export const AppProviders = ({ children }) => {
  return (
    <AuthProvider>
      <UserProvider>
        <SystemConfigProvider>
          <NotificationsProvider>
            <PayPalProvider>
              <SupportChatProvider>
                <ChatProvider>
                  <PublishClinicProvider>
                    {children}
                    <Toaster />
                  </PublishClinicProvider>
                </ChatProvider>
              </SupportChatProvider>
            </PayPalProvider>
          </NotificationsProvider>
        </SystemConfigProvider>
      </UserProvider>
    </AuthProvider>
  );
};