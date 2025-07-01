
"use client";

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { categories, Product } from '@/lib/data';
import { createProduct, updateProduct } from '@/app/admin/products/actions';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Loader2, Save, UploadCloud, Trash2, LinkIcon } from 'lucide-react';
import type { FormEvent } from 'react';
import { useEffect, useState, useRef, useMemo } from 'react';
import Image from 'next/image';
import { storage, auth, configComplete } from '@/lib/firebase/config';
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { Form, FormControl, FormField, FormItem, FormLabel, FormDescription, FormMessage } from '@/components/ui/form';

const GPU_BRANDS_OPTIONS = ['ASUS', 'GigaByte', 'MSI', 'EVGA'] as const;
const RAM_BRANDS_OPTIONS = ['Corsair', 'Kingston', 'G.Skill', 'Crucial'] as const;
const RAM_TYPES_OPTIONS = ['DDR4', 'DDR5'] as const;
const RAM_FORMATS_OPTIONS = ['DIMM', 'SODIMM'] as const;
const MOBO_BRANDS_OPTIONS = ['Asus', 'GigaByte', 'ASRock', 'MSI'] as const;
const MOBO_SOCKETS_OPTIONS = ['LGA1700', 'AM4', 'AM5'] as const;
const MOBO_RAM_TYPES_OPTIONS = ['DDR4', 'DDR5'] as const;
const STORAGE_BRANDS_OPTIONS = ['Seagate', 'Western Digital', 'Crucial', 'Samsung', 'Kingston', 'ADATA'] as const;
const STORAGE_TYPES_OPTIONS = ['HDD', 'SSD', 'NVMe M.2'] as const;
const PROCESSOR_BRANDS_OPTIONS = ['Intel', 'AMD'] as const;
const PROCESSOR_SOCKETS_OPTIONS = ['LGA1700', 'AM4', 'AM5'] as const;
const CASE_BRANDS_OPTIONS = ['NZXT', 'Cooler Master', 'Thermaltake', 'Lian Li', 'Corsair', 'Hyte', 'Phanteks', 'Asus', 'DeepCool'] as const;
const CASE_COLORS_OPTIONS = ['Blanco', 'Negro'] as const;
const CASE_MOBO_SUPPORTS_OPTIONS = ['ATX/Micro-ATX/ITX', 'Micro-ATX', 'ATX', 'Micro-ATX/ATX', 'Mini-ITX', 'Micro-ATX/Mini-ITX'] as const;


const COOLING_BRANDS_OPTIONS = ['Noctua', 'Cooler Master', 'Corsair', 'NZXT'] as const;
const COOLING_SIZES_OPTIONS = ['120mm', '240mm', '360mm'] as const;
const COOLING_ILLUMINATION_OPTIONS = ['ARGB', 'RGB', 'Sin RGB'] as const;

const PSU_BRANDS_OPTIONS = ['Corsair', 'Antec', 'EVGA', 'Cooler Master', 'XPG', 'GigaByte', 'Asus', 'Seasonic', 'NZXT', 'Thermaltake'] as const;
const PSU_CERTIFICATIONS_OPTIONS = ['80 PLUS Bronze', '80 PLUS Gold', '80 PLUS Platinum', '80 PLUS Titanium'] as const;
const PSU_FORMATS_OPTIONS = ['ATX', 'Micro ATX'] as const;

// Base Zod schema for client-side
const productFormSchemaBase = z.object({
  name: z.string().min(3, { message: "El nombre debe tener al menos 3 caracteres." }).max(100),
  description: z.string().min(10, { message: "La descripción debe tener al menos 10 caracteres." }).max(1000),
  price: z.coerce.number().min(0.01, { message: "El precio debe ser mayor a 0." }),
  stock: z.coerce.number().int().min(0, { message: "El stock no puede ser negativo." }),
  category: z.string().min(1, { message: "Debes seleccionar una categoría." }),
  categorySlug: z.string().optional(), // Added optional categorySlug
  brand: z.string().optional().nullable(), // Marca general
  isBestseller: z.boolean().default(false),
  rating: z.coerce.number().min(0).max(5).optional().nullable(),
  image: z.string().url({ message: "Debe ser una URL válida para la imagen." }).optional().or(z.literal('')).nullable(),
  features: z.string().optional().nullable(),
  data_ai_hint: z.string().optional().nullable(),

  // Tarjetas Gráficas
  gpu_brand: z.enum(GPU_BRANDS_OPTIONS).optional().nullable(),
  gpu_vram: z.string().optional().nullable(),
  gpuChipset: z.enum(['NVIDIA', 'AMD']).optional().nullable(),

  // Memoria RAM
  ram_brand: z.enum(RAM_BRANDS_OPTIONS).optional().nullable(),
  ram_type: z.enum(RAM_TYPES_OPTIONS).optional().nullable(),
  ram_format: z.enum(RAM_FORMATS_OPTIONS).optional().nullable(),
  ram_capacity: z.string().optional().nullable(),
  ram_speed: z.string().optional().nullable(),

  // Placas Madre
  mobo_brand: z.enum(MOBO_BRANDS_OPTIONS).optional().nullable(),
  mobo_socket: z.enum(MOBO_SOCKETS_OPTIONS).optional().nullable(),
  mobo_ram_type: z.enum(MOBO_RAM_TYPES_OPTIONS).optional().nullable(),
  mobo_wifi_bluetooth: z.boolean().optional().nullable().default(false),
  mobo_argb_compatible: z.boolean().optional().nullable().default(false),

  // Almacenamiento
  storage_type: z.enum(STORAGE_TYPES_OPTIONS).optional().nullable(),
  storage_capacity: z.string().optional().nullable(),
  storage_brand: z.enum(STORAGE_BRANDS_OPTIONS).optional().nullable(),
  storage_speed: z.string().optional().nullable(),

  // Procesadores
  processor_brand: z.enum(PROCESSOR_BRANDS_OPTIONS).optional().nullable(),
  processor_socket: z.enum(PROCESSOR_SOCKETS_OPTIONS).optional().nullable(),
  processor_cores: z.string().optional().nullable(),
  processor_threads: z.string().optional().nullable(),

  // Gabinetes (Case)
  case_brand: z.enum(CASE_BRANDS_OPTIONS).optional().nullable(),
  case_color: z.enum(CASE_COLORS_OPTIONS).optional().nullable(),
  case_mobo_support: z.enum(CASE_MOBO_SUPPORTS_OPTIONS).optional().nullable(),

  // Refrigeración (Cooling)
  cooling_brand: z.enum(COOLING_BRANDS_OPTIONS).optional().nullable(),
  cooling_size: z.enum(COOLING_SIZES_OPTIONS).optional().nullable(),
  cooling_illumination: z.enum(COOLING_ILLUMINATION_OPTIONS).optional().nullable(),
  cooling_noise_level: z.string().optional().nullable(),

  // Fuentes de Poder (PSU)
  psu_brand: z.enum(PSU_BRANDS_OPTIONS).optional().nullable(),
  psu_certification: z.enum(PSU_CERTIFICATIONS_OPTIONS).optional().nullable(),
  psu_format: z.enum(PSU_FORMATS_OPTIONS).optional().nullable(),
  psu_power: z.string().optional().nullable(),
});

