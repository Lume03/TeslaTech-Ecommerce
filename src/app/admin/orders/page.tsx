"use client";
import { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation'; // <-- Import this
import { getAllOrdersAdminAction, updateOrderStatusAdminAction } from '@/app/actions/orderActions';
import type { Order, OrderStatus } from '@/lib/data';
import { orderStatusTranslations } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, RefreshCw, Search, Filter } from 'lucide-react'; // <-- Add Search, Filter
import { useToast } from "@/hooks/use-toast";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Input } from '@/components/ui/input'; // <-- Add Input
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"; // <-- Add Pagination
import { Suspense } from 'react';

const availableStatuses: OrderStatus[] = [
  'payment_pending',
  'pending_shipment',
  'shipped',
  'delivered',
  'cancelled_by_admin',
  'payment_failed',
  'refunded'
];

// Wrap the main component in a Suspense-compatible component to use useSearchParams
function AdminOrdersContent() {
  const searchParams = useSearchParams();
  const initialSearchTerm = searchParams.get('search') || '';

  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);

  const fetchOrders = () => {
    setLoading(true);
    getAllOrdersAdminAction()
      .then(setAllOrders)
      .catch(err => {
        console.error("Failed to fetch orders:", err);
        toast({ title: "Error", description: "No se pudieron cargar los pedidos.", variant: "destructive" });
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrders();
  }, []); // Only fetch once on mount

  useEffect(() => {
    let tempOrders = allOrders;
    if (searchTerm) {
      tempOrders = tempOrders.filter(o =>
        o.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (o.userName && o.userName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (o.userEmail && o.userEmail.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    if (statusFilter !== 'all') {
      tempOrders = tempOrders.filter(o => o.orderStatus === statusFilter);
    }
    setFilteredOrders(tempOrders);
    setCurrentPage(1); // Reset page on filter change
  }, [searchTerm, statusFilter, allOrders]);

  const paginatedOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredOrders.slice(startIndex, endIndex);
  }, [filteredOrders, currentPage, itemsPerPage]);

  const totalPages = useMemo(() => {
    return Math.ceil(filteredOrders.length / itemsPerPage);
  }, [filteredOrders, itemsPerPage]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    setUpdatingStatus(prev => ({ ...prev, [orderId]: true }));
    const result = await updateOrderStatusAdminAction(orderId, newStatus);
    if (result.success) {
      toast({ title: "Estado Actualizado", description: `El pedido ${orderId.substring(0,8)} ahora es ${orderStatusTranslations[newStatus]}.` });
      fetchOrders(); // Re-fetch to get the latest data
    } else {
      toast({ title: "Error", description: result.error || "No se pudo actualizar el estado.", variant: "destructive" });
    }
    setUpdatingStatus(prev => ({ ...prev, [orderId]: false }));
  };

  const formatDate = (timestampInput: any): string => {
    if (!timestampInput) return 'N/A';
    let date: Date | null = null;
    if (timestampInput instanceof Date) { date = timestampInput; }
    else if (timestampInput && typeof timestampInput.toDate === 'function') { date = timestampInput.toDate(); }
    else if (timestampInput && typeof timestampInput.seconds === 'number') { date = new Date(timestampInput.seconds * 1000); }
    else { const parsed = new Date(timestampInput); if (!isNaN(parsed.getTime())) { date = parsed; } }
    if (date && !isNaN(date.getTime())) { return format(date, "dd/MM/yy HH:mm", { locale: es }); }
    return 'Fecha inválida';
  };

  if (loading && allOrders.length === 0) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-headline font-bold">Gestión de Pedidos</h1>
        <Button onClick={fetchOrders} variant="outline" disabled={loading}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
          Actualizar
        </Button>
      </div>

      {/* Filter and Search Section */}
      <div className="flex flex-col sm:flex-row gap-4 items-center p-4 bg-card rounded-lg shadow">
        <div className="relative flex-grow w-full sm:w-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Buscar por ID, nombre, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="h-5 w-5 text-muted-foreground" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Filtrar por estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los Estados</SelectItem>
              {availableStatuses.map(status => (
                <SelectItem key={status} value={status}>
                  {orderStatusTranslations[status] || status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-lg border shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID Pedido</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead className="hidden md:table-cell">Fecha</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-center">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedOrders.length > 0 ? paginatedOrders.map((order) => (
              <TableRow key={order.id} className={order.id.toLowerCase().includes(searchTerm.toLowerCase()) && searchTerm.length > 5 ? 'bg-primary/10' : ''}>
                <TableCell className="font-medium font-mono" title={order.id}>{order.id.substring(0, 8)}...</TableCell>
                <TableCell>
                  <div>{order.userName || 'N/A'}</div>
                  <div className="text-xs text-muted-foreground">{order.userEmail}</div>
                </TableCell>
                <TableCell className="hidden md:table-cell">{formatDate(order.createdAt)}</TableCell>
                <TableCell className="text-right">S/{order.totalAmount.toFixed(2)}</TableCell>
                <TableCell>
                  <Badge variant={
                      order.orderStatus === 'delivered' ? 'default' :
                      order.orderStatus === 'shipped' ? 'secondary' :
                      order.orderStatus === 'pending_shipment' ? 'outline' :
                      order.orderStatus.startsWith('cancelled') || order.orderStatus === 'payment_failed' ? 'destructive' : 'default'
                    }>
                    {orderStatusTranslations[order.orderStatus] || order.orderStatus}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                  <Select
                    value={order.orderStatus}
                    onValueChange={(newStatus) => handleStatusChange(order.id, newStatus as OrderStatus)}
                    disabled={updatingStatus[order.id]}
                  >
                    <SelectTrigger className="w-[180px] h-9 mx-auto">
                      <SelectValue placeholder="Cambiar estado" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableStatuses.map(status => (
                        <SelectItem key={status} value={status}>
                          {orderStatusTranslations[status] || status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {updatingStatus[order.id] && <Loader2 className="h-5 w-5 animate-spin inline-block ml-2" />}
                </TableCell>
              </TableRow>
            )) : (
              <TableRow><TableCell colSpan={6} className="h-24 text-center">No se encontraron pedidos con los filtros actuales.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center mt-4">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious onClick={() => handlePageChange(currentPage - 1)} className={currentPage === 1 ? "pointer-events-none opacity-50" : undefined} />
              </PaginationItem>
              <PaginationItem>
                <span className="px-4 py-2 text-sm">Página {currentPage} de {totalPages}</span>
              </PaginationItem>
              <PaginationItem>
                <PaginationNext onClick={() => handlePageChange(currentPage + 1)} className={currentPage === totalPages ? "pointer-events-none opacity-50" : undefined} />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}


export default function AdminOrdersPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center h-64"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>}>
      <AdminOrdersContent />
    </Suspense>
  )
}
