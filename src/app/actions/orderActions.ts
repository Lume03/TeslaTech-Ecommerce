
// Ruta: src/app/actions/orderActions.ts

'use server';

import adminDefault from '@/lib/firebase/admin'; 
import type { App } from 'firebase-admin/app';
import { FieldValue, type Firestore } from 'firebase-admin/firestore';
import type { Order, OrderItem, OrderStatus, ShippingAddress, PaymentDetails, Product } from '@/lib/data'; 
import { revalidatePath } from 'next/cache';

const actionLogPrefix = "OrderAction";

/**
 * Helper function to safely convert Firestore Timestamps or server timestamps to Date objects.
 * Returns null if the input is invalid or undefined.
 */
function toDateSafe(timestamp: any): Date | null {
  if (!timestamp) return null;
  if (timestamp instanceof Date) return timestamp;
  if (timestamp && typeof timestamp.toDate === 'function') { 
    return timestamp.toDate();
  }
  if (timestamp && typeof timestamp.seconds === 'number' && typeof timestamp.nanoseconds === 'number') { 
    return new Date(timestamp.seconds * 1000 + timestamp.nanoseconds / 1000000);
  }
  const date = new Date(timestamp);
  if (!isNaN(date.getTime())) {
    return date;
  }
  console.warn(`${actionLogPrefix}: Could not convert timestamp to Date:`, timestamp);
  return null;
}

const safeProcessFeatures = (featuresInput: any): string[] => {
  if (Array.isArray(featuresInput)) {
    return featuresInput.filter(f => typeof f === 'string').map(f_str => String(f_str).trim()).filter(f => f);
  }
  if (typeof featuresInput === 'string') {
    const trimmedFeatures = featuresInput.trim();
    return trimmedFeatures !== '' ? trimmedFeatures.split('\n').map(s => s.trim()).filter(s => s) : [];
  }
  return []; 
};


/**
 * Crea una nueva orden en Firestore y actualiza el stock de los productos.
 */
