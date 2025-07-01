
"use client";
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { categories as allCategories, Product } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '../ui/input';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface FilterPanelProps {
  products: Product[]; 
  onFilterChange: (filters: EnhancedFilters) => void;
  currentCategorySlug?: string; 
}

export interface EnhancedFilters {
  priceRange: [number, number];
  selectedCategories: string[]; 
  searchTerm: string;
  dynamicFilters: Record<string, string[]>; 
}

interface FilterConfig {
  key: string; 
  label: string; 
  valueSource: { type: 'direct'; property: keyof Product } | { type: 'feature'; featureName: string };
  categories: string[]; 
}

// IMPORTANT: This list should ideally be centralized and imported.
// For now, ensure it's consistent with where it's used (e.g., products/page.tsx, categories/[slug]/page.tsx)
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

const extractFeatureValue = (featureString: string, featureName: string): string | null => {
  const prefix = featureName + ': ';
  if (featureString.startsWith(prefix)) {
    return featureString.substring(prefix.length).trim();
  }
  return null;
};

const getDisplayOptionsForFilter = (filterConfig: FilterConfig, productsToScan: Product[]): string[] => {
  const options = new Set<string>();
  productsToScan.forEach(product => {
    let value: string | number | boolean | string[] | undefined | null;
    if (filterConfig.valueSource.type === 'direct') {
      value = product[filterConfig.valueSource.property as keyof Product];
    } else if (filterConfig.valueSource.type === 'feature' && product.features) {
      const featureName = filterConfig.valueSource.featureName;
      product.features.forEach(featureStr => {
        const extracted = extractFeatureValue(featureStr, featureName);
        if (extracted) options.add(extracted);
      });
      return; 
    }

    if (value === undefined || value === null) return; 

    let formattedValue = String(value).trim();

    if (filterConfig.key === 'gpu_vram' || filterConfig.key === 'ram_capacity') {
        if (/^\d+$/.test(formattedValue) && formattedValue) { 
            options.add(formattedValue + "GB");
        } else if (formattedValue && formattedValue.toUpperCase().includes('GB')) { 
            options.add(formattedValue);
        } else if (formattedValue) { // Keep other formats as is
            options.add(formattedValue);
        }
        return; 
    }

    if (filterConfig.key === 'ram_speed') {
      const cleanedValue = String(value).trim();
      if (/^\d+$/.test(cleanedValue) && cleanedValue) { 
        options.add(cleanedValue + "MHz");
      } else { 
        const matchMHz = cleanedValue.match(/^(\d+)\s*(MHZ)$/i);
        const matchMTS = cleanedValue.match(/^(\d+)\s*(MT\/S)$/i);
        if (matchMHz) {
            options.add(matchMHz[1] + "MHz");
        } else if (matchMTS) {
            options.add(matchMTS[1] + "MT/s"); 
        } else if (cleanedValue) { 
            options.add(cleanedValue);
        }
      }
      return;
    }
    
    if (filterConfig.key === 'psu_potencia') {
        const cleanedValue = String(value).trim();
        if (/^\d+$/.test(cleanedValue) && cleanedValue) { 
            options.add(cleanedValue + "W");
        } else if (cleanedValue.toUpperCase().endsWith("W")) { 
            options.add(cleanedValue);
        } else if (cleanedValue) { 
            options.add(cleanedValue);
        }
        return;
    }

    if (filterConfig.key === 'cooling_noise_level') {
        const cleanedValue = String(value).trim();
        if (/^\d+(\.\d+)?$/.test(cleanedValue) && cleanedValue) { // Matches numbers like "25" or "25.5"
            options.add(cleanedValue + "dB");
        } else if (cleanedValue.toUpperCase().endsWith("DB")) {
            options.add(cleanedValue);
        } else if (cleanedValue) {
            options.add(cleanedValue);
        }
        return;
    }
    
    if (typeof value === 'boolean') { 
      options.add(value ? 'Sí' : 'No');
    } else if (Array.isArray(value)) { 
      value.forEach(v => { if(typeof v === 'string' && v.trim() !== '') options.add(v.trim()) });
    } else if (typeof value === 'string' && value.trim() !== '') {
      options.add(value.trim());
    }
  });

  return Array.from(options).sort((a, b) => {
    if (filterConfig.key === 'gpu_vram' || filterConfig.key === 'ram_speed' || filterConfig.key === 'ram_capacity' || filterConfig.key === 'psu_potencia' || filterConfig.key === 'cooling_noise_level') {
        const numA = parseFloat(a); 
        const numB = parseFloat(b);
        if (!isNaN(numA) && !isNaN(numB)) {
            if (numA !== numB) return numA - numB;
        }
    }
    return a.localeCompare(b);
  });
};

