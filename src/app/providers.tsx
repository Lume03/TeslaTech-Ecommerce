
"use client";

import { AppProvider, useAppContext } from "@/contexts/AppContext";
import type { ReactNode } from "react";
import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";

// This component watches for incomplete profiles and prompts the user to complete them.
function ProfileCompletionWatcher() {
  const { currentUser, userProfile, isAdmin, loadingAuth, isProfileComplete } = useAppContext();
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const [hasNotified, setHasNotified] = useState(false); // Prevent toast spam

  useEffect(() => {
    // Don't run checks until auth is resolved and we have a user that is NOT an admin
    if (loadingAuth || !currentUser || !userProfile || isAdmin) {
      return;
    }

    // Don't redirect if we are already on the profile page
    if (pathname === '/profile') {
      return;
    }

    // If profile is incomplete, redirect to the profile page
    if (!isProfileComplete(userProfile)) {
       // Only show the toast once per session/redirect-wave
      if (!hasNotified) {
        toast({
          title: "Completa tu Perfil",
          description: "Por favor, completa tus datos para facilitar tus compras.",
          variant: "default",
          duration: 5000,
        });
        setHasNotified(true);
      }
      router.push('/profile');
    }
  }, [currentUser, userProfile, isAdmin, loadingAuth, isProfileComplete, router, pathname, toast, hasNotified]);

  return null; // This component does not render anything
}


export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <AppProvider>
      <ProfileCompletionWatcher />
      {children}
    </AppProvider>
  );
}
