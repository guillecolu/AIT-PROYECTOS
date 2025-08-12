
'use client';

import LoginForm from '@/components/login-form';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Loader2 } from 'lucide-react';


export default function LoginPage() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [loadingLogo, setLoadingLogo] = useState(true);

  useEffect(() => {
    setYear(new Date().getFullYear());
    
    const fetchLogo = async () => {
        try {
            const configDoc = await getDoc(doc(db, "appConfig", "main"));
            if (configDoc.exists()) {
                setLogoUrl(configDoc.data().logoUrl);
            }
        } catch (error) {
            console.error("Error fetching logo:", error);
        } finally {
            setLoadingLogo(false);
        }
    };
    fetchLogo();
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8 h-[60px] items-center">
            {loadingLogo ? (
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            ) : logoUrl ? (
                 <Image
                    src={logoUrl}
                    alt="AIT Logo"
                    width={200}
                    height={60}
                    priority
                    style={{ objectFit: 'contain' }}
                />
            ) : (
                <span className="text-4xl font-bold text-foreground">AIT</span>
            )}
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
