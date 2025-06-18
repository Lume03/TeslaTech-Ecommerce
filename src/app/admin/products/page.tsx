
"use client";
import { useEffect, useState, useMemo } from 'react';
import { Product, getAllProductsFromDB, categories } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, Edit, Trash2, Loader2, Search, Filter } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { deleteProduct } from './actions';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"; // Asumiendo que este es un componente simple

export default function AdminProductsPage() {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [productsMatchingFilters, setProductsMatchingFilters] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<Product | null>(null);

  const [itemsPerPage, setItemsPerPage] = useState<number>(20);
  const [currentPage, setCurrentPage] = useState<number>(1);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      const prods = await getAllProductsFromDB();
      setAllProducts(prods);
      setLoading(false);
    };
    fetchProducts();
  }, []);

  useEffect(() => {
    let tempProducts = allProducts;
    if (searchTerm) {
      tempProducts = tempProducts.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.brand && p.brand.toLowerCase().includes(searchTerm.toLowerCase())) ||
        p.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (selectedCategory !== 'all') {
      tempProducts = tempProducts.filter(p => p.categorySlug === selectedCategory);
    }
    setProductsMatchingFilters(tempProducts);
    setCurrentPage(1); // Reset a la página 1 cuando cambian los filtros
  }, [searchTerm, selectedCategory, allProducts]);

  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return productsMatchingFilters.slice(startIndex, endIndex);
  }, [productsMatchingFilters, currentPage, itemsPerPage]);

  const totalPages = useMemo(() => {
    return Math.ceil(productsMatchingFilters.length / itemsPerPage);
  }, [productsMatchingFilters, itemsPerPage]);

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number(value));
    setCurrentPage(1); 
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleDeleteConfirmation = (product: Product) => {
    setShowDeleteConfirm(product);
  };

  const executeDeleteProduct = async () => {
    if (!showDeleteConfirm) return;
    setIsDeleting(showDeleteConfirm.id);

    const result = await deleteProduct(showDeleteConfirm.id);

    if (result.success) {
      // Refetch or update allProducts and productsMatchingFilters accordingly
      const newAllProducts = allProducts.filter(p => p.id !== showDeleteConfirm.id);
      setAllProducts(newAllProducts);
      // The useEffect for productsMatchingFilters will re-run and update it
      toast({ title: "Producto Eliminado", description: `El producto "${showDeleteConfirm.name}" ha sido eliminado.` });
    } else {
      toast({ title: "Error al Eliminar", description: result.error || `No se pudo eliminar el producto "${showDeleteConfirm.name}".`, variant: "destructive" });
    }
    setIsDeleting(null);
    setShowDeleteConfirm(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-2xl font-headline font-bold">Gestión de Productos</h1>
        <Link href="/admin/products/new" passHref>
          <Button>
            <PlusCircle className="mr-2 h-5 w-5" /> Añadir Nuevo Producto
          </Button>
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center p-4 bg-card rounded-lg shadow">
        <div className="relative flex-grow w-full sm:w-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input 
            placeholder="Buscar por nombre, marca, ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="h-5 w-5 text-muted-foreground" />
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filtrar por categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las Categorías</SelectItem>
              {categories.map(cat => (
                <SelectItem key={cat.slug} value={cat.slug}>{cat.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label htmlFor="itemsPerPageSelect" className="text-sm text-muted-foreground whitespace-nowrap">Items por pág:</label>
          <Select value={String(itemsPerPage)} onValueChange={handleItemsPerPageChange}>
            <SelectTrigger id="itemsPerPageSelect" className="w-full sm:w-[100px]">
              <SelectValue placeholder="Items" />
            </SelectTrigger>
            <SelectContent>
              {[10, 20, 50, 100].map(val => (
                <SelectItem key={val} value={String(val)}>{val}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-lg border shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px] hidden sm:table-cell">Imagen</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead className="hidden md:table-cell">Marca</TableHead>
              <TableHead className="text-right">Precio</TableHead>
              <TableHead className="text-center">Stock</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedProducts.length > 0 ? paginatedProducts.map((product) => (
              <TableRow key={product.id}>
                <TableCell className="hidden sm:table-cell">
                  <Image 
                    src={product.image || "https://placehold.co/60x60.png"} 
                    alt={product.name} 
                    width={60} 
                    height={60} 
                    className="rounded-md object-cover"
                    data-ai-hint={`${product.categorySlug || 'product'} small`}
                    unoptimized // <-- CAMBIO AÑADIDO
                  />
                </TableCell>
                <TableCell className="font-medium max-w-[200px] truncate" title={product.name}>
                  <Link href={`/products/${product.id}`} className="hover:underline" target="_blank">{product.name}</Link>
                  <div className="text-xs text-muted-foreground">ID: {product.id}</div>
                </TableCell>
                <TableCell>{product.category}</TableCell>
                <TableCell className="hidden md:table-cell">{product.brand || 'N/A'}</TableCell>
                <TableCell className="text-right">
                  {typeof product.price === 'number' ? `S/${product.price.toFixed(2)}` : 'S/ --.--'}
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant={typeof product.stock === 'number' && product.stock > 10 ? 'default' : typeof product.stock === 'number' && product.stock > 0 ? 'secondary' : 'destructive'}>
                    {typeof product.stock === 'number' ? product.stock : 'N/A'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Link href={`/admin/products/edit/${product.id}`} passHref>
                      <Button variant="outline" size="icon">
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Editar</span>
                      </Button>
                    </Link>
                    <Button 
                      variant="destructive" 
                      size="icon" 
                      onClick={() => handleDeleteConfirmation(product)}
                      disabled={isDeleting === product.id}
                    >
                      {isDeleting === product.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                      <span className="sr-only">Eliminar</span>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  No se encontraron productos con los filtros actuales.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-4">
        <p className="text-sm text-muted-foreground">
          Mostrando {paginatedProducts.length > 0 ? ((currentPage - 1) * itemsPerPage) + 1 : 0}-
          {Math.min(currentPage * itemsPerPage, productsMatchingFilters.length)} de {productsMatchingFilters.length} productos.
          (Total {allProducts.length} en base de datos)
        </p>
        {totalPages > 1 && (
           <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => handlePageChange(currentPage - 1)}
                  // disabled={currentPage === 1} // Pagination component should handle this
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : undefined}
                />
              </PaginationItem>
              {/* Simple page indicator, could be expanded */}
              <PaginationItem>
                <span className="px-4 py-2 text-sm">Página {currentPage} de {totalPages}</span>
              </PaginationItem>
              <PaginationItem>
                <PaginationNext
                  onClick={() => handlePageChange(currentPage + 1)}
                  // disabled={currentPage === totalPages} // Pagination component should handle this
                  className={currentPage === totalPages ? "pointer-events-none opacity-50" : undefined}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </div>

      {showDeleteConfirm && (
        <AlertDialog open={!!showDeleteConfirm} onOpenChange={() => setShowDeleteConfirm(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer. Esto eliminará permanentemente el producto "{showDeleteConfirm.name}".
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setShowDeleteConfirm(null)}>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={executeDeleteProduct}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={isDeleting === showDeleteConfirm.id}
              >
                {isDeleting === showDeleteConfirm.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Sí, eliminar producto
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}

    