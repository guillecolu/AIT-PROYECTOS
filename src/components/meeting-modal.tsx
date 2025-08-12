

"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { generateEngineerReport, EngineerReportOutput } from '@/ai/flows/generate-engineer-report';
import { generateProjectReport, GenerateProjectReportOutput } from '@/ai/flows/generate-project-report';
import { useToast } from '@/hooks/use-toast';
import type { User, Project, Task, TaskStatus } from '@/lib/types';
import { useData } from '@/hooks/use-data';
import { Loader2, Rocket, FileDown, Calendar, AlertTriangle, UserCheck, BarChart2, ListTodo, ClipboardCheck, GanttChartSquare, User as UserIcon, FolderKanban } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';
import ProjectsTimeline from './projects/projects-timeline';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';


const ReportPlaceholder = ({title, description, icon: Icon}: {title: string, description: string, icon: React.ElementType}) => (
     <div className="flex flex-col justify-center items-center h-full text-center p-8 bg-muted/30 rounded-lg border-2 border-dashed">
        <Icon className="h-12 w-12 text-muted-foreground mb-4"/>
        <h3 className="font-semibold text-lg">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
    </div>
)

const StatCard = ({ title, value, icon: Icon }: { title: string; value: string | number; icon: React.ElementType }) => (
    <Card className="bg-background/50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{value}</div>
        </CardContent>
    </Card>
)

function EngineerReportViewer({ report, isLoading, selectedEngineer }: { report: EngineerReportOutput | null; isLoading: boolean, selectedEngineer: User | null }) {
    if (isLoading) return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    if (!report || !selectedEngineer) return <ReportPlaceholder title="Selecciona un Ingeniero" description="Elige un ingeniero de la lista para ver su informe de rendimiento y carga de trabajo." icon={UserIcon} />;
    
    return (
        <Card className="bg-muted/50 h-full border-0 shadow-none">
            <ScrollArea className="h-full">
                <CardHeader>
                    <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12">
                            <AvatarImage src={selectedEngineer.avatar} alt={selectedEngineer.name} data-ai-hint="person face"/>
                            <AvatarFallback>{selectedEngineer.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                             <CardTitle className="font-headline text-xl">{selectedEngineer.name}</CardTitle>
                             <p className="text-sm text-muted-foreground">{selectedEngineer.email}</p>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-6 pt-0">
                    <pre className="whitespace-pre-wrap font-body text-sm leading-relaxed bg-background/50 p-4 rounded-lg">{report.report}</pre>
                </CardContent>
            </ScrollArea>
        </Card>
    );
}

function ProjectReportViewer({ report, isLoading, selectedProject }: { report: GenerateProjectReportOutput | null; isLoading: boolean, selectedProject: Project | null }) {
    if (isLoading) return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    if (!report || !selectedProject) return <ReportPlaceholder title="Selecciona un Proyecto" description="Elige un proyecto de la lista para obtener un análisis completo generado por IA." icon={FolderKanban} />;
    
    const { executiveSummary, risksAndBlockers, overloadedEngineers, keyStats } = report;

    return (
        <ScrollArea className="h-full">
            <div className="p-1 space-y-6">
                <Card>
                     <CardHeader>
                        <CardTitle className="font-headline text-lg">Resumen Ejecutivo</CardTitle>
                     </CardHeader>
                     <CardContent>
                        <p className="text-sm text-foreground/80 leading-relaxed">{executiveSummary}</p>
                     </CardContent>
                </Card>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <StatCard title="Tareas Completadas" value={keyStats.completedTasks} icon={ClipboardCheck} />
                    <StatCard title="Entregables Finalizados" value={keyStats.deliverablesFinished} icon={GanttChartSquare} />
                    <StatCard title="Tareas En Progreso" value={keyStats.tasksInProgress} icon={ListTodo} />
                </div>

                {risksAndBlockers.length > 0 && (
                    <Card className="border-destructive/50 bg-destructive/5">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-destructive font-headline text-lg"><AlertTriangle size={20} /> Riesgos y Bloqueos</CardTitle>
                        </CardHeader>
                        <CardContent>
                             <ul className="list-disc list-inside space-y-2 text-sm text-red-800">
                                {risksAndBlockers.map((risk, i) => <li key={i}>{risk}</li>)}
                            </ul>
                        </CardContent>
                    </Card>
                )}

                 {overloadedEngineers.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 font-headline text-lg"><UserCheck size={20} /> Posible Sobrecarga</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground mb-3">Los siguientes ingenieros tienen una alta carga de trabajo. Considera redistribuir tareas para equilibrar el equipo.</p>
                             <div className="flex flex-wrap gap-2">
                                {overloadedEngineers.map((engineer, i) => <Badge key={i} variant="secondary" className="text-base py-1 px-3">{engineer}</Badge>)}
                            </div>
                        </CardContent>
                    </Card>
                )}
                
            </div>
        </ScrollArea>
    )
}

