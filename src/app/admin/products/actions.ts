
"use server";

import { z } from 'zod';
import { firestore, configComplete } from '@/lib/firebase/config'; // Added configComplete
import { collection, addDoc, updateDoc, doc, serverTimestamp, deleteDoc, getDoc } from 'firebase/firestore';
import { categories } from '@/lib/data';
import { revalidatePath } from 'next/cache';

const GPU_BRANDS_ENUM = z.enum(['ASUS', 'GigaByte', 'MSI', 'EVGA']);
const RAM_BRANDS_ENUM = z.enum(['Corsair', 'Kingston', 'G.Skill', 'Crucial']);
const MOBO_BRANDS_ENUM = z.enum(['Asus', 'GigaByte', 'ASRock', 'MSI']);
const STORAGE_BRANDS_ENUM = z.enum(['Seagate', 'Western Digital', 'Crucial', 'Samsung', 'Kingston', 'ADATA']); // Added Kingston and ADATA
const PROCESSOR_BRANDS_ENUM = z.enum(['Intel', 'AMD']);
const CASE_BRANDS_ENUM = z.enum(['NZXT', 'Cooler Master', 'Thermaltake', 'Lian Li', 'Corsair', 'Hyte', 'Phanteks', 'Asus', 'DeepCool']);
const CASE_MOBO_SUPPORTS_ENUM = z.enum(['ATX/Micro-ATX/ITX', 'Micro-ATX', 'ATX', 'Micro-ATX/ATX', 'Mini-ITX', 'Micro-ATX/Mini-ITX']);


const COOLING_BRANDS_ENUM = z.enum(['Noctua', 'Cooler Master', 'Corsair', 'NZXT']);
const COOLING_SIZES_ENUM = z.enum(['120mm', '240mm', '360mm']); // Assuming these relate to fan/radiator size for simplicity
const COOLING_ILLUMINATION_ENUM = z.enum(['ARGB', 'RGB', 'Sin RGB']);

const PSU_BRANDS_ENUM = z.enum(['Corsair', 'Antec', 'EVGA', 'Cooler Master', 'XPG', 'GigaByte', 'Asus', 'Seasonic', 'NZXT', 'Thermaltake']); // Added Seasonic, NZXT, Thermaltake
const PSU_CERTIFICATIONS_ENUM = z.enum(['80 PLUS Bronze', '80 PLUS Gold', '80 PLUS Platinum', '80 PLUS Titanium']); // Added Titanium
const PSU_FORMATS_ENUM = z.enum(['ATX', 'Micro ATX']); // Could be SFX, etc. Simplified for now.

const productActionSchemaBase = z.object({
  name: z.string().min(3).max(100),
  description: z.string().min(10).max(1000),
  price: z.coerce.number().min(0.01),
  stock: z.coerce.number().int().min(0),
  category: z.string().min(1), // Category name
  categorySlug: z.string().optional(), // Added to match Product interface and prepareProductData logic
  brand: z.string().optional().nullable(),
  isBestseller: z.boolean().default(false),
  rating: z.coerce.number().min(0).max(5).optional().nullable(),
  image: z.string().url().optional().or(z.literal('')).nullable(),
  features: z.string().optional().nullable(),
  data_ai_hint: z.string().optional().nullable(),

  gpu_brand: GPU_BRANDS_ENUM.optional().nullable(),
  gpu_vram: z.string().optional().nullable(),
  gpuChipset: z.enum(['NVIDIA', 'AMD']).optional().nullable(),

  ram_brand: RAM_BRANDS_ENUM.optional().nullable(),
  ram_type: z.enum(['DDR4', 'DDR5']).optional().nullable(),
  ram_format: z.enum(['DIMM', 'SODIMM']).optional().nullable(),
  ram_capacity: z.string().optional().nullable(),
  ram_speed: z.string().optional().nullable(),

  mobo_brand: MOBO_BRANDS_ENUM.optional().nullable(),
  mobo_socket: z.enum(['LGA1700', 'AM4', 'AM5']).optional().nullable(),
  mobo_ram_type: z.enum(['DDR4', 'DDR5']).optional().nullable(),
  mobo_wifi_bluetooth: z.boolean().optional().nullable().default(false),
  mobo_argb_compatible: z.boolean().optional().nullable().default(false),

  storage_type: z.enum(['HDD', 'SSD', 'NVMe M.2']).optional().nullable(),
  storage_capacity: z.string().optional().nullable(),
  storage_brand: STORAGE_BRANDS_ENUM.optional().nullable(),
  storage_speed: z.string().optional().nullable(),

  processor_brand: PROCESSOR_BRANDS_ENUM.optional().nullable(),
  processor_socket: z.enum(['LGA1700', 'AM4', 'AM5']).optional().nullable(),
  processor_cores: z.string().optional().nullable(),
  processor_threads: z.string().optional().nullable(),

  case_brand: CASE_BRANDS_ENUM.optional().nullable(),
  case_color: z.enum(['Blanco', 'Negro']).optional().nullable(),
  case_mobo_support: CASE_MOBO_SUPPORTS_ENUM.optional().nullable(),

  cooling_brand: COOLING_BRANDS_ENUM.optional().nullable(),
  cooling_size: COOLING_SIZES_ENUM.optional().nullable(),
  cooling_illumination: COOLING_ILLUMINATION_ENUM.optional().nullable(),
  cooling_noise_level: z.string().optional().nullable(),

  psu_brand: PSU_BRANDS_ENUM.optional().nullable(),
  psu_certification: PSU_CERTIFICATIONS_ENUM.optional().nullable(),
  psu_format: PSU_FORMATS_ENUM.optional().nullable(),
  psu_power: z.string().optional().nullable(),
});

