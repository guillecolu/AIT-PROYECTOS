
'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Loader2, MoveRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function WelcomePage() {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [loadingLogo, setLoadingLogo] = useState(true);
  const [isNavigating, setIsNavigating] = useState(false);
  const router = useRouter();

  useEffect(() => {
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

  const handleStart = () => {
    setIsNavigating(true);
    // Simulate a brief delay for the animation to be noticeable before navigating
    setTimeout(() => {
        router.push('/dashboard');
    }, 400);
  };

  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center bg-white p-4 overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-white via-gray-50 to-red-50/20"></div>

      <div className="flex flex-col items-center text-center animate-fade-in">
        <div className="mb-8 transform transition-all duration-500 ease-out scale-100">
          {loadingLogo ? (
            <div className="h-[60px] flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : logoUrl ? (
            <Image
              src={logoUrl}
              alt="AIT Logo"
              width={180}
              height={55}
              priority
              style={{ objectFit: 'contain' }}
            />
          ) : (
            <span className="text-5xl font-bold text-foreground">AIT</span>
          )}
        </div>

        <h1 className="font-headline text-4xl md:text-5xl font-semibold text-gray-800 mb-4">
          Gestiona los proyectos de AIT
        </h1>
        <p className="max-w-xl text-lg text-gray-500 mb-10">
          Tu centro de control para el seguimiento, asignación y gestión de cada fase de nuestros proyectos industriales.
        </p>

        <button
          onClick={handleStart}
          disabled={isNavigating}
          className={cn(
            "group relative inline-flex items-center justify-center px-10 py-4 text-lg font-bold text-white bg-primary rounded-lg shadow-lg overflow-hidden transition-all duration-300 ease-in-out",
            "hover:scale-105 hover:shadow-xl active:scale-100",
            "focus:outline-none focus:ring-4 focus:ring-primary/50",
             isNavigating && "scale-95 animate-pulse"
          )}
        >
          {/* Ripple effect on click */}
          <span className="absolute inset-0 bg-primary-foreground/20 opacity-0 group-active:opacity-100 transition-opacity duration-200 scale-150 group-active:scale-100 rounded-full"></span>
          
          <span className="relative flex items-center gap-2">
            {isNavigating ? 'Cargando...' : 'Comenzar'}
             {!isNavigating && (
                <MoveRight className="h-6 w-6 transform transition-transform duration-300 group-hover:translate-x-1" />
             )}
          </span>
        </button>
      </div>

       <footer className="absolute bottom-6 text-center text-sm text-gray-400">
          © {new Date().getFullYear()} AIT. Todos los derechos reservados.
      </footer>
    </main>
  );
}
