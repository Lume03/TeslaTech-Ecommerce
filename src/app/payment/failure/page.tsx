"use client";
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { XCircle } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function PaymentFailureContent() {
  const searchParams = useSearchParams();

  // Aquí podrías registrar el intento fallido si lo deseas.
  // const paymentId = searchParams.get('payment_id');
  // const status = searchParams.get('status');
  // const preferenceId = searchParams.get('preference_id');
  // console.log("Failed Payment:", { status, paymentId, preferenceId });

  return (
    <div className="container mx-auto px-4 py-16 text-center">
      <XCircle className="mx-auto h-20 w-20 text-destructive mb-6" />
      <h1 className="text-4xl font-headline font-bold mb-4">Pago Fallido</h1>
      <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
        Lo sentimos, no se pudo procesar tu pago. Por favor, verifica tus datos o intenta con otro método de pago.
      </p>
       <div className="text-sm text-muted-foreground mb-6 bg-card p-4 rounded-md inline-block">
        <p className="mb-1">ID de Pago: {searchParams.get('payment_id') || 'N/A'}</p>
        <p className="mb-1">Estado: {searchParams.get('status') || 'N/A'}</p>
        <p>ID de Preferencia: {searchParams.get('preference_id') || 'N/A'}</p>
      </div>
      <div>
        <Link href="/cart" passHref>
          <Button size="lg" variant="outline" className="mr-4">Volver al Carrito</Button>
        </Link>
        <Link href="/products" passHref>
          <Button size="lg">Seguir Comprando</Button>
        </Link>
      </div>
    </div>
  );
}


export default function PaymentFailurePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PaymentFailureContent />
    </Suspense>
  );
}