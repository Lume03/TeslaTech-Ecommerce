
"use client";
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Label } from "@/components/ui/label";
import { CalendarIcon, Loader2, FileText, Download } from 'lucide-react';
import { format as formatDateFns } from 'date-fns';
import { es } from 'date-fns/locale';
import { getSalesReportAction, SalesReportData } from '../actions';
import { cn } from '@/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from '@/components/ui/scroll-area';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import Link from 'next/link';

// Add type declaration for jspdf-autotable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}


const initialReportData: SalesReportData = {
  totalSales: 0,
  numberOfOrders: 0,
  averageOrderValue: 0,
  reportPeriodDescription: "Selecciona un período para ver el reporte",
  lineItems: [],
};

export default function SalesReportPage() {
  const [reportData, setReportData] = useState<SalesReportData>(initialReportData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [activeFilter, setActiveFilter] = useState<any>('thisMonth');
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>(undefined);
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>(undefined);

  const fetchReport = useCallback(async (filter: any, startDate?: Date, endDate?: Date) => {
    setLoading(true);
    setError(null);
    try {
      const startDateStr = startDate ? startDate.toISOString() : undefined;
      const endDateStr = endDate ? endDate.toISOString() : undefined;
      const data = await getSalesReportAction(filter, startDateStr, endDateStr);
      setReportData(data);
       if (data.reportPeriodDescription.startsWith("Error al cargar datos:")) {
        setError(data.reportPeriodDescription);
      }
    } catch (err: any) {
      const errorMessage = err.message || "Error al cargar el reporte de ventas.";
      setError(errorMessage);
      setReportData({...initialReportData, reportPeriodDescription: `Error: ${errorMessage}`});
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeFilter === 'thisMonth' && !customStartDate && !customEndDate) {
       fetchReport('thisMonth');
    }
  }, [fetchReport, activeFilter, customStartDate, customEndDate]);

  const handleFilterClick = (filterType: any) => {
    setActiveFilter(filterType);
    setCustomStartDate(undefined);
    setCustomEndDate(undefined);
    if (filterType !== 'customRange') {
      fetchReport(filterType);
    }
  };

  const handleCustomRangeSearch = () => {
    if (customStartDate) {
      setActiveFilter('customRange');
      fetchReport('customRange', customStartDate, customEndDate || customStartDate); 
    } else {
      setError("Por favor, selecciona una fecha de inicio.");
    }
  };
  
  const handleDownloadPdf = () => {
    if (!reportData || reportData.lineItems.length === 0) {
      alert("No hay datos para descargar.");
      return;
    }
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text("Reporte de Ventas", 14, 22);
    
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(reportData.reportPeriodDescription, 14, 30);
    
    const summaryText = `Ventas Totales: S/ ${reportData.totalSales.toFixed(2)}  |  Pedidos: ${reportData.numberOfOrders}  |  Ticket Promedio: S/ ${reportData.averageOrderValue.toFixed(2)}`;
    doc.setFontSize(10);
    doc.text(summaryText, 14, 40);

    const tableColumn = ["Código Venta", "Fecha y Hora", "Producto", "Cant.", "P. Unit.", "Ingreso"];
    const tableRows: any[] = [];

    reportData.lineItems.forEach(item => {
      const itemData = [
        item.orderId,
        formatDateFns(new Date(item.orderDate), "dd/MM/yy HH:mm", { locale: es }),
        item.name,
        item.quantitySold,
        `S/ ${item.unitPrice.toFixed(2)}`,
        `S/ ${item.totalRevenueFromProduct.toFixed(2)}`
      ];
      tableRows.push(itemData);
    });

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 50,
      theme: 'grid',
      headStyles: { fillColor: [40, 42, 58] }, // #282A3A
    });

    const date = new Date();
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    doc.save(`Reporte_de_Ventas_${dateStr}.pdf`);
  };

  const filterButtons: { label: string; type: any }[] = [
    { label: "Hoy", type: "today" },
    { label: "Ayer", type: "yesterday" },
    { label: "Últimos 7 Días", type: "last7days" },
    { label: "Este Mes", type: "thisMonth" },
    { label: "Mes Pasado", type: "lastMonth" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-3xl font-headline font-bold">Reporte de Ventas</h1>
        <div className="flex gap-2">
            <Button onClick={() => fetchReport(activeFilter, customStartDate, customEndDate || customStartDate)} disabled={loading} variant="outline">
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
            Actualizar Reporte
            </Button>
            <Button onClick={handleDownloadPdf} disabled={loading || !reportData || reportData.lineItems.length === 0}>
                <Download className="mr-2 h-4 w-4" />
                Descargar PDF
            </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Seleccionar Período</CardTitle>
          <CardDescription>Elige un período predefinido o un rango de fechas personalizado.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {filterButtons.map(btn => (
              <Button
                key={btn.type}
                variant={activeFilter === btn.type && activeFilter !== 'customRange' ? "default" : "outline"}
                onClick={() => handleFilterClick(btn.type)}
                disabled={loading}
              >
                {btn.label}
              </Button>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="grid gap-2 flex-grow">
              <Label htmlFor="start-date">Fecha de Inicio</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="start-date"
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !customStartDate && "text-muted-foreground"
                    )}
                    disabled={loading}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {customStartDate ? formatDateFns(customStartDate, "PPP", { locale: es }) : <span>Selecciona fecha</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={customStartDate}
                    onSelect={(date) => { setCustomStartDate(date || undefined); setActiveFilter('customRange'); }}
                    initialFocus
                    disabled={loading}
                  />
                </PopoverContent>
              </Popover>
            </div>
             <div className="grid gap-2 flex-grow">
              <Label htmlFor="end-date">Fecha de Fin (opcional)</Label>
               <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="end-date"
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !customEndDate && "text-muted-foreground"
                    )}
                    disabled={loading}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {customEndDate ? formatDateFns(customEndDate, "PPP", { locale: es }) : <span>Selecciona fecha</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={customEndDate}
                    onSelect={(date) => { setCustomEndDate(date || undefined); setActiveFilter('customRange'); }}
                    disabled={(date) => customStartDate ? date < customStartDate : false || loading}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <Button onClick={handleCustomRangeSearch} disabled={loading || !customStartDate}>Buscar Rango</Button>
          </div>
        </CardContent>
      </Card>

      {loading && (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      )}

      {!loading && (
        <Card>
          <CardHeader>
            <CardTitle>Resultados del Reporte</CardTitle>
            <CardDescription>{error || reportData.reportPeriodDescription}</CardDescription>
          </CardHeader>
          {!error && (
            <>
            <CardContent className="grid gap-6 md:grid-cols-3">
                <div className="flex flex-col items-center justify-center p-6 border rounded-lg bg-muted/30">
                <p className="text-sm font-medium text-muted-foreground">Ventas Totales</p>
                <p className="text-3xl font-bold text-primary">S/ {reportData.totalSales.toFixed(2)}</p>
                </div>
                <div className="flex flex-col items-center justify-center p-6 border rounded-lg bg-muted/30">
                <p className="text-sm font-medium text-muted-foreground">Número de Pedidos</p>
                <p className="text-3xl font-bold">{reportData.numberOfOrders}</p>
                </div>
                <div className="flex flex-col items-center justify-center p-6 border rounded-lg bg-muted/30">
                <p className="text-sm font-medium text-muted-foreground">Ticket Promedio</p>
                <p className="text-3xl font-bold">S/ {reportData.averageOrderValue.toFixed(2)}</p>
                </div>
            </CardContent>
            
            {reportData.lineItems && reportData.lineItems.length > 0 ? (
                <CardContent className="pt-6">
                    <h3 className="text-xl font-semibold mb-4">Detalle de Productos Vendidos</h3>
                    <ScrollArea className="h-[400px] w-full rounded-md border">
                        <Table>
                            <TableHeader className="sticky top-0 bg-background">
                                <TableRow>
                                <TableHead>Código de Venta</TableHead>
                                <TableHead>Fecha y Hora</TableHead>
                                <TableHead>Producto</TableHead>
                                <TableHead className="text-center">Cant. Vendida</TableHead>
                                <TableHead className="text-right">Precio Unit.</TableHead>
                                <TableHead className="text-right">Ingreso Total</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {reportData.lineItems.map((item, index) => (
                                <TableRow key={`${item.orderId}-${item.productId}-${index}`}>
                                    <TableCell className="font-mono text-xs">
                                        <Link href={`/admin/orders?search=${item.orderId}`} className="text-primary hover:underline" title={`Ver pedido ${item.orderId}`}>
                                            {item.orderId.substring(0, 8)}...
                                        </Link>
                                    </TableCell>
                                    <TableCell className="text-xs">{formatDateFns(new Date(item.orderDate), "dd/MM/yy HH:mm", { locale: es })}</TableCell>
                                    <TableCell className="font-medium">{item.name}</TableCell>
                                    <TableCell className="text-center">{item.quantitySold}</TableCell>
                                    <TableCell className="text-right">S/ {item.unitPrice.toFixed(2)}</TableCell>
                                    <TableCell className="text-right">S/ {item.totalRevenueFromProduct.toFixed(2)}</TableCell>
                                </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </ScrollArea>
                </CardContent>
            ) : (
                 <CardContent>
                    <p className="text-center text-muted-foreground py-10">No hay datos de ventas para el período seleccionado.</p>
                 </CardContent>
            )}
             <CardContent>
               <p className="text-xs text-muted-foreground pt-4">
                Este reporte solo incluye órdenes marcadas como 'entregadas' dentro del período seleccionado.
              </p>
             </CardContent>
            </>
          )}
        </Card>
      )}
    </div>
  );
}
