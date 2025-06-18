// Ruta: src/app/payment/stripe-success/StripeSuccessContent.tsx

"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader2, AlertCircle, ShoppingCart } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { useToast } from "@/hooks/use-toast";
import { createOrderAction } from '@/app/actions/orderActions';
import type { OrderStatus, ShippingAddress, PaymentDetails } from '@/lib/data';

export default function StripeSuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const { currentUser, userProfile, cart, getCartTotal, clearCart } = useAppContext();
  const { toast } = useToast();

  const [orderCreationStatus, setOrderCreationStatus] = useState<'idle' | 'creating' | 'success' | 'error'>('idle');
  const [orderMessage, setOrderMessage] = useState('');

  useEffect(() => {
    if (orderCreationStatus !== 'idle' || !sessionId || !currentUser || !userProfile || cart.length === 0) {
      return; 
    }

    const processOrder = async () => {
      setOrderCreationStatus('creating');
      setOrderMessage('Validando pago y creando tu pedido...');

      try {
        const shippingAddress: ShippingAddress = {
          firstName: userProfile.firstName || '',
          lastName: userProfile.lastName || '',
          dni: userProfile.dni || '',
          phoneNumber: userProfile.phoneNumber || '',
          address: userProfile.address || '',
          email: userProfile.email || '',
        };

        const paymentDetails: PaymentDetails = {
          gateway: 'stripe',
          paymentId: sessionId,
          status: 'succeeded',
        };
        
        const orderData = {
          userId: currentUser.uid,
          userEmail: userProfile.email,
          userName: userProfile.displayName || `${userProfile.firstName} ${userProfile.lastName}`,
          items: cart,
          totalAmount: getCartTotal(),
          shippingAddress,
          paymentDetails,
          orderStatus: 'pending_shipment' as OrderStatus,
        };

        const result = await createOrderAction(orderData);

        if (result.success && result.orderId) {
          clearCart();
          setOrderCreationStatus('success');
          setOrderMessage(`¡Pedido #${result.orderId.substring(0,8)} creado exitosamente!`);
          toast({ title: "¡Pedido Creado Exitosamente!" });
        } else {
          setOrderCreationStatus('error');
          setOrderMessage(result.error || 'Hubo un problema al crear tu pedido.');
          toast({ title: "Error al Crear Pedido", description: result.error, variant: "destructive" });
        }
      } catch (err: any) {
        console.error("Error processing order:", err);
        setOrderCreationStatus('error');
        setOrderMessage(`Error inesperado: ${err.message}`);
        toast({ title: "Error Inesperado", variant: "destructive" });
      }
    };

    processOrder();

  }, [sessionId, currentUser, userProfile, cart, getCartTotal, clearCart, toast, orderCreationStatus]);

  // ... (El resto del return con el JSX para mostrar el estado se queda igual)
  return (
    <div className="container mx-auto px-4 py-16 text-center">
      {orderCreationStatus === 'success' && <CheckCircle className="mx-auto h-20 w-20 text-green-500 mb-6" />}
      {orderCreationStatus === 'error' && <AlertCircle className="mx-auto h-20 w-20 text-destructive mb-6" />}
      {(orderCreationStatus === 'creating' || orderCreationStatus === 'idle') && <Loader2 className="mx-auto h-20 w-20 animate-spin text-primary mb-6" />}
      
      <h1 className="text-4xl font-headline font-bold mb-4">
        {orderCreationStatus === 'success' ? '¡Pago Exitoso!' : 
         orderCreationStatus === 'error' ? 'Error en el Pedido' : 'Procesando...'}
      </h1>
      <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
        {orderMessage || 'Verificando tu pago con Stripe...'}
      </p>
      
      <div className="space-x-4">
        {orderCreationStatus === 'success' && (
          <Link href="/orders"><Button size="lg">Ver Mis Pedidos</Button></Link>
        )}
        <Link href="/products"><Button size="lg" variant="outline"><ShoppingCart className="mr-2 h-5 w-5" /> Seguir Comprando</Button></Link>
      </div>
    </div>
  );
}
    