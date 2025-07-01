
"use client";
import { useEffect, useState } from 'react';
import { getComplaintsAdminAction } from '@/app/admin/actions';
import type { Complaint } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, RefreshCw, FileWarning } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function AdminComplaintsPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchComplaints = () => {
    setLoading(true);
    getComplaintsAdminAction()
      .then(setComplaints)
      .catch(err => {
        console.error("Failed to fetch complaints:", err);
        toast({ title: "Error", description: "No se pudieron cargar los reclamos.", variant: "destructive" });
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const formatDate = (dateInput: any): string => {
    if (!dateInput) return 'N/A';
    try {
        const date = new Date(dateInput);
        if (isNaN(date.getTime())) {
            return 'Fecha inválida';
        }
        return format(date, "dd/MM/yy HH:mm", { locale: es });
    } catch (e) {
        console.warn("Could not format date:", dateInput);
        return 'Fecha inválida';
    }
  };

  if (loading && complaints.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-headline font-bold">Gestión de Reclamos</h1>
        <Button onClick={fetchComplaints} variant="outline" disabled={loading}>
          {loading && !complaints.length ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
          Actualizar
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Reclamos y Quejas</CardTitle>
          <CardDescription>
            Aquí puedes ver todos los reclamos enviados por los clientes a través del libro de reclamaciones.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {complaints.length === 0 && !loading ? (
            <div className="text-center py-10">
              <FileWarning className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-muted-foreground">No hay reclamos para mostrar.</p>
            </div>
          ) : (
            <Accordion type="multiple" className="w-full">
              {complaints.map((complaint) => (
                <AccordionItem value={complaint.id!} key={complaint.id!}>
                  <AccordionTrigger>
                    <div className="flex justify-between items-center w-full pr-4">
                       <div className="flex flex-col text-left">
                         <span className="font-semibold">{complaint.fullName}</span>
                         <span className="text-sm text-muted-foreground">{formatDate(complaint.createdAt)}</span>
                       </div>
                       <Badge variant={complaint.complaintType === 'Reclamo' ? 'destructive' : 'secondary'}>
                         {complaint.complaintType}
                       </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="p-4 bg-muted/50 rounded-md">
                       <h4 className="font-semibold mb-2">Detalles del Cliente</h4>
                       <Table>
                        <TableBody>
                            <TableRow><TableCell className="font-medium w-1/4">Nombre Completo</TableCell><TableCell>{complaint.fullName}</TableCell></TableRow>
                            <TableRow><TableCell className="font-medium">Documento</TableCell><TableCell>{complaint.documentType} - {complaint.documentNumber}</TableCell></TableRow>
                            <TableRow><TableCell className="font-medium">Contacto</TableCell><TableCell>{complaint.email} / {complaint.phone}</TableCell></TableRow>
                            <TableRow><TableCell className="font-medium">Dirección</TableCell><TableCell>{complaint.address}</TableCell></TableRow>
                            {complaint.guardianName && <TableRow><TableCell className="font-medium">Apoderado</TableCell><TableCell>{complaint.guardianName}</TableCell></TableRow>}
                        </TableBody>
                       </Table>
                       
                       <h4 className="font-semibold mt-4 mb-2">Detalles del Reclamo</h4>
                       <Table>
                        <TableBody>
                            <TableRow><TableCell className="font-medium w-1/4">Tipo de Bien</TableCell><TableCell>{complaint.itemType}</TableCell></TableRow>
                            <TableRow><TableCell className="font-medium">Descripción del Bien</TableCell><TableCell>{complaint.itemDescription}</TableCell></TableRow>
                            <TableRow><TableCell className="font-medium">Detalle del Reclamo</TableCell><TableCell className="whitespace-pre-wrap">{complaint.complaintDetails}</TableCell></TableRow>
                        </TableBody>
                       </Table>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
