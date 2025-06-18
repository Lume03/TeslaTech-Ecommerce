
import { firestore, configComplete } from '@/lib/firebase/config'; // Added configComplete
import { collection, doc, getDoc, getDocs, query, where, limit, orderBy } from 'firebase/firestore';
// Removed: import type { Timestamp } from 'firebase-admin/firestore'; // No longer directly needed for Order interface client-side
import type { CartItem, UserProfile as AppUserProfile } from '@/contexts/AppContext';


// Define Product interface
export interface Product {
  id: string; // Firestore document ID
  name: string;
  category: string; // Category display name e.g., "Procesadores"
  categorySlug: string; // Category slug e.g., "processors"
  price: number;
  image: string;
  data_ai_hint?: string;
  description?: string;
  isBestseller?: boolean;
  rating?: number; // 1-5
  stock?: number;
  features?: string[]; // Características generales
  brand?: string; // Marca general del producto

  // Campos específicos para Tarjetas Gráficas
  gpu_brand?: 'ASUS' | 'GigaByte' | 'MSI' | 'EVGA';
  gpu_vram?: string; // Ej: "8GB GDDR6X"
  gpuChipset?: 'NVIDIA' | 'AMD';

  // Campos específicos para Memoria RAM
  ram_brand?: 'Corsair' | 'Kingston' | 'G.Skill' | 'Crucial';
  ram_type?: 'DDR4' | 'DDR5';
  ram_format?: 'DIMM' | 'SODIMM';
  ram_capacity?: string; // Ej: "16GB (2x8GB)"
  ram_speed?: string; // Ej: "3200MHz"

  // Campos específicos para Placas Madre
  mobo_brand?: 'Asus' | 'GigaByte' | 'ASRock' | 'MSI';
  mobo_socket?: 'LGA1700' | 'AM4' | 'AM5';
  mobo_ram_type?: 'DDR4' | 'DDR5';
  mobo_wifi_bluetooth?: boolean;
  mobo_argb_compatible?: boolean;

  // Campos específicos para Almacenamiento
  storage_type?: 'HDD' | 'SSD' | 'NVMe M.2';
  storage_capacity?: string; // Ej: "1TB", "512GB"
  storage_brand?: 'Seagate' | 'Western Digital' | 'Crucial' | 'Samsung' | 'Kingston' | 'ADATA';
  storage_speed?: string; // Ej: "150MB/s", "7000MB/s"

  // Campos específicos para Procesadores
  processor_brand?: 'Intel' | 'AMD';
  processor_socket?: 'LGA1700' | 'AM4' | 'AM5';
  processor_cores?: string; // Ej: "8", "16"
  processor_threads?: string; // Ej: "16", "32"

  // Campos específicos para Gabinetes de PC
  case_brand?: 'NZXT' | 'Cooler Master' | 'Thermaltake' | 'Lian Li' | 'Corsair' | 'Hyte' | 'Phanteks' | 'Asus' | 'DeepCool';
  case_color?: 'Blanco' | 'Negro';
  case_mobo_support?: 'ATX/Micro-ATX/ITX' | 'Micro-ATX' | 'ATX' | 'Micro-ATX/ATX' | 'Mini-ITX' | 'Micro-ATX/Mini-ITX';

  // Campos específicos para Refrigeración
  cooling_brand?: 'Noctua' | 'Cooler Master' | 'Corsair' | 'NZXT';
  cooling_size?: '120mm' | '240mm' | '360mm';
  cooling_illumination?: 'ARGB' | 'RGB' | 'Sin RGB';
  cooling_noise_level?: string; // Ej: "25dB"

  // Campos específicos para Fuentes de Poder
  psu_brand?: 'Corsair' | 'Antec' | 'EVGA' | 'Cooler Master' | 'XPG' | 'GigaByte' | 'Asus' | 'Seasonic' | 'NZXT' | 'Thermaltake';
  psu_certification?: '80 PLUS Bronze' | '80 PLUS Gold' | '80 PLUS Platinum' | '80 PLUS Titanium';
  psu_format?: 'ATX' | 'Micro ATX';
  psu_power?: string; // Ej: "750W"
}

// Categories can remain local as they are fairly static UI data
export const categories = [
  { id: 'processors', name: 'Procesadores', slug: 'processors' },
  { id: 'graphics-cards', name: 'Tarjetas Gráficas', slug: 'graphics-cards' },
  { id: 'motherboards', name: 'Placas Madre', slug: 'motherboards' },
  { id: 'memory', name: 'Memoria (RAM)', slug: 'memory' },
  { id: 'storage', name: 'Almacenamiento (SSD/HDD)', slug: 'storage' },
  { id: 'power-supplies', name: 'Fuentes de Poder', slug: 'power-supplies' },
  { id: 'cases', name: 'Gabinetes de PC', slug: 'cases' },
  { id: 'cooling', name: 'Refrigeración', slug: 'refrigeracion' },
];

const productsCollectionRef = () => {
  if (!configComplete || !firestore) {
    return null;
  }
  return collection(firestore, 'products');
};

// Helper to convert Firestore doc to Product
const mapDocToProduct = (documentSnapshot: any): Product => {
  const data = documentSnapshot.data();
  return {
    id: documentSnapshot.id,
    ...data,
  } as Product;
};

// --- Product Firestore-based data fetching functions ---

