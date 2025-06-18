
"use client";
import { useEffect, useState } from 'react';
import { getAllOrdersAdminAction, updateOrderStatusAdminAction } from '@/app/actions/orderActions';
import type { Order, OrderStatus } from '@/lib/data';
import { orderStatusTranslations } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, RefreshCw, Save } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const availableStatuses: OrderStatus[] = [
  'payment_pending',
  'pending_shipment',
  'shipped',
  'delivered',
  'cancelled_by_admin',
  'payment_failed',
  'refunded'
];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  const fetchOrders = () => {
    setLoading(true);
    getAllOrdersAdminAction()
      .then(setOrders)
      .catch(err => {
        console.error("Failed to fetch orders:", err);
        toast({ title: "Error", description: "No se pudieron cargar los pedidos.", variant: "destructive" });
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrders();
  }, [toast]);

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

    if (timestampInput instanceof Date) {
      date = timestampInput;
    } else if (timestampInput && typeof timestampInput.toDate === 'function') {
      // Firestore Timestamp object from client SDK
      date = timestampInput.toDate();
    } else if (timestampInput && typeof timestampInput.seconds === 'number' && typeof timestampInput.nanoseconds === 'number') {
      // Firestore Timestamp object from Admin SDK (serialized) or similar structure
      date = new Date(timestampInput.seconds * 1000 + timestampInput.nanoseconds / 1000000);
    } else {
      // Fallback: Try to parse as a string or number directly (less reliable)
      const parsed = new Date(timestampInput);
      if (!isNaN(parsed.getTime())) {
        date = parsed;
      }
    }

    if (date && !isNaN(date.getTime())) { // Check if the resulting date is valid
      return format(date, "dd/MM/yy HH:mm", { locale: es });
    }
    
    console.warn("formatDate in AdminOrdersPage received an invalid time value:", timestampInput);
    return 'Fecha inválida';
  };

  if (loading && orders.length === 0) { // Show loader only on initial load or if orders are empty
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-headline font-bold">Gestión de Pedidos</h1>
        <Button onClick={fetchOrders} variant="outline" disabled={loading}>
          {loading && !orders.length ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
          Actualizar
        </Button>
      </div>

      {orders.length === 0 && !loading ? (
        <p className="text-center text-muted-foreground py-10">No hay pedidos para mostrar.</p>
      ) : (
        <div className="rounded-lg border shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID Pedido</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead className="hidden md:table-cell">Fecha</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Estado Actual</TableHead>
                <TableHead className="text-right">Cambiar Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium" title={order.id}>{order.id.substring(0, 8)}...</TableCell>
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
                        order.orderStatus === 'payment_failed' || order.orderStatus.startsWith('cancelled') ? 'destructive' :
                        'default'
                      }>
                      {orderStatusTranslations[order.orderStatus] || order.orderStatus}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Select
                        value={order.orderStatus}
                        onValueChange={(newStatus) => handleStatusChange(order.id, newStatus as OrderStatus)}
                        disabled={updatingStatus[order.id]}
                      >
                        <SelectTrigger className="w-[180px] h-9">
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
                      {updatingStatus[order.id] && <Loader2 className="h-5 w-5 animate-spin" />}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
