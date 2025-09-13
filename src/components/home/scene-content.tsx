
'use client';

import { useFrame, useThree } from '@react-three/fiber';
import { Edges, Html, OrbitControls, Stars, Text, useCursor } from '@react-three/drei';
import { useMemo, useRef, useState, useEffect } from 'react';
import * as THREE from 'three';
import { motion as motion3d } from 'framer-motion';
import { useRouter } from 'next/navigation';
import type { Project, Task, User } from '@/lib/types';
import { isBefore } from 'date-fns';

type ProjectNodeProps = {
  project: Project;
  tasks: Task[];
  users: User[];
  position: THREE.Vector3;
  onNodeClick: (position: THREE.Vector3, id: string) => void;
  isFocused: boolean;
};

function getProjectStatus(project: Project, tasks: Task[]) {
  const projectTasks = tasks.filter(t => t.projectId === project.id);
  const hasDelayedTasks = projectTasks.some(t => t.deadline && isBefore(new Date(t.deadline), new Date()) && t.status !== 'finalizada');
  if (hasDelayedTasks) return 'delayed';

  const daysRemaining = (new Date(project.deliveryDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24);
  if (daysRemaining < 7) return 'at-risk';
  
  return 'on-time';
}

function ProjectNode({ project, tasks, users, position, onNodeClick, isFocused }: ProjectNodeProps) {
  const router = useRouter();
  const ref = useRef<THREE.Mesh>(null!);
  const [isHovered, setHovered] = useState(false);
  useCursor(isHovered);

  const projectTasks = tasks.filter(t => t.projectId === project.id);
  const projectManager = users.find(u => u.id === project.projectManagerId);

  const { size, color } = useMemo(() => {
    const s = Math.max(0.8, Math.min(2.5, 1 + projectTasks.length * 0.05));
    const status = getProjectStatus(project, tasks);
    
    let c = '#4682B4'; // Default: Steel Blue (on-time)
    if (status === 'at-risk') c = '#FFBF00'; // Amber
    if (status === 'delayed') c = '#BE1E2D'; // Red
    
    return { size: s, color: c };
  }, [project, projectTasks]);

  useFrame((state) => {
    if (ref.current && isHovered) {
      ref.current.scale.lerp(new THREE.Vector3(1.2, 1.2, 1.2), 0.1);
    } else if(ref.current) {
      ref.current.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1);
    }
  });

  return (
    <motion3d.mesh
      ref={ref}
      position={position}
      onClick={(e) => {
        e.stopPropagation();
        onNodeClick(ref.current.position, project.id);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={() => setHovered(false)}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ duration: 0.5, delay: Math.random() * 2 }}
    >
      <sphereGeometry args={[size, 32, 32]} />
      <meshStandardMaterial
        color={isHovered ? 'white' : color}
        roughness={0.4}
        metalness={0.6}
        emissive={color}
        emissiveIntensity={isHovered ? 0.8 : 0.3}
      />
      {project.isUrgent && (
        <mesh>
          <sphereGeometry args={[size * 1.3, 32, 32]} />
          <meshBasicMaterial color={color} transparent opacity={0.3} side={THREE.BackSide} />
        </mesh>
      )}

      <Html
        as="div"
        center
        distanceFactor={15}
        occlude
        style={{
          transition: 'all 0.2s',
          opacity: isHovered && !isFocused ? 1 : 0,
          pointerEvents: 'none',
          transform: `scale(${isHovered ? 1 : 0.5})`,
          minWidth: '200px',
        }}
      >
        <div className="bg-background/80 backdrop-blur-sm text-foreground rounded-lg p-3 shadow-lg border border-border">
          <p className="font-bold text-sm">{project.name}</p>
          <p className="text-xs text-muted-foreground">{projectManager?.name || 'N/A'}</p>
          <div className="flex items-center gap-2 mt-2">
            <div className="w-full bg-muted rounded-full h-1.5">
              <div className="bg-primary h-1.5 rounded-full" style={{ width: `${project.progress}%` }}></div>
            </div>
            <span className="text-xs font-semibold">{project.progress}%</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Entrega: {new Date(project.deliveryDate).toLocaleDateString('es-ES')}
          </p>
        </div>
      </Html>
      
      <Html
        as="div"
        center
        distanceFactor={15}
        style={{
          transition: 'all 0.3s',
          opacity: isFocused ? 1 : 0,
          pointerEvents: isFocused ? 'auto' : 'none',
          transform: `scale(${isFocused ? 1 : 0.8}) translateY(-80px)`,
        }}
      >
        <button
          onClick={() => router.push(`/dashboard/projects/${project.id}`)}
          className="px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-lg shadow-lg hover:bg-primary/90 transition-colors"
        >
          Ver Proyecto
        </button>
      </Html>

    </motion3d.mesh>
  );
}

