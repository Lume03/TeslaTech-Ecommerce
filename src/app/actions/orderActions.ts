
'use server';

import { getFirestoreAdmin } from '@/lib/firebase/admin';
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
  const firestoreService = getFirestoreAdmin();
  const actionName = `${actionLogPrefix}/createOrder`;
  console.log(`${actionName}: Server Action invoked for user ID: ${orderData.userId}`);
  
  try {
    if (!orderData.userId) {
      console.error(`${actionName}: User ID is required to create an order.`);
      return { success: false, error: "Falta el ID del usuario." };
    }

    const newOrderRef = firestoreService.collection('orders').doc();
    
    // This mapping ensures that only fields defined in OrderItem are passed to the database,
    // preventing any extraneous properties from the cart from being saved.
    const itemsWithEnsuredFields: OrderItem[] = orderData.items.map(item => ({
      id: String(item.id || ''),
      name: String(item.name || 'Producto Desconocido'),
      category: String(item.category || 'Sin Categoría'),
      price: Number(item.price || 0),
      image: String(item.image || ''),
      quantity: Number(item.quantity || 0),
      categorySlug: String(item.categorySlug || ''),
      // Add other optional fields from Product interface, ensuring they are present or undefined
      description: item.description || undefined,
      brand: item.brand || undefined,
      rating: item.rating ?? undefined,
      stock: item.stock ?? undefined,
      features: safeProcessFeatures(item.features),
      isBestseller: !!item.isBestseller,
      gpuChipset: item.gpuChipset,
      processor_socket: item.processor_socket,
      mobo_socket: item.mobo_socket,
      ram_type: item.ram_type,
      mobo_ram_type: item.mobo_ram_type,
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

      // Step 1: Get product references and quantities.
      for (const item of itemsWithEnsuredFields) {
        if (!item.id) {
          console.error(`${actionName}: Item without ID in the order. Item:`, item);
          throw new Error(`Un artículo en tu pedido no tiene un ID válido. Contacta a soporte.`);
        }
        productRefsAndQuantities.push({
          ref: firestoreService.collection('products').doc(item.id),
          quantity: item.quantity,
          name: item.name
        });
      }

      // Step 2: Read all products within the transaction.
      const productDocsPromises = productRefsAndQuantities.map(pq => transaction.get(pq.ref));
      const productDocsSnapshots = await Promise.all(productDocsPromises);

      // Step 3: Validate stock and prepare updates.
      for (let i = 0; i < productRefsAndQuantities.length; i++) {
        const { ref, quantity, name } = productRefsAndQuantities[i];
        const productDoc = productDocsSnapshots[i];

        if (!productDoc.exists) {
          console.error(`${actionName}: Product with ID ${ref.id} (${name}) not found during transaction.`);
          throw new Error(`Producto "${name}" ya no está disponible. Contacta a soporte.`);
        }

        const productData = productDoc.data() as Product;

        if (typeof productData.stock !== 'number') {
          console.error(`${actionName}: Product with ID ${ref.id} (${name}) does not have a numeric 'stock' field. Stock: ${productData.stock}`);
          throw new Error(`Stock inválido para el producto "${name}". Contacta a soporte.`);
        }

        if (productData.stock < quantity) {
          console.warn(`${actionName}: Insufficient stock for product ID ${ref.id} (${name}). Needed: ${quantity}, Available: ${productData.stock}`);
          throw new Error(`No hay suficiente stock para "${name}". Disponible: ${productData.stock}, Pedido: ${quantity}.`);
        }

        const newStock = productData.stock - quantity;
        transaction.update(ref, { stock: newStock, updatedAt: FieldValue.serverTimestamp() }); // Admin SDK FieldValue
        console.log(`${actionName}: Stock for product ${ref.id} scheduled to update to ${newStock} in transaction.`);
      }
      
      // Step 4: Create the order document.
      transaction.set(newOrderRef, finalOrderData);
      console.log(`${actionName}: Order ${newOrderRef.id} scheduled for creation in transaction.`);
    });
    
    console.log(`${actionName}: ✅ Transaction completed. Order created with ID: ${newOrderRef.id} and stocks updated.`);
    
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
    
    console.error(`${actionName}: ❌❌❌ Error creating order: Code: ${errorCode}, Message: ${errorMessage}, Stack: ${error.stack}`);
    
    let userFacingError = "Ocurrió un error procesando tu pedido. Por favor, intenta de nuevo o contacta a soporte. (Ref: SVR_ORD_CRT_GEN_TRANSACTION)";
    
    if (errorMessage.includes("No hay suficiente stock para") || errorMessage.includes("ya no está disponible")) {
        userFacingError = errorMessage + " (Ref: SVR_ORD_CRT_STK)";
    }
    
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
  const firestoreService = getFirestoreAdmin();
  const actionName = `${actionLogPrefix}/getUserOrders`;
  if (!userId) {
    console.log(`${actionName}: No se proporcionó un ID de usuario para buscar órdenes.`);
    return [];
  }

  try {
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
        price: Number(itemData.price || 0),
        image: String(itemData.image || ''),
        quantity: Number(itemData.quantity || 0),
        categorySlug: String(itemData.categorySlug || ''),
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
  const firestoreService = getFirestoreAdmin();
  const actionName = `${actionLogPrefix}/getAllOrdersAdmin`;
  try {
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
        price: Number(itemData.price || 0),
        image: String(itemData.image || ''),
        quantity: Number(itemData.quantity || 0),
        categorySlug: String(itemData.categorySlug || ''),
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
  const firestoreService = getFirestoreAdmin();
  const actionName = `${actionLogPrefix}/updateOrderStatusAdmin`;
  if (!orderId || !newStatus) {
    return { 
      success: false, 
      error: "Se requiere ID de la orden y el nuevo estado." 
    };
  }

  try {
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
