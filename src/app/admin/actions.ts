
"use server";
import { getFirestoreAdmin } from '@/lib/firebase/admin';
import type { Order, Product, OrderStatus, Complaint } from '@/lib/data';
import { categories } from '@/lib/data'; 
import { FieldValue, Timestamp } from 'firebase-admin/firestore'; 
import { 
  startOfDay, endOfDay, 
  startOfWeek, endOfWeek, 
  startOfMonth, endOfMonth, 
  subDays, subMonths,
  format as formatDateFns
} from 'date-fns';
import { es } from 'date-fns/locale';
import { revalidatePath } from 'next/cache';


export async function getAdminDashboardStatsAction(): Promise<{ totalSales: number; totalStock: number; newOrdersCount: number; }> {
  try {
    const firestore = getFirestoreAdmin();
    let totalSales = 0;
    let totalStock = 0;
    let newOrdersCount = 0;

    const deliveredOrdersQuery = firestore.collection('orders').where('orderStatus', '==', 'delivered');
    const deliveredOrdersSnapshot = await deliveredOrdersQuery.get();
    deliveredOrdersSnapshot.forEach(doc => {
      const orderData = doc.data() as Order;
      if (typeof orderData.totalAmount === 'number') {
        totalSales += orderData.totalAmount;
      }
    });

    const productsSnapshot = await firestore.collection('products').get();
    productsSnapshot.forEach(doc => {
      const productData = doc.data() as Product;
      if (typeof productData.stock === 'number' && productData.stock > 0) {
        totalStock += productData.stock;
      }
    });

    const newOrdersQuery = firestore.collection('orders').where('orderStatus', 'in', ['pending_shipment', 'payment_pending']);
    const newOrdersSnapshot = await newOrdersQuery.get();
    newOrdersCount = newOrdersSnapshot.size;
    
    return { totalSales, totalStock, newOrdersCount };

  } catch (error: any) {
    console.error("Error in getAdminDashboardStatsAction:", error);
    if (error.code === 'FAILED_PRECONDITION' && error.message.includes('index')) {
        const helpfulMessage = "La consulta de estadísticas requiere un índice de Firestore. Revisa los logs del servidor para ver el enlace y crearlo. Generalmente es para 'orders' en el campo 'orderStatus'.";
        console.error(helpfulMessage);
        throw new Error(helpfulMessage);
    }
    throw new Error(`No se pudieron obtener las estadísticas del panel: ${error.message}`);
  }
}

export interface SalesByCategoryData {
  category: string;
  totalSales: number;
}

export async function getSalesByCategoryAction(): Promise<SalesByCategoryData[]> {
  try {
    const firestore = getFirestoreAdmin();
    const salesMap = new Map<string, number>();

    const deliveredOrdersQuery = firestore.collection('orders').where('orderStatus', '==', 'delivered');
    const deliveredOrdersSnapshot = await deliveredOrdersQuery.get();

    deliveredOrdersSnapshot.forEach(doc => {
      const order = doc.data() as Order;
      order.items.forEach(item => {
        const categoryName = item.category; 
        salesMap.set(categoryName, (salesMap.get(categoryName) || 0) + (item.price * item.quantity));
      });
    });

    const salesByCategory = Array.from(salesMap.entries())
      .map(([category, totalSales]) => ({ category, totalSales }))
      .sort((a, b) => b.totalSales - a.totalSales);
      
    return salesByCategory;

  } catch (error: any) {
    console.error("Error in getSalesByCategoryAction:", error);
    if (error.code === 'FAILED_PRECONDITION' && error.message.includes('index')) {
        const helpfulMessage = "La consulta de ventas por categoría requiere un índice en Firestore (campo 'orderStatus' en 'orders'). Revisa los logs del servidor.";
        console.error(helpfulMessage);
        throw new Error(helpfulMessage);
    }
    throw new Error(`No se pudieron obtener las ventas por categoría: ${error.message}`);
  }
}

export interface TopSellingProductData {
  name: string;
  totalSales: number;
}

