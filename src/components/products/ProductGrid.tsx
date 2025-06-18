
"use client";
import type { Product } from '@/lib/data';
import ProductCard from './ProductCard';
import React from 'react'; // Import React for React.memo

interface ProductGridProps {
  products: Product[];
}

const ProductGridComponent = ({ products }: ProductGridProps) => {
  if (!products || products.length === 0) {
    return <p className="text-center text-muted-foreground py-10">No products found matching your criteria.</p>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}

export default React.memo(ProductGridComponent);