const productActionSchema = productActionSchemaBase.superRefine((data, ctx) => {
    const categoryDetail = categories.find(c => c.name === data.category);

    if (categoryDetail?.slug === 'graphics-cards') {
        if (!data.gpu_brand) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Marca de la tarjeta gráfica es requerida.", path: ['gpu_brand'] });
        if (!data.gpu_vram || data.gpu_vram.trim() === "") ctx.addIssue({ code: z.ZodIssueCode.custom, message: "VRAM es requerida y no puede estar vacía.", path: ['gpu_vram'] });
        if (!data.gpuChipset) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Chipset GPU es requerido.", path: ['gpuChipset'] });
    }
    if (categoryDetail?.slug === 'memory') {
        if (!data.ram_brand) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Marca de la RAM es requerida.", path: ['ram_brand'] });
        if (!data.ram_type) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Tipo de RAM es requerido.", path: ['ram_type'] });
        if (!data.ram_format) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Formato de RAM es requerido.", path: ['ram_format'] });
        if (!data.ram_capacity || data.ram_capacity.trim() === "") ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Capacidad de RAM es requerida y no puede estar vacía.", path: ['ram_capacity'] });
        if (!data.ram_speed || data.ram_speed.trim() === "") ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Velocidad de RAM es requerida y no puede estar vacía.", path: ['ram_speed'] });
    }
    if (categoryDetail?.slug === 'motherboards') {
        if (!data.mobo_brand) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Marca de la placa madre es requerida.", path: ['mobo_brand'] });
        if (!data.mobo_socket) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Socket es requerido.", path: ['mobo_socket'] });
        if (!data.mobo_ram_type) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Tipo de RAM soportado es requerido.", path: ['mobo_ram_type'] });
    }
    if (categoryDetail?.slug === 'storage') {
        if (!data.storage_type) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Tipo de almacenamiento es requerido.", path: ['storage_type']});
        if (!data.storage_capacity || data.storage_capacity.trim() === "") ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Capacidad de almacenamiento es requerida y no puede estar vacía.", path: ['storage_capacity'] });
        if (!data.storage_brand) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Marca de almacenamiento es requerida.", path: ['storage_brand'] });
        if (!data.storage_speed || data.storage_speed.trim() === "") ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Velocidad de almacenamiento es requerida y no puede estar vacía.", path: ['storage_speed'] });
    }
    if (categoryDetail?.slug === 'processors') {
        if (!data.processor_brand) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Marca del procesador es requerida.", path: ['processor_brand'] });
        if (!data.processor_socket) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Socket del procesador es requerido.", path: ['processor_socket'] });
        if (!data.processor_cores || data.processor_cores.trim() === "") ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Número de núcleos es requerido y no puede estar vacío.", path: ['processor_cores'] });
        if (!data.processor_threads || data.processor_threads.trim() === "") ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Número de hilos es requerido y no puede estar vacío.", path: ['processor_threads'] });
    }
    if (categoryDetail?.slug === 'cases') {
        if (!data.case_brand) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Marca del gabinete es requerida.", path: ['case_brand'] });
        if (!data.case_color) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Color del gabinete es requerido.", path: ['case_color'] });
        if (!data.case_mobo_support) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Soporte de placa madre es requerido.", path: ['case_mobo_support'] });
    }
    if (categoryDetail?.slug === 'refrigeracion') {
        if (!data.cooling_brand) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Marca de refrigeración es requerida.", path: ['cooling_brand'] });
        if (!data.cooling_size) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Tamaño es requerido.", path: ['cooling_size'] });
        if (!data.cooling_illumination) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Iluminación es requerida.", path: ['cooling_illumination'] });
        if (!data.cooling_noise_level || data.cooling_noise_level.trim() === "") ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Nivel de ruido es requerido y no puede estar vacío.", path: ['cooling_noise_level'] });
    }
    if (categoryDetail?.slug === 'power-supplies') {
        if (!data.psu_brand) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Marca de fuente de poder es requerida.", path: ['psu_brand'] });
        if (!data.psu_certification) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Certificación es requerida.", path: ['psu_certification'] });
        if (!data.psu_format) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Formato/Tamaño es requerido.", path: ['psu_format'] });
        if (!data.psu_power || data.psu_power.trim() === "") ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Potencia es requerida y no puede estar vacía.", path: ['psu_power'] });
    }
});

