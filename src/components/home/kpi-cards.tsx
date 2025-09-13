
'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, useSpring } from 'framer-motion';
import { db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { BarChart2, AlertTriangle, PieChart, Loader2 } from 'lucide-react';
import { useData } from '@/hooks/use-data';

function AnimatedNumber({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const spring = useSpring(value, {
    damping: 20,
    stiffness: 100,
  });

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);
  
  useEffect(() => {
      const unsubscribe = spring.on("change", (latest) => {
        if (ref.current) {
          ref.current.textContent = Math.round(latest).toString();
        }
      });
      return unsubscribe;
  }, [spring]);

  return <span ref={ref} />;
}


const MetricCard = ({ title, value, icon, unit = "" }: { title: string, value: number, icon: React.ReactNode, unit?: string }) => {
    const [pulse, setPulse] = useState(0);

    useEffect(() => {
        setPulse(p => p + 1);
    }, [value]);

    return (
        <motion.div 
          key={title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          whileHover={{ scale: 1.05, y: -5 }} 
          className="bg-background/50 backdrop-blur-sm border border-border/50 shadow-lg rounded-xl p-6 text-center"
        >
            <div className="flex items-center justify-center gap-3 mb-3 text-muted-foreground">
                {icon}
                <p className="text-lg font-medium capitalize">{title}</p>
            </div>
            <motion.p
                key={pulse}
                animate={{ scale: [1, 1.1, 1], color: ['hsl(var(--primary))', 'hsl(var(--foreground))', 'hsl(var(--primary))']}}
                transition={{ duration: 0.4 }}
                className="text-4xl font-bold text-primary"
            >
              <AnimatedNumber value={value} />
              {unit}
            </motion.p>
        </motion.div>
    )
}

export default function KpiCards() {
    const [metrics, setMetrics] = useState<{ proyectosActivos: number; retrasosHoy: number; avanceMedio: number; } | null>(null);

    useEffect(() => {
        const unsub = onSnapshot(doc(db, "dashboard", "metrics"), (docSnap) => {
            if (docSnap.exists()) {
                setMetrics(docSnap.data() as any);
            } else {
                 setMetrics({ proyectosActivos: 0, retrasosHoy: 0, avanceMedio: 0 });
            }
        });
        return () => unsub();
    }, []);

    if (metrics === null) {
      return (
          <div className="mt-12 flex items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin"/>
              <span>Cargando métricas...</span>
          </div>
      )
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
            <MetricCard title="Proyectos Activos" value={metrics.proyectosActivos} icon={<BarChart2 className="h-6 w-6"/>} />
            <MetricCard title="Retrasos Hoy" value={metrics.retrasosHoy} icon={<AlertTriangle className="h-6 w-6"/>} />
            <MetricCard title="Avance Medio" value={metrics.avanceMedio} icon={<PieChart className="h-6 w-6"/>} unit="%" />
        </div>
    )
}
