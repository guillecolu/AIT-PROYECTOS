'use client';

import { Canvas } from '@react-three/fiber';
import { Html, Preload, useDetectGPU } from '@react-three/drei';
import { useMediaQuery } from '@/hooks/use-media-query';
import { motion } from 'framer-motion';
import { Suspense, useState } from 'react';
import type { Project, Task, User } from '@/lib/types';
import { SceneContent } from './scene-content';
import Image from 'next/image';

function StaticFallback() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="h-full w-full flex items-center justify-center"
    >
      <Image 
        src="/images/constellation-fallback.png" 
        alt="Visualización estática de proyectos" 
        width={800} 
        height={600} 
        className="object-contain"
        priority
      />
      <div className="absolute bottom-4 text-center text-xs text-muted-foreground p-2 bg-background/50 rounded-md">
        Modo de movimiento reducido activado. Mostrando vista estática.
      </div>
    </motion.div>
  );
}

export function ProjectConstellation({ projects, users, tasks }: { projects: Project[], users: User[], tasks: Task[] }) {
  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const [showStatic, setShowStatic] = useState(false);
  const gpuInfo = useDetectGPU();

  // Determine if we should show the static fallback
  // This effect runs once to decide.
  useState(() => {
    if (prefersReducedMotion || (gpuInfo && (gpuInfo.isMobile || (gpuInfo.fps || 0) < 30))) {
        setShowStatic(true);
    }
  });

  if (showStatic) {
    return <StaticFallback />;
  }

  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: [0, 0, 35], fov: 45 }}
      style={{ touchAction: 'none' }}
    >
      <Suspense fallback={<Html center><span className="text-white">Cargando...</span></Html>}>
        <SceneContent projects={projects} users={users} tasks={tasks} />
        <Preload all />
      </Suspense>
    </Canvas>
  );
}
