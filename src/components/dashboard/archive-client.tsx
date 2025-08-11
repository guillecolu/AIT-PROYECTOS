
"use client";

import { useState, useMemo } from 'react';
import type { Project } from '@/lib/types';
import ProjectCard from './project-card';
import { Input } from '../ui/input';
import { Archive, Loader2, Search } from 'lucide-react';
import { useData } from '@/hooks/use-data';

export default function ArchiveClient() {
    const { projects, users, loading } = useData();
    const [searchTerm, setSearchTerm] = useState('');

    const closedProjects = useMemo(() => {
        return projects.filter(p => p.status === 'cerrado');
    }, [projects]);

    const filteredProjects = useMemo(() => {
        return closedProjects.filter(project => {
            const term = searchTerm.toLowerCase();
            return project.name.toLowerCase().includes(term) || project.client.toLowerCase().includes(term);
        });
    }, [closedProjects, searchTerm]);
    
    if (loading) {
        return <div className="flex items-center justify-center p-20"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
    }

    return (
        <div className="space-y-6">
             <div className="flex justify-between items-center">
                 <div>
                    <h1 className="text-3xl font-bold font-headline">Proyectos Archivados</h1>
                    <p className="text-muted-foreground">Consulta el historial de proyectos completados y cerrados.</p>
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

            {filteredProjects.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {filteredProjects.map(project => (
                        <ProjectCard key={project.id} project={project} users={users} />
                    ))}
                </div>
            ) : (
                <div className="col-span-full text-center py-20 text-muted-foreground bg-card rounded-lg border">
                    <Archive className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                    <p className="text-lg font-semibold">No se encontraron proyectos archivados</p>
                    <p>No hay proyectos que coincidan con tu búsqueda o aún no se ha archivado ninguno.</p>
                </div>
            )}
        </div>
    );
}