export const getAllProductsFromDB = async (): Promise<Product[]> => {
  const productsCol = productsCollectionRef();
  if (!productsCol) {
    console.error("Firestore is not configured. Cannot fetch all products.");
    return [];
  }
  try {
    const snapshot = await getDocs(productsCol);
    if (snapshot.empty) {
      // console.log('No products found in Firestore.'); // Less noisy for normal operation
      return [];
    }
    return snapshot.docs.map(mapDocToProduct);
  } catch (error) {
    console.error("Error fetching all products:", error);
    return [];
  }
};

export const getProductByIdFromDB = async (productId: string): Promise<Product | null> => {
  if (!configComplete || !firestore) {
    console.error("Firestore is not configured. Cannot fetch product by ID.");
    return null;
  }
  if (!productId) {
    console.warn("Attempted to fetch product with invalid ID.");
    return null;
  }
  try {
    const productDocRef = doc(firestore, 'products', productId);
    const docSnap = await getDoc(productDocRef);
    if (docSnap.exists()) {
      return mapDocToProduct(docSnap);
    } else {
      // console.log(`No product found with ID: ${productId}`);
      return null;
    }
  } catch (error) {
    console.error(`Error fetching product by ID ${productId}:`, error);
    return null;
  }
};

export const getProductsByCategorySlugFromDB = async (categorySlug: string): Promise<Product[]> => {
  const productsCol = productsCollectionRef();
  if (!productsCol) {
    console.error("Firestore is not configured. Cannot fetch products by category.");
    return [];
  }
  if (!categorySlug) {
    console.warn("Attempted to fetch products with invalid category slug.");
    return [];
  }
  try {
    const categoryQuery = query(productsCol, where('categorySlug', '==', categorySlug));
    const snapshot = await getDocs(categoryQuery);
    if (snapshot.empty) {
      // console.log(`No products found for category slug: ${categorySlug}`);
      return [];
    }
    return snapshot.docs.map(mapDocToProduct);
  } catch (error) {
    console.error(`Error fetching products by category slug ${categorySlug}:`, error);
    return [];
  }
};

export const getBestsellersFromDB = async (count: number = 8): Promise<Product[]> => {
  const productsCol = productsCollectionRef();
  if (!productsCol) {
    console.error("Firestore is not configured. Cannot fetch bestsellers.");
    return [];
  }
  try {
    const bestsellerQuery = query(
      productsCol,
      where('isBestseller', '==', true),
      limit(count)
    );
    const snapshot = await getDocs(bestsellerQuery);
    if (snapshot.empty) {
      // console.log('No bestseller products found.');
      return [];
    }
    return snapshot.docs.map(mapDocToProduct);
  } catch (error) {
    console.error("Error fetching bestsellers:", error);
    return [];
  }
};

// --- Order Data Structures ---
export type OrderStatus =
  | 'payment_pending'
  | 'pending_shipment'
  | 'shipped'
  | 'delivered'
  | 'cancelled_by_user'
  | 'cancelled_by_admin'
  | 'payment_failed'
  | 'refunded';

export const orderStatusTranslations: Record<OrderStatus, string> = {
  payment_pending: 'Pago Pendiente',
  pending_shipment: 'Pendiente de Envío',
  shipped: 'Enviado',
  delivered: 'Entregado',
  cancelled_by_user: 'Cancelado por Usuario',
  cancelled_by_admin: 'Cancelado por Admin',
  payment_failed: 'Pago Fallido',
  refunded: 'Reembolsado',
};


export interface OrderItem extends CartItem {} 

export interface ShippingAddress {
  firstName: string | null;
  lastName: string | null;
  dni: string | null;
  phoneNumber: string | null;
  address: string | null;
  email: string | null; 
}

export interface PaymentDetails {
  gateway: 'mercadopago' | 'stripe'; // To know which gateway processed it
  paymentId: string | null; // MercadoPago payment_id or Stripe PaymentIntent ID
  preferenceId?: string | null; // MercadoPago preference_id (optional as it's MP specific)
  status: string | null; // 'approved', 'succeeded', 'pending', 'failed', etc.
  paymentMethodId?: string | null; // e.g., 'visa', 'mastercard' from gateway
  paymentTypeId?: string | null; // e.g., 'credit_card' from gateway
  externalReference?: string | null; // If you used one
  stripeSessionId?: string | null; // Specific for Stripe, if you want to store it
}

export interface Order {
  id: string; // Firestore document ID
  userId: string;
  userEmail: string | null;
  userName: string | null; // displayName
  items: OrderItem[];
  totalAmount: number;
  orderStatus: OrderStatus;
  shippingAddress: ShippingAddress;
  paymentDetails: PaymentDetails;
  createdAt: Date; // Changed from Timestamp
  updatedAt: Date; // Changed from Timestamp
  shippedAt?: Date | null; // Changed from Timestamp
}
export const mapDocToOrder = (documentSnapshot: any): Order => {
  const data = documentSnapshot.data();
  return {
    id: documentSnapshot.id,
    ...data,
  } as Order;
};

export const buildShippingAddressFromProfile = (profile: AppUserProfile | null): ShippingAddress => {
  return {
    firstName: profile?.firstName || null,
    lastName: profile?.lastName || null,
    dni: profile?.dni || null,
    phoneNumber: profile?.phoneNumber || null,
    address: profile?.address || null,
    email: profile?.email || null,
  };
};
