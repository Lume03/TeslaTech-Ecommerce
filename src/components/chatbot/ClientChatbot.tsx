
'use client';

import dynamic from 'next/dynamic';
import { useAppContext } from '@/contexts/AppContext';

const ProductAssistant = dynamic(
  () => import('@/components/chatbot/ProductAssistant'),
  {
    ssr: false,
    loading: () => null,
  }
);

export default function ClientChatbot() {
  const { isAdmin, loadingAuth } = useAppContext();

  // Don't render chatbot until auth status is resolved.
  // Don't render for admins.
  if (loadingAuth || isAdmin) {
    return null;
  }

  return <ProductAssistant />;
}
