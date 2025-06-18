
"use client";
import Link from 'next/link';
import { Heart, Search, ShoppingCart, Menu, LogOut, UserCircle, ChevronDown, Mail, Lock, Loader2, UserPlus, Shield, ListOrdered } from 'lucide-react'; // Added Shield, ListOrdered
import Logo from '@/components/icons/Logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAppContext, RegistrationData } from '@/contexts/AppContext';
import { Badge } from '@/components/ui/badge';
import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import Image from 'next/image';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { cn } from '@/lib/utils';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/products', label: 'Productos' },
  { href: '/categories', label: 'Categorías' },
];

const loginSchema = z.object({
  email: z.string().min(1, { message: "El correo es requerido." }).email({ message: "Por favor, introduce un correo válido." }),
  password: z.string().min(1, { message: "La contraseña es requerida." }).min(6, { message: "La contraseña debe tener al menos 6 caracteres." }),
});
type LoginFormData = z.infer<typeof loginSchema>;

const registrationSchema = z.object({
  firstName: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres." }).max(50),
  lastName: z.string().min(2, { message: "El apellido debe tener al menos 2 caracteres." }).max(50),
  dni: z.string().min(8, { message: "El DNI debe tener 8 dígitos." }).max(8, { message: "El DNI debe tener 8 dígitos."}).regex(/^\d+$/, "El DNI solo debe contener números."),
  phoneNumber: z.string().min(9, { message: "El teléfono debe tener al menos 9 dígitos." }).max(15).regex(/^[+]*[(]{0,1}[0-9]{1,4}[)]{0,1}[-\s\./0-9]*$/, "Número de teléfono inválido."),
  address: z.string().min(5, { message: "La dirección debe tener al menos 5 caracteres." }).max(100),
  email: z.string().email({ message: "Por favor, introduce un correo válido." }),
  password: z.string().min(6, { message: "La contraseña debe tener al menos 6 caracteres." }),
  confirmPassword: z.string().min(6, { message: "La confirmación de contraseña debe tener al menos 6 caracteres." }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden.",
  path: ["confirmPassword"],
});
type RegistrationFormData = z.infer<typeof registrationSchema>;


export default function Header() {
  const {
    getCartItemCount,
    wishlist,
    currentUser,
    userProfile,
    isAdmin,
    signInWithGoogle,
    signOut,
    loadingAuth,
    isEmailAuthLoading,
    registerWithEmailPassword,
    loginWithEmailPassword
  } = useAppContext();

  const [cartItemCount, setCartItemCount] = useState(0);
  const [wishlistItemCount, setWishlistItemCount] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("login");


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

  useEffect(() => { setCartItemCount(getCartItemCount()); }, [getCartItemCount]);
  useEffect(() => { setWishlistItemCount(wishlist.length); }, [wishlist]);

  const handleGoogleSignInAndCloseDialog = async () => {
    const success = await signInWithGoogle();
    if (success) {
      setIsAuthDialogOpen(false);
      if (isMobileMenuOpen) setIsMobileMenuOpen(false);
    }
  };

  const onLoginSubmit = async (data: LoginFormData) => {
    let emailToLogin = data.email;
    if (data.email.toLowerCase() === 'admin' && data.password === 'admin123') {
      emailToLogin = 'admin@teslatech.com';
    }
    const success = await loginWithEmailPassword(emailToLogin, data.password);
    if (success) {
      loginForm.reset();
      setIsAuthDialogOpen(false);
      if (isMobileMenuOpen) setIsMobileMenuOpen(false);
    }
  };

  const onRegisterSubmit = async (data: RegistrationFormData) => {
    const { confirmPassword, ...registrationApiData } = data;
    const success = await registerWithEmailPassword(registrationApiData as RegistrationData, data.password);
    if (success) {
      registrationForm.reset();
      setIsAuthDialogOpen(false);
      if (isMobileMenuOpen) setIsMobileMenuOpen(false);
    }
  };

  const NavLinksComponent = ({ isMobile = false }: { isMobile?: boolean }) => (
    <nav className={cn(
        "flex items-center",
        isMobile ? 'flex-col space-y-2 p-4' : 'space-x-1',
        isAdmin && !isMobile && 'ml-auto mr-4'
      )}>
      {navLinks.map((link) => (
        <Link key={link.href} href={link.href} passHref>
          <Button variant="ghost" className={cn("hover:text-primary transition-colors", isMobile ? 'w-full text-left justify-start text-lg py-3' : 'text-sm px-3 py-2')} onClick={() => isMobile && setIsMobileMenuOpen(false)}>
            {link.label}
          </Button>
        </Link>
      ))}
      {isAdmin && (
         <Link href="/admin" passHref>
          <Button variant="ghost" className={cn("hover:text-primary transition-colors text-primary", isMobile ? 'w-full text-left justify-start text-lg py-3' : 'text-sm px-3 py-2')} onClick={() => isMobile && setIsMobileMenuOpen(false)}>
            <Shield className="mr-1 h-4 w-4" /> Admin
          </Button>
        </Link>
      )}
    </nav>
  );

  const AuthModalContent = () => (
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
            <Button type="submit" className="w-full" disabled={isEmailAuthLoading || loadingAuth}>
              {isEmailAuthLoading ? <Loader2 className="animate-spin" /> : "Iniciar Sesión"}
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
          <Button onClick={handleGoogleSignInAndCloseDialog} variant="outline" className="w-full gap-2" disabled={isEmailAuthLoading || loadingAuth}>
            {(isEmailAuthLoading || loadingAuth) && activeTab === 'login' ? <Loader2 className="animate-spin" /> : <Image src="/images/google-logo.svg" alt="Google logo" width={18} height={18} data-ai-hint="google logo" />}
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
            <Button type="submit" className="w-full" disabled={isEmailAuthLoading || loadingAuth}>
              {isEmailAuthLoading ? <Loader2 className="animate-spin" /> : "Crear Cuenta"}
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
          <Button onClick={handleGoogleSignInAndCloseDialog} variant="outline" className="w-full gap-2" disabled={isEmailAuthLoading || loadingAuth}>
             {(isEmailAuthLoading || loadingAuth) && activeTab === 'register' ? <Loader2 className="animate-spin" /> : <Image src="/images/google-logo.svg" alt="Google logo" width={18} height={18} data-ai-hint="google logo small" />}
            Google
          </Button>
        </TabsContent>
      </Tabs>
    </DialogContent>
  );

  const UserMenu = () => {
    if (loadingAuth) {
      return <Button variant="ghost" size="icon" className="h-10 w-10" disabled><Loader2 className="animate-pulse h-5 w-5" /></Button>;
    }
    if (currentUser && userProfile) {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              <Avatar className="h-9 w-9">
                {userProfile.photoURL ? (
                  <AvatarImage src={userProfile.photoURL} alt={userProfile.displayName || 'User Avatar'} />
                ) : (
                  <AvatarImage src={`https://placehold.co/40x40/7DF9FF/282A3A.png?text=${userProfile.displayName ? userProfile.displayName.charAt(0).toUpperCase() : 'U'}`} alt={userProfile.displayName || 'User Avatar'} data-ai-hint="user avatar placeholder" />
                )}
                <AvatarFallback>{userProfile.displayName ? userProfile.displayName.charAt(0).toUpperCase() : 'U'}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{userProfile.displayName || "Usuario"}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {userProfile.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/profile" className="cursor-pointer">
                <UserCircle className="mr-2 h-4 w-4" />
                <span>Mi Perfil</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/orders" className="cursor-pointer">
                <ListOrdered className="mr-2 h-4 w-4" />
                <span>Mis Pedidos</span>
              </Link>
            </DropdownMenuItem>
            {isAdmin && (
              <DropdownMenuItem asChild>
                <Link href="/admin" className="cursor-pointer">
                  <Shield className="mr-2 h-4 w-4" />
                  <span>Panel Admin</span>
                </Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={signOut} className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Cerrar Sesión</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }
    return (
      <Dialog open={isAuthDialogOpen} onOpenChange={setIsAuthDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" onClick={() => setActiveTab('login')}>
            Iniciar Sesión
          </Button>
        </DialogTrigger>
        <AuthModalContent />
      </Dialog>
    );
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 flex items-center justify-between h-16 md:h-20">
        <Link href="/" passHref>
          <Logo className="cursor-pointer" />
        </Link>

        <div className={cn("hidden lg:flex items-center", isAdmin ? "justify-start" : "justify-center flex-grow")}>
          <NavLinksComponent />
        </div>

        <div className="flex items-center space-x-1 md:space-x-2">
          <div className="hidden md:flex relative w-full max-w-xs lg:hidden">
            <Input type="search" placeholder="Buscar productos..." className="pr-10 h-9" />
            <Button variant="ghost" size="icon" className="absolute right-0.5 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground">
              <Search size={18} />
            </Button>
          </div>

          <Link href="/wishlist" passHref>
            <Button variant="ghost" size="icon" aria-label="Wishlist" className="relative">
              <Heart />
              {wishlistItemCount > 0 && (
                <Badge variant="destructive" className="absolute -top-1 -right-1 h-4 min-w-[1rem] px-1 text-xs flex items-center justify-center">{wishlistItemCount}</Badge>
              )}
            </Button>
          </Link>
          <Link href="/cart" passHref>
            <Button variant="ghost" size="icon" aria-label="Shopping Cart" className="relative">
              <ShoppingCart />
              {cartItemCount > 0 && (
                <Badge variant="destructive" className="absolute -top-1 -right-1 h-4 min-w-[1rem] px-1 text-xs flex items-center justify-center">{cartItemCount}</Badge>
              )}
            </Button>
          </Link>

          <div className="hidden lg:flex">
            <UserMenu />
          </div>

          <div className="lg:hidden">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] sm:w-[320px] bg-background p-0 flex flex-col">
                <div className="p-4 border-b flex justify-between items-center">
                  <Logo />
                </div>
                <NavLinksComponent isMobile={true} />
                <div className="mt-auto p-4 border-t space-y-3">
                  <div className="relative w-full mb-3">
                    <Input type="search" placeholder="Buscar productos..." className="pr-10 h-10" />
                    <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground">
                      <Search size={20} />
                    </Button>
                  </div>
                  {currentUser && userProfile ? (
                     <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                           <Button variant="outline" className="w-full justify-start text-md py-3">
                              <Avatar className="h-7 w-7 mr-2">
                                {userProfile.photoURL ? (
                                  <AvatarImage src={userProfile.photoURL} alt={userProfile.displayName || 'User Avatar'} />
                                ) : (
                                  <AvatarImage src={`https://placehold.co/28x28/7DF9FF/282A3A.png?text=${userProfile.displayName ? userProfile.displayName.charAt(0).toUpperCase() : 'U'}`} alt={userProfile.displayName || 'User Avatar'} data-ai-hint="user avatar small placeholder" />
                                )}
                                <AvatarFallback>{userProfile.displayName ? userProfile.displayName.charAt(0).toUpperCase() : 'U'}</AvatarFallback>
                              </Avatar>
                              {userProfile.displayName || "Mi Cuenta"}
                              <ChevronDown className="ml-auto h-5 w-5" />
                           </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-[calc(300px-2rem)]" align="end">
                           <DropdownMenuLabel className="font-normal">
                            <div className="flex flex-col space-y-1">
                              <p className="text-sm font-medium leading-none">{userProfile.displayName || "Usuario"}</p>
                              <p className="text-xs leading-none text-muted-foreground">
                                {userProfile.email}
                              </p>
                            </div>
                          </DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem asChild onClick={() => setIsMobileMenuOpen(false)}>
                            <Link href="/profile" className="cursor-pointer w-full">
                              <UserCircle className="mr-2 h-4 w-4" />
                              <span>Mi Perfil</span>
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild onClick={() => setIsMobileMenuOpen(false)}>
                            <Link href="/orders" className="cursor-pointer w-full">
                              <ListOrdered className="mr-2 h-4 w-4" />
                              <span>Mis Pedidos</span>
                            </Link>
                          </DropdownMenuItem>
                           {isAdmin && (
                            <DropdownMenuItem asChild onClick={() => setIsMobileMenuOpen(false)}>
                              <Link href="/admin" className="cursor-pointer w-full">
                                <Shield className="mr-2 h-4 w-4" />
                                <span>Panel Admin</span>
                              </Link>
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => { signOut(); setIsMobileMenuOpen(false); }} className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10">
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>Cerrar Sesión</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                  ) : (
                    <Dialog open={isAuthDialogOpen} onOpenChange={(open) => { setIsAuthDialogOpen(open); }}>
                      <DialogTrigger asChild>
                        <Button className="w-full justify-center text-md py-3 gap-2" onClick={() => setActiveTab('login')}>
                          <UserCircle className="mr-2 h-5 w-5" />
                          Iniciar Sesión
                        </Button>
                      </DialogTrigger>
                      <AuthModalContent />
                    </Dialog>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
