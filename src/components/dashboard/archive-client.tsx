
"use client";

import { useState, useMemo } from 'react';
import type { Project } from '@/lib/types';
import ProjectCard from './project-card';
import { Input } from '../ui/input';
import { Archive, Loader2, Search, Trash2 } from 'lucide-react';
import { useData } from '@/hooks/use-data';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

export default function ArchiveClient() {
    const { projects, users, loading } = useData();
    const [searchTerm, setSearchTerm] = useState('');

    const { closedProjects, deletedProjects } = useMemo(() => {
        if (!projects) return { closedProjects: [], deletedProjects: [] };
        return {
            closedProjects: projects.filter(p => p.status === 'cerrado'),
            deletedProjects: projects.filter(p => p.status === 'eliminado')
        };
    }, [projects]);

    const filteredClosedProjects = useMemo(() => {
        return closedProjects.filter(project => {
            const term = searchTerm.toLowerCase();
            return project.name.toLowerCase().includes(term) || project.client.toLowerCase().includes(term);
        });
    }, [closedProjects, searchTerm]);

    const filteredDeletedProjects = useMemo(() => {
        return deletedProjects.filter(project => {
            const term = searchTerm.toLowerCase();
            return project.name.toLowerCase().includes(term) || project.client.toLowerCase().includes(term);
        });
    }, [deletedProjects, searchTerm]);

    const closedProjectsByYear = useMemo(() => {
        const grouped = filteredClosedProjects.reduce((acc, project) => {
            const year = new Date(project.deliveryDate).getFullYear().toString();
            if (!acc[year]) acc[year] = [];
            acc[year].push(project);
            return acc;
        }, {} as Record<string, Project[]>);

        return Object.keys(grouped).sort((a, b) => Number(b) - Number(a)).reduce((obj, key) => {
            obj[key] = grouped[key];
            return obj;
        }, {} as Record<string, Project[]>);

    }, [filteredClosedProjects]);
    
    if (loading) {
        return <div className="flex items-center justify-center p-20"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
    }

    return (
        <div className="space-y-8">
             <div className="flex justify-between items-center">
                 <div>
                    <h1 className="text-3xl font-bold font-headline">Archivo de Proyectos</h1>
                    <p className="text-muted-foreground">Consulta el historial de proyectos completados y eliminados.</p>
                 </div>
                 <div className="relative w-full max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Buscar por nombre o cliente..."
                        className="pl-9"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                 </div>
            </div>

            <div>
                <h2 className="text-2xl font-headline font-semibold mb-4 flex items-center gap-2">
                    <Archive className="text-primary" />
                    Proyectos Archivados (Cerrados)
                </h2>
                {Object.keys(closedProjectsByYear).length > 0 ? (
                    <Accordion type="multiple" className="w-full space-y-4" defaultValue={Object.keys(closedProjectsByYear)}>
                        {Object.entries(closedProjectsByYear).map(([year, yearProjects]) => (
                            <AccordionItem value={year} key={year} className="border-none">
                                <AccordionTrigger className="text-xl font-headline bg-muted/40 hover:bg-muted/60 px-4 rounded-md hover:no-underline">
                                    Año {year} ({yearProjects.length} proyectos)
                                </AccordionTrigger>
                                <AccordionContent className="pt-6">
                                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                        {yearProjects.map(project => (
                                            <ProjectCard key={project.id} project={project} users={users || []} />
                                        ))}
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                ) : (
                    <div className="col-span-full text-center py-16 text-muted-foreground bg-card rounded-lg border">
                        <p className="text-lg font-semibold">No se encontraron proyectos cerrados</p>
                        <p>No hay proyectos que coincidan con tu búsqueda o aún no se ha cerrado ninguno.</p>
                    </div>
                )}
            </div>

            <div className="border-t pt-8">
                 <h2 className="text-2xl font-headline font-semibold mb-4 flex items-center gap-2">
                    <Trash2 className="text-destructive" />
                    Proyectos Eliminados (Papelera)
                </h2>
                {filteredDeletedProjects.length > 0 ? (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {filteredDeletedProjects.map(project => (
                            <ProjectCard key={project.id} project={project} users={users || []} />
                        ))}
                    </div>
                ) : (
                    <div className="col-span-full text-center py-16 text-muted-foreground bg-card rounded-lg border">
                        <p className="text-lg font-semibold">La papelera está vacía</p>
                        <p>No has eliminado ningún proyecto recientemente.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
