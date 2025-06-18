
"use client";
import type { Product } from '@/lib/data';
import ProductCard from './ProductCard';
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import React from 'react'; // Import React for React.memo

interface BestsellerShowcaseProps {
  products: Product[];
}

const BestsellerShowcaseComponent = ({ products }: BestsellerShowcaseProps) => {
  if (!products || products.length === 0) {
    return <p>No bestsellers to display at the moment.</p>;
  }

  return (
    <section className="py-12">
      <h2 className="text-3xl font-headline font-bold mb-8 text-center">Our Bestsellers</h2>
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex space-x-4 pb-4">
          {products.map((product) => (
            <div key={product.id} className="w-[280px] md:w-[300px] shrink-0">
              <ProductCard product={product} />
            </div>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </section>
  );
}

export default React.memo(BestsellerShowcaseComponent);