export async function getTopSellingProductsAction(limit: number = 5): Promise<TopSellingProductData[]> {
  try {
    const firestore = getFirestoreAdmin();
    const productSalesMap = new Map<string, { totalSales: number; name: string }>();

    const deliveredOrdersQuery = firestore.collection('orders').where('orderStatus', '==', 'delivered');
    const deliveredOrdersSnapshot = await deliveredOrdersQuery.get();

    deliveredOrdersSnapshot.forEach(doc => {
      const order = doc.data() as Order;
      order.items.forEach(item => {
        const currentSale = item.price * item.quantity;
        const existing = productSalesMap.get(item.id); 
        if (existing) {
          productSalesMap.set(item.id, { ...existing, totalSales: existing.totalSales + currentSale });
        } else {
          productSalesMap.set(item.id, { totalSales: currentSale, name: item.name });
        }
      });
    });

    const topProducts = Array.from(productSalesMap.values())
      .sort((a, b) => b.totalSales - a.totalSales)
      .slice(0, limit);
      
    return topProducts;

  } catch (error: any) {
    console.error("Error in getTopSellingProductsAction:", error);
    if (error.code === 'FAILED_PRECONDITION' && error.message.includes('index')) {
        const helpfulMessage = "La consulta de productos más vendidos requiere un índice en Firestore (campo 'orderStatus' en 'orders'). Revisa los logs del servidor.";
        console.error(helpfulMessage);
        throw new Error(helpfulMessage);
    }
    throw new Error(`No se pudieron obtener los productos más vendidos: ${error.message}`);
  }
}

export type SalesReportFilterType = 'today' | 'yesterday' | 'last7days' | 'thisMonth' | 'lastMonth' | 'customRange';

export interface SalesReportLineItem {
  orderId: string;
  orderDate: Date; // Converted from Timestamp in the action
  productId: string;
  name: string;
  category: string;
  quantitySold: number;
  unitPrice: number;
  totalRevenueFromProduct: number;
}

export interface SalesReportData {
  totalSales: number;
  numberOfOrders: number;
  averageOrderValue: number;
  reportPeriodDescription: string;
  lineItems: SalesReportLineItem[];
}