// Refined schema with conditional validation
const productFormSchema = productFormSchemaBase.superRefine((data, ctx) => {
    const categoryDetail = categories.find(c => c.name === data.category);

    if (categoryDetail?.slug === 'graphics-cards') {
        if (!data.gpu_brand) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Marca de la tarjeta gráfica es requerida.", path: ['gpu_brand'] });
        if (!data.gpu_vram?.trim()) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "VRAM es requerida y no puede estar vacía.", path: ['gpu_vram'] });
        if (!data.gpuChipset) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Chipset GPU es requerido.", path: ['gpuChipset'] });
    }
    if (categoryDetail?.slug === 'memory') {
        if (!data.ram_brand) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Marca de la RAM es requerida.", path: ['ram_brand'] });
        if (!data.ram_type) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Tipo de RAM es requerido.", path: ['ram_type'] });
        if (!data.ram_format) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Formato de RAM es requerido.", path: ['ram_format'] });
        if (!data.ram_capacity?.trim()) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Capacidad de RAM es requerida y no puede estar vacía.", path: ['ram_capacity'] });
        if (!data.ram_speed?.trim()) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Velocidad de RAM es requerida y no puede estar vacía.", path: ['ram_speed'] });
    }
    if (categoryDetail?.slug === 'motherboards') {
        if (!data.mobo_brand) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Marca de la placa madre es requerida.", path: ['mobo_brand'] });
        if (!data.mobo_socket) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Socket es requerido.", path: ['mobo_socket'] });
        if (!data.mobo_ram_type) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Tipo de RAM soportado es requerido.", path: ['mobo_ram_type'] });
    }
    if (categoryDetail?.slug === 'storage') {
        if (!data.storage_type) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Tipo de almacenamiento es requerido.", path: ['storage_type']});
        if (!data.storage_capacity?.trim()) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Capacidad es requerida y no puede estar vacía.", path: ['storage_capacity']});
        if (!data.storage_brand) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Marca es requerida.", path: ['storage_brand']});
        if (!data.storage_speed?.trim()) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Velocidad es requerida y no puede estar vacía.", path: ['storage_speed']});
    }
    if (categoryDetail?.slug === 'processors') {
        if (!data.processor_brand) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Marca es requerida.", path: ['processor_brand']});
        if (!data.processor_socket) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Socket es requerido.", path: ['processor_socket']});
        if (!data.processor_cores?.trim()) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Núcleos son requeridos y no puede estar vacío.", path: ['processor_cores']});
        if (!data.processor_threads?.trim()) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Hilos son requeridos y no puede estar vacío.", path: ['processor_threads']});
    }
    if (categoryDetail?.slug === 'cases') {
        if (!data.case_brand) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Marca del gabinete es requerida.", path: ['case_brand'] });
        if (!data.case_color) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Color es requerido.", path: ['case_color'] });
        if (!data.case_mobo_support) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Soporte de placa madre es requerido.", path: ['case_mobo_support'] });
    }
    if (categoryDetail?.slug === 'refrigeracion') {
        if (!data.cooling_brand) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Marca es requerida.", path: ['cooling_brand'] });
        if (!data.cooling_size) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Tamaño es requerido.", path: ['cooling_size'] });
        if (!data.cooling_illumination) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Iluminación es requerida.", path: ['cooling_illumination'] });
        if (!data.cooling_noise_level?.trim()) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Nivel de ruido es requerido y no puede estar vacío.", path: ['cooling_noise_level'] });
    }
    if (categoryDetail?.slug === 'power-supplies') {
        if (!data.psu_brand) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Marca es requerida.", path: ['psu_brand'] });
        if (!data.psu_certification) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Certificación es requerida.", path: ['psu_certification'] });
        if (!data.psu_format) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Formato/Tamaño es requerido.", path: ['psu_format'] });
        if (!data.psu_power?.trim()) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Potencia es requerida y no puede estar vacía.", path: ['psu_power'] });
    }
});


