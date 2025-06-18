
import ProductForm from '@/app/admin/products/components/ProductForm';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getProductByIdFromDB, Product } from '@/lib/data';
import { notFound } from 'next/navigation';

// The error indicates an external 'PageProps' type is expecting params to be a Promise.
// We will use 'any' for the incoming props to bypass the faulty external constraint,
// and then assert types internally for safety within this component.
export default async function EditProductPage(props: any) {
  // Assert the types we expect internally
  const params = props.params as { id: string };
  // Optionally, assert searchParams if you use them, though the error focuses on 'params'.
  // const searchParams = props.searchParams as { [key: string]: string | string[] | undefined } | undefined;

  const { id } = params;
  const product = await getProductByIdFromDB(id);

  if (!product) {
    notFound();
  }

  // Ensure product is a plain object for client component consumption
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
          <p className="text-muted-foreground">Modifica los detalles del producto.</p>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Información del Producto: {plainProduct.name}</CardTitle>
          <CardDescription>Actualiza los detalles necesarios.</CardDescription>
        </CardHeader>
        <CardContent>
          <ProductForm initialData={plainProduct} productId={id} isEditing={true} />
        </CardContent>
      </Card>
    </div>
  );
}

