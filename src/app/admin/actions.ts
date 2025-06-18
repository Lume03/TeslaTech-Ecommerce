
"use server";
import adminDefault, { getFirestoreAdmin } from '@/lib/firebase/admin';
import type { Order, Product, OrderStatus, OrderItem } from '@/lib/data'; // OrderItem added
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


export async function getAdminDashboardStatsAction(): Promise<{ totalSales: number; totalStock: number; newOrdersCount: number }> {
  const firestore = getFirestoreAdmin();
  let totalSales = 0;
  let totalStock = 0;
  let newOrdersCount = 0;

  try {
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

  } catch (error) {
    console.error("Error in getAdminDashboardStatsAction:", error);
    return { totalSales: 0, totalStock: 0, newOrdersCount: 0 };
  }

  return { totalSales, totalStock, newOrdersCount };
}

export interface SalesByCategoryData {
  category: string;
  totalSales: number;
}

export async function getSalesByCategoryAction(): Promise<SalesByCategoryData[]> {
  const firestore = getFirestoreAdmin();
  const salesMap = new Map<string, number>();

  try {
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

  } catch (error) {
    console.error("Error in getSalesByCategoryAction:", error);
    return [];
  }
}

export interface TopSellingProductData {
  name: string;
  totalSales: number;
}

export async function getTopSellingProductsAction(limit: number = 5): Promise<TopSellingProductData[]> {
  const firestore = getFirestoreAdmin();
  const productSalesMap = new Map<string, { totalSales: number; name: string }>();

  try {
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

  } catch (error) {
    console.error("Error in getTopSellingProductsAction:", error);
    return [];
  }
}

export type SalesReportFilterType = 'today' | 'yesterday' | 'last7days' | 'thisMonth' | 'lastMonth' | 'customRange';

export interface SalesReportItemDetail {
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
  detailedItems: SalesReportItemDetail[];
}

export async function getSalesReportAction(
  filterType: SalesReportFilterType,
  customStartDateStr?: string,
  customEndDateStr?: string
): Promise<SalesReportData> {
  const firestore = getFirestoreAdmin();
  const now = new Date();
  let startDate: Date;
  let endDate: Date;
  let reportPeriodDescription = "";

  console.log(`getSalesReportAction called with: filterType=${filterType}, customStart=${customStartDateStr}, customEnd=${customEndDateStr}`);

  try {
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
    let numberOfOrders = 0;
    const productSalesMap = new Map<string, SalesReportItemDetail>();

    const ordersQuery = firestore.collection('orders')
      .where('orderStatus', '==', 'delivered')
      .where('createdAt', '>=', Timestamp.fromDate(startDate)) 
      .where('createdAt', '<=', Timestamp.fromDate(endDate)); 

    const snapshot = await ordersQuery.get();
    
    snapshot.forEach(doc => {
      const order = doc.data() as Order;
      totalSales += order.totalAmount;
      numberOfOrders++;

      order.items.forEach(item => {
        const existingItem = productSalesMap.get(item.id);
        if (existingItem) {
          existingItem.quantitySold += item.quantity;
          existingItem.totalRevenueFromProduct += item.price * item.quantity;
        } else {
          productSalesMap.set(item.id, {
            productId: item.id,
            name: item.name,
            category: item.category,
            quantitySold: item.quantity,
            unitPrice: item.price,
            totalRevenueFromProduct: item.price * item.quantity,
          });
        }
      });
    });

    console.log(`Found ${numberOfOrders} orders with total sales S/${totalSales.toFixed(2)} for period: ${reportPeriodDescription}`);
    console.log(`Detailed items map size: ${productSalesMap.size}`);

    const detailedItems = Array.from(productSalesMap.values()).sort((a, b) => b.totalRevenueFromProduct - a.totalRevenueFromProduct);

    return {
      totalSales,
      numberOfOrders,
      averageOrderValue: numberOfOrders > 0 ? totalSales / numberOfOrders : 0,
      reportPeriodDescription,
      detailedItems,
    };

  } catch (error: any) {
    console.error("Error in getSalesReportAction:", error.message, error.code, error.stack);
    return { 
      totalSales: 0, 
      numberOfOrders: 0, 
      averageOrderValue: 0, 
      reportPeriodDescription: `Error al cargar datos: ${error.message || 'Error desconocido del servidor.'}`,
      detailedItems: [],
    };
  }
}