export async function createOrderAction(
  orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt' | 'shippedAt'>
): Promise<{ success: boolean; orderId?: string; error?: string }> {
  const actionName = `${actionLogPrefix}/createOrder`;
  console.log(`${actionName}: Server Action invoked for user ID: ${orderData.userId}`);
  
  let firestoreService: Firestore;
  let adminApp: App;

  try {
    console.log(`${actionName}: Attempting to get initialized Admin App and Firestore service.`);
    const adminModule = await import('@/lib/firebase/admin');
    adminApp = adminModule.getInitializedAdminApp();
    firestoreService = adminModule.getFirestoreAdmin();

    if (!adminApp) { 
      console.error(`${actionName}: CRITICAL - getInitializedAdminApp() returned null/undefined.`);
      return { success: false, error: "Error interno del servidor (FI-SA-APP-NULL-CA). Contacta a soporte." };
    }
    const adminProject = adminApp.options?.projectId;
    if (!adminProject || adminProject.trim() === "") { 
      console.error(`${actionName}: CRITICAL Project ID is undefined or empty in Admin SDK options. App name: ${adminApp.name}, ProjectID from options: '${adminProject}'`);
      return { success: false, error: "Error interno del servidor al procesar el pedido (FI-SA-PID-EMPTY-CA). Contacta a soporte." };
    }
        
    if (!orderData.userId) {
      console.error(`${actionName}: User ID is required to create an order.`);
      return { success: false, error: "Falta el ID del usuario." };
    }

    const newOrderRef = firestoreService.collection('orders').doc();
    
    const itemsWithEnsuredFields: OrderItem[] = orderData.items.map(item => ({
      id: String(item.id || ''),
      name: String(item.name || 'Producto Desconocido'),
      category: String(item.category || 'Sin Categoría'),
      categorySlug: String(item.categorySlug || ''),
      price: Number(item.price || 0),
      image: String(item.image || ''),
      quantity: Number(item.quantity || 0),
      features: safeProcessFeatures(item.features),
      data_ai_hint: item.data_ai_hint || undefined,
      description: item.description || undefined,
      isBestseller: !!item.isBestseller,
      rating: item.rating !== undefined && item.rating !== null ? Number(item.rating) : undefined,
      stock: item.stock !== undefined && item.stock !== null ? Number(item.stock) : undefined,
      brand: item.brand || undefined,
      gpu_brand: item.gpu_brand || undefined,
      gpu_vram: item.gpu_vram || undefined,
      gpuChipset: item.gpuChipset || undefined,
      ram_brand: item.ram_brand || undefined,
      ram_type: item.ram_type || undefined,
      ram_format: item.ram_format || undefined,
      ram_capacity: item.ram_capacity || undefined,
      ram_speed: item.ram_speed || undefined,
      mobo_brand: item.mobo_brand || undefined,
      mobo_socket: item.mobo_socket || undefined,
      mobo_ram_type: item.mobo_ram_type || undefined,
      mobo_wifi_bluetooth: !!item.mobo_wifi_bluetooth,
      mobo_argb_compatible: !!item.mobo_argb_compatible,
      storage_type: item.storage_type || undefined,
      storage_capacity: item.storage_capacity || undefined,
      storage_brand: item.storage_brand || undefined,
      storage_speed: item.storage_speed || undefined,
      processor_brand: item.processor_brand || undefined,
      processor_socket: item.processor_socket || undefined,
      processor_cores: item.processor_cores || undefined,
      processor_threads: item.processor_threads || undefined,
      case_brand: item.case_brand || undefined,
      case_color: item.case_color || undefined,
      case_mobo_support: item.case_mobo_support || undefined,
      cooling_brand: item.cooling_brand || undefined,
      cooling_size: item.cooling_size || undefined,
      cooling_illumination: item.cooling_illumination || undefined,
      cooling_noise_level: item.cooling_noise_level || undefined,
      psu_brand: item.psu_brand || undefined,
      psu_certification: item.psu_certification || undefined,
      psu_format: item.psu_format || undefined,
      psu_power: item.psu_power || undefined,
    }));

    const finalOrderData = {
      ...orderData,
      items: itemsWithEnsuredFields,
      id: newOrderRef.id, 
      createdAt: FieldValue.serverTimestamp(), // Admin SDK FieldValue
      updatedAt: FieldValue.serverTimestamp(), // Admin SDK FieldValue
    };

    await firestoreService.runTransaction(async (transaction) => {
      const productRefsAndQuantities: { ref: FirebaseFirestore.DocumentReference, quantity: number, name: string }[] = [];

      // Paso 1: Obtener referencias de productos y cantidades.
      for (const item of itemsWithEnsuredFields) {
        if (!item.id) {
          console.error(`${actionName}: Item sin ID en el pedido. Item:`, item);
          throw new Error(`Un artículo en tu pedido no tiene un ID válido. Contacta a soporte.`);
        }
        productRefsAndQuantities.push({
          ref: firestoreService.collection('products').doc(item.id),
          quantity: item.quantity,
          name: item.name
        });
      }

      // Paso 2: Leer todos los productos dentro de la transacción.
      const productDocsPromises = productRefsAndQuantities.map(pq => transaction.get(pq.ref));
      const productDocsSnapshots = await Promise.all(productDocsPromises);

      // Paso 3: Validar stock y preparar actualizaciones.
      for (let i = 0; i < productRefsAndQuantities.length; i++) {
        const { ref, quantity, name } = productRefsAndQuantities[i];
        const productDoc = productDocsSnapshots[i];

        if (!productDoc.exists) {
          console.error(`${actionName}: Producto con ID ${ref.id} (${name}) no encontrado durante la transacción.`);
          throw new Error(`Producto "${name}" ya no está disponible. Contacta a soporte.`);
        }

        const productData = productDoc.data() as Product;

        if (typeof productData.stock !== 'number') {
          console.error(`${actionName}: Producto con ID ${ref.id} (${name}) no tiene un campo 'stock' numérico. Stock: ${productData.stock}`);
          throw new Error(`Stock inválido para el producto "${name}". Contacta a soporte.`);
        }

        if (productData.stock < quantity) {
          console.warn(`${actionName}: Stock insuficiente para producto ID ${ref.id} (${name}). Necesario: ${quantity}, Disponible: ${productData.stock}`);
          throw new Error(`No hay suficiente stock para "${name}". Disponible: ${productData.stock}, Pedido: ${quantity}.`);
        }

        const newStock = productData.stock - quantity;
        transaction.update(ref, { stock: newStock, updatedAt: FieldValue.serverTimestamp() }); // Admin SDK FieldValue
        console.log(`${actionName}: Stock para producto ${ref.id} programado para actualizar a ${newStock} en transacción.`);
      }
      
      // Paso 4: Crear el documento de la orden.
      transaction.set(newOrderRef, finalOrderData);
      console.log(`${actionName}: Orden ${newOrderRef.id} programada para creación en transacción.`);
    });
    
    console.log(`${actionName}: ✅ Transacción completada. Orden creada con ID: ${newOrderRef.id} y stocks actualizados.`);
    
    // Revalidate paths AFTER successful transaction
    revalidatePath('/orders'); 
    revalidatePath('/admin/orders');
    revalidatePath('/admin/products'); 
    revalidatePath('/products'); 
    itemsWithEnsuredFields.forEach(item => {
      revalidatePath(`/products/${item.id}`);
      if (item.categorySlug) {
        revalidatePath(`/categories/${item.categorySlug}`);
      }
    });
    revalidatePath('/'); 

    return { success: true, orderId: newOrderRef.id };

  } catch (error: any) {
    const errorCode = error.code || 'UNKNOWN_FIRESTORE_ERROR';
    const errorMessage = error.message || 'An unexpected error occurred.';
    const errorName = error.name || 'Error';
    
    console.error(`${actionName}: ❌❌❌ Error creating order: Name: ${errorName}, Code: ${errorCode}, Message: ${errorMessage}, Stack: ${error.stack}`);
    
    let userFacingError = "Ocurrió un error procesando tu pedido. Por favor, intenta de nuevo o contacta a soporte. (Ref: SVR_ORD_CRT_GEN_TRANSACTION)";
    
    if (error.message?.includes("No hay suficiente stock para") || error.message?.includes("ya no está disponible")) {
        console.error(`${actionName}: Error de transacción (stock/producto no encontrado): ${error.message}`);
        userFacingError = error.message + " (Ref: SVR_ORD_CRT_STK)";
    } else if (error.message?.includes("Firebase Admin SDK: Failed to obtain a valid, fully initialized app instance")) {
        userFacingError = "Error crítico del servidor al inicializar servicios (FI-SA-GIA-F-CA). Contacta a soporte.";
    } // ... (otros manejos de errores específicos si es necesario)
    
    return { 
      success: false, 
      error: userFacingError
    };
  }
}

