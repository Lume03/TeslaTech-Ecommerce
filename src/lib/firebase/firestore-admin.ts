// Ruta: src/lib/firebase/firestore-admin.ts

import admin from './admin';

/**
 * Obtiene una instancia segura de Firestore Admin
 * Incluye verificaciones adicionales para evitar errores de inicialización
 */
export const getFirestoreAdmin = () => {
  try {
    // Verificar que Firebase Admin esté inicializado
    if (admin.apps.length === 0) {
      throw new Error('Firebase Admin no está inicializado');
    }

    const firestore = admin.firestore();
    
    // Verificar que Firestore esté disponible
    if (!firestore) {
      throw new Error('No se pudo obtener instancia de Firestore');
    }

    return firestore;
  } catch (error) {
    console.error('❌ Error obteniendo Firestore Admin:', error);
    throw error;
  }
};

/**
 * Wrapper seguro para operaciones de Firestore Admin
 */
export const withFirestoreAdmin = async <T>(
  operation: (firestore: admin.firestore.Firestore) => Promise<T>
): Promise<T> => {
  const firestore = getFirestoreAdmin();
  return await operation(firestore);
};