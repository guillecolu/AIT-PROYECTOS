

'use client';

import { useMemo, useEffect, useState } from 'react';
import type { Project, Stage, User, Task, Part, TaskStatus } from '@/lib/types';
import { format, isPast, isToday, differenceInCalendarDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { CheckCircle, Clock, Loader, AlertTriangle, ChevronRight, Folder, Users, Wrench, Zap, Code, Factory, DraftingCompass, Frame, Scissors, Flame, Construction, Cable, FlaskConical, Cog, Truck } from 'lucide-react';
import Link from 'next/link';
import { Progress } from '../ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { ScrollArea } from '../ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import { Badge } from '../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';


interface EnrichedProject extends Project {
    projectManager: User | undefined;
}

const statusBadgeClasses: Record<TaskStatus, string> = {
    'en-progreso': 'bg-blue-100 text-blue-800',
    'pendiente': 'bg-yellow-100 text-yellow-800',
    'finalizada': 'bg-green-100 text-green-800',
    'montada': 'bg-purple-100 text-purple-800',
    'para-soldar': 'bg-orange-100 text-orange-800',
};

const componentIcons: Record<string, React.ReactNode> = {
    'Diseño': <Cog className="h-4 w-4" />,
    'Estructura': <Frame className="h-4 w-4" />,
    'Corte': <Scissors className="h-4 w-4" />,
    'Soldadura': <Flame className="h-4 w-4" />,
    'Montaje': <Wrench className="h-4 w-4" />,
    'Cableado': <Cable className="h-4 w-4" />,
    'Eléctrico': <Zap className="h-4 w-4" />,
    'Programación': <Code className="h-4 w-4" />,
    'Pruebas': <CheckCircle className="h-4 w-4" />,
    'Fabricacion': <Factory className="h-4 w-4" />,
    'Ensamblaje': <Construction className="h-4 w-4" />,
    'Logistica': <Truck className="h-4 w-4" />,
}

function ClientSideDate({ dateString, className, format = 'dd/MM/yyyy' }: { dateString: string, className?: string, format?: string }){
    const [formattedDate, setFormattedDate] = useState('');

    useEffect(() => {
        if (dateString) {
            const { format: formatDate, es } = require('date-fns');
            setFormattedDate(formatDate(new Date(dateString), format, { locale: es }));
        } else {
            setFormattedDate('');
        }
    }, [dateString, format]);

    return <span className={className}>{formattedDate}</span>;
};


const deadlineBadgeConfig = {
  delayed: {
    dot: 'bg-red-500',
    badge: 'bg-red-100 text-red-700',
    tooltip: 'Retrasada: La fecha de entrega ya ha pasado.',
  },
  soon: {
    dot: 'bg-yellow-500',
    badge: 'bg-yellow-100 text-yellow-700',
    tooltip: 'Vence pronto: La tarea vence hoy o en los próximos 2 días.',
  },
  onTime: {
    dot: 'bg-green-500',
    badge: 'bg-green-100 text-green-700',
    tooltip: 'En tiempo: Quedan más de 2 días.',
  },
};

const DeadlineBadge = ({ deadline }: { deadline: string }) => {
  const deadlineDate = new Date(deadline);
  const today = new Date();
  let status: keyof typeof deadlineBadgeConfig = 'onTime';

  if (isPast(deadlineDate) && !isToday(deadlineDate)) {
    status = 'delayed';
  } else {
    const daysUntilDeadline = differenceInCalendarDays(deadlineDate, today);
    if (daysUntilDeadline <= 2) {
      status = 'soon';
    }
  }

  const config = deadlineBadgeConfig[status];

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <Badge
            variant="outline"
            className={cn(
              'text-xs font-semibold capitalize border-none px-2 py-1 inline-flex items-center gap-2',
              config.badge
            )}
          >
            <div className={cn('h-1.5 w-1.5 rounded-full', config.dot)}></div>
            <ClientSideDate dateString={deadline} />
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>{config.tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};


export default function ProjectsTimeline({ projects, users, tasks }: { projects: Project[], users: User[], tasks: Task[] }) {

  const enrichedProjects: EnrichedProject[] = useMemo(() => {
    if (!projects || !users) return [];
    return projects
        .filter(p => p.status === 'activo')
        .map(project => ({
      ...project,
      projectManager: users.find(u => u.id === project.projectManagerId),
    }));
  }, [projects, users]);

  const getUserName = (id?: string) => users.find(u => u.id === id)?.name || 'Sin asignar';

  if (enrichedProjects.length === 0) {
    return (
        <div className="text-center py-16 text-muted-foreground bg-muted/20 rounded-lg flex flex-col items-center h-full justify-center">
            <Folder className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <p className="font-semibold text-lg">No hay proyectos activos para mostrar</p>
            <p>Crea un nuevo proyecto para verlo aquí.</p>
        </div>
    );
  }

  return (
    <ScrollArea className="h-full flex-grow pr-4">
        <Accordion type="multiple" className="w-full space-y-4">
            {enrichedProjects.map((project) => (
                <AccordionItem key={project.id} value={project.id} className="border rounded-lg bg-card">
                   <AccordionTrigger className="p-4 hover:no-underline">
                        <div className="flex items-center gap-4 flex-grow">
                             <ChevronRight className="h-5 w-5 shrink-0 transition-transform duration-200 group-[&[data-state=open]]:rotate-90" />
                            <div className="flex-grow text-left">
                                <Link href={`/dashboard/projects/${project.id}`} className="font-semibold hover:underline text-base">{project.name}</Link>
                                <p className="font-normal text-xs text-muted-foreground">{project.client}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-6 w-1/2 pr-4">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground w-[120px]">
                                {project.projectManager && (
                                    <>
                                    <Avatar className="h-6 w-6">
                                        <AvatarImage src={project.projectManager.avatar} alt={project.projectManager.name} data-ai-hint="person face" />
                                        <AvatarFallback>{project.projectManager.name[0]}</AvatarFallback>
                                    </Avatar>
                                    <span>{project.projectManager.name}</span>
                                    </>
                                )}
                            </div>
                            <div className="flex-grow">
                                <Progress value={project.progress} className="w-full h-2"/>
                            </div>
                            <span className="font-semibold text-sm text-foreground w-10">{project.progress}%</span>
                        </div>
                   </AccordionTrigger>
                   <AccordionContent className="p-4 pt-0">
                       <Accordion type="multiple" className="w-full space-y-2">
                            {project.parts.map(part => (
                                <AccordionItem key={part.id} value={part.id} className="border-none">
                                    <AccordionTrigger className="bg-muted/50 hover:bg-muted rounded-md p-2 hover:no-underline">
                                        <div className="flex items-center gap-2 flex-grow">
                                             <ChevronRight className="h-4 w-4 shrink-0 transition-transform duration-200 group-[&[data-state=open]]:rotate-90" />
                                             <Folder className="h-4 w-4 text-primary"/>
                                            <span className="font-medium text-sm">{part.name}</span>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="pt-2 pb-0">
                                         <div className="space-y-4 pl-8">
                                            {part.stages.map(stage => {
                                                const stageTasks = tasks.filter(t => t.partId === part.id && t.component === stage.nombre);
                                                return (
                                                    <div key={stage.nombre}>
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
                                                                {componentIcons[stage.nombre] || <Wrench className="h-4 w-4"/>}
                                                            </div>
                                                            <h4 className="font-semibold text-sm capitalize">{stage.nombre}</h4>
                                                            <div className="w-20">
                                                                <Progress value={stage.porcentaje} className="h-1.5"/>
                                                            </div>
                                                        </div>
                                                        {stageTasks.length > 0 ? (
                                                        <div className="pl-7 space-y-1">
                                                            {stageTasks.map(task => (
                                                                <Link key={task.id} href={`/dashboard/projects/${project.id}`} className="flex items-center justify-start gap-4 text-sm py-2 border-b border-dashed border-muted -mx-2 px-2 hover:bg-muted/50 rounded-md">
                                                                    <span className="text-foreground hover:underline">{task.title}</span>
                                                                    <span className="font-semibold text-foreground">{getUserName(task.assignedToId)}</span>
                                                                    <DeadlineBadge deadline={task.deadline} />
                                                                    <Badge variant="secondary" className={cn("capitalize text-xs font-normal border-0", statusBadgeClasses[task.status])}>
                                                                        {task.status.replace('-', ' ')}
                                                                    </Badge>
                                                                </Link>
                                                            ))}
                                                        </div>
                                                        ) : (
                                                            <p className="text-xs text-muted-foreground pl-7 py-2">No hay tareas en esta área.</p>
                                                        )}
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                       </Accordion>
                   </AccordionContent>
                </AccordionItem>
            ))}
        </Accordion>
    </ScrollArea>
  );
}
