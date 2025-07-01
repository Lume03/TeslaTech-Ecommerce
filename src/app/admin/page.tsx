
"use client";
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  Package, 
  ShoppingCart, 
  ListOrdered, 
  LucideLineChart, 
  FileText,
  ShieldAlert
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { getAdminDashboardStatsAction } from './actions';
import { Skeleton } from '@/components/ui/skeleton';
import dynamic from 'next/dynamic';

// Dynamically import the charts component to reduce initial bundle size
const DashboardCharts = dynamic(() => import('@/components/admin/DashboardCharts'), {
  loading: () => <ChartsSkeleton />,
  ssr: false, // Charts are client-side and don't need to be rendered on the server
});

// A dedicated skeleton component for the charts
const ChartsSkeleton = () => (
  <div className="grid gap-6 md:grid-cols-2">
    <Skeleton className="h-[430px] w-full" />
    <Skeleton className="h-[430px] w-full" />
  </div>
);

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({ totalSales: 0, totalStock: 0, newOrdersCount: 0 });
  const [loadingStats, setLoadingStats] = useState(true);
  const [errorStats, setErrorStats] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoadingStats(true);
      setErrorStats(null);
      try {
        const fetchedStats = await getAdminDashboardStatsAction();
        setStats(fetchedStats);
      } catch (error: any) {
        console.error("Error fetching admin dashboard stats:", error);
        setErrorStats(error.message || "No se pudieron cargar las estadísticas generales.");
      } finally {
        setLoadingStats(false);
      }
    };
    fetchDashboardData();
  }, []);

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
              <p className="text-xs text-destructive">{errorStats}</p>
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
              <p className="text-xs text-destructive">{errorStats}</p>
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
              <p className="text-xs text-destructive">{errorStats}</p>
            ) : (
              <div className="text-2xl font-bold">+{stats.newOrdersCount}</div>
            )}
            <p className="text-xs text-muted-foreground">Pendientes o esperando pago</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4">
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
        <Card>
          <CardHeader>
            <CardTitle>Gestión de Reclamos</CardTitle>
            <CardDescription>Ver los reclamos y quejas de los clientes.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/complaints" passHref>
              <Button><ShieldAlert className="mr-2 h-4 w-4" />Ver Reclamos</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
      
      <DashboardCharts />

    </div>
  );
}
