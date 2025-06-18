
"use client";
import { useEffect, useState } from 'react';
import { getUserOrdersAction } from '@/app/actions/orderActions';
import type { Order, OrderStatus } from '@/lib/data';
import { orderStatusTranslations } from '@/lib/data';
import { useAppContext } from '@/contexts/AppContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Truck, Package, CheckCircle, Loader2, AlertCircle, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const getStatusIcon = (status: OrderStatus) => {
  switch (status) {
    case 'pending_shipment': return <Package className="h-5 w-5 text-yellow-500" />;
    case 'shipped': return <Truck className="h-5 w-5 text-blue-500" />;
    case 'delivered': return <CheckCircle className="h-5 w-5 text-green-500" />;
    case 'payment_pending': return <Loader2 className="h-5 w-5 text-orange-500 animate-spin" />;
    case 'payment_failed': return <AlertCircle className="h-5 w-5 text-destructive" />;
    default: return <Package className="h-5 w-5 text-muted-foreground" />;
  }
};

export default function UserOrdersPage() {
  const { currentUser, loadingAuth } = useAppContext();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);

  // Reemplaza tu useEffect con este
  useEffect(() => {
    if (!loadingAuth && currentUser) {
      setIsLoadingOrders(true);
      // Le pasamos el ID del usuario a la función
      getUserOrdersAction(currentUser.uid) 
        .then(fetchedOrders => {
          setOrders(fetchedOrders);
        })
        .catch(error => {
          console.error("Error fetching user orders:", error);
        })
        .finally(() => {
          setIsLoadingOrders(false);
        });
    } else if (!loadingAuth && !currentUser) {
      setIsLoadingOrders(false);
    }
  }, [currentUser, loadingAuth]);

  if (loadingAuth || isLoadingOrders) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <AlertCircle className="mx-auto h-16 w-16 text-destructive mb-4" />
        <h1 className="text-3xl font-headline font-bold mb-4">Acceso Denegado</h1>
        <p className="text-muted-foreground mb-6">Debes iniciar sesión para ver tus pedidos.</p>
        <Link href="/" passHref><Button size="lg">Volver al Inicio</Button></Link>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <ShoppingBag className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
        <h1 className="text-3xl font-headline font-bold mb-4">No Tienes Pedidos Aún</h1>
        <p className="text-muted-foreground mb-6">Parece que no has realizado ninguna compra todavía.</p>
        <Link href="/products" passHref><Button size="lg">Explorar Productos</Button></Link>
      </div>
    );
  }

  const pendingShipmentOrders = orders.filter(order => order.orderStatus === 'pending_shipment' || order.orderStatus === 'payment_pending');
  const shippedOrDeliveredOrders = orders.filter(order => order.orderStatus === 'shipped' || order.orderStatus === 'delivered');
  const otherOrders = orders.filter(order => !['pending_shipment', 'payment_pending', 'shipped', 'delivered'].includes(order.orderStatus));


  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-headline font-bold mb-8">Mis Pedidos</h1>
      
      {pendingShipmentOrders.length > 0 && (
        <section className="mb-12">
          <h2 className="text-2xl font-headline font-semibold mb-6">Pendientes de Envío</h2>
          <div className="space-y-6">
            {pendingShipmentOrders.map(order => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        </section>
      )}

      {shippedOrDeliveredOrders.length > 0 && (
         <section className="mb-12">
          <h2 className="text-2xl font-headline font-semibold mb-6">Enviados / Entregados</h2>
          <div className="space-y-6">
            {shippedOrDeliveredOrders.map(order => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        </section>
      )}
      
      {otherOrders.length > 0 && (
         <section className="mb-12">
          <h2 className="text-2xl font-headline font-semibold mb-6">Otros Pedidos</h2>
          <div className="space-y-6">
            {otherOrders.map(order => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function OrderCard({ order }: { order: Order }) {
  const formatDate = (timestampInput: any): string => {
    if (!timestampInput) return 'N/A';

    let date: Date | null = null;

    if (timestampInput instanceof Date) {
      date = timestampInput;
    } else if (timestampInput && typeof timestampInput.toDate === 'function') {
      // Firestore Timestamp object
      date = timestampInput.toDate();
    } else if (timestampInput && typeof timestampInput.seconds === 'number') {
      // Object with seconds/nanoseconds (common in server-side Firebase Admin or serialized Timestamps)
      date = new Date(timestampInput.seconds * 1000 + (timestampInput.nanoseconds || 0) / 1000000);
    } else {
      // Try to parse as a string or number directly (less reliable)
      const parsed = new Date(timestampInput);
      if (!isNaN(parsed.getTime())) {
        date = parsed;
      }
    }

    if (date && !isNaN(date.getTime())) {
      return format(date, "dd 'de' MMMM, yyyy 'a las' HH:mm", { locale: es });
    }
    
    console.warn("formatDate received an invalid time value:", timestampInput);
    return 'Fecha inválida';
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-muted/30 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
          <div>
            <CardTitle className="text-xl font-headline">Pedido #{order.id.substring(0, 8)}</CardTitle>
            <CardDescription>Realizado el: {formatDate(order.createdAt)}</CardDescription>
          </div>
          <Badge variant={
            order.orderStatus === 'delivered' ? 'default' :
            order.orderStatus === 'shipped' ? 'secondary' :
            order.orderStatus === 'pending_shipment' ? 'outline' : // Using outline for pending
            order.orderStatus === 'payment_failed' || order.orderStatus.startsWith('cancelled') ? 'destructive' :
            'default' // Fallback
          } className="text-sm py-1 px-3">
            <span className="mr-2">{getStatusIcon(order.orderStatus)}</span>
            {orderStatusTranslations[order.orderStatus] || order.orderStatus}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        <div className="space-y-4">
          {order.items.map(item => (
            <div key={item.id} className="flex gap-4 items-start">
              <Image 
                src={item.image || "https://placehold.co/80x80.png"} 
                alt={item.name} 
                width={80} 
                height={80} 
                className="rounded-md object-cover border"
                data-ai-hint={`${item.categorySlug} product small`}
                unoptimized 
              />
              <div className="flex-grow">
                <Link href={`/products/${item.id}`} className="font-semibold hover:text-primary">{item.name}</Link>
                <p className="text-sm text-muted-foreground">Cantidad: {item.quantity}</p>
                <p className="text-sm text-muted-foreground">Precio Unit.: S/{item.price.toFixed(2)}</p>
              </div>
              <p className="text-md font-semibold">S/{(item.price * item.quantity).toFixed(2)}</p>
            </div>
          ))}
        </div>
        <Separator className="my-4" />
        <div className="space-y-1 text-sm">
          <h4 className="font-semibold mb-1">Dirección de Envío:</h4>
          <p>{order.shippingAddress.firstName} {order.shippingAddress.lastName}</p>
          <p>{order.shippingAddress.address}</p>
          <p>Tel: {order.shippingAddress.phoneNumber} | DNI: {order.shippingAddress.dni}</p>
          <p>Email: {order.shippingAddress.email}</p>
        </div>
      </CardContent>
      <CardFooter className="bg-muted/30 p-4 sm:p-6 flex justify-end">
        <p className="text-xl font-bold">Total del Pedido: S/{order.totalAmount.toFixed(2)}</p>
      </CardFooter>
    </Card>
  );
}
