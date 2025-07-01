
import { CreditCard, ShieldCheck, Lock } from 'lucide-react';
import Image from 'next/image';

export default function PaymentMethodsPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="bg-card text-card-foreground p-8 rounded-lg shadow-lg space-y-6 fade-in">
        <h1 className="text-4xl font-headline font-bold text-primary mb-6 border-b pb-4">
          Nuestros Medios de Pago
        </h1>

        <div className="space-y-4 text-lg leading-relaxed text-muted-foreground">
          <p>
            En <span className="font-semibold text-foreground">TeslaTech</span>, tu seguridad y comodidad son nuestra máxima prioridad. Por ello, hemos integrado <span className="font-semibold text-foreground">Stripe</span> como nuestra única y exclusiva pasarela de pagos, una de las plataformas más seguras y confiables a nivel mundial.
          </p>
          <p>
            Con Stripe, puedes realizar tus compras de forma rápida y segura utilizando tus tarjetas de crédito o débito preferidas.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 pt-6">
          <div className="bg-muted p-6 rounded-md space-y-3">
            <CreditCard className="h-10 w-10 text-primary mb-3" />
            <h2 className="text-2xl font-headline font-semibold text-foreground">
              Aceptamos Todas las Tarjetas Principales
            </h2>
            <p className="leading-relaxed text-muted-foreground">
              Puedes pagar con Visa, Mastercard, American Express y muchas otras tarjetas de débito y crédito, tanto nacionales como internacionales. El proceso es directo y transparente.
            </p>
          </div>
          <div className="bg-muted p-6 rounded-md space-y-3">
            <ShieldCheck className="h-10 w-10 text-primary mb-3" />
            <h2 className="text-2xl font-headline font-semibold text-foreground">
              Seguridad de Nivel Mundial
            </h2>
            <p className="leading-relaxed text-muted-foreground">
              Stripe cuenta con la certificación <span className="font-semibold text-foreground">PCI de Nivel 1</span>, el estándar más riguroso en la industria de pagos. Tus datos financieros nunca son almacenados en nuestros servidores; son procesados directamente por Stripe, garantizando la máxima seguridad y encriptación de tu información.
            </p>
          </div>
        </div>

        <div className="text-center pt-8">
            <Lock className="mx-auto h-8 w-8 text-primary/80 mb-2"/>
            <p className="text-muted-foreground">
                Compra con la tranquilidad de saber que tu transacción está protegida.
            </p>
        </div>
      </div>
    </div>
  );
}
