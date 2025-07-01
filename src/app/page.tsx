
"use client";
import { categories, Product } from '@/lib/data';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, Star, ShoppingCart, Heart, Package } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import dynamic from 'next/dynamic';

// Dynamically import the BestsellerShowcase to code-split it and reduce the initial load.
// Provide a skeleton component to show while it's loading.
const BestsellerShowcase = dynamic(
  () => import('@/components/products/BestsellerShowcase'),
  { 
    loading: () => <BestsellerSkeleton />,
    ssr: false // The component fetches its own data client-side, so no need for SSR.
  }
);

const BestsellerSkeleton = () => (
  <section className="py-12">
    <h2 className="text-3xl font-headline font-bold mb-8 text-center">Nuestros Más Vendidos</h2>
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
  </section>
);


export default function HomePage() {
  const prominentCategories = categories.slice(0, 4);

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="relative text-center py-16 md:py-24 rounded-lg overflow-hidden bg-gradient-to-br from-primary/30 via-background to-background">
        <div className="relative z-10 container mx-auto px-4">
          <h1 className="text-4xl md:text-6xl font-headline font-bold mb-6">
            Bienvenido a <span className="text-primary">Tesla</span>Tech
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Tu destino definitivo para componentes de computadora de vanguardia y equipos tecnológicos. Potencia tu mundo digital con nosotros.
          </p>
          <div className="space-x-4">
            <Link href="/products" passHref>
              <Button size="lg" className="font-semibold">
                Ver Todos los Productos <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/categories" passHref>
              <Button size="lg" variant="outline" className="font-semibold">
                Explorar Categorías
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Bestseller Showcase is now dynamically loaded */}
      <BestsellerShowcase />

      {/* Categories Section */}
      <section className="py-12">
        <h2 className="text-3xl font-headline font-bold mb-8 text-center">Compra por Categoría</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {prominentCategories.map(category => ( 
            <Link key={category.id} href={`/categories/${category.slug}`} passHref>
              <Card className="group h-full overflow-hidden rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out hover:border-primary transform hover:scale-[1.02] flex flex-col items-center justify-center p-6 text-center cursor-pointer">
                <CardHeader className="p-2">
                   <Package size={40} className="mx-auto text-primary mb-3 group-hover:scale-110 transition-transform" />
                  <CardTitle className="text-xl font-headline group-hover:text-primary">{category.name}</CardTitle>
                </CardHeader>
                <CardContent className="p-2 mt-auto">
                  <span className="text-sm text-muted-foreground group-hover:text-primary flex items-center justify-center">
                    Ver Productos <ArrowRight className="ml-2 h-4 w-4" />
                  </span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
        <div className="text-center mt-8">
            <Link href="/categories" passHref>
              <Button variant="link" className="text-primary text-lg">
                Ver Todas las Categorías <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
      </section>

       {/* Why Choose Us Section */}
      <section className="py-12 bg-card rounded-lg">
        <h2 className="text-3xl font-headline font-bold mb-8 text-center">¿Por qué TeslaTech?</h2>
        <div className="grid md:grid-cols-3 gap-8 text-center">
          <div>
            <div className="p-4 bg-primary/20 rounded-full inline-block mb-4">
              <Star className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-headline mb-2">Calidad Asegurada</h3>
            <p className="text-muted-foreground">Componentes de primera calidad de marcas líderes.</p>
          </div>
          <div>
            <div className="p-4 bg-primary/20 rounded-full inline-block mb-4">
              <ShoppingCart className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-headline mb-2">Envío Rápido</h3>
            <p className="text-muted-foreground">Recibe tu equipo tecnológico rápidamente.</p>
          </div>
          <div>
            <div className="p-4 bg-primary/20 rounded-full inline-block mb-4">
              <Heart className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-headline mb-2">Soporte Experto</h3>
            <p className="text-muted-foreground">Equipo experto para asistirte.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
