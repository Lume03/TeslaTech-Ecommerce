
"use client";
import type { Product } from '@/lib/data';
import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback, useMemo } from 'react';
import { useToast } from "@/hooks/use-toast";
import { auth, firestore, googleProvider, configComplete } from '@/lib/firebase/config'; // Import configComplete
import type { User } from 'firebase/auth';
import { 
  signInWithPopup, 
  signOut as firebaseSignOut, 
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  type AuthProvider // Import AuthProvider type
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, updateDoc } from 'firebase/firestore';

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
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  getCartTotal: () => number;
  getCartItemCount: () => number;
  clearCart: () => void;
  currentUser: User | null;
  userProfile: UserProfile | null;
  isAdmin: boolean; 
  loadingAuth: boolean;
  isEmailAuthLoading: boolean; 
  signInWithGoogle: () => Promise<boolean>; 
  signOut: () => Promise<void>;
  updateUserProfile: (data: Partial<UserProfile>) => Promise<void>;
  isProfileComplete: (profile: UserProfile | null) => boolean;
  registerWithEmailPassword: (registrationData: RegistrationData, password: string) => Promise<boolean>; 
  loginWithEmailPassword: (email: string, password: string) => Promise<boolean>; 
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [wishlist, setWishlist] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const { toast } = useToast();

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false); 
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [isEmailAuthLoading, setIsEmailAuthLoading] = useState(false);

  useEffect(() => {
    try {
      const storedWishlist = localStorage.getItem('wishlist');
      if (storedWishlist) setWishlist(JSON.parse(storedWishlist));
    } catch (error) { console.error("Failed to load wishlist:", error); localStorage.removeItem('wishlist'); }
    try {
      const storedCart = localStorage.getItem('cart');
      if (storedCart) setCart(JSON.parse(storedCart));
    } catch (error) { console.error("Failed to load cart:", error); localStorage.removeItem('cart'); }
  }, []);

  useEffect(() => { localStorage.setItem('wishlist', JSON.stringify(wishlist)); }, [wishlist]);
  useEffect(() => { localStorage.setItem('cart', JSON.stringify(cart)); }, [cart]);

  useEffect(() => {
    if (!configComplete || !auth) {
      console.warn("Firebase Auth service is not available due to missing configuration. User authentication will be disabled.");
      setLoadingAuth(false);
      setCurrentUser(null);
      setUserProfile(null);
      setIsAdmin(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoadingAuth(true); // Set loading true at the start of auth state change
      if (user) {
        setCurrentUser(user);
        if (firestore) {
          const userRef = doc(firestore, "users", user.uid);
          const docSnap = await getDoc(userRef);
          if (docSnap.exists()) {
            const profileData = docSnap.data() as UserProfile;
            setUserProfile(profileData);
            setIsAdmin(profileData.email === ADMIN_EMAIL || profileData.isAdmin === true);
          } else {
             const basicProfile: UserProfile = {
              uid: user.uid,
              email: user.email,
              displayName: user.displayName || user.email?.split('@')[0] || "Usuario",
              photoURL: user.photoURL,
              isAdmin: user.email === ADMIN_EMAIL,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            };
            await setDoc(userRef, basicProfile, { merge: true }); 
            setUserProfile(basicProfile);
            setIsAdmin(basicProfile.isAdmin || false);
          }
        } else {
            console.warn("Firestore service is not available. Cannot fetch user profile.");
            // Set a basic profile from auth user if firestore is not available
            setUserProfile({
                uid: user.uid,
                email: user.email,
                displayName: user.displayName || user.email?.split('@')[0] || "Usuario",
                photoURL: user.photoURL,
                isAdmin: user.email === ADMIN_EMAIL,
            });
            setIsAdmin(user.email === ADMIN_EMAIL);
        }
      } else {
        setCurrentUser(null);
        setUserProfile(null);
        setIsAdmin(false);
      }
      setLoadingAuth(false);
    });
    return () => unsubscribe();
  }, []); // Empty dependency array ensures this runs once on mount

  const signInWithGoogle = useCallback(async (): Promise<boolean> => {
    if (!configComplete || !auth || !firestore || !googleProvider) { // Added !googleProvider check
      toast({ title: "Configuración Incompleta", description: "Los servicios de Firebase no están disponibles. Revisa la configuración.", variant: "destructive" });
      setIsEmailAuthLoading(false); // Ensure loading state is reset
      return false;
    }
    setIsEmailAuthLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider as AuthProvider); // Cast to AuthProvider
      const user = result.user;
      const userRef = doc(firestore, "users", user.uid);
      const docSnap = await getDoc(userRef);
      let profileToSet: UserProfile;
      if (!docSnap.exists()) {
        const newProfile: UserProfile = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          isAdmin: user.email === ADMIN_EMAIL, 
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };
        await setDoc(userRef, newProfile);
        profileToSet = newProfile;
        toast({ title: "Bienvenido/a a TeslaTech!", description: "Por favor, completa tus datos en tu perfil si es necesario." });
      } else {
         profileToSet = docSnap.data() as UserProfile;
         if (user.email === ADMIN_EMAIL && !profileToSet.isAdmin) {
           await updateDoc(userRef, { isAdmin: true, updatedAt: serverTimestamp() });
           profileToSet.isAdmin = true;
         }
      }
      // setUserProfile and setIsAdmin will be handled by onAuthStateChanged
      toast({ title: "Inicio de sesión exitoso!", description: "Bienvenido/a de nuevo a TeslaTech." });
      setIsEmailAuthLoading(false);
      return true;
    } catch (error: any) {
      console.error("Error signing in with Google:", error);
      toast({ title: "Error de inicio de sesión con Google", description: error.message, variant: "destructive" });
      setIsEmailAuthLoading(false);
      return false;
    }
  }, [toast]);

  const registerWithEmailPassword = useCallback(async (registrationData: RegistrationData, password: string): Promise<boolean> => {
    if (!configComplete || !auth || !firestore) {
      toast({ title: "Configuración Incompleta", description: "Los servicios de Firebase no están disponibles.", variant: "destructive" });
      return false;
    }
    setIsEmailAuthLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, registrationData.email, password);
      const user = userCredential.user;
      
      const newProfile: UserProfile = {
        uid: user.uid,
        email: user.email,
        displayName: `${registrationData.firstName} ${registrationData.lastName}`,
        photoURL: null, 
        firstName: registrationData.firstName,
        lastName: registrationData.lastName,
        dni: registrationData.dni,
        phoneNumber: registrationData.phoneNumber,
        address: registrationData.address,
        isAdmin: registrationData.email === ADMIN_EMAIL, 
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      await setDoc(doc(firestore, "users", user.uid), newProfile);
      // setUserProfile and setIsAdmin will be handled by onAuthStateChanged
      toast({ title: "¡Registro exitoso!", description: "Bienvenido/a a TeslaTech. Tu cuenta ha sido creada." });
      setIsEmailAuthLoading(false);
      return true;
    } catch (error: any) {
      console.error("Error registering with email/password:", error);
      let errorMessage = error.message;
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Este correo electrónico ya está en uso. Intenta iniciar sesión.';
      }
      toast({ title: "Error de Registro", description: errorMessage, variant: "destructive" });
      setIsEmailAuthLoading(false);
      return false;
    }
  }, [toast]);

  const loginWithEmailPassword = useCallback(async (email: string, password: string): Promise<boolean> => {
     if (!configComplete || !auth) {
      toast({ title: "Configuración Incompleta", description: "Los servicios de Firebase no están disponibles.", variant: "destructive" });
      return false;
    }
    setIsEmailAuthLoading(true);
    let emailToLogin = email;
    if (email.toLowerCase() === 'admin' && password === 'admin123') { 
        emailToLogin = ADMIN_EMAIL; 
    }
    try {
      await signInWithEmailAndPassword(auth, emailToLogin, password);
      // onAuthStateChanged will handle setting currentUser, userProfile, and isAdmin
      toast({ title: "Inicio de sesión exitoso!", description: "Bienvenido/a de nuevo a TeslaTech." });
      setIsEmailAuthLoading(false);
      return true;
    } catch (error: any) {
      console.error("Error signing in with email/password:", error);
      let errorMessage = error.message;
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        errorMessage = 'Correo electrónico o contraseña incorrectos.';
      }
      toast({ title: "Error de inicio de sesión", description: errorMessage, variant: "destructive" });
      setIsEmailAuthLoading(false);
      return false;
    }
  }, [toast]);


  const signOut = useCallback(async () => {
    if (!configComplete || !auth) {
      toast({ title: "Error", description: "Servicio de autenticación no disponible.", variant: "destructive" });
      return;
    }
    try {
      await firebaseSignOut(auth);
      // onAuthStateChanged will set currentUser, userProfile to null, and isAdmin to false
      toast({ title: "Sesión cerrada", description: "Has cerrado sesión exitosamente." });
    } catch (error: any) {
      console.error("Error signing out:", error);
      toast({ title: "Error al cerrar sesión", description: error.message, variant: "destructive" });
    }
  }, [toast]);

  const updateUserProfile = useCallback(async (data: Partial<UserProfile>) => {
    if (!configComplete || !currentUser || !firestore) {
      toast({ title: "Error", description: "Debes iniciar sesión y los servicios de Firebase deben estar disponibles para actualizar tu perfil.", variant: "destructive" });
      return;
    }
    try {
      const userRef = doc(firestore, "users", currentUser.uid);
      const profileUpdateData = { ...data, updatedAt: serverTimestamp() };
      if (currentUser.email !== ADMIN_EMAIL && profileUpdateData.isAdmin === true) {
          delete profileUpdateData.isAdmin;
      }
      await updateDoc(userRef, profileUpdateData);
      // setUserProfile will be updated by onAuthStateChanged if email/displayName changes,
      // or manually merge for other fields if not covered by onAuthStateChanged
      setUserProfile(prev => prev ? { ...prev, ...profileUpdateData, // Manually update non-auth fields
          email: prev.email, // keep auth email
          displayName: prev.displayName, // keep auth displayName
          photoURL: prev.photoURL // keep auth photoURL
        } : null);

      if (profileUpdateData.isAdmin !== undefined && currentUser.email === ADMIN_EMAIL) {
          setIsAdmin(profileUpdateData.isAdmin);
      }
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


  const addToWishlist = useCallback((product: Product) => {
    setWishlist((prev) => {
      if (prev.find(item => item.id === product.id)) {
        setTimeout(() => { toast({ title: `${product.name} ya está en tu lista de deseos.`}); }, 0);
        return prev;
      }
      setTimeout(() => { toast({ title: `${product.name} añadido a la lista de deseos!`}); }, 0);
      return [...prev, product];
    });
  }, [toast]);

  const removeFromWishlist = useCallback((productId: string) => {
    setWishlist((prev) => {
      const product = prev.find(item => item.id === productId);
      if (product) setTimeout(() => { toast({ title: `${product.name} eliminado de la lista de deseos.`}); }, 0);
      return prev.filter(item => item.id !== productId);
    });
  }, [toast]);

  const isInWishlist = useCallback((productId: string) => !!wishlist.find(item => item.id === productId), [wishlist]);

  const addToCart = useCallback((product: Product, quantity: number = 1) => {
    setCart((prev) => {
      const existingItem = prev.find(item => item.id === product.id);
      if (existingItem) {
        setTimeout(() => { toast({ title: `Cantidad de ${product.name} aumentada en el carrito.`}); }, 0);
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item);
      }
      setTimeout(() => { toast({ title: `${product.name} añadido al carrito!`}); }, 0);
      return [...prev, { ...product, quantity }];
    });
  }, [toast]);

  const removeFromCart = useCallback((productId: string) => {
    setCart((prev) => {
      const product = prev.find(item => item.id === productId);
      if (product) setTimeout(() => { toast({ title: `${product.name} eliminado del carrito.`}); }, 0);
      return prev.filter(item => item.id !== productId);
    });
  }, [toast]);

  const updateCartQuantity = useCallback((productId: string, quantity: number) => {
    const productInCart = cart.find(item => item.id === productId);
    setCart((prev) => prev.map(item => item.id === productId ? { ...item, quantity: Math.max(0, quantity) } : item).filter(item => item.quantity > 0));
    if (productInCart) {
      if (quantity > 0) setTimeout(() => { toast({ title: `Cantidad de ${productInCart.name} actualizada a ${quantity}.`}); }, 0);
      else setTimeout(() => { toast({ title: `${productInCart.name} eliminado del carrito.`}); }, 0);
    }
  }, [cart, toast]);

  const getCartTotal = useCallback(() => cart.reduce((total, item) => total + item.price * item.quantity, 0), [cart]);
  const getCartItemCount = useCallback(() => cart.reduce((count, item) => count + item.quantity, 0), [cart]);

  const clearCart = useCallback(() => {
    setCart([]);
    setTimeout(() => { toast({ title: "Carrito vaciado."}); }, 0);
  }, [toast]);

  const contextValue = useMemo(() => ({
    wishlist, addToWishlist, removeFromWishlist, isInWishlist,
    cart, addToCart, removeFromCart, updateCartQuantity, getCartTotal, getCartItemCount, clearCart,
    currentUser, userProfile, isAdmin, loadingAuth, isEmailAuthLoading,
    signInWithGoogle, signOut, updateUserProfile, isProfileComplete,
    registerWithEmailPassword, loginWithEmailPassword
  }), [
    wishlist, addToWishlist, removeFromWishlist, isInWishlist,
    cart, addToCart, removeFromCart, updateCartQuantity, getCartTotal, getCartItemCount, clearCart,
    currentUser, userProfile, isAdmin, loadingAuth, isEmailAuthLoading,
    signInWithGoogle, signOut, updateUserProfile, isProfileComplete,
    registerWithEmailPassword, loginWithEmailPassword
  ]);

  return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) throw new Error('useAppContext must be used within an AppProvider');
  return context;
};
