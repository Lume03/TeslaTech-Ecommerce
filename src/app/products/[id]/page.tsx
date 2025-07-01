
"use client";
import { useParams } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import Image from 'next/image';
import { Product, getProductByIdFromDB, getAllProductsFromDB } from '@/lib/data'; // Updated imports
import { Button } from '@/components/ui/button';
import { useAppContext } from '@/contexts/AppContext';
import { Heart, ShoppingCart, Star, CheckCircle, ShieldCheck, Truck, Minus, Plus, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import BestsellerShowcase from '@/components/products/BestsellerShowcase';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton'; // For loading state

export default function ProductDetailPage() {
  const params = useParams();
  const id = typeof params.id === 'string' ? params.id : '';
  const [quantity, setQuantity] = useState(1);
  const { addToCart, addToWishlist, isInWishlist, removeFromWishlist, isAdmin } = useAppContext();

  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setLoading(false); // No ID, nothing to load
      return;
    }
    const fetchProductData = async () => {
      setLoading(true);
      const fetchedProduct = await getProductByIdFromDB(id);
      setProduct(fetchedProduct);

      if (fetchedProduct) {
        // Fetch a few products from the same category for related products
        // This is a simple way, could be more sophisticated
        const allProds = await getAllProductsFromDB(); // In a real app, query by category
        const related = allProds
          .filter(p => p.categorySlug === fetchedProduct.categorySlug && p.id !== fetchedProduct.id)
          .slice(0, 4);
        setRelatedProducts(related);
      } else {
        setRelatedProducts([]);
      }
      setLoading(false);
      setQuantity(1); // Reset quantity when product changes
    };
    fetchProductData();
  }, [id]);

  const isFavorited = product ? isInWishlist(product.id) : false;

  const handleWishlistToggle = () => {
    if (product) {
      if (isFavorited) {
        removeFromWishlist(product.id);
      } else {
        addToWishlist(product);
      }
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12 mb-12">
          <div>
            <Skeleton className="aspect-square w-full rounded-lg" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-12 w-3/4" />
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-5 w-1/2" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-10 w-1/3" />
            <div className="flex gap-4">
              <Skeleton className="h-12 w-24" />
              <Skeleton className="h-12 flex-grow" />
              <Skeleton className="h-12 w-12" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
        <div className="container mx-auto px-4 py-16 text-center">
            <h1 className="text-3xl font-headline">Producto no encontrado</h1>
            <p className="text-muted-foreground">El producto que buscas no existe o no está disponible.</p>
        </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid md:grid-cols-2 gap-8 lg:gap-12 mb-12">
        <div className="bg-card p-4 rounded-lg shadow-lg">
          <div className="aspect-square relative rounded-md overflow-hidden">
            <Image
              src={product.image || "https://placehold.co/600x600.png"}
              alt={product.name}
              fill
              className="object-contain"
              data-ai-hint={`${product.categorySlug} detail`}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              priority
              unoptimized
            />
          </div>
        </div>

        <div className="space-y-6">
          <h1 className="text-4xl lg:text-5xl font-headline font-bold">{product.name}</h1>
          
          <div className="flex items-center space-x-4">
            {product.brand && <Badge variant="secondary">{product.brand}</Badge>}
            <span className="text-sm text-muted-foreground">Categoría: {product.category}</span>
          </div>

          {product.rating && (
            <div className="flex items-center space-x-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={20} className={i < Math.floor(product.rating!) ? "text-yellow-400 fill-current" : "text-muted-foreground/50"} />
              ))}
              <span className="ml-2 text-sm text-muted-foreground">({product.rating.toFixed(1)} rating)</span>
            </div>
          )}

          <p className="text-lg text-muted-foreground">{product.description}</p>
          
          {product.features && product.features.length > 0 && (
            <div>
              <h3 className="text-md font-semibold mb-1">Características Clave:</h3>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                {product.features.map((feature, index) => (
                  <li key={index}>{feature}</li>
                ))}
              </ul>
            </div>
          )}

          <Separator />

          <p className="text-4xl font-bold text-primary">S/{product.price.toFixed(2)}</p>

          {!isAdmin && (
            <div className="flex items-center space-x-4">
              <div className="flex items-center border rounded-md">
                <Button variant="ghost" size="icon" onClick={() => setQuantity(Math.max(1, quantity - 1))} className="rounded-r-none">
                  <Minus size={16} />
                </Button>
                <Input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-16 h-10 text-center border-y-0 border-x rounded-none focus-visible:ring-0"
                  min="1"
                />
                <Button variant="ghost" size="icon" onClick={() => setQuantity(quantity + 1)} className="rounded-l-none">
                  <Plus size={16} />
                </Button>
              </div>
              <Button size="lg" className="flex-grow" onClick={() => addToCart(product, quantity)} disabled={!product.stock || product.stock < 1}>
                <ShoppingCart size={20} className="mr-2" /> {!product.stock || product.stock < 1 ? 'Agotado' : 'Añadir al Carrito'}
              </Button>
              <Button variant="outline" size="icon" onClick={handleWishlistToggle} aria-label={isFavorited ? "Quitar de la lista de deseos" : "Añadir a la lista de deseos"}>
                <Heart className={isFavorited ? "text-red-500 fill-current" : ""} size={24} />
              </Button>
            </div>
          )}

          <div className="space-y-3 pt-4 text-sm">
            <div className={`flex items-center ${product.stock && product.stock > 0 ? 'text-green-500' : 'text-destructive'}`}>
              <CheckCircle size={18} className="mr-2" /> 
              {product.stock && product.stock > 0 ? `En Stock: ${product.stock} unidades disponibles` : 'Agotado'}
            </div>
            <div className="flex items-center text-muted-foreground">
              <ShieldCheck size={18} className="mr-2 text-primary" /> Pago Seguro y Garantía
            </div>
            <div className="flex items-center text-muted-foreground">
              <Truck size={18} className="mr-2 text-primary" /> Envío Rápido y Confiable
            </div>
          </div>
        </div>
      </div>

      {relatedProducts.length > 0 && (
        <div className="mt-16">
          <Separator className="my-8"/>
          <h2 className="text-2xl font-headline font-bold mb-6 text-center">También te podría interesar</h2>
          <BestsellerShowcase products={relatedProducts} />
        </div>
      )}
    </div>
  );
}
