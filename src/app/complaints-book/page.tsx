
"use client";

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useToast } from "@/hooks/use-toast";
import { submitComplaintAction } from '@/app/actions/complaintActions'; // Import the server action
import { Loader2 } from 'lucide-react';

const complaintSchema = z.object({
  fullName: z.string().min(1, "Nombres y Apellidos son requeridos."),
  documentType: z.string().min(1, "Tipo de documento es requerido."),
  documentNumber: z.string().min(8, "Número de documento es requerido.").regex(/^\d+$/, "Solo se permiten números."),
  address: z.string().min(1, "Dirección es requerida."),
  email: z.string().email("Correo electrónico inválido."),
  phone: z.string().min(1, "Número de teléfono es requerido."),
  guardianName: z.string().optional(),
  
  itemType: z.string().min(1, "Tipo de bien es requerido."),
  itemDescription: z.string().min(1, "Descripción del bien es requerida."),
  
  complaintType: z.string().min(1, "Tipo de reclamación es requerido."),
  complaintDetails: z.string().min(1, "Detalle de la reclamación es requerido."),

  isCorrect: z.boolean().refine(val => val === true, { message: "Debe declarar que los datos son correctos." }),
  hasReadPolicy: z.boolean().refine(val => val === true, { message: "Debe aceptar la Política de Privacidad." }),
});

type ComplaintFormData = z.infer<typeof complaintSchema>;

