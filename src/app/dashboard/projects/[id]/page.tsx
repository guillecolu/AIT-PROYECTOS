
'use client';

import { useParams, notFound } from 'next/navigation';
import ProjectDetailsClient from '@/components/projects/project-details-client';
import { useData } from '@/hooks/use-data';

export default function ProjectDetailPage() {
    const params = useParams();
    const projectId = params.id as string;
    const { getProjectById, getUsers, loading } = useData();
    
    if (loading) {
        return <div className="flex items-center justify-center p-20">Cargando...</div>;
    }

    const project = getProjectById(projectId);
    const users = getUsers();

    if (!project) {
        notFound();
        return null;
    }

    return <ProjectDetailsClient project={project} users={users} />;
}
