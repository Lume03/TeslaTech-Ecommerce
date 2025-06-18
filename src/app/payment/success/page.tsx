// src/app/payment/success/page.tsx

"use client";
import { Suspense } from 'react';
import SuccessContent from './SuccessContent'; // Importa el componente que acabamos de crear

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<div>Cargando y validando pago...</div>}>
      <SuccessContent />
    </Suspense>
  );
}