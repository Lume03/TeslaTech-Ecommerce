"use client";
import { useAppContext } from '@/contexts/AppContext';
import ProductCard from '@/components/products/ProductCard';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { HeartCrack } from 'lucide-react';

export default function WishlistPage() {
  const { wishlist, isAdmin } = useAppContext();

  if (isAdmin) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <HeartCrack className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
        <h1 className="text-3xl font-headline font-bold mb-4">Acceso Restringido</h1>
        <p className="text-muted-foreground mb-6">Los administradores no tienen una lista de deseos.</p>
        <Link href="/admin" passHref>
          <Button size="lg">Ir al Panel de Administración</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-headline font-bold mb-8">Tu Lista de Deseos</h1>
      {wishlist.length === 0 ? (
        <div className="text-center py-10 bg-card rounded-lg">
          <HeartCrack className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
          <p className="text-xl text-muted-foreground mb-4">Tu lista de deseos está vacía.</p>
          <p className="mb-6">¡Añade productos que te gusten para verlos aquí!</p>
          <Link href="/products" passHref>
            <Button size="lg">Descubrir Productos</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {wishlist.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
