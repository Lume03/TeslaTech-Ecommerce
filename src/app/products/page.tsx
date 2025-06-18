
"use client";
import { useState, useEffect, useMemo, useCallback } from 'react';
import ProductGrid from '@/components/products/ProductGrid';
import FilterPanel, { EnhancedFilters } from '@/components/products/FilterPanel';
import { Product, categories as productCategories, getAllProductsFromDB } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { SlidersHorizontal, Loader2 } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton'; 

// Centralized filter configuration (ensure it's accurate for your data)
// THIS SHOULD IDEALLY BE IMPORTED FROM A SHARED LOCATION if FilterPanel also needs it.
// For now, ensuring it's the same as in FilterPanel.
interface FilterConfig {
  key: string;
  label: string;
  valueSource: { type: 'direct'; property: keyof Product } | { type: 'feature'; featureName: string };
  categories: string[]; 
}
const ALL_FILTER_CONFIGS: FilterConfig[] = [
  { key: 'processor_brand', label: 'Marca CPU', valueSource: { type: 'direct', property: 'processor_brand' }, categories: ['processors'] },
  { key: 'processor_socket', label: 'Socket CPU', valueSource: { type: 'direct', property: 'processor_socket' }, categories: ['processors'] },
  { key: 'gpu_brand', label: 'Marca Tarjeta', valueSource: { type: 'direct', property: 'gpu_brand' }, categories: ['graphics-cards'] },
  { key: 'gpu_chipset', label: 'Chipset GPU', valueSource: { type: 'direct', property: 'gpuChipset' }, categories: ['graphics-cards'] },
  { key: 'gpu_vram', label: 'VRAM', valueSource: { type: 'direct', property: 'gpu_vram' }, categories: ['graphics-cards'] },
  { key: 'motherboard_brand', label: 'Marca Placa', valueSource: { type: 'direct', property: 'mobo_brand' }, categories: ['motherboards'] },
  { key: 'motherboard_socket', label: 'Socket Placa', valueSource: { type: 'direct', property: 'mobo_socket' }, categories: ['motherboards'] },
  { key: 'motherboard_ram_type', label: 'Tipo de RAM (Placa)', valueSource: { type: 'direct', property: 'mobo_ram_type' }, categories: ['motherboards'] },
  { key: 'ram_brand', label: 'Marca RAM', valueSource: { type: 'direct', property: 'ram_brand' }, categories: ['memory'] },
  { key: 'ram_type', label: 'Tipo RAM', valueSource: { type: 'direct', property: 'ram_type' }, categories: ['memory'] },
  { key: 'ram_capacity', label: 'Capacidad RAM', valueSource: { type: 'direct', property: 'ram_capacity' }, categories: ['memory'] },
  { key: 'ram_speed', label: 'Velocidad RAM', valueSource: { type: 'direct', property: 'ram_speed' }, categories: ['memory'] },
  { key: 'storage_brand', label: 'Marca Almacenamiento', valueSource: { type: 'direct', property: 'storage_brand' }, categories: ['storage'] },
  { key: 'storage_type', label: 'Tipo Almacenamiento', valueSource: { type: 'direct', property: 'storage_type' }, categories: ['storage'] },
  { key: 'storage_capacity', label: 'Capacidad Almacenamiento', valueSource: { type: 'direct', property: 'storage_capacity' }, categories: ['storage'] },
  { key: 'psu_brand', label: 'Marca PSU', valueSource: { type: 'direct', property: 'psu_brand' }, categories: ['power-supplies'] },
  { key: 'psu_certification', label: 'Certificación PSU', valueSource: { type: 'direct', property: 'psu_certification' }, categories: ['power-supplies'] },
  { key: 'psu_potencia', label: 'Potencia PSU', valueSource: { type: 'direct', property: 'psu_power' }, categories: ['power-supplies'] },
  { key: 'case_brand', label: 'Marca Gabinete', valueSource: { type: 'direct', property: 'case_brand' }, categories: ['cases'] },
  { key: 'case_mobo_support', label: 'Soporte MB (Gabinete)', valueSource: { type: 'direct', property: 'case_mobo_support' }, categories: ['cases'] },
  { key: 'cooling_brand', label: 'Marca Refrigeración', valueSource: { type: 'direct', property: 'cooling_brand' }, categories: ['refrigeracion'] },
  { key: 'cooling_type', label: 'Tipo Refrigeración', valueSource: { type: 'direct', property: 'cooling_size' }, categories: ['refrigeracion'] }, 
  { key: 'cooling_illumination', label: 'Iluminación (Refrigeración)', valueSource: { type: 'direct', property: 'cooling_illumination' }, categories: ['refrigeracion'] },
  { key: 'cooling_noise_level', label: 'Nivel de Ruido', valueSource: { type: 'direct', property: 'cooling_noise_level' }, categories: ['refrigeracion'] },
];