/**
 * Obtiene todas las órdenes de un usuario específico.
 */
export async function getUserOrdersAction(userId: string): Promise<Order[]> {
  const actionName = `${actionLogPrefix}/getUserOrders`;
  if (!userId) {
    console.log(`${actionName}: No se proporcionó un ID de usuario para buscar órdenes.`);
    return [];
  }

  try {
    const adminModule = await import('@/lib/firebase/admin');
    const firestoreService = adminModule.getFirestoreAdmin();
    console.log(`${actionName}: Attempting to fetch orders for user ID: ${userId}`);
    const ordersCol = firestoreService.collection('orders');
    const q = ordersCol
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc');
    
    const snapshot = await q.get();

    if (snapshot.empty) {
      console.log(`${actionName}: No orders found for user ID: ${userId}`);
      return [];
    }
    
    const orders = snapshot.docs.map(doc => {
      const data = doc.data();
      const items: OrderItem[] = (data.items || []).map((itemData: any): OrderItem => ({
        id: String(itemData.id || ''),
        name: String(itemData.name || 'Producto Desconocido'),
        category: String(itemData.category || 'Sin Categoría'),
        categorySlug: String(itemData.categorySlug || ''),
        price: Number(itemData.price || 0),
        image: String(itemData.image || ''),
        quantity: Number(itemData.quantity || 0),
        features: safeProcessFeatures(itemData.features),
        data_ai_hint: itemData.data_ai_hint || undefined,
        description: itemData.description || undefined,
        isBestseller: !!itemData.isBestseller,
        rating: itemData.rating !== undefined && itemData.rating !== null ? Number(itemData.rating) : undefined,
        stock: itemData.stock !== undefined && itemData.stock !== null ? Number(itemData.stock) : undefined,
        brand: itemData.brand || undefined,
        gpu_brand: itemData.gpu_brand || undefined,
        gpu_vram: itemData.gpu_vram || undefined,
        gpuChipset: itemData.gpuChipset || undefined,
        ram_brand: itemData.ram_brand || undefined,
        ram_type: itemData.ram_type || undefined,
        ram_format: itemData.ram_format || undefined,
        ram_capacity: itemData.ram_capacity || undefined,
        ram_speed: itemData.ram_speed || undefined,
        mobo_brand: itemData.mobo_brand || undefined,
        mobo_socket: itemData.mobo_socket || undefined,
        mobo_ram_type: itemData.mobo_ram_type || undefined,
        mobo_wifi_bluetooth: !!itemData.mobo_wifi_bluetooth,
        mobo_argb_compatible: !!itemData.mobo_argb_compatible,
        storage_type: itemData.storage_type || undefined,
        storage_capacity: itemData.storage_capacity || undefined,
        storage_brand: itemData.storage_brand || undefined,
        storage_speed: itemData.storage_speed || undefined,
        processor_brand: itemData.processor_brand || undefined,
        processor_socket: itemData.processor_socket || undefined,
        processor_cores: itemData.processor_cores || undefined,
        processor_threads: itemData.processor_threads || undefined,
        case_brand: itemData.case_brand || undefined,
        case_color: itemData.case_color || undefined,
        case_mobo_support: itemData.case_mobo_support || undefined,
        cooling_brand: itemData.cooling_brand || undefined,
        cooling_size: itemData.cooling_size || undefined,
        cooling_illumination: itemData.cooling_illumination || undefined,
        cooling_noise_level: itemData.cooling_noise_level || undefined,
        psu_brand: itemData.psu_brand || undefined,
        psu_certification: itemData.psu_certification || undefined,
        psu_format: itemData.psu_format || undefined,
        psu_power: itemData.psu_power || undefined,
      }));

      return {
        id: doc.id,
        userId: String(data.userId), 
        userEmail: data.userEmail || null,
        userName: data.userName || null,
        items, 
        totalAmount: Number(data.totalAmount || 0),
        orderStatus: data.orderStatus as OrderStatus || 'payment_pending',
        shippingAddress: data.shippingAddress as ShippingAddress,
        paymentDetails: data.paymentDetails as PaymentDetails,
        createdAt: toDateSafe(data.createdAt) || new Date(0), 
        updatedAt: toDateSafe(data.updatedAt) || new Date(0), 
        shippedAt: toDateSafe(data.shippedAt), 
      };
    });
    console.log(`${actionName}: Successfully fetched ${orders.length} orders for user ID: ${userId}`);
    return orders;
  } catch (error: any) {
    console.error(`${actionName}: ❌ Error fetching orders for user ${userId}:`, error.message, error.stack);
    return [];
  }
}

