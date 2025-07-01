"use client";
import Link from 'next/link';
import { Heart, Search, ShoppingCart, Menu, LogOut, UserCircle, ChevronDown, Loader2, Shield, ListOrdered } from 'lucide-react';
import Logo from '@/components/icons/Logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAppContext } from '@/contexts/AppContext';
import { Badge } from '@/components/ui/badge';
import React, { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
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
import { cn } from '@/lib/utils';
import dynamic from 'next/dynamic';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/products', label: 'Productos' },
  { href: '/categories', label: 'Categorías' },
];

const AuthModal = dynamic(() => import('@/components/layout/AuthModal'), {
    loading: () => <DialogContent className="sm:max-w-md flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></DialogContent>,
    ssr: false
});

export default function Header() {
  const {
    getCartItemCount,
    wishlist,
    currentUser,
    userProfile,
    isAdmin,
    signOut,
    loadingAuth,
  } = useAppContext();

  const [cartItemCount, setCartItemCount] = useState(0);
  const [wishlistItemCount, setWishlistItemCount] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("login");

  useEffect(() => { setCartItemCount(getCartItemCount()); }, [getCartItemCount]);
  useEffect(() => { setWishlistItemCount(wishlist.length); }, [wishlist]);

  const NavLinksComponent = ({ isMobile = false }: { isMobile?: boolean }) => (
    <nav className={cn(
        "flex items-center",
        isMobile ? 'flex-col space-y-2 p-4' : 'space-x-1'
      )}>
      {navLinks.map((link) => (
        <Link key={link.href} href={link.href} passHref>
          <Button variant="ghost" className={cn("hover:text-primary transition-colors", isMobile ? 'w-full text-left justify-start text-lg py-3' : 'text-sm px-3 py-2')} onClick={() => isMobile && setIsMobileMenuOpen(false)}>
            {link.label}
          </Button>
        </Link>
      ))}
    </nav>
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
            {!isAdmin && (
              <>
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
              </>
            )}
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
        <AuthModal
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          closeDialog={() => {
            setIsAuthDialogOpen(false);
            if (isMobileMenuOpen) setIsMobileMenuOpen(false);
          }}
        />
      </Dialog>
    );
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 flex items-center justify-between h-16 md:h-20">
        <Link href={isAdmin ? "/admin" : "/"} passHref className="cursor-pointer">
          <Logo />
        </Link>

        {/* --- Desktop Nav --- */}
        <div className={cn("hidden lg:flex items-center flex-grow justify-center")}>
          {isAdmin ? (
            <Link href="/admin" passHref>
              <Button variant="default" className="font-semibold text-base">
                <Shield className="mr-2 h-5 w-5" />
                Panel Admin
              </Button>
            </Link>
          ) : (
            <NavLinksComponent />
          )}
        </div>
        
        {/* --- Right side icons and User Menu --- */}
        <div className="flex items-center space-x-1 md:space-x-2">
          {!isAdmin && (
            <div className="hidden md:flex relative w-full max-w-xs lg:hidden">
              <Input type="search" placeholder="Buscar productos..." className="pr-10 h-9" />
              <Button variant="ghost" size="icon" className="absolute right-0.5 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground">
                <Search size={18} />
              </Button>
            </div>
          )}

          {!isAdmin && (
            <>
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
            </>
          )}

          <div className="hidden lg:flex">
            <UserMenu />
          </div>

          {/* --- Mobile Menu --- */}
          <div className="lg:hidden">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] sm:w-[320px] bg-background p-0 flex flex-col">
                <div className="p-4 border-b flex justify-between items-center">
                   <Link href={isAdmin ? "/admin" : "/"} passHref className="cursor-pointer" onClick={() => setIsMobileMenuOpen(false)}>
                    <Logo />
                  </Link>
                </div>

                {isAdmin ? (
                  <div className="flex flex-col space-y-2 p-4">
                    <Link href="/admin" passHref>
                      <Button variant="default" className="w-full text-left justify-start text-lg py-3">
                        <Shield className="mr-2 h-5 w-5" />
                        Panel Admin
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <NavLinksComponent isMobile={true} />
                )}

                <div className="mt-auto p-4 border-t space-y-3">
                  {!isAdmin && (
                    <div className="relative w-full mb-3">
                      <Input type="search" placeholder="Buscar productos..." className="pr-10 h-10" />
                      <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground">
                        <Search size={20} />
                      </Button>
                    </div>
                  )}
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
                          {!isAdmin && (
                            <>
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
                            </>
                          )}
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
                       <AuthModal
                          activeTab={activeTab}
                          setActiveTab={setActiveTab}
                          closeDialog={() => {
                            setIsAuthDialogOpen(false);
                            if (isMobileMenuOpen) setIsMobileMenuOpen(false);
                          }}
                        />
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
