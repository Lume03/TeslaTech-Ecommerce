
"use client";
import type { Product } from '@/lib/data';
import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback, useMemo } from 'react';
import { useToast } from "@/hooks/use-toast";
import { auth, firestore, googleProvider, configComplete } from '@/lib/firebase/config';
import type { User } from 'firebase/auth';
import { 
  signInWithPopup, 
  signOut as firebaseSignOut, 
  onAuthStateChanged,
  signInWithEmailAndPassword,
  type AuthProvider
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { getProductsByIdsFromDB } from '@/lib/data';

export interface CartItem extends Product {
  quantity: number;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  firstName?: string;
  lastName?: string;
  dni?: string;
  phoneNumber?: string;
  address?: string;
  isAdmin?: boolean; 
  createdAt?: any;
  updatedAt?: any;
  wishlist?: string[]; // Array of product IDs
  cart?: { id: string; quantity: number }[]; // Array of non-hydrated cart items
}

export interface RegistrationData {
  firstName: string;
  lastName: string;
  dni: string;
  phoneNumber: string;
  address: string;
  email: string;
}

const ADMIN_EMAIL = 'admin@teslatech.com'; 

interface AppContextType {
  wishlist: Product[];
  addToWishlist: (product: Product) => void;
  removeFromWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
  clearWishlist: (silent?: boolean) => void;
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  addMultipleToCart: (itemsToAdd: { product: Product; quantity: number }[]) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  getCartTotal: () => number;
  getCartItemCount: () => number;
  clearCart: (silent?: boolean) => void;
  currentUser: User | null;
  userProfile: UserProfile | null;
  isAdmin: boolean; 
  loadingAuth: boolean;
  signInWithGoogle: () => Promise<boolean>; 
  signOut: () => Promise<void>;
  updateUserProfile: (data: Partial<UserProfile>) => Promise<void>;
  isProfileComplete: (profile: UserProfile | null) => boolean;
  loginWithEmailPassword: (email: string, password: string) => Promise<boolean>; 
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [wishlist, setWishlist] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const { toast } = useToast();
  const router = useRouter();

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false); 
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [authModal, setAuthModal] = useState({ isOpen: false, activeTab: 'login' });

  // --- Firestore Sync for Logged-in Users ---
  const updateFirestoreUser = useCallback(async (data: Partial<Pick<UserProfile, 'cart' | 'wishlist'>>) => {
    if (!currentUser || !firestore) return;
    try {
      const userRef = doc(firestore, "users", currentUser.uid);
      await updateDoc(userRef, data);
    } catch (error) {
      console.error("Failed to update user data in Firestore:", error);
      toast({ title: "Error de Sincronización", description: "No se pudieron guardar los cambios en tu cuenta.", variant: "destructive" });
    }
  }, [currentUser, toast]);


  // --- localStorage Sync for Guest Users ---
  useEffect(() => {
    if (!currentUser) { // Only save to LS for guest users
      try {
        localStorage.setItem('wishlist', JSON.stringify(wishlist.map(p => ({ id: p.id })))); // Save only IDs
      } catch (e) { console.error("Could not save wishlist to localStorage", e); }
    }
  }, [wishlist, currentUser]);

  useEffect(() => {
    if (!currentUser) { // Only save to LS for guest users
      try {
        localStorage.setItem('cart', JSON.stringify(cart.map(c => ({ id: c.id, quantity: c.quantity }))));
      } catch (e) { console.error("Could not save cart to localStorage", e); }
    }
  }, [cart, currentUser]);


  // --- Auth State Change Handler (Main logic for loading data) ---
  useEffect(() => {
    if (!configComplete || !auth) {
      console.warn("Firebase Auth service is not available. User authentication will be disabled.");
      setLoadingAuth(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoadingAuth(true); 
      if (user) { // --- USER IS LOGGED IN ---
        setCurrentUser(user);
        if (firestore) {
          const userRef = doc(firestore, "users", user.uid);
          const docSnap = await getDoc(userRef);
          
          if (docSnap.exists()) { // --- EXISTING USER LOGS IN ---
            const localWishlistItems: {id: string}[] = JSON.parse(localStorage.getItem('wishlist') || '[]');
            const localCartItems: {id: string, quantity: number}[] = JSON.parse(localStorage.getItem('cart') || '[]');
            const localWishlistIds = new Set(localWishlistItems.map(p => p.id));
            const localCartMap = new Map(localCartItems.map(item => [item.id, item.quantity]));
            
            const profileData = docSnap.data() as UserProfile;
            setUserProfile(profileData);
            const userIsAdmin = profileData.email === ADMIN_EMAIL || profileData.isAdmin === true;
            setIsAdmin(userIsAdmin);

            if (userIsAdmin) {
              setWishlist([]);
              setCart([]);
              router.push('/admin');
            } else {
              const firestoreWishlistIds = new Set(profileData.wishlist || []);
              const firestoreCartMap = new Map((profileData.cart || []).map(item => [item.id, item.quantity]));
              
              const mergedWishlistIds = new Set([...localWishlistIds, ...firestoreWishlistIds]);
              const mergedCartMap = new Map(firestoreCartMap);
              localCartMap.forEach((quantity, id) => {
                  mergedCartMap.set(id, (mergedCartMap.get(id) || 0) + quantity);
              });

              const allUniqueProductIds = Array.from(new Set([...mergedWishlistIds, ...mergedCartMap.keys()]));

              if (allUniqueProductIds.length > 0) {
                  const allProductsData = await getProductsByIdsFromDB(allUniqueProductIds);
                  const productsMap = new Map(allProductsData.map(p => [p.id, p]));

                  const finalWishlist: Product[] = [];
                  mergedWishlistIds.forEach(id => {
                      const product = productsMap.get(id);
                      if (product) finalWishlist.push(product);
                  });
                  setWishlist(finalWishlist);
                  
                  const finalCart: CartItem[] = [];
                  mergedCartMap.forEach((quantity, id) => {
                      const product = productsMap.get(id);
                      if (product) finalCart.push({ ...product, quantity });
                  });
                  setCart(finalCart);

                  const finalWishlistIdsToSave = Array.from(mergedWishlistIds);
                  const finalCartItemsToSave = Array.from(mergedCartMap.entries()).map(([id, quantity]) => ({ id, quantity }));
                  
                  await updateFirestoreUser({ 
                      wishlist: finalWishlistIdsToSave, 
                      cart: finalCartItemsToSave 
                  });
              } else {
                  setWishlist([]);
                  setCart([]);
              }
            }

          } else { // --- NEW USER (e.g., first Google sign-in) ---
            const localWishlist: {id: string}[] = JSON.parse(localStorage.getItem('wishlist') || '[]');
            const localCart: {id: string, quantity: number}[] = JSON.parse(localStorage.getItem('cart') || '[]');
            
            const newProfile: UserProfile = {
              uid: user.uid,
              email: user.email,
              displayName: user.displayName,
              photoURL: user.photoURL,
              isAdmin: user.email === ADMIN_EMAIL, 
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
              wishlist: localWishlist.map(p => p.id),
              cart: localCart,
            };
            await setDoc(userRef, newProfile);
            setUserProfile(newProfile);
            
            const userIsAdmin = newProfile.isAdmin === true;
            setIsAdmin(userIsAdmin);

            if (userIsAdmin) {
                setWishlist([]);
                setCart([]);
                router.push('/admin');
            } else {
              const allIds = Array.from(new Set([...newProfile.wishlist || [], ...(newProfile.cart?.map(c => c.id) || [])]));
              if (allIds.length > 0) {
                const productsData = await getProductsByIdsFromDB(allIds);
                const productsMap = new Map(productsData.map(p => [p.id, p]));
                const hydratedWishlist = (newProfile.wishlist || []).map(id => productsMap.get(id)).filter(Boolean) as Product[];
                const hydratedCart = (newProfile.cart || []).map(item => {
                  const p = productsMap.get(item.id);
                  return p ? { ...p, quantity: item.quantity } : null;
                }).filter(Boolean) as CartItem[];
                setWishlist(hydratedWishlist);
                setCart(hydratedCart);
              }
            }
          }
        }
        localStorage.removeItem('wishlist');
        localStorage.removeItem('cart');

      } else { // --- USER IS LOGGED OUT (GUEST) ---
        setCurrentUser(null);
        setUserProfile(null);
        setIsAdmin(false);

        const storedWishlistItems: {id: string}[] = JSON.parse(localStorage.getItem('wishlist') || '[]');
        const storedCartItems: {id: string, quantity: number}[] = JSON.parse(localStorage.getItem('cart') || '[]');
        
        const allIds = Array.from(new Set([...storedWishlistItems.map(i => i.id), ...storedCartItems.map(i => i.id)]));

        if (allIds.length > 0) {
            getProductsByIdsFromDB(allIds).then(productsData => {
                const productsMap = new Map(productsData.map(p => [p.id, p]));
                
                const hydratedWishlist = storedWishlistItems.map(item => productsMap.get(item.id)).filter(Boolean) as Product[];
                setWishlist(hydratedWishlist);

                const hydratedCart = storedCartItems.map(item => {
                    const product = productsMap.get(item.id);
                    return product ? { ...product, quantity: item.quantity } : null;
                }).filter(Boolean) as CartItem[];
                setCart(hydratedCart);
            });
        } else {
            setWishlist([]);
            setCart([]);
        }
      }
      setLoadingAuth(false);
    });
    return () => unsubscribe();
  }, [router, updateFirestoreUser]);

  const signInWithGoogle = useCallback(async (): Promise<boolean> => {
    if (!configComplete || !auth || !firestore || !googleProvider) { 
      toast({ title: "Configuración Incompleta", description: "Los servicios de Firebase no están disponibles.", variant: "destructive" });
      return false;
    }
    try {
      await signInWithPopup(auth, googleProvider as AuthProvider);
      toast({ title: "Inicio de sesión exitoso!" });
      return true;
    } catch (error: any) {
      console.error("Error signing in with Google:", error);
      toast({ title: "Error de inicio de sesión con Google", description: error.message, variant: "destructive" });
      return false;
    }
  }, [toast]);

  const loginWithEmailPassword = useCallback(async (email: string, password: string): Promise<boolean> => {
    if (!configComplete || !auth) {
      toast({ title: "Configuración Incompleta", description: "Los servicios de Firebase no están disponibles.", variant: "destructive" });
      return false;
    }
    const emailToLogin = email.toLowerCase() === 'admin' ? ADMIN_EMAIL : email;
    
    try {
      await signInWithEmailAndPassword(auth, emailToLogin, password);
      toast({ title: "Inicio de sesión exitoso!", description: "Bienvenido/a de nuevo a TeslaTech." });
      return true;
    } catch (error: any) {
      console.error("Error signing in with email/password:", error);
      let errorMessage = "Ocurrió un error inesperado. Por favor, intente de nuevo.";
      switch (error.code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
          errorMessage = 'Correo electrónico o contraseña incorrectos.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'El formato del correo electrónico no es válido.';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Acceso deshabilitado temporalmente debido a demasiados intentos fallidos. Intente más tarde.';
          break;
        case 'auth/email-already-in-use':
          errorMessage = 'Este correo electrónico ya está en uso. Intenta iniciar sesión.';
          break;
        default:
          break;
      }
      
      toast({ title: "Error de inicio de sesión", description: errorMessage, variant: "destructive" });
      return false;
    }
  }, [toast]);


  const signOut = useCallback(async () => {
    if (!configComplete || !auth) {
      toast({ title: "Error", description: "Servicio de autenticación no disponible.", variant: "destructive" });
      return;
    }
    try {
      const wasAdmin = isAdmin;
      // Immediately clear sensitive state before signing out
      setWishlist([]);
      setCart([]);
      
      await firebaseSignOut(auth);
      
      // onAuthStateChanged will handle the rest of the state reset and loading guest data
      toast({ title: "Sesión cerrada" });
      if (wasAdmin) router.push('/');
      
    } catch (error: any) {
      console.error("Error signing out:", error);
      toast({ title: "Error al cerrar sesión", description: error.message, variant: "destructive" });
    }
  }, [toast, auth, router, isAdmin]);

  const updateUserProfile = useCallback(async (data: Partial<UserProfile>) => {
    if (!configComplete || !currentUser || !firestore) {
      toast({ title: "Error", description: "Debes iniciar sesión para actualizar tu perfil.", variant: "destructive" });
      return;
    }
    try {
      const userRef = doc(firestore, "users", currentUser.uid);
      const profileUpdateData = { ...data, updatedAt: serverTimestamp() };
      await updateDoc(userRef, profileUpdateData);
      setUserProfile(prev => prev ? { ...prev, ...data } : null);
      toast({ title: "Perfil actualizado", description: "Tus datos han sido guardados." });
    } catch (error: any) {
      console.error("Error updating user profile:", error);
      toast({ title: "Error al actualizar perfil", description: error.message, variant: "destructive" });
    }
  }, [currentUser, toast]);

  const isProfileComplete = useCallback((profile: UserProfile | null): boolean => {
    if (!profile) return false;
    return !!(profile.firstName && profile.lastName && profile.dni && profile.phoneNumber && profile.address);
  }, []);

  // --- Cart & Wishlist Functions (with Firestore sync) ---
  
  const addToWishlist = useCallback((product: Product) => {
    if (wishlist.find(item => item.id === product.id)) {
      toast({ title: `${product.name} ya está en tu lista de deseos.`});
      return;
    }
    toast({ title: `${product.name} añadido a la lista de deseos!`});
    const newWishlist = [...wishlist, product];
    setWishlist(newWishlist);

    if (currentUser) {
      updateFirestoreUser({ wishlist: newWishlist.map(p => p.id) });
    }
  }, [wishlist, currentUser, updateFirestoreUser, toast]);

  const removeFromWishlist = useCallback((productId: string) => {
    const product = wishlist.find(item => item.id === productId);
    if (product) toast({ title: `${product.name} eliminado de la lista de deseos.`});
    
    const newWishlist = wishlist.filter(item => item.id !== productId);
    setWishlist(newWishlist);

    if (currentUser) {
      updateFirestoreUser({ wishlist: newWishlist.map(p => p.id) });
    }
  }, [wishlist, currentUser, updateFirestoreUser, toast]);

  const clearWishlist = useCallback((silent = false) => {
    if (!silent) toast({ title: "Lista de deseos vaciada." });
    setWishlist([]);
    if (currentUser) {
      updateFirestoreUser({ wishlist: [] });
    }
  }, [currentUser, updateFirestoreUser, toast]);


  const isInWishlist = useCallback((productId: string) => !!wishlist.find(item => item.id === productId), [wishlist]);

  const addToCart = useCallback((product: Product, quantity: number = 1) => {
    toast({ title: `${product.name} añadido al carrito!`});
    
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      let newCart: CartItem[];
      if (existingItem) {
          newCart = prevCart.map(item => item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item);
      } else {
          newCart = [...prevCart, { ...product, quantity }];
      }
      
      if (currentUser) {
        updateFirestoreUser({ cart: newCart.map(i => ({ id: i.id, quantity: i.quantity })) });
      }
      return newCart;
    });
  }, [currentUser, updateFirestoreUser, toast]);

  const addMultipleToCart = useCallback((itemsToAdd: { product: Product; quantity: number }[]) => {
    if (itemsToAdd.length === 0) return;

    toast({
        title: `Añadiendo ${itemsToAdd.length} productos al carrito...`,
    });

    setCart(prevCart => {
        const newCartMap = new Map(prevCart.map(item => [item.id, { ...item }]));

        itemsToAdd.forEach(itemToAdd => {
            const existingItem = newCartMap.get(itemToAdd.product.id);
            if (existingItem) {
                existingItem.quantity += itemToAdd.quantity;
            } else {
                newCartMap.set(itemToAdd.product.id, { ...itemToAdd.product, quantity: itemToAdd.quantity });
            }
        });

        const finalCart = Array.from(newCartMap.values());
        
        if (currentUser) {
            updateFirestoreUser({ cart: finalCart.map(i => ({ id: i.id, quantity: i.quantity })) });
        }

        return finalCart;
    });
  }, [currentUser, updateFirestoreUser, toast]);

  const removeFromCart = useCallback((productId: string) => {
    const product = cart.find(item => item.id === productId);
    if (product) toast({ title: `${product.name} eliminado del carrito.`});
    
    const newCart = cart.filter(item => item.id !== productId);
    setCart(newCart);
    
    if (currentUser) {
      updateFirestoreUser({ cart: newCart.map(i => ({ id: i.id, quantity: i.quantity })) });
    }
  }, [cart, currentUser, updateFirestoreUser, toast]);

  const updateCartQuantity = useCallback((productId: string, quantity: number) => {
    const productInCart = cart.find(item => item.id === productId);
    if (productInCart) {
      if (quantity > 0) toast({ title: `Cantidad de ${productInCart.name} actualizada a ${quantity}.`});
      else toast({ title: `${productInCart.name} eliminado del carrito.`});
    }

    const newCart = cart.map(item => item.id === productId ? { ...item, quantity: Math.max(0, quantity) } : item).filter(item => item.quantity > 0);
    setCart(newCart);

    if (currentUser) {
      updateFirestoreUser({ cart: newCart.map(i => ({ id: i.id, quantity: i.quantity })) });
    }
  }, [cart, currentUser, updateFirestoreUser, toast]);

  const clearCart = useCallback((silent = false) => {
    if (!silent) toast({ title: "Carrito vaciado." });
    setCart([]);
    if (currentUser) {
      updateFirestoreUser({ cart: [] });
    }
  }, [currentUser, updateFirestoreUser, toast]);

  const getCartTotal = useCallback(() => cart.reduce((total, item) => total + item.price * item.quantity, 0), [cart]);
  const getCartItemCount = useCallback(() => cart.reduce((count, item) => count + item.quantity, 0), [cart]);

  const contextValue = useMemo(() => ({
    wishlist, addToWishlist, removeFromWishlist, isInWishlist, clearWishlist,
    cart, addToCart, addMultipleToCart, removeFromCart, updateCartQuantity, getCartTotal, getCartItemCount, clearCart,
    currentUser, userProfile, isAdmin, loadingAuth,
    signInWithGoogle, signOut, updateUserProfile, isProfileComplete,
    loginWithEmailPassword
  }), [
    wishlist, addToWishlist, removeFromWishlist, isInWishlist, clearWishlist,
    cart, addToCart, addMultipleToCart, removeFromCart, updateCartQuantity, getCartTotal, getCartItemCount, clearCart,
    currentUser, userProfile, isAdmin, loadingAuth,
    signInWithGoogle, signOut, updateUserProfile, isProfileComplete,
    loginWithEmailPassword
  ]);

  return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) throw new Error('useAppContext must be used within an AppProvider');
  return context;
};