export async function getSalesReportAction(
  filterType: SalesReportFilterType,
  customStartDateStr?: string,
  customEndDateStr?: string
): Promise<SalesReportData> {
  const now = new Date();
  let startDate: Date;
  let endDate: Date;
  let reportPeriodDescription = "";

  console.log(`getSalesReportAction called with: filterType=${filterType}, customStart=${customStartDateStr}, customEnd=${customEndDateStr}`);

  try {
    const firestore = getFirestoreAdmin();
    switch (filterType) {
      case 'today':
        startDate = startOfDay(now);
        endDate = endOfDay(now);
        reportPeriodDescription = `Hoy (${formatDateFns(now, 'dd MMM yyyy', { locale: es })})`;
        break;
      case 'yesterday':
        const yesterday = subDays(now, 1);
        startDate = startOfDay(yesterday);
        endDate = endOfDay(yesterday);
        reportPeriodDescription = `Ayer (${formatDateFns(yesterday, 'dd MMM yyyy', { locale: es })})`;
        break;
      case 'last7days':
        startDate = startOfDay(subDays(now, 6)); 
        endDate = endOfDay(now);
        reportPeriodDescription = `Últimos 7 días (${formatDateFns(startDate, 'dd MMM', { locale: es })} - ${formatDateFns(endDate, 'dd MMM yyyy', { locale: es })})`;
        break;
      case 'thisMonth':
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
        reportPeriodDescription = `Este Mes (${formatDateFns(now, 'MMMM yyyy', { locale: es })})`;
        break;
      case 'lastMonth':
        const lastMonthStart = startOfMonth(subMonths(now, 1));
        startDate = lastMonthStart;
        endDate = endOfMonth(lastMonthStart);
        reportPeriodDescription = `Mes Pasado (${formatDateFns(lastMonthStart, 'MMMM yyyy', { locale: es })})`;
        break;
      case 'customRange':
        if (!customStartDateStr) {
          throw new Error("Fecha de inicio requerida para rango personalizado.");
        }
        startDate = startOfDay(new Date(customStartDateStr));
        endDate = customEndDateStr ? endOfDay(new Date(customEndDateStr)) : endOfDay(new Date(customStartDateStr));
        if (startDate > endDate) {
          throw new Error("La fecha de inicio no puede ser posterior a la fecha de fin.");
        }
        if (customEndDateStr && customStartDateStr !== customEndDateStr) {
          reportPeriodDescription = `Del ${formatDateFns(startDate, 'dd MMM yyyy', { locale: es })} al ${formatDateFns(endDate, 'dd MMM yyyy', { locale: es })}`;
        } else {
          reportPeriodDescription = `El ${formatDateFns(startDate, 'dd MMM yyyy', { locale: es })}`;
        }
        break;
      default:
        throw new Error("Tipo de filtro inválido.");
    }

    console.log(`Querying orders between ${startDate.toISOString()} and ${endDate.toISOString()}`);

    let totalSales = 0;
    const lineItems: SalesReportLineItem[] = [];
    const processedOrderIds = new Set<string>();

    const ordersQuery = firestore.collection('orders')
      .where('orderStatus', '==', 'delivered')
      .where('createdAt', '>=', Timestamp.fromDate(startDate)) 
      .where('createdAt', '<=', Timestamp.fromDate(endDate));

    const snapshot = await ordersQuery.get();
    
    // Sort in memory as Firestore requires an index for ordering on a different field than the range filter
    const sortedDocs = snapshot.docs.sort((a, b) => {
      const timeA = (a.data().createdAt as Timestamp).toMillis();
      const timeB = (b.data().createdAt as Timestamp).toMillis();
      return timeB - timeA; // Descending
    });

    sortedDocs.forEach(doc => {
      const order = doc.data() as Order;
      
      if (!processedOrderIds.has(order.id)) {
        totalSales += order.totalAmount;
        processedOrderIds.add(order.id);
      }

      const orderDate = (doc.data().createdAt as Timestamp).toDate();

      order.items.forEach(item => {
        lineItems.push({
          orderId: order.id,
          orderDate: orderDate,
          productId: item.id,
          name: item.name,
          category: item.category,
          quantitySold: item.quantity,
          unitPrice: item.price,
          totalRevenueFromProduct: item.price * item.quantity,
        });
      });
    });

    const numberOfOrders = processedOrderIds.size;

    console.log(`Found ${lineItems.length} line items from ${numberOfOrders} orders with total sales S/${totalSales.toFixed(2)} for period: ${reportPeriodDescription}`);

    return {
      totalSales,
      numberOfOrders,
      averageOrderValue: numberOfOrders > 0 ? totalSales / numberOfOrders : 0,
      reportPeriodDescription,
      lineItems,
    };

  } catch (error: any) {
    console.error("Error in getSalesReportAction:", error.message, error.code, error.stack);
    if (error.code === 'FAILED_PRECONDITION' && error.message.includes('The query requires an index')) {
       return { 
        totalSales: 0, 
        numberOfOrders: 0, 
        averageOrderValue: 0, 
        reportPeriodDescription: `Error al cargar datos: La base de datos requiere un índice para esta consulta. Por favor, crea el índice en Firebase Firestore para 'orders' con los campos 'orderStatus' (asc) y 'createdAt' (desc), o contacta al desarrollador.`,
        lineItems: [],
      };
    }
    return { 
      totalSales: 0, 
      numberOfOrders: 0, 
      averageOrderValue: 0, 
      reportPeriodDescription: `Error al cargar datos: ${error.message || 'Error desconocido del servidor.'}`,
      lineItems: [],
    };
  }
}

export async function getComplaintsAdminAction(): Promise<Complaint[]> {
  const complaints: Complaint[] = [];
  try {
    const firestore = getFirestoreAdmin();
    const complaintsQuery = firestore.collection('complaints').orderBy('createdAt', 'desc');
    const snapshot = await complaintsQuery.get();
    
    snapshot.forEach(doc => {
      const data = doc.data();
      const createdAtTimestamp = data.createdAt;
      
      let createdAtDate: Date | null = null;
      if (createdAtTimestamp && typeof createdAtTimestamp.toDate === 'function') {
        createdAtDate = createdAtTimestamp.toDate();
      } else if (createdAtTimestamp) {
        // Fallback for serialized timestamp
        try {
          createdAtDate = new Date(createdAtTimestamp.seconds * 1000);
        } catch (e) {
          console.warn("Could not convert complaint createdAt timestamp:", createdAtTimestamp);
        }
      }

      complaints.push({
        id: doc.id,
        ...data,
        createdAt: createdAtDate, // Convert timestamp to Date
      } as Complaint);
    });
    
    return complaints;

  } catch (error) {
    console.error("Error in getComplaintsAdminAction:", error);
    return [];
  }
}
