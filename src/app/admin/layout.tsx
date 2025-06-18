
"use client";
import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/contexts/AppContext';
import { Loader2, ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { isAdmin, loadingAuth, currentUser } = useAppContext();
  const router = useRouter();

  useEffect(() => {
    if (!loadingAuth) {
      if (!currentUser || !isAdmin) {
        router.replace('/'); // Redirect non-admins to homepage
      }
    }
  }, [isAdmin, loadingAuth, currentUser, router]);

  if (loadingAuth) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg">Verificando acceso...</p>
      </div>
    );
  }

  if (!currentUser || !isAdmin) {
    // This state should ideally be brief due to the useEffect redirect.
    // However, it's a good fallback.
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4 text-center">
        <ShieldAlert className="h-16 w-16 text-destructive mb-4" />
        <h1 className="text-2xl font-bold mb-2">Acceso Denegado</h1>
        <p className="text-muted-foreground mb-6">No tienes permiso para acceder a esta sección.</p>
        <Link href="/" passHref>
          <Button>Volver al Inicio</Button>
        </Link>
      </div>
    );
  }

  // Admin is verified, render the admin layout children
  return (
    <div className="min-h-screen bg-muted/40">
      {/* Możesz dodać tutaj nawigację specyficzną dla panelu admina */}
      <div className="container mx-auto px-4 py-8">
        {children}
      </div>
    </div>
  );
}