/**
 * Obtiene TODAS las órdenes para el panel de administración.
 */
export async function getAllOrdersAdminAction(): Promise<Order[]> {
  const actionName = `${actionLogPrefix}/getAllOrdersAdmin`;
  try {
    const adminModule = await import('@/lib/firebase/admin');
    const firestoreService = adminModule.getFirestoreAdmin();
    console.log(`${actionName}: Attempting to fetch all orders for admin...`);
    const ordersCol = firestoreService
      .collection('orders')
      .orderBy('createdAt', 'desc');
    
    const snapshot = await ordersCol.get();

    if (snapshot.empty) {
      console.log(`${actionName}: No orders found for admin.`);
      return [];
    }
    
    const orders = snapshot.docs.map(doc => {
      const data = doc.data();
      const items: OrderItem[] = (data.items || []).map((itemData: any): OrderItem => ({
        id: String(itemData.id || ''),
        name: String(itemData.name || 'Producto Desconocido'),
        category: String(itemData.category || 'Sin Categoría'),
        categorySlug: String(itemData.categorySlug || ''),
        price: Number(itemData.price || 0),
        image: String(itemData.image || ''),
        quantity: Number(itemData.quantity || 0),
        features: safeProcessFeatures(itemData.features),
        data_ai_hint: itemData.data_ai_hint || undefined,
        description: itemData.description || undefined,
        isBestseller: !!itemData.isBestseller,
        rating: itemData.rating !== undefined && itemData.rating !== null ? Number(itemData.rating) : undefined,
        stock: itemData.stock !== undefined && itemData.stock !== null ? Number(itemData.stock) : undefined,
        brand: itemData.brand || undefined,
        gpu_brand: itemData.gpu_brand || undefined,
        gpu_vram: itemData.gpu_vram || undefined,
        gpuChipset: itemData.gpuChipset || undefined,
        ram_brand: itemData.ram_brand || undefined,
        ram_type: itemData.ram_type || undefined,
        ram_format: itemData.ram_format || undefined,
        ram_capacity: itemData.ram_capacity || undefined,
        ram_speed: itemData.ram_speed || undefined,
        mobo_brand: itemData.mobo_brand || undefined,
        mobo_socket: itemData.mobo_socket || undefined,
        mobo_ram_type: itemData.mobo_ram_type || undefined,
        mobo_wifi_bluetooth: !!itemData.mobo_wifi_bluetooth,
        mobo_argb_compatible: !!itemData.mobo_argb_compatible,
        storage_type: itemData.storage_type || undefined,
        storage_capacity: itemData.storage_capacity || undefined,
        storage_brand: itemData.storage_brand || undefined,
        storage_speed: itemData.storage_speed || undefined,
        processor_brand: itemData.processor_brand || undefined,
        processor_socket: itemData.processor_socket || undefined,
        processor_cores: itemData.processor_cores || undefined,
        processor_threads: itemData.processor_threads || undefined,
        case_brand: itemData.case_brand || undefined,
        case_color: itemData.case_color || undefined,
        case_mobo_support: itemData.case_mobo_support || undefined,
        cooling_brand: itemData.cooling_brand || undefined,
        cooling_size: itemData.cooling_size || undefined,
        cooling_illumination: itemData.cooling_illumination || undefined,
        cooling_noise_level: itemData.cooling_noise_level || undefined,
        psu_brand: itemData.psu_brand || undefined,
        psu_certification: itemData.psu_certification || undefined,
        psu_format: itemData.psu_format || undefined,
        psu_power: itemData.psu_power || undefined,
      }));

      return {
        id: doc.id,
        userId: String(data.userId),
        userEmail: data.userEmail || null,
        userName: data.userName || null,
        items,
        totalAmount: Number(data.totalAmount || 0),
        orderStatus: data.orderStatus as OrderStatus || 'payment_pending',
        shippingAddress: data.shippingAddress as ShippingAddress,
        paymentDetails: data.paymentDetails as PaymentDetails,
        createdAt: toDateSafe(data.createdAt) || new Date(0), 
        updatedAt: toDateSafe(data.updatedAt) || new Date(0), 
        shippedAt: toDateSafe(data.shippedAt),
      };
    });
    console.log(`${actionName}: Successfully fetched ${orders.length} orders for admin.`);
    return orders;
  } catch (error: any) {
    console.error(`${actionName}: ❌ Error fetching all orders for admin:`, error.message, error.stack);
    return [];
  }
}

