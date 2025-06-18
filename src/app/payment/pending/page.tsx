// src/app/payment/pending/page.tsx

'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

function PendingContent() {
  const searchParams = useSearchParams();
  const paymentId = searchParams.get('payment_id');
  const status = searchParams.get('status');
  const preferenceId = searchParams.get('preference_id');

  return (
    <div className="container mx-auto px-4 py-16 text-center">
      <AlertTriangle className="mx-auto h-20 w-20 text-yellow-500 mb-4" />
      <h1 className="text-4xl font-headline text-yellow-500 mb-2">Pago Pendiente</h1>
      <p className="text-lg text-muted-foreground mb-6">
        Tu pago está pendiente de confirmación. Te notificaremos cuando se complete.
      </p>
      
      <div className="text-sm text-muted-foreground bg-card p-4 rounded-md inline-block">
        <p><span className="font-semibold">ID de Pago:</span> {paymentId || 'N/A'}</p>
        <p><span className="font-semibold">Estado:</span> {status || 'N/A'}</p>
        <p><span className="font-semibold">ID de Preferencia:</span> {preferenceId || 'N/A'}</p>
      </div>

      <div className="mt-8">
        <Link href="/" passHref>
          <Button size="lg">Volver al Inicio</Button>
        </Link>
      </div>
    </div>
  );
}

export default function PaymentPendingPage() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <PendingContent />
    </Suspense>
  );
}