
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import *  as z from 'zod';
import { useAppContext, UserProfile } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, UserCircle, Save, ShieldAlert } from 'lucide-react';
import Link from 'next/link';

const profileSchema = z.object({
  firstName: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres." }).max(50),
  lastName: z.string().min(2, { message: "El apellido debe tener al menos 2 caracteres." }).max(50),
  dni: z.string().min(8, { message: "El DNI debe tener 8 dígitos." }).max(8, { message: "El DNI debe tener 8 dígitos."}).regex(/^\d+$/, "El DNI solo debe contener números."),
  phoneNumber: z.string().min(9, { message: "El teléfono debe tener al menos 9 dígitos." }).max(15).regex(/^[+]*[(]{0,1}[0-9]{1,4}[)]{0,1}[-\s\./0-9]*$/, "Número de teléfono inválido."),
  address: z.string().min(5, { message: "La dirección debe tener al menos 5 caracteres." }).max(100),
  // email y displayName no son editables aquí, vienen de Google/Firebase Auth
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const { currentUser, userProfile, loadingAuth, updateUserProfile, isProfileComplete, isAdmin } = useAppContext();
  const router = useRouter();

  const { control, handleSubmit, reset, formState: { errors, isSubmitting, isDirty } } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      dni: '',
      phoneNumber: '',
      address: '',
    },
  });

  useEffect(() => {
    if (!loadingAuth) {
      if (!currentUser) {
        router.replace('/'); // O a una página de "por favor inicie sesión"
      } else if (userProfile) {
        reset({
          firstName: userProfile.firstName || '',
          lastName: userProfile.lastName || '',
          dni: userProfile.dni || '',
          phoneNumber: userProfile.phoneNumber || '',
          address: userProfile.address || '',
        });
      }
    }
  }, [currentUser, userProfile, loadingAuth, router, reset]);

  const onSubmit = async (data: ProfileFormData) => {
    await updateUserProfile(data);
    reset(data); // Para resetear isDirty
  };

  if (loadingAuth) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  if (isAdmin) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <ShieldAlert className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
        <h1 className="text-3xl font-headline font-bold mb-4">Acceso Restringido</h1>
        <p className="text-muted-foreground mb-6">Los administradores no tienen una página de perfil de cliente.</p>
        <Link href="/admin" passHref>
          <Button size="lg">Ir al Panel de Administración</Button>
        </Link>
      </div>
    );
  }

  if (!currentUser || !userProfile) {
     return (
      <div className="container mx-auto px-4 py-8 text-center">
        <UserCircle className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
        <h1 className="text-3xl font-headline font-bold mb-4">Acceso Denegado</h1>
        <p className="text-muted-foreground mb-6">Debes iniciar sesión para ver tu perfil.</p>
        <Link href="/" passHref>
          <Button size="lg">Volver al Inicio</Button>
        </Link>
      </div>
    );
  }
  
  const profileInitiallyComplete = isProfileComplete(userProfile);

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <Card>
        <CardHeader className="items-center text-center">
          <Avatar className="h-24 w-24 mb-4">
            {userProfile.photoURL ? (
              <AvatarImage src={userProfile.photoURL} alt={userProfile.displayName || 'User Avatar'} />
            ) : (
 <AvatarImage src={`https://placehold.co/96x96/7DF9FF/282A3A.png?text=${userProfile.displayName ? userProfile.displayName.charAt(0).toUpperCase() : 'U'}`} alt={userProfile.displayName || 'User Avatar'} data-ai-hint="user avatar" />
            )}
            <AvatarFallback className="text-3xl">{userProfile.displayName ? userProfile.displayName.charAt(0).toUpperCase() : 'U'}</AvatarFallback>
          </Avatar>
          <CardTitle className="text-3xl font-headline">{userProfile.displayName || "Mi Perfil"}</CardTitle>
          <CardDescription>{userProfile.email}</CardDescription>
          {!profileInitiallyComplete && (
            <p className="text-sm text-destructive mt-2">Por favor, completa tus datos para facilitar tus compras.</p>
          )}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="firstName">Nombres</Label>
                <Controller
                  name="firstName"
                  control={control}
                  render={({ field }) => <Input id="firstName" {...field} placeholder="Tus nombres" />}
                />
                {errors.firstName && <p className="text-sm text-destructive">{errors.firstName.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Apellidos</Label>
                <Controller
                  name="lastName"
                  control={control}
                  render={({ field }) => <Input id="lastName" {...field} placeholder="Tus apellidos" />}
                />
                {errors.lastName && <p className="text-sm text-destructive">{errors.lastName.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="dni">DNI</Label>
                <Controller
                  name="dni"
                  control={control}
                  render={({ field }) => <Input id="dni" {...field} placeholder="Tu número de DNI" />}
                />
                {errors.dni && <p className="text-sm text-destructive">{errors.dni.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Número de Teléfono</Label>
                <Controller
                  name="phoneNumber"
                  control={control}
                  render={({ field }) => <Input id="phoneNumber" type="tel" {...field} placeholder="Tu número de teléfono" />}
                />
                {errors.phoneNumber && <p className="text-sm text-destructive">{errors.phoneNumber.message}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Dirección de Envío Principal</Label>
              <Controller
                name="address"
                control={control}
                render={({ field }) => <Input id="address" {...field} placeholder="Ej: Av. Siempre Viva 123, Springfield" />}
              />
              {errors.address && <p className="text-sm text-destructive">{errors.address.message}</p>}
            </div>
             <CardFooter className="px-0 pt-6">
              <Button type="submit" disabled={isSubmitting || !isDirty} className="w-full md:w-auto">
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Guardar Cambios
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