/**
 * Actualiza el estado de una orden específica (acción de administrador).
 */
export async function updateOrderStatusAdminAction(
  orderId: string, 
  newStatus: OrderStatus
): Promise<{ success: boolean; error?: string }> {
  const actionName = `${actionLogPrefix}/updateOrderStatusAdmin`;
  if (!orderId || !newStatus) {
    return { 
      success: false, 
      error: "Se requiere ID de la orden y el nuevo estado." 
    };
  }

  try {
    const adminModule = await import('@/lib/firebase/admin');
    const firestoreService = adminModule.getFirestoreAdmin();
    console.log(`${actionName}: Attempting to update order ${orderId} to status ${newStatus}`);
    const orderRef = firestoreService.collection('orders').doc(orderId);
    
    const updateData: any = {
      orderStatus: newStatus,
      updatedAt: FieldValue.serverTimestamp(), // Admin SDK FieldValue
    };
    
    if (newStatus === 'shipped') {
      updateData.shippedAt = FieldValue.serverTimestamp(); // Admin SDK FieldValue
    }
    
    await orderRef.update(updateData);
    console.log(`${actionName}: Successfully updated order ${orderId} to status ${newStatus}`);

    revalidatePath('/admin/orders');
    revalidatePath('/orders'); 
    
    return { success: true };
    
  } catch (error: any) {
    console.error(`${actionName}: ❌ Error updating order status for ${orderId}:`, error.message, error.stack);
    return { 
      success: false, 
      error: "Ocurrió un error actualizando el estado. Por favor, intenta de nuevo o contacta a soporte. (Ref: SVR_ORD_UPD)"
    };
  }
}

