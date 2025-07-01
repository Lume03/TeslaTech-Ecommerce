
"use client";

import React, { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAppContext, RegistrationData } from '@/contexts/AppContext';
import { useToast } from "@/hooks/use-toast";
import { registerUserAction } from '@/app/actions/authActions';

// Schemas and Types
const loginSchema = z.object({
  email: z.string().min(1, { message: "El correo es requerido." }).email({ message: "Por favor, introduce un correo válido." }),
  password: z.string().min(1, { message: "La contraseña es requerida." }).min(6, { message: "La contraseña debe tener al menos 6 caracteres." }),
});
type LoginFormData = z.infer<typeof loginSchema>;

const registrationSchema = z.object({
  firstName: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres." }).max(50).regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s'-]+$/, { message: "El nombre no debe contener números ni símbolos." }),
  lastName: z.string().min(2, { message: "El apellido debe tener al menos 2 caracteres." }).max(50).regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s'-]+$/, { message: "El apellido no debe contener números ni símbolos." }),
  dni: z.string().min(8, { message: "El DNI debe tener 8 dígitos." }).max(8, { message: "El DNI debe tener 8 dígitos."}).regex(/^\d+$/, "El DNI solo debe contener números."),
  phoneNumber: z.string().min(9, { message: "El teléfono debe tener 9 dígitos." }).max(9, { message: "El teléfono debe tener 9 dígitos."}).regex(/^\d+$/, "El teléfono solo debe contener números."),
  address: z.string().min(5, { message: "La dirección debe tener al menos 5 caracteres." }).max(100),
  email: z.string().email({ message: "Por favor, introduce un correo válido." }),
  password: z.string().min(6, { message: "La contraseña debe tener al menos 6 caracteres." }),
  confirmPassword: z.string().min(6, { message: "La confirmación de contraseña debe tener al menos 6 caracteres." }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden.",
  path: ["confirmPassword"],
});
type RegistrationFormData = z.infer<typeof registrationSchema>;

// Props interface
interface AuthModalProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  closeDialog: () => void;
}