interface MeetingModalProps {
    isOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
    initialFilteredProjects?: Project[];
}


export default function MeetingModal({ isOpen, onOpenChange, initialFilteredProjects }: MeetingModalProps) {
    const { toast } = useToast();
    const { users, projects, tasks, loading: isDataLoading } = useData();
    
    const [isModalOpen, setIsModalOpen] = useState(isOpen);
    useEffect(() => {
        setIsModalOpen(isOpen);
    }, [isOpen]);

    const handleOpenChange = (open: boolean) => {
        if (onOpenChange) {
            onOpenChange(open);
        } else {
            setIsModalOpen(open);
        }
         if (!open) {
            setSelectedEngineer(null);
            setSelectedProject(null);
            setEngineerReport(null);
            setProjectReport(null);
        }
    }
    
    const [selectedEngineer, setSelectedEngineer] = useState<User | null>(null);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);

    const [engineerReport, setEngineerReport] = useState<EngineerReportOutput | null>(null);
    const [projectReport, setProjectReport] = useState<GenerateProjectReportOutput | null>(null);
    const [isEngineerLoading, setIsEngineerLoading] = useState(false);
    const [isProjectLoading, setIsProjectLoading] = useState(false);

    
    const timelineProjects = useMemo(() => {
        let projsToDisplay;
    
        if (initialFilteredProjects) {
            const filteredIds = initialFilteredProjects.map(p => p.id);
            projsToDisplay = projects.filter(p => filteredIds.includes(p.id));
        } else {
            projsToDisplay = projects.filter(p => p.status === 'activo');
        }
    
        return projsToDisplay;
    }, [initialFilteredProjects, projects]);
    
    const handleGenerateEngineerReport = async (user: User) => {
        setIsEngineerLoading(true);
        setEngineerReport(null);
        setSelectedEngineer(user);
        try {
            const userTasks = tasks.filter(t => t.assignedToId === user.id);
            const activeProjects = projects.filter(p => user.assignedProjectIds.includes(p.id) && p.status === 'activo');
            
            const taskStatusCounts = userTasks.reduce((acc, task) => {
                const statusMap: Record<TaskStatus, string> = {
                    'finalizada': '✅ Finalizadas',
                    'montada': '🛠 Montadas',
                    'para-soldar': '🔩 Para Soldar',
                    'pendiente': '⏳ Pendientes',
                    'en-progreso': '🏃 En Progreso'
                };
                const statusName = statusMap[task.status] || task.status;
                if (!acc[statusName]) {
                    acc[statusName] = { status: statusName, quantity: 0, percentage: '' };
                }
                acc[statusName].quantity++;
                return acc;
            }, {} as Record<string, { status: string; quantity: number; percentage: string; tasks: Task[] }>);
            
            const totalTasks = userTasks.length;
            const finalizedTasks = userTasks.filter(t => t.status === 'finalizada').length;
            
            const taskStats = Object.values(taskStatusCounts).map(group => ({
                ...group,
                percentage: group.status === '✅ Finalizadas' 
                    ? `${Math.round((group.quantity / totalTasks) * 100)}%`
                    : '--',
            }));


            const personalProgress = totalTasks > 0
                ? Math.round((finalizedTasks / totalTasks) * 100)
                : 0;

            const reportData = await generateEngineerReport({
                engineerName: user.name,
                activeProjects: activeProjects.map(p => p.name),
                taskStats: taskStats,
                personalProgress,
                delayedTasksAlerts: [], // Mock data for now
                observations: ["Revisar prioridades de tareas pendientes para evitar bloqueos."], // Mock data for now
            });
            setEngineerReport(reportData);
        } catch (error) {
            console.error("No se pudo generar el informe del ingeniero:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo generar el informe del ingeniero.' });
        } finally {
            setIsEngineerLoading(false);
        }
    };

    const handleGenerateProjectReport = async (project: Project) => {
        setIsProjectLoading(true);
        setProjectReport(null);
        setSelectedProject(project);
        try {
            const assignedPeople = users.filter(u => project.engineerIds.includes(u.id)).map(u => u.name);
            const projectTasks = tasks.filter(t => t.projectId === project.id);
            const notesText = project.notes?.map(note => `${note.author} (${new Date(note.date).toLocaleDateString()}): ${note.content}`).join('\n') || '';

            const reportData = await generateProjectReport({
                projectName: project.name,
                totalProgress: project.progress,
                assignedPeople,
                overallStatus: project.status,
                etapas: project.parts.flatMap(p => p.stages),
                tasks: projectTasks.map(t => ({
                    id: t.id,
                    title: t.title,
                    status: t.status,
                    assignedToName: users.find(u => u.id === t.assignedToId)?.name || 'Sin asignar',
                })),
                deliveryDate: project.deliveryDate,
                notes: notesText,
            });
            setProjectReport(reportData);
        } catch (error) {
            console.error("No se pudo generar el informe del proyecto:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo generar el informe del proyecto.' });
        } finally {
            setIsProjectLoading(false);
        }
    };

    const dialogTrigger = onOpenChange ? null : (
        <DialogTrigger asChild>
            <Button size="lg">
                <Calendar className="mr-2" />
                Modo Reunión
            </Button>
        </DialogTrigger>
    );

    return (
        <Dialog open={isModalOpen} onOpenChange={handleOpenChange}>
            {dialogTrigger}
            <DialogContent className="max-w-[95vw] w-full h-[95vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="font-headline text-2xl">Panel de Control para Reuniones</DialogTitle>
                    <DialogDescription>
                        Estado global y en tiempo real de los proyectos activos.
                    </DialogDescription>
                </DialogHeader>

                {isDataLoading ? (
                     <div className="flex-grow flex items-center justify-center">
                        <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    </div>
                ) : (
                <Tabs defaultValue="timeline" className="flex-grow flex flex-col min-h-0 pt-4">
                    <TabsList className="self-start grid grid-cols-3 w-auto">
                        <TabsTrigger value="timeline"><GanttChartSquare className="mr-2" />Cronograma Global</TabsTrigger>
                        <TabsTrigger value="projects"><FolderKanban className="mr-2" />Análisis por Proyecto</TabsTrigger>
                        <TabsTrigger value="engineers"><UserIcon className="mr-2" />Análisis por Ingeniero</TabsTrigger>
                    </TabsList>
                    <TabsContent value="timeline" className="flex-grow mt-4 min-h-0">
                        <ProjectsTimeline projects={timelineProjects} users={users} tasks={tasks} />
                    </TabsContent>
                     <TabsContent value="projects" className="flex-grow mt-4 min-h-0">
                        <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] h-full gap-6">
                            <div className="col-span-1 flex flex-col border-r pr-4">
                                <h4 className="font-semibold mb-2 px-1 text-lg">Proyectos Activos</h4>
                                <ScrollArea className="h-full">
                                <div className="p-1 space-y-2">
                                    {projects.filter(p => p.status === 'activo').map(project => (
                                        <Button
                                            key={project.id}
                                            variant={selectedProject?.id === project.id ? "secondary" : "ghost"}
                                            className="w-full justify-start h-auto text-left py-2"
                                            onClick={() => handleGenerateProjectReport(project)}
                                            disabled={isProjectLoading && selectedProject?.id === project.id}
                                        >
                                            <div className="flex items-center gap-2">
                                                {isProjectLoading && selectedProject?.id === project.id && <Loader2 className="h-4 w-4 animate-spin"/>}
                                                <div>
                                                    <p className="font-semibold">{project.name}</p>
                                                    <p className="text-xs text-muted-foreground">{project.client}</p>
                                                </div>
                                            </div>
                                        </Button>
                                    ))}
                                </div>
                                </ScrollArea>
                            </div>
                            <div className="col-span-1 h-full bg-muted/30 rounded-lg">
                                <ProjectReportViewer report={projectReport} isLoading={isProjectLoading} selectedProject={selectedProject} />
                            </div>
                        </div>
                    </TabsContent>
                    <TabsContent value="engineers" className="flex-grow mt-4 min-h-0">
                        <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] h-full gap-6">
                            <div className="col-span-1 flex flex-col border-r pr-4">
                                <h4 className="font-semibold mb-2 px-1 text-lg">Equipo de Ingeniería</h4>
                                <ScrollArea className="h-full">
                                <div className="p-1 space-y-2">
                                    {users.filter(u => u.role === 'Engineer').map(user => (
                                        <Button
                                            key={user.id}
                                            variant={selectedEngineer?.id === user.id ? "secondary" : "ghost"}
                                            className="w-full justify-start h-auto text-left py-2"
                                            onClick={() => handleGenerateEngineerReport(user)}
                                            disabled={isEngineerLoading && selectedEngineer?.id === user.id}
                                        >
                                            <div className="flex items-center gap-3">
                                                 {isEngineerLoading && selectedEngineer?.id === user.id && <Loader2 className="h-4 w-4 animate-spin"/>}
                                                <Avatar className="h-8 w-8">
                                                    <AvatarImage src={user.avatar} alt={user.name} data-ai-hint="person face" />
                                                    <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                <span>{user.name}</span>
                                            </div>
                                        </Button>
                                    ))}
                                </div>
                                </ScrollArea>
                            </div>
                            <div className="col-span-1 h-full bg-muted/30 rounded-lg">
                                <EngineerReportViewer report={engineerReport} isLoading={isEngineerLoading} selectedEngineer={selectedEngineer} />
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
                )}
                <DialogFooter className="mt-4 border-t pt-4">
                     <p className="text-xs text-muted-foreground mr-auto">Los informes son generados por IA y pueden contener imprecisiones.</p>
                    <Button variant="outline" disabled={!engineerReport && !projectReport}>
                        <FileDown className="mr-2 h-4 w-4" />
                        Exportar Resumen
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
