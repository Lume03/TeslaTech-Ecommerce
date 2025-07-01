import Link from 'next/link';
import { categories } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, Package } from 'lucide-react'; // Using Package icon as a generic category icon

export default function CategoriesPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-headline font-bold mb-10 text-center">Categorías de Productos</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {categories.map(category => (
          <Link key={category.id} href={`/categories/${category.slug}`} passHref>
            <Card className="group h-full overflow-hidden rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out hover:border-primary transform hover:scale-[1.02] flex flex-col items-center justify-center p-6 text-center cursor-pointer">
              <CardHeader className="p-2">
                <Package size={48} className="mx-auto text-primary mb-4 group-hover:scale-110 transition-transform" />
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
    </div>
  );
}
