
"use client";
import { useAppContext } from '@/contexts/AppContext';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Trash2, Plus, Minus, ShoppingBag, Loader2, CreditCard } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";
import { createStripeCheckoutSession } from '@/app/actions/stripeActions';
import type { CartItem } from '@/contexts/AppContext';

export default function CartPage() {
  const { cart, updateCartQuantity, removeFromCart, getCartTotal, clearCart, currentUser, userProfile, isProfileComplete, isAdmin } = useAppContext();
  const router = useRouter();
  const { toast } = useToast();
  const [isProcessingStripe, setIsProcessingStripe] = useState(false);

  const commonCheckoutValidation = useCallback(() => {
    if (cart.length === 0) {
      toast({ title: "Tu carrito está vacío", variant: "destructive" });
      return false;
    }
    if (!currentUser) {
      toast({
        title: "Inicio de Sesión Requerido",
        description: "Por favor, inicia sesión para proceder con el pago.",
        variant: "default",
      });
      router.push('/'); 
      return false;
    }
    if (userProfile && !isProfileComplete(userProfile)) {
      toast({
        title: "Perfil Incompleto",
        description: "Por favor, completa tus datos en tu perfil antes de proceder al pago.",
        variant: "destructive",
        action: (
          <Link href="/profile">
            <Button variant="outline" size="sm">
              Ir al Perfil
            </Button>
          </Link>
        ),
      });
      return false;
    }
    return true;
  }, [cart.length, currentUser, userProfile, isProfileComplete, toast, router]);

  if (isAdmin) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <ShoppingBag className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
        <h1 className="text-3xl font-headline font-bold mb-4">Acceso Restringido</h1>
        <p className="text-muted-foreground mb-6">Los administradores no tienen un carrito de compras.</p>
        <Link href="/admin" passHref>
          <Button size="lg">Ir al Panel de Administración</Button>
        </Link>
      </div>
    );
  }


  const handleQuantityChange = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
    } else {
      updateCartQuantity(productId, newQuantity);
    }
  };

  const handleProceedWithStripe = async () => {
    if (!commonCheckoutValidation()) {
      return;
    }
    setIsProcessingStripe(true);
    try {
        const payerData = userProfile ? { email: userProfile.email } : undefined;
        
        const itemsForStripe: CartItem[] = cart.map(item => ({
            id: item.id,
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            category: item.category,
            categorySlug: item.categorySlug,
            image: item.image,
        }));

        const response = await createStripeCheckoutSession(itemsForStripe, payerData);
        
        if (response.success && response.sessionUrl) {
            window.location.href = response.sessionUrl;
        } else {
            toast({
              title: "Error al Procesar con Stripe",
              description: response.error || "No se pudo iniciar la sesión de pago de Stripe.",
              variant: "destructive",
            });
            setIsProcessingStripe(false);
        }
    } catch (error: any) {
        toast({
            title: "Error Inesperado con Stripe",
            description: error.message || "Ocurrió un error al intentar procesar tu pago con Stripe.",
            variant: "destructive",
        });
        setIsProcessingStripe(false);
    }
  };


  if (cart.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <ShoppingBag className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
        <h1 className="text-3xl font-headline font-bold mb-4">Tu Carrito está Vacío</h1>
        <p className="text-muted-foreground mb-6">Parece que aún no has añadido nada a tu carrito.</p>
        <Link href="/products" passHref>
          <Button size="lg">Comenzar a Comprar</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-headline font-bold mb-8">Tu Carrito de Compras</h1>
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="lg:w-2/3 space-y-4">
          {cart.map(item => (
            <Card key={item.id} className="flex flex-col sm:flex-row items-center p-4 gap-4">
              <Link href={`/products/${item.id}`} className="shrink-0">
                <Image 
                  src={item.image} 
                  alt={item.name} 
                  width={100} 
                  height={100} 
                  className="rounded-md object-cover w-24 h-24 sm:w-32 sm:h-32"
                  data-ai-hint={`${item.category} product small`}
                  unoptimized
                />
              </Link>
              <div className="flex-grow">
                <Link href={`/products/${item.id}`}>
                  <h2 className="text-lg font-semibold font-headline hover:text-primary">{item.name}</h2>
                </Link>
                <p className="text-sm text-muted-foreground">{item.category}</p>
                <p className="text-md font-semibold text-primary mt-1">S/{item.price.toFixed(2)}</p>
              </div>
              <div className="flex items-center space-x-2 sm:ml-auto">
                <Button variant="outline" size="icon" onClick={() => handleQuantityChange(item.id, item.quantity - 1)} disabled={item.quantity <= 1}>
                  <Minus size={16} />
                </Button>
                <Input 
                  type="number" 
                  value={item.quantity} 
                  onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value) || 1)}
                  className="w-16 h-10 text-center"
                  min="1"
                />
                <Button variant="outline" size="icon" onClick={() => handleQuantityChange(item.id, item.quantity + 1)}>
                  <Plus size={16} />
                </Button>
              </div>
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={() => removeFromCart(item.id)}>
                <Trash2 size={18} />
              </Button>
            </Card>
          ))}
           {cart.length > 0 && (
             <Button variant="outline" onClick={() => clearCart()} className="mt-4 text-destructive hover:bg-destructive/10">
 <Trash2 size={16} className="mr-2"/> Limpiar Carrito
             </Button>
           )}
        </div>

        <aside className="lg:w-1/3">
          <Card className="sticky top-20">
            <CardHeader>
              <CardTitle className="text-2xl font-headline">Resumen del Pedido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>S/{getCartTotal().toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Envío</span>
                <span>Gratis</span>
              </div>
              <Separator />
              <div className="flex justify-between text-xl font-bold">
                <span>Total</span>
                <span>S/{getCartTotal().toFixed(2)}</span>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-3">
              <Button 
                size="lg" 
                variant="default" 
                className="w-full" 
                onClick={handleProceedWithStripe}
                disabled={isProcessingStripe}
              >
                {isProcessingStripe ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CreditCard className="mr-2 h-5 w-5" />
                )}
                Pagar con Tarjeta
              </Button>
            </CardFooter>
          </Card>
        </aside>
      </div>
    </div>
  );
}
