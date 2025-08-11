'use client';

import { useParams, notFound } from 'next/navigation';
import ProjectDetailsClient from '@/components/projects/project-details-client';
import { useData } from '@/hooks/use-data';

export default function ProjectDetailPage() {
    const params = useParams();
    const projectId = params.id as string;
    const { getProjectById, getTasksByProjectId, getUsers, loading } = useData();
    
    const project = getProjectById(projectId);
    const tasks = getTasksByProjectId(projectId);
    const users = getUsers();
    
    if (loading) {
        return <div>Cargando...</div>;
    }

    if (!project) {
        // Wait for loading to finish before showing not found
        if (!loading) notFound();
        return null; // Or a dedicated loading skeleton
    }

    return <ProjectDetailsClient project={project} tasks={tasks} users={users} />;
}
