
"use client";

import Link from 'next/link';
import { Phone, Mail, MapPin } from 'lucide-react';
import Image from 'next/image';
import React from 'react';
import { useAppContext } from '@/contexts/AppContext';

const FooterComponent = () => {
  const { isAdmin } = useAppContext();
  const currentYear = new Date().getFullYear();

  if (isAdmin) {
    return null;
  }
  
  return (
    <footer className="border-t border-border/40 bg-card text-card-foreground">
      <div className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">

          {/* Column 1: Contact Info */}
          <div className="space-y-4">
            <h3 className="font-headline text-lg font-semibold text-primary">TESLATECH</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-primary" />
                <span>Celular: 930 471 770</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary" />
                <span>Email: tesla.tech@gmail.com </span>
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                <span>Galería Centro Lima - Pasaje H 557 Primer Nivel, Lima, Peru</span>
              </li>
            </ul>
          </div>

          {/* Column 2: Información */}
          <div className="space-y-4">
            <h3 className="font-headline text-lg font-semibold text-primary">INFORMACIÓN</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/about" className="hover:text-primary transition-colors text-muted-foreground">&gt; Nuestra Empresa</Link></li>
              <li><Link href="/payment-methods" className="hover:text-primary transition-colors text-muted-foreground">&gt; Medios de pago</Link></li>
              <li><Link href="/terms" className="hover:text-primary transition-colors text-muted-foreground">&gt; Términos y condiciones</Link></li>
            </ul>
          </div>

          {/* Column 3: Políticas */}
          <div className="space-y-4">
            <h3 className="font-headline text-lg font-semibold text-primary">POLÍTICAS Y CONDICIONES</h3>
             <ul className="space-y-2 text-sm">
              <li><Link href="/warranty-policy" className="hover:text-primary transition-colors text-muted-foreground">&gt; Política de Garantía</Link></li>
              <li><Link href="/shipping-policy" className="hover:text-primary transition-colors text-muted-foreground">&gt; Política de Envío</Link></li>
              <li><Link href="/cookie-policy" className="hover:text-primary transition-colors text-muted-foreground">&gt; Política de Cookies</Link></li>
              <li><Link href="/privacy-policy" className="hover:text-primary transition-colors text-muted-foreground">&gt; Política de Privacidad de Datos</Link></li>
            </ul>
          </div>
          
           {/* Column 4: Libro de Reclamaciones */}
          <div className="space-y-4">
             <Link href="/complaints-book">
                 <Image src="/images/libro_reclamaciones.webp" alt="Libro de Reclamaciones Virtual" width={184} height={68} unoptimized />
             </Link>
          </div>

        </div>
      </div>
      <div className="border-t border-border/40 py-4 bg-background">
        <div className="container mx-auto px-4 text-center text-xs text-muted-foreground">
          <p>&copy; {currentYear} TeslaTech. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
}

export default FooterComponent;
