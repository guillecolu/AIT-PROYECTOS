'use client';

import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { DataProvider } from '@/hooks/use-data';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <title>AIT - MachineTrack</title>
        <meta name="description" content="Gestión de Proyectos Industriales - Aplicaciones Industriales Técnicas" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <DataProvider>
          {children}
        </DataProvider>
        <Toaster />
      </body>
    </html>
  );
}
