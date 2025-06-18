
"use client";
import { Suspense } from 'react';
import StripeSuccessContent from './StripeSuccessContent';

// Optional: Server action to verify Stripe session and get payment details (commented out)
// async function verifyStripeSessionOnServer(sessionId: string): Promise<{ success: boolean; paymentIntentId?: string; client_secret?: string; error?: string; paymentStatus?: string }> {
//   // This would be a server action in stripeActions.ts
//   // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
//   // try {
//   //   const session = await stripe.checkout.sessions.retrieve(sessionId);
//   //   return { success: true, paymentIntentId: session.payment_intent as string, paymentStatus: session.payment_status };
//   // } catch (error: any) {
//   //   return { success: false, error: error.message };
//   // }
//   // For now, returning a placeholder until server-side verification is fully built:
//    console.log("Server-side verification for Stripe session (placeholder):", sessionId);
//   return { success: true, paymentIntentId: `pi_placeholder_${sessionId}`, paymentStatus: 'succeeded'};
// }

export default function StripeSuccessPage() {

  return (
 <Suspense fallback={<div>Loading...</div>}>
 <StripeSuccessContent />
 </Suspense>
  );
}
