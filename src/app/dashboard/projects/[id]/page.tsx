'use client';

import { useParams, notFound } from 'next/navigation';
import ProjectDetailsClient from '@/components/projects/project-details-client';
import { useData } from '@/hooks/use-data';

export default function ProjectDetailPage() {
    const params = useParams();
    const projectId = params.id as string;
    const { getProjectById, getTasksByProjectId, getUsers, loading } = useData();
    
    // While loading, we can't know if the project exists yet.
    if (loading) {
        return <div className="flex items-center justify-center p-20">Cargando...</div>;
    }

    // After loading, we can safely check for the project.
    const project = getProjectById(projectId);
    const tasks = getTasksByProjectId(projectId);
    const users = getUsers();

    // If loading is finished and still no project, then it's a 404.
    if (!project) {
        notFound();
        return null; // notFound() throws an error, so this is for type safety.
    }

    return <ProjectDetailsClient project={project} tasks={tasks} users={users} />;
}