const AuthModal = ({
  activeTab,
  setActiveTab,
  closeDialog,
}: AuthModalProps) => {
  const { 
    signInWithGoogle, 
    loadingAuth, 
    loginWithEmailPassword, 
  } = useAppContext();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const registrationForm = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      firstName: "", lastName: "", dni: "", phoneNumber: "", address: "",
      email: "", password: "", confirmPassword: "",
    },
  });

  // Reset forms when tab changes to avoid keeping old data/errors
  useEffect(() => {
    loginForm.reset();
    registrationForm.reset();
  }, [activeTab, loginForm, registrationForm]);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
        const success = await signInWithGoogle();
        if (success) {
        closeDialog();
        }
    } finally {
        setIsLoading(false);
    }
  };

  const onLoginSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
        const success = await loginWithEmailPassword(data.email, data.password);
        if (success) {
        closeDialog();
        }
    } finally {
        setIsLoading(false);
    }
  };

  const onRegisterSubmit = async (data: RegistrationFormData) => {
    setIsLoading(true);
    try {
        const { confirmPassword, ...registrationApiData } = data;
        const result = await registerUserAction(registrationApiData, data.password);
        
        if (result.success) {
            const loginSuccess = await loginWithEmailPassword(data.email, data.password);
            if (loginSuccess) {
                closeDialog();
            } else {
                toast({
                    title: "Registro exitoso, pero inicio de sesión falló",
                    description: "Tu cuenta fue creada. Por favor, intenta iniciar sesión manualmente.",
                });
                closeDialog();
            }
        } else {
            if (result.field && (result.field === 'dni' || result.field === 'phoneNumber' || result.field === 'email')) {
                registrationForm.setError(result.field, {
                type: 'server',
                message: result.error,
                });
            } else {
                toast({
                title: "Error de Registro",
                description: result.error || "Ocurrió un error inesperado.",
                variant: "destructive",
                });
            }
        }
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle className="text-2xl font-headline text-center">Bienvenido a TeslaTech</DialogTitle>
        <DialogDescription className="text-center pt-2 text-muted-foreground">
          Accede o crea tu cuenta para una experiencia de compra personalizada.
        </DialogDescription>
      </DialogHeader>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="login">Iniciar Sesión</TabsTrigger>
          <TabsTrigger value="register">Registrarse</TabsTrigger>
        </TabsList>

        <TabsContent value="login" className="space-y-4 pt-4">
          <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="login-email">Correo Electrónico o Usuario Admin</Label>
              <Controller
                name="email"
                control={loginForm.control}
                render={({ field }) => <Input id="login-email" type="text" placeholder="tu@correo.com o admin" {...field} />}
              />
              {loginForm.formState.errors.email && <p className="text-sm text-destructive">{loginForm.formState.errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="login-password">Contraseña</Label>
              <Controller
                name="password"
                control={loginForm.control}
                render={({ field }) => <Input id="login-password" type="password" placeholder="Tu contraseña" {...field} />}
              />
              {loginForm.formState.errors.password && <p className="text-sm text-destructive">{loginForm.formState.errors.password.message}</p>}
            </div>
            <Button type="submit" className="w-full" disabled={isLoading || loadingAuth}>
              {isLoading ? <Loader2 className="animate-spin" /> : "Iniciar Sesión"}
            </Button>
          </form>
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                O continuar con
              </span>
            </div>
          </div>
          <Button onClick={handleGoogleSignIn} variant="outline" className="w-full gap-2" disabled={isLoading || loadingAuth}>
            {(isLoading || loadingAuth) ? <Loader2 className="animate-spin" /> : <Image src="/images/google-logo.svg" alt="Google logo" width={18} height={18} data-ai-hint="google logo" unoptimized />}
            Google
          </Button>
        </TabsContent>

        <TabsContent value="register" className="space-y-4 pt-4">
          <form onSubmit={registrationForm.handleSubmit(onRegisterSubmit)} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="reg-firstName">Nombres</Label>
                <Controller name="firstName" control={registrationForm.control} render={({ field }) => <Input id="reg-firstName" placeholder="Tus nombres" {...field} />} />
                {registrationForm.formState.errors.firstName && <p className="text-xs text-destructive">{registrationForm.formState.errors.firstName.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="reg-lastName">Apellidos</Label>
                <Controller name="lastName" control={registrationForm.control} render={({ field }) => <Input id="reg-lastName" placeholder="Tus apellidos" {...field} />} />
                {registrationForm.formState.errors.lastName && <p className="text-xs text-destructive">{registrationForm.formState.errors.lastName.message}</p>}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                    <Label htmlFor="reg-dni">DNI</Label>
                    <Controller name="dni" control={registrationForm.control} render={({ field }) => <Input id="reg-dni" placeholder="Tu DNI" {...field} />} />
                    {registrationForm.formState.errors.dni && <p className="text-xs text-destructive">{registrationForm.formState.errors.dni.message}</p>}
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="reg-phoneNumber">Teléfono</Label>
                    <Controller name="phoneNumber" control={registrationForm.control} render={({ field }) => <Input id="reg-phoneNumber" type="tel" placeholder="Tu teléfono" {...field} />} />
                    {registrationForm.formState.errors.phoneNumber && <p className="text-xs text-destructive">{registrationForm.formState.errors.phoneNumber.message}</p>}
                </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="reg-address">Dirección de Envío</Label>
              <Controller name="address" control={registrationForm.control} render={({ field }) => <Input id="reg-address" placeholder="Ej: Av. Siempre Viva 123" {...field} />} />
              {registrationForm.formState.errors.address && <p className="text-xs text-destructive">{registrationForm.formState.errors.address.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="reg-email">Correo Electrónico</Label>
              <Controller name="email" control={registrationForm.control} render={({ field }) => <Input id="reg-email" type="email" placeholder="tu@correo.com" {...field} />} />
              {registrationForm.formState.errors.email && <p className="text-xs text-destructive">{registrationForm.formState.errors.email.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="reg-password">Contraseña</Label>
              <Controller name="password" control={registrationForm.control} render={({ field }) => <Input id="reg-password" type="password" placeholder="Crea una contraseña" {...field} />} />
              {registrationForm.formState.errors.password && <p className="text-xs text-destructive">{registrationForm.formState.errors.password.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="reg-confirmPassword">Confirmar Contraseña</Label>
              <Controller name="confirmPassword" control={registrationForm.control} render={({ field }) => <Input id="reg-confirmPassword" type="password" placeholder="Confirma tu contraseña" {...field} />} />
              {registrationForm.formState.errors.confirmPassword && <p className="text-xs text-destructive">{registrationForm.formState.errors.confirmPassword.message}</p>}
            </div>
            <Button type="submit" className="w-full" disabled={isLoading || loadingAuth}>
              {isLoading ? <Loader2 className="animate-spin" /> : "Crear Cuenta"}
            </Button>
          </form>
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                O registrarse con
              </span>
            </div>
          </div>
          <Button onClick={handleGoogleSignIn} variant="outline" className="w-full gap-2" disabled={isLoading || loadingAuth}>
            {(isLoading || loadingAuth) ? <Loader2 className="animate-spin" /> : <Image src="/images/google-logo.svg" alt="Google logo" width={18} height={18} data-ai-hint="google logo small" unoptimized />}
            Google
          </Button>
        </TabsContent>
      </Tabs>
    </DialogContent>
  );
};

export default AuthModal;