export type ProductFormData = z.infer<typeof productFormSchema>;

interface ProductFormProps {
  initialData?: Product | null;
  productId?: string;
  isEditing?: boolean;
}

export default function ProductForm({ initialData, productId, isEditing = false }: ProductFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(initialData?.image || null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const defaultFormValues = useMemo((): ProductFormData => ({
      name: initialData?.name || '',
      description: initialData?.description || '',
      price: initialData?.price ?? 0,
      stock: initialData?.stock ?? 0,
      category: initialData?.category || '',
      brand: initialData?.brand || null,
      isBestseller: initialData?.isBestseller || false,
      rating: initialData?.rating ?? null,
      image: initialData?.image || null,
      features: Array.isArray(initialData?.features) ? initialData.features.join('\n') : (initialData?.features || ''),
      data_ai_hint: initialData?.data_ai_hint || null,

      gpu_brand: initialData?.gpu_brand || null,
      gpu_vram: initialData?.gpu_vram || '',
      gpuChipset: initialData?.gpuChipset || null,
      
      ram_brand: initialData?.ram_brand || null,
      ram_type: initialData?.ram_type || null,
      ram_format: initialData?.ram_format || null,
      ram_capacity: initialData?.ram_capacity || '',
      ram_speed: initialData?.ram_speed || '',

      mobo_brand: initialData?.mobo_brand || null,
      mobo_socket: initialData?.mobo_socket || null,
      mobo_ram_type: initialData?.mobo_ram_type || null,
      mobo_wifi_bluetooth: initialData?.mobo_wifi_bluetooth || false,
      mobo_argb_compatible: initialData?.mobo_argb_compatible || false,

      storage_type: initialData?.storage_type || null,
      storage_capacity: initialData?.storage_capacity || '',
      storage_brand: initialData?.storage_brand || null,
      storage_speed: initialData?.storage_speed || '',
      
      processor_brand: initialData?.processor_brand || null,
      processor_socket: initialData?.processor_socket || null,
      processor_cores: initialData?.processor_cores || '',
      processor_threads: initialData?.processor_threads || '',
      
      case_brand: initialData?.case_brand || null,
      case_color: initialData?.case_color || null,
      case_mobo_support: initialData?.case_mobo_support || null,

      cooling_brand: initialData?.cooling_brand || null,
      cooling_size: initialData?.cooling_size || null,
      cooling_illumination: initialData?.cooling_illumination || null,
      cooling_noise_level: initialData?.cooling_noise_level || '',

      psu_brand: initialData?.psu_brand || null,
      psu_certification: initialData?.psu_certification || null,
      psu_format: initialData?.psu_format || null,
      psu_power: initialData?.psu_power || '',
  }), [initialData]);

  const methods = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema),
    defaultValues: defaultFormValues,
  });
  const { control, handleSubmit, reset, watch, setValue, formState: { errors } } = methods;

  const watchedCategory = watch('category');
  const currentCategoryDetails = categories.find(c => c.name === watchedCategory);
  
  useEffect(() => {
    if (initialData) {
        const initialFeatures = Array.isArray(initialData.features) ? initialData.features.join('\n') : (initialData.features || '');
        reset({
            ...defaultFormValues,
            features: initialFeatures,
            rating: initialData.rating ?? null, 
            mobo_wifi_bluetooth: initialData.mobo_wifi_bluetooth ?? false,
            mobo_argb_compatible: initialData.mobo_argb_compatible ?? false,
        });
        setImagePreview(initialData.image || null);
    } else {
        reset(defaultFormValues);
        setImagePreview(null);
    }
    setSelectedFile(null);
  }, [initialData, reset, defaultFormValues]);


  useEffect(() => {
    const fieldsToNullify = [
      'gpu_brand', 'gpu_vram', 'gpuChipset',
      'ram_brand', 'ram_type', 'ram_format', 'ram_capacity', 'ram_speed',
      'mobo_brand', 'mobo_socket', 'mobo_ram_type',
      'storage_type', 'storage_capacity', 'storage_brand', 'storage_speed',
      'processor_brand', 'processor_socket', 'processor_cores', 'processor_threads',
      'case_brand', 'case_color', 'case_mobo_support',
      'cooling_brand', 'cooling_size', 'cooling_illumination', 'cooling_noise_level',
      'psu_brand', 'psu_certification', 'psu_format', 'psu_power'
    ] as (keyof ProductFormData)[];

    const booleansToDefault = [
        'mobo_wifi_bluetooth', 'mobo_argb_compatible'
    ] as (keyof ProductFormData)[];

    fieldsToNullify.forEach(field => {
        let clear = true;
        if (currentCategoryDetails?.slug === 'graphics-cards' && (field.startsWith('gpu_') || field === 'gpuChipset')) clear = false;
        if (currentCategoryDetails?.slug === 'memory' && field.startsWith('ram_')) clear = false;
        if (currentCategoryDetails?.slug === 'motherboards' && field.startsWith('mobo_')) clear = false;
        if (currentCategoryDetails?.slug === 'storage' && field.startsWith('storage_')) clear = false;
        if (currentCategoryDetails?.slug === 'processors' && field.startsWith('processor_')) clear = false;
        if (currentCategoryDetails?.slug === 'cases' && field.startsWith('case_')) clear = false;
        if (currentCategoryDetails?.slug === 'refrigeracion' && field.startsWith('cooling_')) clear = false;
        if (currentCategoryDetails?.slug === 'power-supplies' && field.startsWith('psu_')) clear = false;
        
        const currentValue = watch(field);
        if (clear) {
            const targetValue = (typeof defaultFormValues[field] === 'string') ? '' : null;
            if (currentValue !== targetValue) {
                 setValue(field, targetValue as any, { shouldValidate: true, shouldDirty: true });
            }
        }
    });
    booleansToDefault.forEach(field => {
        let clear = true;
        if (currentCategoryDetails?.slug === 'motherboards' && field.startsWith('mobo_')) clear = false;
        const currentValue = watch(field);
        if (clear) {
            if (currentValue !== false) {
                setValue(field, false as any, { shouldValidate: true, shouldDirty: true });
            }
        }
    });

    const specificBrandFieldFilled = 
      (currentCategoryDetails?.slug === 'graphics-cards' && watch('gpu_brand')) ||
      (currentCategoryDetails?.slug === 'memory' && watch('ram_brand')) ||
      (currentCategoryDetails?.slug === 'motherboards' && watch('mobo_brand')) ||
      (currentCategoryDetails?.slug === 'storage' && watch('storage_brand')) ||
      (currentCategoryDetails?.slug === 'processors' && watch('processor_brand')) ||
      (currentCategoryDetails?.slug === 'cases' && watch('case_brand')) ||
      (currentCategoryDetails?.slug === 'refrigeracion' && watch('cooling_brand')) ||
      (currentCategoryDetails?.slug === 'power-supplies' && watch('psu_brand'));

    const generalBrandValue = watch('brand');
    if (specificBrandFieldFilled) {
      if (generalBrandValue !== '' && generalBrandValue !== null) {
        setValue('brand', '');
      }
    }

  }, [watchedCategory, currentCategoryDetails, setValue, watch, defaultFormValues]);

  useEffect(() => {
    return () => {
      if (imagePreview && imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);


  const showGpuFields = currentCategoryDetails?.slug === 'graphics-cards';
  const showRamFields = currentCategoryDetails?.slug === 'memory';
  const showMoboFields = currentCategoryDetails?.slug === 'motherboards';
  const showStorageFields = currentCategoryDetails?.slug === 'storage';
  const showProcessorFields = currentCategoryDetails?.slug === 'processors';
  const showCaseFields = currentCategoryDetails?.slug === 'cases';
  const showCoolingFields = currentCategoryDetails?.slug === 'refrigeracion';
  const showPsuFields = currentCategoryDetails?.slug === 'power-supplies';

  const hasSpecificBrandField = showGpuFields || showRamFields || showMoboFields || showStorageFields || showProcessorFields || showCaseFields || showCoolingFields || showPsuFields;
  const showGeneralBrandField = !hasSpecificBrandField && currentCategoryDetails;


  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (imagePreview && imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview);
      }
      const newPreviewUrl = URL.createObjectURL(file);
      setImagePreview(newPreviewUrl);
      setValue('image', ''); 
    }
  };

  const handleImageUrlChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const url = event.target.value;
    if (url) {
        setSelectedFile(null); 
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        if (imagePreview && imagePreview.startsWith('blob:')) {
            URL.revokeObjectURL(imagePreview);
        }
        setImagePreview(url); 
    } else if (!selectedFile) { 
        setImagePreview(initialData?.image || null); 
    }
  };


  const handleRemoveImage = () => {
    if (imagePreview && imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview);
    }
    setSelectedFile(null);
    setValue('image', isEditing && initialData?.image ? initialData.image : ''); 
    setImagePreview(isEditing && initialData?.image ? initialData.image : null); 
    if (fileInputRef.current) {
        fileInputRef.current.value = ''; 
    }
  };

  const onSubmitHandler = async (data: ProductFormData) => {
    setIsProcessing(true);
    let finalImageUrl: string | null | undefined = data.image; 

    if (selectedFile) {
      setIsUploading(true);
      setUploadProgress(0);

      if (!configComplete || !auth || !storage) {
        toast({
          title: "Error de Configuración",
          description: "Firebase no está configurado correctamente. No se puede subir la imagen.",
          variant: "destructive"
        });
        setIsProcessing(false);
        setIsUploading(false);
        return;
      }
      
      const user = auth.currentUser;
      if (!user) {
          toast({ title: "Error de Autenticación", description: "No estás autenticado para subir imágenes.", variant: "destructive" });
          setIsProcessing(false);
          setIsUploading(false);
          return;
      }
      const fileName = `${Date.now()}-${selectedFile.name.replace(/\s+/g, '_')}`;
      const storageRefPath = `product_images/${fileName}`;
      const imageRef = ref(storage, storageRefPath);
      const uploadTask = uploadBytesResumable(imageRef, selectedFile);

      try {
        await new Promise<void>((resolve, reject) => {
          uploadTask.on('state_changed',
            (snapshot) => {
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              setUploadProgress(progress);
            },
            (error: any) => { 
              toast({ title: "Error al subir imagen", description: error.message, variant: "destructive" });
              reject(error);
            },
            async () => {
              finalImageUrl = await getDownloadURL(uploadTask.snapshot.ref);
              resolve();
            }
          );
        });
      } catch (error) {
        setIsUploading(false);
        setIsProcessing(false);
        return; 
      }
      setIsUploading(false);
    }

    const normalizeUnit = (value: string | null | undefined, unit: string): string | null => {
        if (!value || typeof value !== 'string') return null;
        const trimmedValue = value.trim();
        if (trimmedValue === '') return null;

        // Handle special formats like "(2x8GB)" first
        if (/\(.*\)/.test(trimmedValue)) {
            return trimmedValue;
        }

        const numericPart = parseFloat(trimmedValue);
        // If it's not a number (e.g., "7000MB/s"), or if it already has the unit, return as is.
        if (isNaN(numericPart) || trimmedValue.toUpperCase().includes(unit.toUpperCase())) {
            return trimmedValue;
        }
        
        return `${numericPart}${unit}`;
    };
    
    const dataToSubmit: ProductFormData = {
        ...data,
        gpu_vram: normalizeUnit(data.gpu_vram, 'GB'),
        ram_speed: normalizeUnit(data.ram_speed, 'MHz'),
        ram_capacity: normalizeUnit(data.ram_capacity, 'GB'),
        psu_power: normalizeUnit(data.psu_power, 'W'),
        cooling_noise_level: normalizeUnit(data.cooling_noise_level, 'dB'),
        image: finalImageUrl || null,
        rating: data.rating === null || data.rating === undefined ? null : Number(data.rating),
        brand: data.brand === '' ? null : data.brand,
        features: data.features === '' ? null : data.features,
        data_ai_hint: data.data_ai_hint === '' ? null : data.data_ai_hint,
    };
    
    console.log("Data being submitted to server action:", JSON.stringify(dataToSubmit, null, 2));

    try {
      let result;
      if (isEditing && productId) {
        result = await updateProduct(productId, dataToSubmit);
      } else {
        result = await createProduct(dataToSubmit);
      }

      if (result.success) {
        toast({
          title: `Producto ${isEditing ? 'actualizado' : 'creado'}`,
          description: `El producto "${data.name}" ha sido ${isEditing ? 'actualizado' : 'creado'} exitosamente.`,
        });
        router.push('/admin/products');
        router.refresh();
      } else {
        toast({
          title: `Error al ${isEditing ? 'actualizar' : 'crear'} producto`,
          description: result.error || `No se pudo ${isEditing ? 'actualizar' : 'crear'} el producto.`,
          variant: 'destructive',
          ...(result.errors && { description: `${result.error} Detalles: ${JSON.stringify(result.errors)}`}),
        });
      }
    } catch (error) {
      toast({ title: 'Error inesperado', description: 'Ocurrió un error en el servidor.', variant: 'destructive' });
      console.error("Form submission error:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Form {...methods}>
      <form onSubmit={handleSubmit(onSubmitHandler)} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField control={control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre del Producto</FormLabel>
                <FormControl><Input {...field} placeholder="Ej: NVIDIA GeForce RTX 4090" /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField control={control} name="category" render={({ field }) => (
              <FormItem>
                <FormLabel>Categoría</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || ''}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Selecciona una categoría" /></SelectTrigger></FormControl>
                  <SelectContent>{categories.map(cat => (<SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>))}</SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField control={control} name="description" render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción</FormLabel>
              <FormControl><Textarea {...field} placeholder="Describe el producto detalladamente..." rows={4} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <FormField control={control} name="price" render={({ field }) => (
              <FormItem>
                <FormLabel>Precio (S/)</FormLabel>
                <FormControl><Input type="number" step="0.01" {...field} value={field.value ?? ''} placeholder="Ej: 1200.50" onChange={e => field.onChange(parseFloat(e.target.value) || 0)} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField control={control} name="stock" render={({ field }) => (
              <FormItem>
                <FormLabel>Stock</FormLabel>
                <FormControl><Input type="number" {...field} value={field.value ?? ''} placeholder="Ej: 50" onChange={e => field.onChange(parseInt(e.target.value,10) || 0)} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
           {showGeneralBrandField && (
              <FormField control={control} name="brand" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Marca General</FormLabel>
                    <FormControl><Input {...field} value={field.value || ''} placeholder="Ej: ASUS, Intel, AMD" /></FormControl>
                    <FormDescription className="text-xs">Para categorías sin marca específica.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          <FormField control={control} name="rating" render={({ field }) => (
              <FormItem>
                <FormLabel>Calificación (0-5)</FormLabel>
                <FormControl><Input type="number" step="0.1" {...field} value={field.value ?? ''} placeholder="Ej: 4.5" onChange={e => field.onChange(e.target.value === '' ? null : parseFloat(e.target.value))} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {showGpuFields && (
          <div className="space-y-4 p-4 border rounded-md bg-muted/20">
            <h4 className="font-medium text-sm text-muted-foreground">Atributos de Tarjeta Gráfica</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormField control={control} name="gpu_brand" render={({ field }) => (
                <FormItem>
                  <FormLabel>Marca GPU</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ''}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Selecciona marca" /></SelectTrigger></FormControl>
                    <SelectContent>{GPU_BRANDS_OPTIONS.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
                  </Select><FormMessage />
                </FormItem>)}
              />
              <FormField control={control} name="gpu_vram" render={({ field }) => (
                <FormItem>
                  <FormLabel>VRAM</FormLabel>
                  <FormControl><Input 
                    type="text" 
                    {...field} 
                    value={field.value || ''} 
                    placeholder="Ej: 8 o 8GB"
                  /></FormControl>
                  <FormDescription className="text-xs">Solo números (ej: 12). Se añadirá "GB" automáticamente.</FormDescription>
                  <FormMessage />
                </FormItem>)}
              />
              <FormField control={control} name="gpuChipset" render={({ field }) => (
                <FormItem>
                  <FormLabel>Chipset GPU</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ''}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Selecciona chipset" /></SelectTrigger></FormControl>
                    <SelectContent><SelectItem value="NVIDIA">NVIDIA</SelectItem><SelectItem value="AMD">AMD</SelectItem></SelectContent>
                  </Select><FormMessage />
                </FormItem>)}
              />
            </div>
          </div>
        )}

        {showRamFields && (
          <div className="space-y-4 p-4 border rounded-md bg-muted/20">
            <h4 className="font-medium text-sm text-muted-foreground">Atributos de Memoria RAM</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              <FormField control={control} name="ram_brand" render={({ field }) => (
                <FormItem>
                  <FormLabel>Marca RAM</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ''}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Selecciona marca" /></SelectTrigger></FormControl>
                    <SelectContent>{RAM_BRANDS_OPTIONS.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
                  </Select>
                  <FormDescription className="text-xs min-h-[1rem]">&nbsp;</FormDescription>
                  <FormMessage />
                </FormItem>)}
              />
              <FormField control={control} name="ram_type" render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo RAM</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ''}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Selecciona tipo" /></SelectTrigger></FormControl>
                    <SelectContent>{RAM_TYPES_OPTIONS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                  <FormDescription className="text-xs min-h-[1rem]">&nbsp;</FormDescription>
                  <FormMessage />
                </FormItem>)}
              />
              <FormField control={control} name="ram_format" render={({ field }) => (
                <FormItem>
                  <FormLabel>Formato RAM</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ''}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Selecciona formato" /></SelectTrigger></FormControl>
                    <SelectContent>{RAM_FORMATS_OPTIONS.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
                  </Select>
                  <FormDescription className="text-xs min-h-[1rem]">&nbsp;</FormDescription>
                  <FormMessage />
                </FormItem>)}
              />
              <FormField control={control} name="ram_capacity" render={({ field }) => (
                <FormItem>
                  <FormLabel>Capacidad RAM</FormLabel>
                  <FormControl><Input 
                    type="text"
                    {...field} 
                    value={field.value || ''} 
                    placeholder="Ej: 16 o (2x8GB)"
                  /></FormControl>
                  <FormDescription className="text-xs min-h-[1rem]">Solo números (ej: 16). Se añadirá "GB" auto. Para kits: "(2x8GB)".</FormDescription>
                  <FormMessage />
                </FormItem>)}
              />
              <FormField control={control} name="ram_speed" render={({ field }) => (
                <FormItem>
                  <FormLabel>Velocidad RAM</FormLabel>
                  <FormControl><Input 
                    type="text" 
                    {...field} 
                    value={field.value || ''} 
                    placeholder="Ej: 3200 o 3200MHz"
                  /></FormControl>
                  <FormDescription className="text-xs min-h-[1rem]">Solo números (ej: 3200). Se añadirá "MHz" auto.</FormDescription>
                  <FormMessage />
                </FormItem>)}
              />
            </div>
          </div>
        )}

        {showMoboFields && (
          <div className="space-y-4 p-4 border rounded-md bg-muted/20">
            <h4 className="font-medium text-sm text-muted-foreground">Atributos de Placa Madre</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormField control={control} name="mobo_brand" render={({ field }) => (
                <FormItem>
                  <FormLabel>Marca Placa Madre</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ''}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Selecciona marca" /></SelectTrigger></FormControl>
                    <SelectContent>{MOBO_BRANDS_OPTIONS.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
                  </Select><FormMessage />
                </FormItem>)}
              />
              <FormField control={control} name="mobo_socket" render={({ field }) => (
                <FormItem>
                  <FormLabel>Socket Placa Madre</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ''}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Selecciona socket" /></SelectTrigger></FormControl>
                    <SelectContent>{MOBO_SOCKETS_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select><FormMessage />
                </FormItem>)}
              />
              <FormField control={control} name="mobo_ram_type" render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo RAM Soportado</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ''}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Selecciona tipo RAM" /></SelectTrigger></FormControl>
                    <SelectContent>{MOBO_RAM_TYPES_OPTIONS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select><FormMessage />
                </FormItem>)}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                <FormField control={control} name="mobo_wifi_bluetooth" render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-3">
                    <FormControl><Checkbox checked={field.value || false} onCheckedChange={field.onChange} /></FormControl>
                    <FormLabel className="font-normal">¿Incluye WiFi/Bluetooth?</FormLabel>
                    <FormMessage />
                    </FormItem>)}
                />
                <FormField control={control} name="mobo_argb_compatible" render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-3">
                    <FormControl><Checkbox checked={field.value || false} onCheckedChange={field.onChange} /></FormControl>
                    <FormLabel className="font-normal">¿Compatible con ARGB?</FormLabel>
                    <FormMessage />
                    </FormItem>)}
                />
            </div>
          </div>
        )}

        {showStorageFields && (
          <div className="space-y-4 p-4 border rounded-md bg-muted/20">
              <h4 className="font-medium text-sm text-muted-foreground">Atributos de Almacenamiento</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <FormField control={control} name="storage_type" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ''}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Selecciona tipo" /></SelectTrigger></FormControl>
                          <SelectContent>{STORAGE_TYPES_OPTIONS.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent>
                        </Select><FormMessage />
                      </FormItem>)}
                  />
                  <FormField control={control} name="storage_brand" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Marca</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ''}>
                           <FormControl><SelectTrigger><SelectValue placeholder="Selecciona marca" /></SelectTrigger></FormControl>
                           <SelectContent>{STORAGE_BRANDS_OPTIONS.map(brandName => <SelectItem key={brandName} value={brandName}>{brandName}</SelectItem>)}</SelectContent>
                        </Select><FormMessage />
                      </FormItem>)}
                  />
                  <FormField control={control} name="storage_capacity" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Capacidad</FormLabel>
                        <FormControl><Input {...field} value={field.value || ''} placeholder="Ej: 1TB, 512GB" /></FormControl><FormMessage />
                      </FormItem>)}
                  />
                  <FormField control={control} name="storage_speed" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Velocidad</FormLabel>
                        <FormControl><Input {...field} value={field.value || ''} placeholder="Ej: 550MB/s, 7000MB/s" /></FormControl><FormMessage />
                      </FormItem>)}
                  />
              </div>
          </div>
        )}

        {showProcessorFields && (
          <div className="space-y-4 p-4 border rounded-md bg-muted/20">
              <h4 className="font-medium text-sm text-muted-foreground">Atributos de Procesador</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <FormField control={control} name="processor_brand" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Marca</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ''}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Selecciona marca" /></SelectTrigger></FormControl>
                          <SelectContent>{PROCESSOR_BRANDS_OPTIONS.map(brandName => <SelectItem key={brandName} value={brandName}>{brandName}</SelectItem>)}</SelectContent>
                        </Select><FormMessage />
                      </FormItem>)}
                  />
                  <FormField control={control} name="processor_socket" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Socket</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ''}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Selecciona socket" /></SelectTrigger></FormControl>
                          <SelectContent>{PROCESSOR_SOCKETS_OPTIONS.map(socketName => <SelectItem key={socketName} value={socketName}>{socketName}</SelectItem>)}</SelectContent>
                        </Select><FormMessage />
                      </FormItem>)}
                  />
                  <FormField control={control} name="processor_cores" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Núcleos</FormLabel>
                        <FormControl><Input {...field} value={field.value || ''} placeholder="Ej: 8, 16" /></FormControl><FormMessage />
                      </FormItem>)}
                  />
                  <FormField control={control} name="processor_threads" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hilos</FormLabel>
                        <FormControl><Input {...field} value={field.value || ''} placeholder="Ej: 16, 32" /></FormControl><FormMessage />
                      </FormItem>)}
                  />
              </div>
          </div>
        )}

        {showCaseFields && (
          <div className="space-y-4 p-4 border rounded-md bg-muted/20">
              <h4 className="font-medium text-sm text-muted-foreground">Atributos de Gabinete</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormField control={control} name="case_brand" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Marca del Gabinete</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || ''}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Selecciona marca" /></SelectTrigger></FormControl>
                            <SelectContent>{CASE_BRANDS_OPTIONS.map(brandName => <SelectItem key={brandName} value={brandName}>{brandName}</SelectItem>)}</SelectContent>
                          </Select><FormMessage />
                        </FormItem>)}
                    />
                  <FormField control={control} name="case_color" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Color</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ''}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Selecciona color" /></SelectTrigger></FormControl>
                          <SelectContent>{CASE_COLORS_OPTIONS.map(color => <SelectItem key={color} value={color}>{color}</SelectItem>)}</SelectContent>
                        </Select><FormMessage />
                      </FormItem>)}
                  />
                  <FormField control={control} name="case_mobo_support" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Soporte MB</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ''}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Selecciona soporte" /></SelectTrigger></FormControl>
                          <SelectContent>{CASE_MOBO_SUPPORTS_OPTIONS.map(support => <SelectItem key={support} value={support}>{support}</SelectItem>)}</SelectContent>
                        </Select><FormMessage />
                      </FormItem>)}
                  />
              </div>
          </div>
        )}

        {showCoolingFields && (
          <div className="space-y-4 p-4 border rounded-md bg-muted/20">
            <h4 className="font-medium text-sm text-muted-foreground">Atributos de Refrigeración</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <FormField control={control} name="cooling_brand" render={({ field }) => (
                <FormItem>
                  <FormLabel>Marca</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ''}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Selecciona marca" /></SelectTrigger></FormControl>
                    <SelectContent>{COOLING_BRANDS_OPTIONS.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
                  </Select><FormMessage />
                </FormItem>)}
              />
              <FormField control={control} name="cooling_size" render={({ field }) => (
                <FormItem>
                  <FormLabel>Tamaño</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ''}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Selecciona tamaño" /></SelectTrigger></FormControl>
                    <SelectContent>{COOLING_SIZES_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select><FormMessage />
                </FormItem>)}
              />
              <FormField control={control} name="cooling_illumination" render={({ field }) => (
                <FormItem>
                  <FormLabel>Iluminación</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ''}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Selecciona iluminación" /></SelectTrigger></FormControl>
                    <SelectContent>{COOLING_ILLUMINATION_OPTIONS.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
                  </Select><FormMessage />
                </FormItem>)}
              />
              <FormField control={control} name="cooling_noise_level" render={({ field }) => (
                <FormItem>
                  <FormLabel>Nivel de Ruido</FormLabel>
                  <FormControl><Input 
                    type="text"
                    {...field} 
                    value={field.value || ''} 
                    placeholder="Ej: 25 o 25.5dB"
                  /></FormControl>
                  <FormDescription className="text-xs">Solo números (ej: 25). Se añadirá "dB" automáticamente.</FormDescription>
                  <FormMessage />
                </FormItem>)}
              />
            </div>
          </div>
        )}

        {showPsuFields && (
          <div className="space-y-4 p-4 border rounded-md bg-muted/20">
            <h4 className="font-medium text-sm text-muted-foreground">Atributos de Fuente de Poder</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <FormField control={control} name="psu_brand" render={({ field }) => (
                <FormItem>
                  <FormLabel>Marca</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ''}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Selecciona marca" /></SelectTrigger></FormControl>
                    <SelectContent>{PSU_BRANDS_OPTIONS.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
                  </Select><FormMessage />
                </FormItem>)}
              />
              <FormField control={control} name="psu_certification" render={({ field }) => (
                <FormItem>
                  <FormLabel>Certificación</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ''}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Selecciona certificación" /></SelectTrigger></FormControl>
                    <SelectContent>{PSU_CERTIFICATIONS_OPTIONS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select><FormMessage />
                </FormItem>)}
              />
              <FormField control={control} name="psu_format" render={({ field }) => (
                <FormItem>
                  <FormLabel>Formato/Tamaño</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ''}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Selecciona formato" /></SelectTrigger></FormControl>
                    <SelectContent>{PSU_FORMATS_OPTIONS.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
                  </Select><FormMessage />
                </FormItem>)}
              />
              <FormField control={control} name="psu_power" render={({ field }) => (
                <FormItem>
                  <FormLabel>Potencia</FormLabel>
                  <FormControl><Input 
                    type="text"
                    {...field} 
                    value={field.value || ''} 
                    placeholder="Ej: 750 o 750W"
                  /></FormControl>
                  <FormDescription className="text-xs">Solo números (ej: 750). Se añadirá "W" automáticamente.</FormDescription>
                  <FormMessage />
                </FormItem>)}
              />
            </div>
          </div>
        )}

        {errors.root?.message && <p className="text-sm text-destructive">{errors.root.message}</p>}

        <FormField
          control={control}
          name="image"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Imagen del Producto</FormLabel>
              <div className="mt-1 flex flex-col items-start gap-4">
                  {imagePreview && (
                      <div className="relative w-48 h-48 border rounded-md overflow-hidden shadow-sm">
                          <Image src={imagePreview} alt="Vista previa de la imagen" layout="fill" objectFit="cover" unoptimized />
                      </div>
                  )}
                   <div className="flex items-center gap-2 w-full sm:w-auto">
                      <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isProcessing}>
                          <UploadCloud className="mr-2 h-4 w-4" /> {selectedFile ? 'Cambiar Archivo' : 'Seleccionar Archivo'}
                      </Button>
                      { (imagePreview || selectedFile) && (
                          <Button type="button" variant="destructive" size="icon" onClick={handleRemoveImage} disabled={isProcessing}>
                              <Trash2 className="h-4 w-4" /><span className="sr-only">Quitar Imagen/Archivo</span>
                          </Button>
                      )}
                  </div>
                  <Input 
                      id="image-upload" 
                      type="file" 
                      accept="image/*" 
                      onChange={handleFileChange} 
                      className="hidden" 
                      ref={fileInputRef} 
                      disabled={isProcessing} 
                  />

                  <div className="flex items-center gap-2 w-full">
                    <LinkIcon className="h-5 w-5 text-muted-foreground" />
                    <Input 
                        type="url"
                        placeholder="O pega una URL de imagen existente aquí" 
                        className="flex-grow"
                        value={field.value || ''}
                        onChange={(e) => {
                            field.onChange(e); 
                            handleImageUrlChange(e); 
                        }}
                        disabled={isProcessing}
                    />
                  </div>
                  
                  {isUploading && (<div className="w-full bg-muted rounded-full h-2.5 mt-2"><div className="bg-primary h-2.5 rounded-full" style={{ width: `${uploadProgress}%` }}></div></div>)}
                  
                  <FormDescription>
                      {selectedFile ? `Archivo seleccionado: ${selectedFile.name}.` : 
                       field.value ? `Usando URL: ${field.value}` : 
                       "Sube un archivo o pega una URL. La subida de archivo tiene prioridad si se selecciona un archivo."}
                  </FormDescription>
                  <FormMessage /> 
              </div>
            </FormItem>
          )}
        />

        <FormField control={control} name="data_ai_hint" render={({ field }) => (
            <FormItem>
              <FormLabel>Pista para IA de Imagen (1-2 palabras)</FormLabel>
              <FormControl><Input {...field} value={field.value || ''} placeholder="Ej: gaming processor" /></FormControl>
              <FormDescription className="text-xs">Usado para encontrar imágenes placeholder relevantes si no se sube una y no se pega URL.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField control={control} name="features" render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor="features">Características Generales (una por línea)</FormLabel>
              <FormControl><Textarea id="features" {...field} value={field.value || ''} placeholder="Ej: Iluminación RGB\nRefrigeración líquida integrada\nBajo consumo" rows={5} /></FormControl>
              <FormDescription className="text-xs">Para atributos no cubiertos por campos específicos, usar formato "Atributo: Valor". Si la categoría tiene campos propios, úsalos preferentemente.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField control={control} name="isBestseller" render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} disabled={isProcessing} /></FormControl>
              <div className="space-y-1 leading-none"><FormLabel>¿Es Bestseller?</FormLabel></div>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isProcessing || isUploading} className="w-full sm:w-auto">
          {isProcessing ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {isUploading ? `Subiendo Imagen (${Math.round(uploadProgress)}%)...` : (isEditing ? 'Guardando Cambios...' : 'Creando Producto...')}</>
          ) : (
            <><Save className="mr-2 h-4 w-4" />{isEditing ? 'Guardar Cambios' : 'Crear Producto'}</>
          )}
        </Button>
      </form>
    </Form>
  );
}
    
