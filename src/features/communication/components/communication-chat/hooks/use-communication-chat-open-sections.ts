import { useState } from 'react';
import type { ConversationOpenSections } from '../types/communication-chat.types';

export function useCommunicationChatOpenSections() {
  const [openSections, setOpenSections] = useState<ConversationOpenSections>({
    dms: true,
    groups: true,
    text: true,
    voice: true,
  });

  const toggleSection = (key: keyof ConversationOpenSections) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return {
    openSections,
    toggleSection,
  };
}
