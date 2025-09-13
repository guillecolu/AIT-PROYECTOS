'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Task, TaskStatus } from '@/lib/types';
import { getProjectById } from '@/lib/data';
import { useEffect, useState } from 'react';
import type { Project } from '@/lib/types';

interface KanbanBoardProps {
    tasks: Task[];
}

const TaskCard = ({ task }: { task: Task }) => {
    const [project, setProject] = useState<Project | null>(null);
    
    useEffect(() => {
        async function fetchProject() {
            if (task.projectId) {
                const p = await getProjectById(task.projectId);
                if (p) {
                    setProject(p);
                }
            }
        }
        fetchProject();
    }, [task.projectId]);

    return (
        <Card>
            <CardContent className="p-3">
                <h4 className="font-semibold text-sm">{task.title}</h4>
                <p className="text-xs text-muted-foreground">{project?.name}</p>
            </CardContent>
        </Card>
    )
}

const KanbanColumn = ({ title, tasks }: { title: string, tasks: Task[] }) => {
    return (
        <div className="flex-1">
            <Card className="bg-muted/50">
                <CardHeader className="p-4">
                    <CardTitle className="text-base font-medium">{title} ({tasks.length})</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 space-y-3 min-h-40">
                    {tasks.map(task => <TaskCard key={task.id} task={task} />)}
                </CardContent>
            </Card>
        </div>
    )
}

export default function KanbanBoard({ tasks }: KanbanBoardProps) {
    const columns: { title: string, status: TaskStatus }[] = [
        { title: 'Pendientes', status: 'pendiente' },
        { title: 'En Progreso', status: 'en-progreso' },
        { title: 'Para Soldar', status: 'para-soldar' },
        { title: 'Montadas', status: 'montada' },
        { title: 'Finalizadas', status: 'finalizada' },
    ];

    return (
        <div className="flex gap-4 overflow-x-auto pb-4">
            {columns.map(col => (
                <KanbanColumn 
                    key={col.status}
                    title={col.title}
                    tasks={tasks.filter(t => t.status === col.status)}
                />
            ))}
        </div>
    );
}
