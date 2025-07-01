'use server';

import { getAuthAdmin, getFirestoreAdmin } from '@/lib/firebase/admin';
import type { RegistrationData } from '@/contexts/AppContext';
import { FieldValue } from 'firebase-admin/firestore';

export async function registerUserAction(registrationData: RegistrationData, password: string): Promise<{ success: boolean; error?: string; field?: 'dni' | 'phoneNumber' | 'email' }> {
  const { email, dni, phoneNumber, firstName, lastName, address } = registrationData;
  
  // Basic server-side validation
  if (!email || !password || !dni || !phoneNumber || !firstName || !lastName || !address) {
    return { success: false, error: 'Faltan datos de registro. Todos los campos son obligatorios.' };
  }
  if (password.length < 6) {
    return { success: false, error: 'La contraseña debe tener al menos 6 caracteres.' };
  }
  if (!/^\d{8}$/.test(dni)) {
    return { success: false, error: 'El DNI debe contener exactamente 8 dígitos.' };
  }
  if (!/^\d{9}$/.test(phoneNumber)) {
    return { success: false, error: 'El número de teléfono debe contener exactamente 9 dígitos.' };
  }

  const authAdmin = getAuthAdmin();
  const firestoreAdmin = getFirestoreAdmin();
  
  try {
    // Step 1: Check for uniqueness of DNI and Phone Number in Firestore
    const usersRef = firestoreAdmin.collection('users');
    
    const dniQuery = usersRef.where('dni', '==', dni).limit(1);
    const phoneQuery = usersRef.where('phoneNumber', '==', phoneNumber).limit(1);
    
    const [dniSnapshot, phoneSnapshot] = await Promise.all([
      dniQuery.get(),
      phoneQuery.get()
    ]);
    
    if (!dniSnapshot.empty) {
      return { success: false, error: 'El número de DNI ya está en uso por otra cuenta.', field: 'dni' };
    }
    
    if (!phoneSnapshot.empty) {
      return { success: false, error: 'El número de teléfono ya está en uso por otra cuenta.', field: 'phoneNumber' };
    }

    // Step 2: Create user in Firebase Auth (this also checks for email uniqueness)
    const userRecord = await authAdmin.createUser({
      email: email,
      password: password,
      displayName: `${firstName} ${lastName}`,
    });

    // Step 3: Create user profile in Firestore
    const userProfileData = {
      uid: userRecord.uid,
      email: email,
      displayName: `${firstName} ${lastName}`,
      photoURL: null,
      firstName: firstName,
      lastName: lastName,
      dni: dni,
      phoneNumber: phoneNumber,
      address: address,
      isAdmin: email.toLowerCase() === 'admin@teslatech.com',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    await firestoreAdmin.collection('users').doc(userRecord.uid).set(userProfileData);

    return { success: true };

  } catch (error: any) {
    console.error("Error in registerUserAction:", error);
    let errorMessage = 'Ocurrió un error durante el registro. Por favor, inténtalo de nuevo.';
    if (error.code === 'auth/email-already-exists') {
      errorMessage = 'Este correo electrónico ya está en uso. Intenta iniciar sesión.';
      return { success: false, error: errorMessage, field: 'email' };
    } else if (error.code === 'auth/invalid-password') {
      errorMessage = 'La contraseña debe tener al menos 6 caracteres.';
    }
    
    return { success: false, error: errorMessage };
  }
}
