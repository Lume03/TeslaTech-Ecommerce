
"use client";
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  BarChart as LucideBarChart, 
  Package, 
  ShoppingCart, 
  LineChart as LucideLineChart, 
  ListOrdered, 
  Loader2,
  FileText // Icon for Sales Report
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { getAdminDashboardStatsAction, getSalesByCategoryAction, getTopSellingProductsAction, SalesByCategoryData, TopSellingProductData } from './actions';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BarChart as RechartsBarChart, 
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({ totalSales: 0, totalStock: 0, newOrdersCount: 0 });
  const [loadingStats, setLoadingStats] = useState(true);
  const [errorStats, setErrorStats] = useState<string | null>(null);

  const [salesByCategoryData, setSalesByCategoryData] = useState<SalesByCategoryData[]>([]);
  const [loadingSalesByCategory, setLoadingSalesByCategory] = useState(true);
  const [errorSalesByCategory, setErrorSalesByCategory] = useState<string | null>(null);

  const [topProductsData, setTopProductsData] = useState<TopSellingProductData[]>([]);
  const [loadingTopProducts, setLoadingTopProducts] = useState(true);
  const [errorTopProducts, setErrorTopProducts] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoadingStats(true);
      setErrorStats(null);
      try {
        const fetchedStats = await getAdminDashboardStatsAction();
        setStats(fetchedStats);
      } catch (error) {
        console.error("Error fetching admin dashboard stats:", error);
        setErrorStats("No se pudieron cargar las estadísticas generales.");
      } finally {
        setLoadingStats(false);
      }

      setLoadingSalesByCategory(true);
      setErrorSalesByCategory(null);
      try {
        const fetchedSalesByCategory = await getSalesByCategoryAction();
        setSalesByCategoryData(fetchedSalesByCategory);
      } catch (error) {
        console.error("Error fetching sales by category:", error);
        setErrorSalesByCategory("No se pudieron cargar las ventas por categoría.");
      } finally {
        setLoadingSalesByCategory(false);
      }
      
      setLoadingTopProducts(true);
      setErrorTopProducts(null);
      try {
        const fetchedTopProducts = await getTopSellingProductsAction(5);
        setTopProductsData(fetchedTopProducts);
      } catch (error) {
        console.error("Error fetching top selling products:", error);
        setErrorTopProducts("No se pudieron cargar los productos más vendidos.");
      } finally {
        setLoadingTopProducts(false);
      }
    };
    fetchDashboardData();
  }, []);

  const chartTickFormatter = (value: string) => {
    if (value.length > 12) {
      return `${value.substring(0, 10)}...`;
    }
    return value;
  };
  
  const chartTooltipFormatter = (value: number) => `S/${value.toFixed(2)}`;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-3xl font-headline font-bold">Panel de Administración</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ventas Totales</CardTitle>
            <LucideLineChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loadingStats ? (
              <Skeleton className="h-8 w-3/4" />
            ) : errorStats ? (
              <p className="text-xs text-destructive">{errorStats} (S/ 0.00)</p>
            ) : (
              <div className="text-2xl font-bold">S/ {stats.totalSales.toFixed(2)}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Productos en Stock</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
             {loadingStats ? (
              <Skeleton className="h-8 w-1/2" />
            ) : errorStats ? (
              <p className="text-xs text-destructive">{errorStats} (0)</p>
            ) : (
              <div className="text-2xl font-bold">{stats.totalStock}</div>
            )}
            <p className="text-xs text-muted-foreground">Total de productos con stock</p>
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nuevos Pedidos</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loadingStats ? (
              <Skeleton className="h-8 w-1/4" />
            ) : errorStats ? (
              <p className="text-xs text-destructive">{errorStats} (0)</p>
            ) : (
              <div className="text-2xl font-bold">+{stats.newOrdersCount}</div>
            )}
            <p className="text-xs text-muted-foreground">Pendientes o esperando pago</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Gestión de Productos</CardTitle>
            <CardDescription>Ver, añadir, editar o eliminar productos.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/products" passHref>
              <Button><Package className="mr-2 h-4 w-4" />Administrar Productos</Button>
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Gestión de Pedidos</CardTitle>
            <CardDescription>Ver y actualizar el estado de los pedidos.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/orders" passHref>
              <Button><ListOrdered className="mr-2 h-4 w-4" />Administrar Pedidos</Button>
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Reporte de Ventas</CardTitle>
            <CardDescription>Analizar el rendimiento de ventas.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/sales-report" passHref>
              <Button><FileText className="mr-2 h-4 w-4" />Ver Reporte de Ventas</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Ventas Mensuales por Categoría</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            {loadingSalesByCategory ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : errorSalesByCategory ? (
              <p className="text-destructive text-center">{errorSalesByCategory}</p>
            ) : salesByCategoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RechartsBarChart data={salesByCategoryData} margin={{ top: 5, right: 0, left: -25, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="category" fontSize={12} tickLine={false} axisLine={false} tickFormatter={chartTickFormatter} />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `S/${value}`} />
                  <Tooltip
                    cursor={{ fill: 'hsl(var(--muted))' }}
                    contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                    formatter={chartTooltipFormatter}
                  />
                  <Bar dataKey="totalSales" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </RechartsBarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-center h-full flex items-center justify-center">No hay datos de ventas por categoría para mostrar.</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Top 5 Productos Más Vendidos</CardTitle>
          </CardHeader>
           <CardContent className="h-[300px]">
             {loadingTopProducts ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : errorTopProducts ? (
              <p className="text-destructive text-center">{errorTopProducts}</p>
            ) : topProductsData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RechartsBarChart data={topProductsData} margin={{ top: 5, right: 0, left: -25, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} tickFormatter={chartTickFormatter} />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `S/${value}`} />
                  <Tooltip
                    cursor={{ fill: 'hsl(var(--muted))' }}
                    contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                    formatter={chartTooltipFormatter}
                  />
                  <Bar dataKey="totalSales" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                </RechartsBarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-center h-full flex items-center justify-center">No hay datos de productos más vendidos para mostrar.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 text-center">
        <p className="text-sm text-muted-foreground">
          Recuerda crear el usuario <code className="bg-muted px-1.5 py-0.5 rounded">admin@teslatech.com</code> con la contrase\u00F1a <code className="bg-muted px-1.5 py-0.5 rounded">admin123</code> en Firebase Authentication para acceder.
        </p>
      </div>
    </div>
  );
}
