
'use server';
/**
 * @fileOverview Server Actions for Stripe integration.
 * - createStripeCheckoutSession - Creates a Stripe Checkout session.
 */
import Stripe from 'stripe';
import type { CartItem } from '@/contexts/AppContext'; // Assuming CartItem includes necessary fields

interface PayerData {
  email: string | null;
  // Potentially add name, address if you want to prefill Stripe checkout or create Stripe Customer
}

// Helper function to validate if a URL is absolute
function isValidUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch (_) {
    return false;
  }
}

export async function createStripeCheckoutSession(items: CartItem[], payerData?: PayerData) {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

  if (!stripeSecretKey || !stripePublishableKey) {
    console.error("Stripe API keys are not configured in environment variables.");
    return { success: false, error: "Stripe no está configurado correctamente en el servidor." };
  }

  const stripe = new Stripe(stripeSecretKey, { apiVersion: '2024-04-10' }); 

  // Use VERCEL_URL if available (for preview/prod deployments on Vercel), otherwise fallback to the specific production URL or localhost.
  const isProduction = process.env.NODE_ENV === 'production';
  let rawBaseUrl = isProduction 
    ? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://tesla-tech-ecommerce.vercel.app')
    : (process.env.NEXT_PUBLIC_BASE_URL?.trim() || 'http://localhost:3000');


  if (!rawBaseUrl) {
    console.error("CRITICAL: Base URL for Stripe is not configured. Deployments will fail. Set NEXT_PUBLIC_BASE_URL for local dev or VERCEL_URL for production.");
    return { success: false, error: "La URL base (NEXT_PUBLIC_BASE_URL o VERCEL_URL) no está configurada o está vacía." };
  }
  
  // Explicit check for placeholder value in local development
  if (!isProduction && (rawBaseUrl.includes("your-workstation-id") || rawBaseUrl.includes("localhost:0000"))) {
     console.error(`CRITICAL WARNING: NEXT_PUBLIC_BASE_URL seems to be set to a placeholder value: "${rawBaseUrl}". Please configure it with your actual public application URL for Stripe callbacks to work.`);
  }


  const sanitizedBaseUrl = rawBaseUrl.endsWith('/') ? rawBaseUrl.slice(0, -1) : rawBaseUrl;

  if (!sanitizedBaseUrl || !isValidUrl(sanitizedBaseUrl)) {
      console.error(`Base URL '${sanitizedBaseUrl}' is not a valid absolute URL (must start with http:// or https://).`);
      return { success: false, error: `La URL base '${sanitizedBaseUrl}' no es una URL absoluta válida.` };
  }

  const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = items.map(item => ({
    price_data: {
      currency: 'pen', 
      product_data: {
        name: item.name,
        images: item.image ? [item.image] : undefined, 
        description: item.category, 
      },
      unit_amount: Math.round(item.price * 100), 
    },
    quantity: item.quantity,
  }));

  try {
    const sessionCreateParams: Stripe.Checkout.SessionCreateParams = {
        payment_method_types: ['card'],
        line_items,
        mode: 'payment',
        success_url: `${sanitizedBaseUrl}/payment/stripe-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${sanitizedBaseUrl}/payment/stripe-cancel`,
    };

    if (payerData?.email) {
        sessionCreateParams.customer_email = payerData.email;
    }
    
    console.log("Creating Stripe Checkout Session with params:", JSON.stringify({
        line_items_count: line_items.length,
        success_url: sessionCreateParams.success_url,
        cancel_url: sessionCreateParams.cancel_url,
        customer_email: sessionCreateParams.customer_email,
    }, null, 2));


    const session = await stripe.checkout.sessions.create(sessionCreateParams);

    if (session.id && session.url) {
      return { success: true, sessionId: session.id, sessionUrl: session.url };
    } else {
      console.error("Stripe session creation failed, no session ID or URL returned:", session);
      let errorMsg = "No se pudo obtener el ID de sesión de Stripe.";
      if (session.id && !session.url) {
        errorMsg = "Se obtuvo un ID de sesión de Stripe, pero no la URL de checkout.";
      } else if (!session.id) {
        errorMsg = "No se pudo obtener el ID de sesión de Stripe.";
      }
      return { success: false, error: errorMsg };
    }

  } catch (error: any) {
    console.error("Error creating Stripe Checkout session:", error);
    let errorMessage = "No se pudo crear la sesión de pago de Stripe.";
    if (error.raw && error.raw.message) {
        errorMessage = `Error de Stripe: ${error.raw.message}`;
    } else if (error.message) {
        errorMessage = error.message;
    }
    return { success: false, error: errorMessage };
  }
}
