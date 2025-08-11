
'use client';

import LoginForm from '@/components/login-form';
import { useEffect, useState } from 'react';
import Image from 'next/image';

export default function LoginPage() {
  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => {
    setYear(new Date().getFullYear());
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
            <Image
                src="https://placehold.co/200x60.png"
                alt="AIT Logo"
                width={200}
                height={60}
                priority
                data-ai-hint="logo"
            />
        </div>
        
        <p className="text-center text-muted-foreground mb-8 -mt-4">
          Gestión de Proyectos Industriales
        </p>
        <LoginForm />
      </div>
       <footer className="absolute bottom-4 text-center text-sm text-muted-foreground">
          © {year} AIT. Todos los derechos reservados.
      </footer>
    </main>
  );
}
