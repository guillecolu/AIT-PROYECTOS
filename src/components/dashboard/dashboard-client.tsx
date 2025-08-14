
"use client";

import { useMemo } from 'react';
import type { Project } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FolderArchive, Users, AlertTriangle, FolderClosed, FolderKanban, FolderPlus, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '../ui/button';
import { PlusCircle } from 'lucide-react';
import ProjectCard from './project-card';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useData } from '@/hooks/use-data';
import { useRouter } from 'next/navigation';

const EmptyDashboard = () => {
    const router = useRouter();
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6 text-center bg-card rounded-lg border">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
          <FolderKanban className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-semibold font-headline text-foreground">Crea tu primer proyecto</h2>
        <p className="text-muted-foreground mt-2 max-w-sm">
          Aquí es donde verás el estado general de todos tus proyectos, tareas urgentes y próximos hitos.
        </p>
        <Button
          className="mt-6"
          onClick={() => router.push("/dashboard/create-project")}
          size="lg"
        >
          <PlusCircle className="mr-2 h-5 w-5" />
          Crear Nuevo Proyecto
        </Button>
        <div className="mt-8 text-sm text-muted-foreground/80">
          <span className="font-semibold">Consejo:</span> puedes añadir Áreas (Diseño, Soldadura, etc.) desde la vista de un proyecto.
        </div>
      </div>
    );
};


const StatCardTooltipContent = ({ title, items }: { title: string, items: { id: string, name: string }[] }) => (
    <div className="p-2">
        <h4 className="font-bold text-base mb-2">{title}</h4>
        {items.length > 0 ? (
            <ul className="list-disc list-inside space-y-1">
                {items.slice(0, 5).map(item => <li key={item.id} className="text-sm">{item.name}</li>)}
                {items.length > 5 && <li className="text-sm font-semibold">y {items.length - 5} más...</li>}
            </ul>
        ) : (
            <p className="text-sm text-muted-foreground">No hay elementos que mostrar.</p>
        )}
    </div>
);

const StatCard = ({ title, value, icon: Icon, href, tooltipContent }: { title: string, value: number, icon: React.ElementType, href: string, tooltipContent: React.ReactNode }) => (
    <TooltipProvider>
        <Tooltip>
            <TooltipTrigger asChild>
                <Link href={href}>
                    <Card className="hover:bg-muted/50 transition-colors">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{title}</CardTitle>
                            <Icon className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{value}</div>
                        </CardContent>
                    </Card>
                </Link>
            </TooltipTrigger>
            <TooltipContent side="bottom" align="start">
                {tooltipContent}
            </TooltipContent>
        </Tooltip>
    </TooltipProvider>
);


export default function DashboardClient() {
    const { projects, users, loading } = useData();

    const { activeProjects, urgentProjects, closedProjects } = useMemo(() => {
        if (!projects) return { activeProjects: [], urgentProjects: [], closedProjects: [] };
        const active = projects.filter(p => p.status === 'activo');
        return {
            activeProjects: active,
            urgentProjects: active.filter(p => p.isUrgent),
            closedProjects: projects.filter(p => p.status === 'cerrado'),
        };
    }, [projects]);
    
    if (loading) {
        return <div className="flex items-center justify-center p-20"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
    }

    if (!projects || projects.length === 0) {
        return <EmptyDashboard />;
    }

    return (
        <div className="space-y-6">
             <div className="flex justify-between items-center">
                 <div>
                    <h1 className="text-3xl font-bold font-headline">Panel de Control</h1>
                    <p className="text-muted-foreground">Una vista global del estado de los proyectos y del equipo.</p>
                 </div>
                 <Button asChild size="lg">
                    <Link href="/dashboard/create-project">
                        <PlusCircle className="mr-2" />
                        Crear Nuevo Proyecto
                    </Link>
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard 
                    title="Proyectos Activos" 
                    value={activeProjects.length} 
                    icon={FolderKanban} 
                    href="/dashboard"
                    tooltipContent={<StatCardTooltipContent title="Proyectos Activos" items={activeProjects} />}
                />
                <StatCard 
                    title="Proyectos Urgentes" 
                    value={urgentProjects.length} 
                    icon={AlertTriangle} 
                    href="/dashboard"
                     tooltipContent={<StatCardTooltipContent title="Proyectos Urgentes" items={urgentProjects} />}
                />
                <StatCard 
                    title="Proyectos Cerrados" 
                    value={closedProjects.length} 
                    icon={FolderClosed} 
                    href="/dashboard/archive"
                     tooltipContent={<StatCardTooltipContent title="Proyectos Cerrados" items={closedProjects} />}
                />
                <StatCard 
                    title="Personas" 
                    value={users?.length || 0} 
                    icon={Users} 
                    href="/dashboard/people"
                    tooltipContent={<StatCardTooltipContent title="Miembros del Equipo" items={users || []} />}
                />
            </div>
            
             {urgentProjects.length > 0 && (
                <div>
                    <h2 className="text-2xl font-headline font-semibold mb-4 flex items-center gap-2">
                        <AlertTriangle className="text-destructive" />
                        Proyectos Urgentes
                    </h2>
                     <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {urgentProjects.map(project => (
                           <ProjectCard key={project.id} project={project} users={users || []} />
                        ))}
                    </div>
                </div>
            )}
            
            <div>
                <h2 className="text-2xl font-headline font-semibold mb-4">
                   {urgentProjects.length > 0 ? "Otros Proyectos Activos" : "Proyectos Activos"}
                </h2>
                 {activeProjects.filter(p => !p.isUrgent).length > 0 ? (
                     <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {activeProjects.filter(p => !p.isUrgent).map(project => (
                             <ProjectCard key={project.id} project={project} users={users || []} />
                        ))}
                    </div>
                 ) : (
                    <div className="col-span-full text-center py-16 text-muted-foreground bg-card rounded-lg border">
                        <p className="text-lg font-semibold">No hay más proyectos activos</p>
                        <p>Puedes crear uno nuevo o revisar los proyectos urgentes.</p>
                    </div>
                 )}
            </div>
        </div>
    );
}

    