const FilterPanelComponent = ({ products, onFilterChange, currentCategorySlug }: FilterPanelProps) => {
  const [currentPriceRange, setCurrentPriceRange] = useState<[number, number]>([0, 1000]);
  const [selectedCategoryFilters, setSelectedCategoryFilters] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [dynamicFilterState, setDynamicFilterState] = useState<Record<string, string[]>>({});

  const derivedPriceBounds = useMemo(() => {
    if (products && products.length > 0) {
      const prices = products.map(p => p.price).filter(p => typeof p === 'number');
      if (prices.length === 0) return { min: 0, max: 1000 };
      const minVal = Math.min(...prices);
      const maxVal = Math.max(...prices);
      return {
        min: Math.floor(minVal / 100) * 100,
        max: Math.ceil(maxVal / 100) * 100 || 1000,
      };
    }
    return { min: 0, max: 1000 };
  }, [products]);

  useEffect(() => {
    setCurrentPriceRange(prevRange => {
      const newMin = derivedPriceBounds.min;
      const newMax = derivedPriceBounds.max;
      if (prevRange[1] < newMin || prevRange[0] > newMax || (prevRange[0] === 0 && prevRange[1] === 1000 && (newMin !== 0 || newMax !== 1000))) {
        return [newMin, newMax];
      }
      return [Math.max(newMin, prevRange[0]), Math.min(newMax, prevRange[1])];
    });
  }, [derivedPriceBounds]);

  const effectiveCategorySlugForSpecificFilters = useMemo(() => {
    if (currentCategorySlug) return currentCategorySlug;
    if (!currentCategorySlug && selectedCategoryFilters.length === 1) {
      const category = allCategories.find(c => c.id === selectedCategoryFilters[0]);
      return category ? category.slug : null;
    }
    return null;
  }, [currentCategorySlug, selectedCategoryFilters]);

  useEffect(() => {
    setDynamicFilterState({}); 
  }, [effectiveCategorySlugForSpecificFilters]);


  useEffect(() => {
    const timeoutId = setTimeout(() => {
      onFilterChange({
        priceRange: currentPriceRange,
        selectedCategories: selectedCategoryFilters,
        searchTerm,
        dynamicFilters: dynamicFilterState
      });
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [currentPriceRange, selectedCategoryFilters, searchTerm, dynamicFilterState, onFilterChange]);

  const handlePriceChange = (value: number[]) => {
    setCurrentPriceRange(value as [number, number]);
  };

  const handleCategoryFilterChange = (categoryId: string) => {
    setSelectedCategoryFilters(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [categoryId] 
    );
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleDynamicFilterChange = (filterKey: string, optionValue: string, isChecked: boolean) => {
    setDynamicFilterState(prev => {
      const currentOptions = prev[filterKey] || [];
      if (isChecked) {
        return { ...prev, [filterKey]: [...currentOptions, optionValue] };
      } else {
        return { ...prev, [filterKey]: currentOptions.filter(opt => opt !== optionValue) };
      }
    });
  };
  
  const clearFilters = () => {
    setCurrentPriceRange([derivedPriceBounds.min, derivedPriceBounds.max]);
    if (!currentCategorySlug) { 
        setSelectedCategoryFilters([]);
    }
    setSearchTerm('');
    setDynamicFilterState({});
  };
  
  const applicableSpecificFilters = useMemo(() => {
    if (!effectiveCategorySlugForSpecificFilters) {
        return ALL_FILTER_CONFIGS.filter(fc => fc.categories.includes('all')); 
    }
    return ALL_FILTER_CONFIGS.filter(fc => 
      fc.categories.includes(effectiveCategorySlugForSpecificFilters) || fc.categories.includes('all')
    );
  }, [effectiveCategorySlugForSpecificFilters]);

  const productsToUseForDerivingOptions = useMemo(() => {
    if (!products) return [];
    if (currentCategorySlug) return products; 
    if (selectedCategoryFilters.length === 1) { 
      const selectedCatObj = allCategories.find(cat => cat.id === selectedCategoryFilters[0]);
      if (selectedCatObj) {
        return products.filter(p => p.categorySlug === selectedCatObj.slug);
      }
    }
    return products; 
  }, [products, currentCategorySlug, selectedCategoryFilters]);

  const derivedFilterOptions = useMemo(() => {
    const allOptions: Record<string, string[]> = {};
    if (applicableSpecificFilters.length > 0 && productsToUseForDerivingOptions.length > 0) {
      applicableSpecificFilters.forEach(filterConfig => {
        allOptions[filterConfig.key] = getDisplayOptionsForFilter(filterConfig, productsToUseForDerivingOptions);
      });
    }
    return allOptions;
  }, [applicableSpecificFilters, productsToUseForDerivingOptions]);

  const defaultAccordionOpenValues = useMemo(() => {
    let openValues: string[] = [];
    if (applicableSpecificFilters.length > 0) {
      openValues = openValues.concat(applicableSpecificFilters.map(fc => fc.key));
    }
    if (!currentCategorySlug) { 
        openValues.push("categories-filter");
    }
    return openValues; 
  }, [applicableSpecificFilters, currentCategorySlug]);
  
  const makeCheckboxId = (filterKey: string, optionText: string) => {
    const sanitizedOption = optionText.replace(/[^a-zA-Z0-9-_./]/g, '').replace(/\s+/g, '-');
    return `filter-${filterKey}-${sanitizedOption || 'empty_option'}`;
  };


  return (
    <Card className="sticky top-20">
      <CardHeader>
        <CardTitle className="text-xl font-headline">Filtros</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label htmlFor="search-filter" className="text-base font-medium mb-2 block">Buscar</Label>
          <Input
            id="search-filter"
            type="text"
            placeholder="Buscar por nombre..."
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </div>
        <div>
          <Label htmlFor="price-range" className="text-base font-medium">Rango de Precio</Label>
          <div className="mt-2">
            <Slider
              id="price-range"
              min={derivedPriceBounds.min}
              max={derivedPriceBounds.max}
              step={10}
              value={currentPriceRange}
              onValueChange={handlePriceChange}
              className="my-4"
              disabled={!products || products.length === 0}
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>S/{currentPriceRange[0]}</span>
              <span>S/{currentPriceRange[1]}</span>
            </div>
          </div>
        </div>

        {!currentCategorySlug && ( 
          <div>
            <Accordion type="single" collapsible className="w-full" defaultValue='categories-filter'>
              <AccordionItem value="categories-filter">
                 <AccordionTrigger className="text-base py-2">Seleccionar Categoría</AccordionTrigger>
                 <AccordionContent>
                    <div className="space-y-2 max-h-60 overflow-y-auto pt-2">
                      {allCategories.map(category => (
                        <div key={category.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`panel-category-${category.id}`}
                            checked={selectedCategoryFilters.includes(category.id)}
                            onCheckedChange={() => handleCategoryFilterChange(category.id)}
                          />
                          <Label htmlFor={`panel-category-${category.id}`} className="font-normal cursor-pointer">{category.name}</Label>
                        </div>
                      ))}
                    </div>
                 </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        )}
        
        {applicableSpecificFilters.length > 0 && (
          <Accordion type="multiple" className="w-full space-y-2" defaultValue={defaultAccordionOpenValues} key={effectiveCategorySlugForSpecificFilters}>
            {applicableSpecificFilters.map(filterConfig => {
              const options = derivedFilterOptions[filterConfig.key] || [];
              if (options.length === 0) return null;
              
              return (
                <AccordionItem value={filterConfig.key} key={filterConfig.key}>
                  <AccordionTrigger className="text-base py-2">{filterConfig.label}</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2 max-h-60 overflow-y-auto pt-2">
                      {options.map(option => {
                        const checkboxId = makeCheckboxId(filterConfig.key, option);
                        return (
                          <div key={checkboxId} className="flex items-center space-x-2">
                            <Checkbox
                              id={checkboxId} 
                              checked={(dynamicFilterState[filterConfig.key] || []).includes(option)}
                              onCheckedChange={(checked) => handleDynamicFilterChange(filterConfig.key, option, !!checked)}
                            />
                            <Label htmlFor={checkboxId} className="font-normal cursor-pointer">{option}</Label>
                          </div>
                        );
                      })}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        )}

        <Button onClick={clearFilters} variant="outline" className="w-full">Limpiar Filtros</Button>
      </CardContent>
    </Card>
  );
}

export default FilterPanelComponent;