export function SceneContent({ projects, users, tasks }: { projects: Project[], users: User[], tasks: Task[] }) {
  const { size } = useThree();
  const groupRef = useRef<THREE.Group>(null!);
  const [focusedNode, setFocusedNode] = useState<{ position: THREE.Vector3, id: string } | null>(null);

  const activeProjects = projects.filter(p => p.status === 'activo');

  const nodes = useMemo(() => {
    const temp: { project: Project, position: THREE.Vector3 }[] = [];
    const radius = Math.min(size.width, size.height) / 50;
    activeProjects.forEach((project, i) => {
      const phi = Math.acos(-1 + (2 * i) / activeProjects.length);
      const theta = Math.sqrt(activeProjects.length * Math.PI) * phi;
      const position = new THREE.Vector3().setFromSphericalCoords(radius, phi, theta);
      temp.push({ project, position });
    });
    return temp;
  }, [activeProjects, size.width, size.height]);
  
  const lines = useMemo(() => {
    const temp = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        temp.push([nodes[i].position, nodes[j].position]);
      }
    }
    return temp;
  }, [nodes]);

  useFrame((state, delta) => {
    if (groupRef.current && !focusedNode) {
      groupRef.current.rotation.y += delta * 0.05;
      groupRef.current.rotation.x += delta * 0.02;
    }
    if (focusedNode) {
        state.camera.position.lerp(
            new THREE.Vector3(focusedNode.position.x, focusedNode.position.y, focusedNode.position.z + 10),
            0.05
        );
        state.camera.lookAt(focusedNode.position);
    } else {
         state.camera.position.lerp(new THREE.Vector3(0, 0, 35), 0.05);
         state.camera.lookAt(0,0,0);
    }
  });

  const handleNodeClick = (position: THREE.Vector3, id: string) => {
    if (focusedNode?.id === id) {
      setFocusedNode(null);
    } else {
      setFocusedNode({ position, id });
    }
  };
  
   const handleCanvasClick = (e: any) => {
    // only reset focus if we click on the background
    if (e.target.tagName === 'CANVAS') {
      setFocusedNode(null);
    }
  };

  return (
    <>
      <color attach="background" args={['#0f172a']} />
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1.5} />
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      
      <group ref={groupRef} onClick={handleCanvasClick}>
        {nodes.map(({ project, position }) => (
          <ProjectNode
            key={project.id}
            project={project}
            users={users}
            tasks={tasks}
            position={position}
            onNodeClick={handleNodeClick}
            isFocused={focusedNode?.id === project.id}
          />
        ))}
        {lines.map(([start, end], i) => (
            <line key={i}>
                <bufferGeometry attach="geometry">
                    <bufferAttribute
                        attach="attributes-position"
                        count={2}
                        array={new Float32Array([start.x, start.y, start.z, end.x, end.y, end.z])}
                        itemSize={3}
                    />
                </bufferGeometry>
                <lineBasicMaterial attach="material" color="#475569" transparent opacity={0.2} />
            </line>
        ))}
      </group>
      
      {!focusedNode && <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.1} />}
    </>
  );
}
