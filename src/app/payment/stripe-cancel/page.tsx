
"use client";
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { XCircle } from 'lucide-react';

export default function StripeCancelPage() {
  return (
    <div className="container mx-auto px-4 py-16 text-center">
      <XCircle className="mx-auto h-20 w-20 text-destructive mb-6" />
      <h1 className="text-4xl font-headline font-bold mb-4">Pago Cancelado</h1>
      <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
        Tu pago con Stripe ha sido cancelado. Puedes volver al carrito e intentarlo de nuevo o seguir explorando nuestros productos.
      </p>
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
