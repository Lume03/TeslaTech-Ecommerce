"use client";
import { useAppContext } from '@/contexts/AppContext';
import ProductCard from '@/components/products/ProductCard';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { HeartCrack } from 'lucide-react';

export default function WishlistPage() {
  const { wishlist } = useAppContext();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-headline font-bold mb-8">Your Wishlist</h1>
      {wishlist.length === 0 ? (
        <div className="text-center py-10 bg-card rounded-lg">
          <HeartCrack className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
          <p className="text-xl text-muted-foreground mb-4">Your wishlist is empty.</p>
          <p className="mb-6">Add some products you love to see them here!</p>
          <Link href="/products" passHref>
            <Button size="lg">Discover Products</Button>
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
