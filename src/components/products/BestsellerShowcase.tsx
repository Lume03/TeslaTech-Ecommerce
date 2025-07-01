
"use client";
import type { Product } from '@/lib/data';
import { getBestsellersFromDB } from '@/lib/data';
import ProductCard from './ProductCard';
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';

interface BestsellerShowcaseProps {
  // This component now fetches its own data, but can accept products as a fallback/initial data
  products?: Product[];
}

const BestsellerShowcaseComponent = ({ products: initialProducts }: BestsellerShowcaseProps) => {
  const [products, setProducts] = useState<Product[]>(initialProducts || []);
  const [isLoading, setIsLoading] = useState(!initialProducts);

  useEffect(() => {
    // If no initial products are provided, fetch them.
    if (!initialProducts) {
      const fetchBestsellers = async () => {
        setIsLoading(true);
        const fetchedProducts = await getBestsellersFromDB(8);
        setProducts(fetchedProducts);
        setIsLoading(false);
      };
      fetchBestsellers();
    }
  }, [initialProducts]);


  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const SCROLL_AMOUNT = 320; 

  const getViewport = () => scrollAreaRef.current?.querySelector<HTMLDivElement>('[data-radix-scroll-area-viewport]');

  const checkScrollability = useCallback(() => {
    const viewport = getViewport();
    if (viewport) {
      const isScrollable = viewport.scrollWidth > viewport.clientWidth;
      setCanScrollLeft(viewport.scrollLeft > 0);
      setCanScrollRight(isScrollable && Math.ceil(viewport.scrollLeft) < viewport.scrollWidth - viewport.clientWidth - 1);
    }
  }, []);

  useEffect(() => {
    const viewport = getViewport();
    if (viewport) {
      checkScrollability();
      viewport.addEventListener('scroll', checkScrollability, { passive: true });
      window.addEventListener('resize', checkScrollability);
      const timer = setTimeout(checkScrollability, 500);

      return () => {
        if (viewport) {
            viewport.removeEventListener('scroll', checkScrollability);
        }
        window.removeEventListener('resize', checkScrollability);
        clearTimeout(timer);
      };
    }
  }, [products, checkScrollability]);

  const scroll = (direction: 'left' | 'right') => {
    const viewport = getViewport();
    if (viewport) {
      const scrollAmount = direction === 'left' ? -SCROLL_AMOUNT : SCROLL_AMOUNT;
      viewport.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if (isLoading) {
     return (
       <div className="flex space-x-4 pb-4 overflow-x-auto">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="w-[280px] md:w-[300px] shrink-0 space-y-3">
              <Skeleton className="h-[280px] w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
     )
  }

  if (!products || products.length === 0) {
    return <p className="text-center text-muted-foreground py-10">No hay productos más vendidos para mostrar en este momento.</p>;
  }

  return (
    <section className="py-12">
      <h2 className="text-3xl font-headline font-bold mb-8 text-center">Nuestros Más Vendidos</h2>
      <div className="flex items-center justify-center gap-x-1 md:gap-x-4">
        <Button
          variant="outline"
          size="icon"
          className="h-10 w-10 rounded-full shadow-md bg-background/80 hover:bg-background hidden md:flex shrink-0"
          onClick={() => scroll('left')}
          disabled={!canScrollLeft}
          aria-label="Scroll left"
        >
          <ChevronLeft className="h-6 w-6" />
        </Button>

        <ScrollArea ref={scrollAreaRef} className="w-full whitespace-nowrap">
          <div className="flex space-x-4 pb-4 px-1">
            {products.map((product) => (
              <div key={product.id} className="w-[280px] md:w-[300px] shrink-0">
                <ProductCard product={product} />
              </div>
            ))}
          </div>
          <ScrollBar orientation="horizontal" className="md:invisible" />
        </ScrollArea>

        <Button
          variant="outline"
          size="icon"
          className="h-10 w-10 rounded-full shadow-md bg-background/80 hover:bg-background hidden md:flex shrink-0"
          onClick={() => scroll('right')}
          disabled={!canScrollRight}
          aria-label="Scroll right"
        >
          <ChevronRight className="h-6 w-6" />
        </Button>
      </div>
    </section>
  );
}

export default BestsellerShowcaseComponent;
