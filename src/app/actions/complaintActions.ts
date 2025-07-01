
'use server';

import { getFirestoreAdmin } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import type { Complaint } from '@/lib/data';
import { revalidatePath } from 'next/cache';

// Omit id and createdAt because Firestore handles them server-side with Admin SDK
type ComplaintSubmissionData = Omit<Complaint, 'id' | 'createdAt'>;

export async function submitComplaintAction(data: ComplaintSubmissionData): Promise<{ success: boolean; error?: string }> {
  try {
    const firestoreAdmin = getFirestoreAdmin();
    
    const complaintData = {
      ...data,
      createdAt: FieldValue.serverTimestamp(), // Use Admin SDK FieldValue
    };
    
    // Using the admin SDK to add the document
    await firestoreAdmin.collection('complaints').add(complaintData);

    // Revalidate the admin complaints path so admins see the new complaint immediately
    revalidatePath('/admin/complaints');

    return { success: true };
  } catch (error: any) {
    console.error('Error submitting complaint to Firestore with Admin SDK:', error);
    // Provide a slightly more specific error message if possible for debugging, but keep user message generic.
    const userFacingError = 'No se pudo registrar el reclamo debido a un error del servidor. Por favor, inténtalo de nuevo.';
    
    if (error.message?.includes('Firebase Admin SDK')) {
        // This indicates a problem with the admin setup itself.
        console.error("Admin SDK Initialization Error Detected:", error.message);
        return { success: false, error: 'Error de configuración del servidor. Contacte a soporte (Ref: ADMIN_SDK_INIT).' };
    }
    
    return { success: false, error: userFacingError };
  }
}