const extractFeatureValueFromProduct = (productFeature: string, featureName: string): string | null => {
  const prefix = featureName + ': ';
  if (productFeature.startsWith(prefix)) {
    return productFeature.substring(prefix.length).trim();
  }
  return null;
};

export default function ProductsPage() {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [initialMaxPrice, setInitialMaxPrice] = useState(1000);
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoadingProducts(true);
      const productsFromDB = await getAllProductsFromDB();
      setAllProducts(productsFromDB);
      if (productsFromDB.length > 0) {
        const prices = productsFromDB.map(p => p.price).filter(p => typeof p === 'number');
        if (prices.length > 0) {
          const max = Math.max(...prices);
          setInitialMaxPrice(Math.ceil(max / 100) * 100 || 1000);
        } else {
          setInitialMaxPrice(1000);
        }
      } else {
        setInitialMaxPrice(1000);
      }
      setLoadingProducts(false);
    };
    fetchProducts();
  }, []);

  const [currentFilters, setCurrentFilters] = useState<EnhancedFilters>({
    priceRange: [0, initialMaxPrice],
    selectedCategories: [], 
    searchTerm: '',
    dynamicFilters: {},
  });

  useEffect(() => {
    setCurrentFilters(prev => ({ 
        ...prev, 
        priceRange: [prev.priceRange[0] > initialMaxPrice ? 0 : prev.priceRange[0] , initialMaxPrice],
        dynamicFilters: {} // Reset dynamic filters when products/max price changes
    }));
  }, [initialMaxPrice]);

  const handleFilterChange = useCallback((newFilters: EnhancedFilters) => {
    setCurrentFilters(newFilters);
  }, []);
  
  const filteredProducts = useMemo(() => {
    if (loadingProducts) return []; 
    let tempProducts = allProducts;

    if (currentFilters.searchTerm) {
      tempProducts = tempProducts.filter(product =>
        product.name.toLowerCase().includes(currentFilters.searchTerm.toLowerCase()) ||
        product.brand?.toLowerCase().includes(currentFilters.searchTerm.toLowerCase())
      );
    }

    tempProducts = tempProducts.filter(product =>
      product.price >= currentFilters.priceRange[0] && product.price <= currentFilters.priceRange[1]
    );

    if (currentFilters.selectedCategories.length > 0) {
      const selectedCategorySlugs = currentFilters.selectedCategories.map(catId => {
        const cat = productCategories.find(c => c.id === catId);
        return cat ? cat.slug : '';
      }).filter(slug => slug !== '');

      tempProducts = tempProducts.filter(product =>
        selectedCategorySlugs.includes(product.categorySlug) 
      );
    }
    
    if (currentFilters.dynamicFilters && Object.keys(currentFilters.dynamicFilters).length > 0) {
      tempProducts = tempProducts.filter(product => {
        return Object.entries(currentFilters.dynamicFilters).every(([filterKey, selectedOptions]) => {
          if (!selectedOptions || selectedOptions.length === 0) return true;
          
          const filterConfig = ALL_FILTER_CONFIGS.find(fc => fc.key === filterKey);
          if (!filterConfig) return true; 

          let productValueRaw: any;
          if (filterConfig.valueSource.type === 'direct') {
            productValueRaw = product[filterConfig.valueSource.property as keyof Product];
          } else if (filterConfig.valueSource.type === 'feature' && product.features) {
            const featureName = filterConfig.valueSource.featureName;
            const foundFeature = product.features.find(f => f.startsWith(featureName + ':'));
            if (foundFeature) {
              productValueRaw = extractFeatureValueFromProduct(foundFeature, featureName);
            }
          }

          if (productValueRaw === undefined || productValueRaw === null) return false; 
          
          const productValueStr = String(productValueRaw).trim();

          if (filterKey === 'gpu_vram') {
            return selectedOptions.some(opt => { 
              const optTrimmed = opt.trim(); 
              if (optTrimmed === productValueStr) return true;
              const optMatch = optTrimmed.match(/^(\d+)GB$/i);
              if (optMatch && optMatch[1] === productValueStr) return true;
              return false;
            });
          }

          if (filterKey === 'ram_speed') {
            return selectedOptions.some(opt => {
              const optTrimmed = opt.trim().toUpperCase(); 
              const productValueNormalized = productValueStr.toUpperCase(); 
              if (productValueNormalized === optTrimmed) return true; 
              const optNumericMatch = optTrimmed.match(/^(\d+)(MHZ|MT\/S)$/); 
              const productNumericOnly = productValueNormalized.match(/^(\d+)$/);
              if (optNumericMatch && productNumericOnly && optNumericMatch[1] === productNumericOnly[1]) return true; 
              return false;
            });
          }

          if (filterKey === 'ram_capacity') {
            return selectedOptions.some(opt => {
                const optTrimmed = opt.trim().toUpperCase(); 
                const productValueNormalized = productValueStr.toUpperCase(); 
                if (productValueNormalized.includes(optTrimmed)) return true;
                const optNumericMatch = optTrimmed.match(/^(\d+)GB$/);
                const productNumericOnly = productValueNormalized.match(/^(\d+)$/);
                if (optNumericMatch && productNumericOnly && optNumericMatch[1] === productNumericOnly[1]) return true;
                return false;
            });
          }
          
          if (filterKey === 'psu_potencia') {
            return selectedOptions.some(opt => {
                const optTrimmed = opt.trim().toUpperCase(); 
                const productValueNormalized = productValueStr.toUpperCase(); 
                if (productValueNormalized === optTrimmed) return true; 
                const optNumericMatch = optTrimmed.match(/^(\d+)W$/); 
                const productNumericOnly = productValueNormalized.match(/^(\d+)$/);
                if (optNumericMatch && productNumericOnly && optNumericMatch[1] === productNumericOnly[1]) return true;
                return false;
            });
          }

          if (filterKey === 'cooling_noise_level') {
            return selectedOptions.some(opt => {
                const optTrimmed = opt.trim().toUpperCase(); // e.g., "25DB"
                const productValueNormalized = productValueStr.toUpperCase(); // e.g., "25", "25DB", "25.5DB"
                if (productValueNormalized === optTrimmed) return true;
                const optNumericMatch = optTrimmed.match(/^(\d+(\.\d+)?)DB$/); // "25DB" -> "25", "25.5DB" -> "25.5"
                const productNumericOnly = productValueNormalized.match(/^(\d+(\.\d+)?)$/);
                if (optNumericMatch && productNumericOnly && optNumericMatch[1] === productNumericOnly[1]) return true;
                return false;
            });
          }
          
          // General comparison logic for other filters
          const valueToCheck = Array.isArray(productValueRaw) 
            ? productValueRaw.map(val => String(val).trim()) 
            : typeof productValueRaw === 'boolean' 
              ? [productValueRaw ? 'Sí' : 'No'] 
              : [productValueStr];
              
          return selectedOptions.some(opt => valueToCheck.includes(opt.trim()));
        });
      });
    }
    return tempProducts;
  }, [currentFilters, allProducts, loadingProducts]); 
  
  const filterPanelComponent = useMemo(() => (
    <FilterPanel products={allProducts} onFilterChange={handleFilterChange} />
  ), [allProducts, handleFilterChange]); 

  const ProductGridSkeleton = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="space-y-3">
          <Skeleton className="h-[200px] sm:h-[250px] w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-headline font-bold">Todos los Productos</h1>
        <div className="md:hidden">
          <Sheet open={isFilterSheetOpen} onOpenChange={setIsFilterSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" disabled={loadingProducts}>
                <SlidersHorizontal className="h-5 w-5" />
                <span className="sr-only">Abrir Filtros</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] overflow-y-auto p-0">
              <div className="p-4 border-b">
                <h3 className="text-lg font-headline font-semibold">Filtros</h3>
              </div>
              <div className="p-4">
                {loadingProducts ? <Loader2 className="mx-auto h-8 w-8 animate-spin" /> : filterPanelComponent}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row gap-8">
        <aside className="hidden md:block md:w-1/4 lg:w-1/5">
          {loadingProducts ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : filterPanelComponent}
        </aside>
        <main className="md:w-3/4 lg:w-4/5">
          {loadingProducts ? <ProductGridSkeleton /> : <ProductGrid products={filteredProducts} />}
        </main>
      </div>
    </div>
  );
}
    
