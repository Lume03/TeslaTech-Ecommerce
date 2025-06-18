"use client";
import Image from 'next/image';
import Link from 'next/link';
import type { Product } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Heart, ShoppingCart, Star } from 'lucide-react';
import { useAppContext } from '@/contexts/AppContext';
import { Badge } from '@/components/ui/badge';
import React, { memo } from 'react';

interface ProductCardProps {
  product: Product;
}

const ProductCardComponent = ({ product }: ProductCardProps) => {
  const { addToCart, addToWishlist, isInWishlist, removeFromWishlist } = useAppContext();
  const isFavorited = isInWishlist(product.id);

  const handleWishlistToggle = () => {
    if (isFavorited) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(product);
    }
  };

  return (
    <Card className="group w-full overflow-hidden rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out hover:border-primary transform hover:scale-[1.02]">
      <CardHeader className="p-0 relative">
        <Link href={`/products/${product.id}`} passHref>
          <div className="aspect-square overflow-hidden relative">
            <Image
              src={product.image}
              alt={product.name}
              width={300}
              height={300}
              className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300 ease-in-out"
              data-ai-hint={`${product.category} product`}
              unoptimized // <-- CAMBIO AÑADIDO
            />
          </div>
        </Link>
        {product.isBestseller && (
          <Badge variant="destructive" className="absolute top-2 left-2 bg-accent text-accent-foreground">Bestseller</Badge>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 bg-card/70 hover:bg-card"
          onClick={handleWishlistToggle}
          aria-label={isFavorited ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart className={isFavorited ? "text-red-500 fill-current" : "text-muted-foreground"} size={20} />
        </Button>
      </CardHeader>
      <CardContent className="p-4 space-y-2">
        <CardTitle className="text-lg font-headline leading-tight truncate group-hover:text-primary">
          <Link href={`/products/${product.id}`} passHref>
            {product.name}
          </Link>
        </CardTitle>
        <CardDescription className="text-sm text-muted-foreground">{product.category}</CardDescription>
        <div className="flex items-center justify-between">
          <p className="text-xl font-semibold text-primary">S/{product.price.toFixed(2)}</p>
          {product.rating && (
            <div className="flex items-center space-x-1">
              <Star size={16} className="text-yellow-400 fill-current" />
              <span className="text-sm text-muted-foreground">{product.rating.toFixed(1)}</span>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="p-4">
        <Button
          className="w-full transition-colors duration-300 ease-in-out hover:bg-accent hover:text-accent-foreground"
          onClick={() => addToCart(product)}
        >
          <ShoppingCart size={18} className="mr-2" /> Add to Cart
        </Button>
      </CardFooter>
    </Card>
  );
}

export default memo(ProductCardComponent);