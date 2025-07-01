
import type { Metadata } from 'next';
import { Inter as FontInter, Space_Grotesk as FontSpaceGrotesk } from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AppProviders } from './providers';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { cn } from '@/lib/utils';
import ClientChatbot from '@/components/chatbot/ClientChatbot';

// Using next/font for Inter and Space Grotesk
const fontInter = FontInter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const fontSpaceGrotesk = FontSpaceGrotesk({
  subsets: ['latin'],
  weight: ['300', '400', '500', '700'],
  variable: '--font-space-grotesk',
});

export const metadata: Metadata = {
  title: 'TeslaTech - Powering Your Digital World',
  description: 'Discover the latest in tech components and peripherals at TeslaTech.',
  icons: null,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        {/* next/font handles font loading, no need for direct <link> tags if using it correctly */}
      </head>
      <body className={cn(
        "min-h-screen font-body antialiased",
        fontInter.variable,
        fontSpaceGrotesk.variable
      )}>
        <AppProviders>
          <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-grow container mx-auto px-4 py-8 fade-in">
              {children}
            </main>
            <Footer />
          </div>
          <ClientChatbot />
          <Toaster />
        </AppProviders>
      </body>
    </html>
  );
}
