import ProductForm from '@/app/admin/products/components/ProductForm';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Product } from '@/lib/data';
import { getFirestoreAdmin } from '@/lib/firebase/admin';
import { notFound } from 'next/navigation';

export default async function Page({ params }: { params: any }) {
  const { id } = params;
  
  const firestore = getFirestoreAdmin();
  const productDoc = await firestore.collection('products').doc(id).get();

  if (!productDoc.exists) {
    notFound();
  }

  const product = { id: productDoc.id, ...productDoc.data() } as Product;

  const plainProduct: Product = JSON.parse(JSON.stringify(product));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/products" passHref>
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-headline font-bold">Editar Producto</h1>
          <p className="text-muted-foreground">
            Modifica los detalles del producto.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Información del Producto: {plainProduct.name}</CardTitle>
          <CardDescription>Actualiza los detalles necesarios.</CardDescription>
        </CardHeader>
        <CardContent>
          <ProductForm
            initialData={plainProduct}
            productId={id}
            isEditing={true}
          />
        </CardContent>
      </Card>
    </div>
  );
}
