"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

export default function PendingContent() {
  const searchParams = useSearchParams();

  // Aquí podrías guardar el estado pendiente para seguimiento.
  // const paymentId = searchParams.get('payment_id');
  // const status = searchParams.get('status');
  // const preferenceId = searchParams.get('preference_id');
  // console.log("Pending Payment:", { status, paymentId, preferenceId });

  return (
    <div className="container mx-auto px-4 py-16 text-center">
      <AlertTriangle className="mx-auto h-20 w-20 text-yellow-500 mb-6" />
      <h1 className="text-4xl font-headline font-bold mb-4">Pago Pendiente</h1>
      <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
        Tu pago está actualmente pendiente de confirmación. Te notificaremos una vez que se complete el proceso. Si el pago requiere una acción adicional (por ejemplo, pago en efectivo), por favor sigue las instrucciones proporcionadas por Mercado Pago.
      </p>
      <div className="text-sm text-muted-foreground mb-6 bg-card p-4 rounded-md inline-block">
        <p className="mb-1">ID de Pago: {searchParams.get('payment_id') || 'N/A'}</p>
        <p className="mb-1">Estado: {searchParams.get('status') || 'N/A'}</p>
        <p>ID de Preferencia: {searchParams.get('preference_id') || 'N/A'}</p>
      </div>
      <div>
        <Link href="/" passHref>
          <Button size="lg">Volver a la Tienda</Button>
        </Link>
      </div>
    </div>
  );
}