type ProductActionData = z.infer<typeof productActionSchema>;

const categorySpecificFieldsMap: Record<string, (keyof ProductActionData)[]> = {
  'graphics-cards': ['gpu_brand', 'gpu_vram', 'gpuChipset'],
  'memory': ['ram_brand', 'ram_type', 'ram_format', 'ram_capacity', 'ram_speed'],
  'motherboards': ['mobo_brand', 'mobo_socket', 'mobo_ram_type', 'mobo_wifi_bluetooth', 'mobo_argb_compatible'],
  'storage': ['storage_type', 'storage_capacity', 'storage_brand', 'storage_speed'],
  'processors': ['processor_brand', 'processor_socket', 'processor_cores', 'processor_threads'],
  'cases': ['case_brand', 'case_color', 'case_mobo_support'],
  'refrigeracion': ['cooling_brand', 'cooling_size', 'cooling_illumination', 'cooling_noise_level'],
  'power-supplies': ['psu_brand', 'psu_certification', 'psu_format', 'psu_power'],
};

function prepareProductData(data: ProductActionData, categorySlug: string) {
    const commonFields: (keyof ProductActionData)[] = [
        'name', 'description', 'price', 'stock', 'category', 'isBestseller', 
        'rating', 'image', 'features', 'data_ai_hint'
    ];
    
    const preparedData: Partial<ProductActionData> = {};

    commonFields.forEach(key => {
        if (data[key] !== undefined) {
            if (key === 'features' && typeof data.features === 'string') {
                (preparedData as any)[key] = data.features.split('\n').map(f => f.trim()).filter(f => f);
            } else if (key === 'features' && data.features === null) {
                 (preparedData as any)[key] = []; 
            } else if (key === 'rating' && (data.rating === undefined || data.rating === null)) {
                 (preparedData as any)[key] = null; 
            } else if ((key === 'image' || key === 'brand' || key === 'data_ai_hint') && data[key] === '') {
                (preparedData as any)[key] = null; 
            }
            else {
                (preparedData as any)[key] = data[key];
            }
        }
    });
    preparedData.categorySlug = categorySlug;


    const specificBrandField = 
        (categorySlug === 'graphics-cards' && data.gpu_brand) ||
        (categorySlug === 'memory' && data.ram_brand) ||
        (categorySlug === 'motherboards' && data.mobo_brand) ||
        (categorySlug === 'storage' && data.storage_brand) ||
        (categorySlug === 'processors' && data.processor_brand) ||
        (categorySlug === 'cases' && data.case_brand) ||
        (categorySlug === 'refrigeracion' && data.cooling_brand) ||
        (categorySlug === 'power-supplies' && data.psu_brand);

    if (specificBrandField) {
        preparedData.brand = specificBrandField;
    } else if (data.brand) { 
        preparedData.brand = data.brand;
    } else {
        preparedData.brand = null; 
    }
    
    const relevantFieldsForCategory = categorySpecificFieldsMap[categorySlug] || [];
    relevantFieldsForCategory.forEach(fieldKey => {
        if (data[fieldKey] !== undefined && data[fieldKey] !== null && data[fieldKey] !== '') {
            (preparedData as any)[fieldKey] = data[fieldKey];
        } else if (typeof data[fieldKey] === 'boolean') { 
             (preparedData as any)[fieldKey] = data[fieldKey];
        }
    });
    
    if (categorySlug === 'motherboards') {
        preparedData.mobo_wifi_bluetooth = data.mobo_wifi_bluetooth ?? false;
        preparedData.mobo_argb_compatible = data.mobo_argb_compatible ?? false;
    }
    
    const finalDataForFirestore: any = {};
    const allPossibleSpecificFields = Object.values(categorySpecificFieldsMap).flat();

    for (const key in preparedData) {
        const typedKey = key as keyof typeof preparedData;
        
        if (commonFields.includes(typedKey) || typedKey === 'categorySlug' || typedKey === 'brand') {
            finalDataForFirestore[typedKey] = preparedData[typedKey];
            continue;
        }

        if (relevantFieldsForCategory.includes(typedKey)) {
            finalDataForFirestore[typedKey] = preparedData[typedKey];
            continue;
        }
    }
    
    const sourceSpecificBrandKey = 
        (categorySlug === 'graphics-cards' && 'gpu_brand') ||
        (categorySlug === 'memory' && 'ram_brand') ||
        (categorySlug === 'motherboards' && 'mobo_brand') ||
        (categorySlug === 'storage' && 'storage_brand') ||
        (categorySlug === 'processors' && 'processor_brand') ||
        (categorySlug === 'cases' && 'case_brand') ||
        (categorySlug === 'refrigeracion' && 'cooling_brand') ||
        (categorySlug === 'power-supplies' && 'psu_brand');
    
    if (sourceSpecificBrandKey && data[sourceSpecificBrandKey] && finalDataForFirestore.brand === data[sourceSpecificBrandKey]) {
        finalDataForFirestore[sourceSpecificBrandKey] = data[sourceSpecificBrandKey];
    }

    return finalDataForFirestore;
}