export default function ComplaintsBookPage() {
  const [currentDate, setCurrentDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    const now = new Date();
    const formattedDate = `${now.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })} ${now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`;
    setCurrentDate(formattedDate);
  }, []);

  const { control, handleSubmit, formState: { errors }, reset } = useForm<ComplaintFormData>({
    resolver: zodResolver(complaintSchema),
    defaultValues: {
      fullName: '',
      documentNumber: '',
      address: '',
      email: '',
      phone: '',
      guardianName: '',
      itemDescription: '',
      complaintDetails: '',
      documentType: "DNI",
      itemType: "Producto",
      complaintType: "Reclamo",
      isCorrect: false,
      hasReadPolicy: false,
    }
  });

  const onSubmit = async (data: ComplaintFormData) => {
    setIsSubmitting(true);
    // Exclude checkbox fields before sending to the server action
    const { isCorrect, hasReadPolicy, ...complaintData } = data;
    
    const result = await submitComplaintAction(complaintData);

    if (result.success) {
      toast({
        title: "Reclamo Enviado",
        description: "Tu reclamo ha sido registrado exitosamente. Te contactaremos pronto.",
      });
      reset(); // Clear the form on successful submission
    } else {
      toast({
        title: "Error al Enviar",
        description: result.error || "No se pudo registrar tu reclamo. Por favor, intenta de nuevo.",
        variant: "destructive",
      });
    }
    setIsSubmitting(false);
  };

  const SectionTitle = ({ children }: { children: React.ReactNode }) => (
    <h2 className="text-xl font-headline font-semibold text-foreground pb-2 mb-6 border-b border-primary">{children}</h2>
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Card className="shadow-2xl">
        <CardHeader className="text-center bg-muted/30">
          <CardTitle className="text-3xl font-headline font-bold text-primary">Libro de Reclamaciones</CardTitle>
        </CardHeader>
        <CardContent className="p-6 md:p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
            
            <section>
              <SectionTitle>Datos Generales</SectionTitle>
              <div className="space-y-2 text-sm text-muted-foreground bg-muted p-4 rounded-md border">
                <p><strong className="text-foreground">Fecha del reclamo:</strong> {currentDate}</p>
                <p><strong className="text-foreground">Razón Social:</strong> TeslaTech</p>
                <p><strong className="text-foreground">RUC:</strong> 10749821057</p>
                <p><strong className="text-foreground">Dirección:</strong> Galería Centro Lima - Pasaje H 557 Primer Nivel, Lima, Perú</p>
              </div>
            </section>
            
            <section>
              <SectionTitle>Identificación del Consumidor</SectionTitle>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="fullName">Nombres y Apellidos</Label>
                  <Controller name="fullName" control={control} render={({ field }) => <Input id="fullName" {...field} />} />
                  {errors.fullName && <p className="text-sm text-destructive mt-1">{errors.fullName.message}</p>}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="documentType">Tipo de Documento</Label>
                    <Controller name="documentType" control={control} render={({ field }) => (
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <SelectTrigger id="documentType"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="DNI">DNI</SelectItem>
                          <SelectItem value="Pasaporte">Pasaporte</SelectItem>
                          <SelectItem value="CE">Carnet de Extranjería</SelectItem>
                        </SelectContent>
                      </Select>
                    )} />
                     {errors.documentType && <p className="text-sm text-destructive mt-1">{errors.documentType.message}</p>}
                  </div>
                  <div>
                    <Label htmlFor="documentNumber">Número de Documento</Label>
                    <Controller name="documentNumber" control={control} render={({ field }) => <Input id="documentNumber" {...field} />} />
                    {errors.documentNumber && <p className="text-sm text-destructive mt-1">{errors.documentNumber.message}</p>}
                  </div>
                </div>
                <div>
                  <Label htmlFor="address">Dirección</Label>
                  <Controller name="address" control={control} render={({ field }) => <Input id="address" {...field} />} />
                  {errors.address && <p className="text-sm text-destructive mt-1">{errors.address.message}</p>}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Correo electrónico</Label>
                    <Controller name="email" control={control} render={({ field }) => <Input id="email" type="email" {...field} />} />
                    {errors.email && <p className="text-sm text-destructive mt-1">{errors.email.message}</p>}
                  </div>
                  <div>
                    <Label htmlFor="phone">Número de Teléfono</Label>
                    <Controller name="phone" control={control} render={({ field }) => <Input id="phone" type="tel" {...field} />} />
                    {errors.phone && <p className="text-sm text-destructive mt-1">{errors.phone.message}</p>}
                  </div>
                </div>
                 <div>
                    <Label htmlFor="guardianName">Nombre del apoderado (Solo si es menor de edad)</Label>
                    <Controller name="guardianName" control={control} render={({ field }) => <Input id="guardianName" {...field} />} />
                  </div>
              </div>
            </section>

            <section>
              <SectionTitle>Identificación del bien contratado</SectionTitle>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="itemType">Tipo de bien recibido</Label>
                  <Controller name="itemType" control={control} render={({ field }) => (
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <SelectTrigger id="itemType"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Producto">Producto</SelectItem>
                          <SelectItem value="Servicio">Servicio</SelectItem>
                        </SelectContent>
                      </Select>
                    )} />
                   {errors.itemType && <p className="text-sm text-destructive mt-1">{errors.itemType.message}</p>}
                </div>
                <div>
                  <Label htmlFor="itemDescription">Descripción del bien</Label>
                  <Controller name="itemDescription" control={control} render={({ field }) => <Textarea id="itemDescription" {...field} />} />
                  {errors.itemDescription && <p className="text-sm text-destructive mt-1">{errors.itemDescription.message}</p>}
                </div>
              </div>
            </section>
            
            <section>
              <SectionTitle>Detalle de la reclamación</SectionTitle>
              <div className="text-xs text-muted-foreground space-y-1 mb-4 bg-muted/50 p-3 rounded-md border">
                <p><strong className="text-foreground">* Queja:</strong> Disconformidad no relacionada a los productos o servicios o malestar o descontento respecto a la atención al público.</p>
                <p><strong className="text-foreground">* Reclamo:</strong> Disconformidad relacionada a los productos o servicios.</p>
              </div>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="complaintType">Tipo de reclamación</Label>
                  <Controller name="complaintType" control={control} render={({ field }) => (
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <SelectTrigger id="complaintType"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Queja">Queja</SelectItem>
                          <SelectItem value="Reclamo">Reclamo</SelectItem>
                        </SelectContent>
                      </Select>
                    )} />
                  {errors.complaintType && <p className="text-sm text-destructive mt-1">{errors.complaintType.message}</p>}
                </div>
                <div>
                  <Label htmlFor="complaintDetails">Detalle de la reclamación</Label>
                  <Controller name="complaintDetails" control={control} render={({ field }) => <Textarea id="complaintDetails" rows={5} {...field} />} />
                  {errors.complaintDetails && <p className="text-sm text-destructive mt-1">{errors.complaintDetails.message}</p>}
                </div>
              </div>
            </section>
            
            <section className="space-y-4 pt-4 border-t">
              <Controller name="isCorrect" control={control} render={({ field }) => (
                  <div className="flex items-start space-x-3">
                    <Checkbox id="isCorrect" checked={field.value} onCheckedChange={field.onChange} className="mt-1"/>
                    <Label htmlFor="isCorrect" className="font-normal text-sm text-muted-foreground leading-snug">Declaro que los datos consignados son correctos y fiel expresión de la verdad.</Label>
                  </div>
                )} />
              {errors.isCorrect && <p className="text-sm text-destructive ml-6">{errors.isCorrect.message}</p>}

              <Controller name="hasReadPolicy" control={control} render={({ field }) => (
                  <div className="flex items-start space-x-3">
                    <Checkbox id="hasReadPolicy" checked={field.value} onCheckedChange={field.onChange} className="mt-1"/>
                    <Label htmlFor="hasReadPolicy" className="font-normal text-sm text-muted-foreground leading-snug">
                      Declaro haber leído y acepto la{' '}
                      <Link href="/privacy-policy" className="text-primary hover:underline" target="_blank">
                        Política de Privacidad de Datos personales
                      </Link>.
                    </Label>
                  </div>
                )} />
              {errors.hasReadPolicy && <p className="text-sm text-destructive ml-6">{errors.hasReadPolicy.message}</p>}
              
              <div className="flex justify-center pt-4">
                <Button type="submit" size="lg" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isSubmitting ? 'Enviando...' : 'Enviar'}
                </Button>
              </div>
            </section>
          </form>
        </CardContent>
         <CardHeader className="text-center bg-muted/30 py-3">
            <p className="text-xs text-muted-foreground">&copy; {currentYear} - TeslaTech</p>
        </CardHeader>
      </Card>
    </div>
  );
}
