
"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import {
  BarChart as RechartsBarChart, 
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useEffect, useState } from 'react';
import { getSalesByCategoryAction, getTopSellingProductsAction, SalesByCategoryData, TopSellingProductData } from '@/app/admin/actions';

export default function DashboardCharts() {
  const [salesByCategoryData, setSalesByCategoryData] = useState<SalesByCategoryData[]>([]);
  const [loadingSalesByCategory, setLoadingSalesByCategory] = useState(true);
  const [errorSalesByCategory, setErrorSalesByCategory] = useState<string | null>(null);

  const [topProductsData, setTopProductsData] = useState<TopSellingProductData[]>([]);
  const [loadingTopProducts, setLoadingTopProducts] = useState(true);
  const [errorTopProducts, setErrorTopProducts] = useState<string | null>(null);

  useEffect(() => {
    const fetchChartData = async () => {
      setLoadingSalesByCategory(true);
      setErrorSalesByCategory(null);
      try {
        const fetchedSalesByCategory = await getSalesByCategoryAction();
        setSalesByCategoryData(fetchedSalesByCategory);
      } catch (error: any) {
        console.error("Error fetching sales by category:", error);
        setErrorSalesByCategory(error.message || "No se pudieron cargar las ventas por categoría.");
      } finally {
        setLoadingSalesByCategory(false);
      }
      
      setLoadingTopProducts(true);
      setErrorTopProducts(null);
      try {
        const fetchedTopProducts = await getTopSellingProductsAction(5);
        setTopProductsData(fetchedTopProducts);
      } catch (error: any) {
        console.error("Error fetching top selling products:", error);
        setErrorTopProducts(error.message || "No se pudieron cargar los productos más vendidos.");
      } finally {
        setLoadingTopProducts(false);
      }
    };
    fetchChartData();
  }, []);

  const chartTooltipFormatter = (value: number) => `S/${value.toFixed(2)}`;

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Ventas Mensuales por Categoría</CardTitle>
        </CardHeader>
        <CardContent className="h-[350px]">
          {loadingSalesByCategory ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : errorSalesByCategory ? (
            <p className="text-destructive text-center">{errorSalesByCategory}</p>
          ) : salesByCategoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <RechartsBarChart data={salesByCategoryData} margin={{ top: 5, right: 20, left: 10, bottom: 75 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="category" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                  angle={-45}
                  textAnchor="end"
                  interval={0}
                  height={80}
                />
                <YAxis 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(value) => `S/${value}`}
                  width={80}
                  domain={[(dataMin: number) => (Math.max(0, Math.floor(dataMin * 0.9))), (dataMax: number) => Math.ceil(dataMax * 1.1)]}
                />
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
         <CardContent className="h-[350px]">
           {loadingTopProducts ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : errorTopProducts ? (
            <p className="text-destructive text-center">{errorTopProducts}</p>
          ) : topProductsData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <RechartsBarChart data={topProductsData} margin={{ top: 5, right: 20, left: 10, bottom: 75 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="name" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false}
                  angle={-45}
                  textAnchor="end"
                  interval={0}
                  height={80}
                />
                <YAxis 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(value) => `S/${value}`} 
                  width={80}
                  domain={[(dataMin: number) => (Math.max(0, Math.floor(dataMin * 0.9))), (dataMax: number) => Math.ceil(dataMax * 1.1)]}
                />
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
  );
}
