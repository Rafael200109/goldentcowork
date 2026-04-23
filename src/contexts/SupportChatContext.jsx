import React, { createContext, useState, useContext } from 'react';

const SupportChatContext = createContext();

export const useSupportChat = () => useContext(SupportChatContext);

export const SupportChatProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleChat = () => setIsOpen(prev => !prev);
  const openChat = () => setIsOpen(true);
  const closeChat = () => setIsOpen(false);

  return (
    <SupportChatContext.Provider value={{ isOpen, toggleChat, openChat, closeChat }}>
      {children}
    </SupportChatContext.Provider>
  );
};