// Ruta: src/app/payment/success/SuccessContent.tsx

"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader2, AlertCircle, ShoppingCart } from 'lucide-react';
import { useAppContext } from '@/contexts/AppContext';
import { useToast } from "@/hooks/use-toast";
import { createOrderAction } from '@/app/actions/orderActions';
import type { OrderStatus, ShippingAddress, PaymentDetails } from '@/lib/data';

export default function SuccessContent() {
  const searchParams = useSearchParams();
  const { currentUser, userProfile, cart, getCartTotal, clearCart, isProfileComplete } = useAppContext();
  const { toast } = useToast();

  const [orderCreationStatus, setOrderCreationStatus] = useState<'idle' | 'creating' | 'success' | 'error'>('idle');
  const [orderMessage, setOrderMessage] = useState('');
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);

  // Datos de Mercado Pago desde la URL
  const paymentId = searchParams.get('payment_id');
  const paymentStatus = searchParams.get('status');

  useEffect(() => {
    if (orderCreationStatus !== 'idle') return; // La lógica ya se ejecutó
    if (!currentUser || !userProfile) return; // Esperando datos del usuario

    // Si el carrito está vacío, es probable que la orden ya se creó.
    if (cart.length === 0) {
      setOrderCreationStatus('success');
      setOrderMessage('Tu pago fue procesado. Si el carrito está vacío, es posible que tu pedido ya haya sido creado.');
      return;
    }

    const processOrder = async () => {
      setOrderCreationStatus('creating');
      setOrderMessage('Validando pago y creando tu pedido...');

      try {
        // 1. OBTENER EL TOKEN DEL USUARIO
        const idToken = await currentUser.getIdToken(true);

        // 2. PREPARAR LOS DATOS DE LA ORDEN
        const shippingAddress: ShippingAddress = {
          firstName: userProfile.firstName || null,
          lastName: userProfile.lastName || null,
          dni: userProfile.dni || null,
          phoneNumber: userProfile.phoneNumber || null,
          address: userProfile.address || null,
          email: userProfile.email || null,
        };

        const paymentDetails: PaymentDetails = {
          gateway: 'mercadopago',
          paymentId: paymentId,
          status: paymentStatus,
        };
        
        const totalAmount = getCartTotal();

        const orderData = {
          userId: currentUser.uid,
          userEmail: userProfile.email,
          userName: userProfile.displayName || `${userProfile.firstName} ${userProfile.lastName}`,
          items: cart,
          totalAmount,
          shippingAddress,
          paymentDetails,
          orderStatus: 'pending_shipment' as OrderStatus,
          idToken: idToken, // <-- ¡AÑADIMOS EL TOKEN!
        };

        // 3. LLAMAR A LA SERVER ACTION
        const result = await createOrderAction(orderData);

        if (result.success && result.orderId) {
          clearCart();
          setCreatedOrderId(result.orderId);
          setOrderCreationStatus('success');
          setOrderMessage(`¡Pedido #${result.orderId.substring(0,8)} creado exitosamente!`);
        } else {
          setOrderCreationStatus('error');
          setOrderMessage(result.error || 'Hubo un problema al crear tu pedido.');
        }
      } catch (err: any) {
        console.error("Error procesando la orden:", err);
        setOrderCreationStatus('error');
        setOrderMessage(`Error inesperado: ${err.message || 'Contacta a soporte.'}`);
      }
    };

    // Solo procesar si el pago fue aprobado
    if (paymentStatus === 'approved') {
        processOrder();
    } else {
        setOrderCreationStatus('error');
        setOrderMessage(`El pago no fue aprobado (estado: ${paymentStatus}). No se creó el pedido.`);
    }

  }, [paymentId, paymentStatus, currentUser, userProfile, cart, getCartTotal, clearCart, orderCreationStatus, isProfileComplete]);

  return (
    <div className="container mx-auto px-4 py-16 text-center">
      {orderCreationStatus === 'success' && <CheckCircle className="mx-auto h-20 w-20 text-green-500 mb-6" />}
      {orderCreationStatus === 'error' && <AlertCircle className="mx-auto h-20 w-20 text-destructive mb-6" />}
      {(orderCreationStatus === 'creating' || orderCreationStatus === 'idle') && <Loader2 className="mx-auto h-20 w-20 animate-spin text-primary mb-6" />}
      
      <h1 className="text-4xl font-headline font-bold mb-4">
        {orderCreationStatus === 'success' && '¡Pago Exitoso!'}
        {orderCreationStatus === 'error' && 'Error en el Pedido'}
        {(orderCreationStatus === 'creating' || orderCreationStatus === 'idle') && 'Procesando Pago...'}
      </h1>

      <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
        {orderMessage || 'Verificando tu pago con Mercado Pago...'}
      </p>
      
      <div className="space-x-4">
        {orderCreationStatus === 'success' && (
          <Link href="/orders" passHref>
            <Button size="lg" className="mr-4">Ver Mis Pedidos</Button>
          </Link>
        )}
        <Link href="/products" passHref>
          <Button size="lg" variant="outline">
            <ShoppingCart className="mr-2 h-5 w-5" /> Seguir Comprando
          </Button>
        </Link>
      </div>
    </div>
  );
}