export async function createProduct(formData: ProductActionData) {
  if (!configComplete || !firestore) {
    console.error("Firestore is not configured. Cannot create product.");
    return { success: false, error: "Error interno del servidor: Firestore no configurado." };
  }
  try {
    const validatedData = productActionSchema.safeParse(formData);
    if (!validatedData.success) {
      console.error("Validation errors (server-side create):", JSON.stringify(validatedData.error.flatten().fieldErrors, null, 2));
      return { success: false, error: "Error de validación. Revisa los campos.", errors: validatedData.error.flatten().fieldErrors };
    }

    const data = validatedData.data;
    const categoryDetail = categories.find(c => c.name === data.category);
    if (!categoryDetail) {
      return { success: false, error: "Categoría inválida." };
    }

    const productToSave = prepareProductData(data, categoryDetail.slug);
    (productToSave as any).createdAt = serverTimestamp();
    (productToSave as any).updatedAt = serverTimestamp();
    
    await addDoc(collection(firestore, 'products'), productToSave);

    revalidatePath('/admin/products');
    revalidatePath('/products');
    revalidatePath(`/categories/${categoryDetail.slug}`);
    revalidatePath('/'); 

    return { success: true };

  } catch (error: any) {
    console.error("Error creating product (server-side action):", error);
    return { success: false, error: error.message || "No se pudo crear el producto en Firestore." };
  }
}

export async function updateProduct(productId: string, formData: ProductActionData) {
  if (!configComplete || !firestore) {
    console.error("Firestore is not configured. Cannot update product.");
    return { success: false, error: "Error interno del servidor: Firestore no configurado." };
  }
  try {
    const validatedData = productActionSchema.safeParse(formData);
    if (!validatedData.success) {
      console.error("Validation errors (server-side update):", JSON.stringify(validatedData.error.flatten().fieldErrors, null, 2));
      return { success: false, error: "Error de validación.", errors: validatedData.error.flatten().fieldErrors };
    }

    const data = validatedData.data;
    const categoryDetail = categories.find(c => c.name === data.category);
    if (!categoryDetail) {
      return { success: false, error: "Categoría inválida." };
    }

    const productToUpdate = prepareProductData(data, categoryDetail.slug);
    (productToUpdate as any).updatedAt = serverTimestamp();
    
    const productRef = doc(firestore, 'products', productId);
    await updateDoc(productRef, productToUpdate);

    revalidatePath('/admin/products');
    revalidatePath(`/products/${productId}`);
    revalidatePath('/products');
    revalidatePath(`/categories/${categoryDetail.slug}`);
    revalidatePath('/');

    return { success: true };

  } catch (error: any) {
    console.error("Error updating product (server-side action):", error);
    return { success: false, error: error.message || "No se pudo actualizar el producto." };
  }
}

export async function deleteProduct(productId: string) {
  if (!configComplete || !firestore) {
    console.error("Firestore is not configured. Cannot delete product.");
    return { success: false, error: "Error interno del servidor: Firestore no configurado." };
  }
  try {
    if (!productId) {
      return { success: false, error: "ID de producto no válido." };
    }

    const productRef = doc(firestore, 'products', productId);
    const productSnap = await getDoc(productRef);

    if (!productSnap.exists()) {
      return { success: false, error: "Producto no encontrado." };
    }

    const productData = productSnap.data();
    const categorySlug = productData?.categorySlug;

    await deleteDoc(productRef);

    revalidatePath('/admin/products');
    revalidatePath('/products');
    if (categorySlug) {
      revalidatePath(`/categories/${categorySlug}`);
    }
    revalidatePath('/'); 

    return { success: true };
  } catch (error: any) {
    console.error("Error deleting product (server-side action):", error);
    return { success: false, error: error.message || "No se pudo eliminar el producto." };
  }
}
    

    

    

    

