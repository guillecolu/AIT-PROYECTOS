

'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CalendarIcon, UsersIcon, CheckCircle, Wrench, Zap, Code, Factory, PlusCircle, MoreHorizontal, Pencil, Trash2, UserSquare, XCircle, PenSquare, Edit, Archive, FolderPlus, ChevronDown, Palette, History, MessageSquare, Save, Paperclip, FileDown, Loader2, BrainCircuit, Play, Pause, ClipboardList, LayoutGrid, Rows, DraftingCompass, Frame, Scissors, Flame, Construction, Cable, FlaskConical, Cog, Truck, ChevronsUpDown, Clock, Timer } from 'lucide-react';
import type { TaskComponent, Task, User, Project, ProjectNote, TaskStatus, Part, Signature, TaskComment, CommonTask, ProjectAlerts, AlertItem, AreaColor } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import TaskFormModal from '@/components/projects/task-form-modal';
import TaskNotesModal from '@/components/projects/task-notes-modal';
import TaskDescriptionModal from '@/components/projects/task-description-modal';
import TaskSignatureModal from '@/components/projects/task-signature-modal';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useData } from '@/hooks/use-data';
import PartsRoadmap from '@/components/projects/parts-roadmap';
import { Input } from '@/components/ui/input';
import EditableField from '@/components/ui/editable-field';
import ProjectColorPicker from '@/components/projects/project-color-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ProjectEditModal from '@/components/projects/project-edit-modal';
import { generatePendingTasksPdf } from '@/lib/pdf-generator';
import ProjectAlerts from '@/components/projects/project-alerts';
import { generateDailySummary } from '@/ai/flows/generate-daily-summary';
import type { DailySummaryOutput } from '@/ai/flows/generate-daily-summary.types';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { startOfDay, endOfDay, addDays, isBefore, differenceInCalendarDays, isPast, isToday } from 'date-fns';
import { es } from 'date-fns/locale';
import AreaColorPicker from './area-color-picker';
import PdfOptionsModal, { type PdfSelection } from './pdf-options-modal';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import TaskIconPicker from './task-icon-picker';
import ProjectQRCode from './project-qr-code';
import { Calendar } from '../ui/calendar';
import SignatureHistory from './signature-history';


const componentIcons: Record<string, React.ReactNode> = {
    'Diseño': <Cog className="h-4 w-4 mr-2" />,
    'Estructura': <Frame className="h-4 w-4 mr-2" />,
    'Corte': <Scissors className="h-4 w-4 mr-2" />,
    'Soldadura': <Flame className="h-4 w-4 mr-2" />,
    'Montaje': <Wrench className="h-4 w-4 mr-2" />,
    'Cableado': <Cable className="h-4 w-4 mr-2" />,
    'Eléctrico': <Zap className="h-4 w-4 mr-2" />,
    'Programación': <Code className="h-4 w-4 mr-2" />,
    'Pruebas': <CheckCircle className="h-4 w-4 mr-2" />,
    'Fabricacion': <Factory className="h-4 w-4 mr-2" />,
    'Ensamblaje': <Construction className="h-4 w-4 mr-2" />,
    'Logistica': <Truck className="h-4 w-4 mr-2" />,
}

const statusColorClasses: Record<TaskStatus, string> = {
    pendiente: 'bg-yellow-100 text-yellow-800',
    'en-progreso': 'bg-blue-100 text-blue-800',
    'para-soldar': 'bg-orange-100 text-orange-800',
    montada: 'bg-purple-100 text-purple-800',
    finalizada: 'bg-green-100 text-green-800',
};

function ClientSideDate({ dateString, className, format = 'dd/MM/yyyy' }: { dateString?: string, className?: string, format?: string }){
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


type AreaLayout = 'fila' | 'cuadricula';
type SortKey = 'title' | 'assignedToName' | 'status' | 'startDate' | 'deadline' | 'estimatedTime';
type SortDirection = 'asc' | 'desc';


function TasksByComponent({ tasks, users, project, commonTasks, commonDepartments, onTaskUpdate, onTaskDelete, selectedPart, onDepartmentAdd, onDepartmentDelete, onDepartmentNameChange, openNotesModal, openDescriptionModal, onSignTask, onUndoSignTask, onSaveCommonDepartment }: { tasks: Task[], users: User[], project: Project, commonTasks: any[], commonDepartments: string[], onTaskUpdate: (task: Task | Omit<Task, 'id'>) => void, onTaskDelete: (taskId: string) => void, selectedPart: Part | null, onDepartmentAdd: (partId: string, stageName: TaskComponent) => void, onDepartmentDelete: (partId: string, stageName: string) => void, onDepartmentNameChange: (partId: string, oldStageName: string, newStageName: string) => void, openNotesModal: (task: Task) => void, openDescriptionModal: (task: Task) => void, onSignTask: (task: Task, userId: string, workDescription: string, actualTime: number) => void, onUndoSignTask: (task: Task) => void, onSaveCommonDepartment: (name: string) => void }) {
    
    const getUserName = (id?: string) => users.find(u => u.id === id)?.name || 'Sin asignar';
    const { areaColors } = useData();
    const [areaLayout, setAreaLayout] = useState<AreaLayout>('fila');
    const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection } | null>(null);
    
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [componentForNewTask, setComponentForNewTask] = useState<TaskComponent | null>(null);
    const [newStageName, setNewStageName] = useState("");
    const [prefillData, setPrefillData] = useState<Partial<Task> | undefined>(undefined);

    const [newCommonDept, setNewCommonDept] = useState("");
    const { toast } = useToast();
    const { projects } = useData();

    const [taskToSign, setTaskToSign] = useState<Task | null>(null);
    const [signingUser, setSigningUser] = useState<User | null>(null);
    
    const handleAssigneeChange = (task: Task, newAssigneeId: string) => {
        const updatedTask = { ...task, assignedToId: newAssigneeId === 'unassigned' ? undefined : newAssigneeId };
        onTaskUpdate(updatedTask);
    };

    const handleDateChange = (task: Task, field: 'startDate' | 'deadline', date: Date | undefined) => {
        if (date) {
            onTaskUpdate({ ...task, [field]: date.toISOString() });
        }
    };

    const handleOpenModalForNew = (component: TaskComponent) => {
        setEditingTask(null);
        setComponentForNewTask(component);
        setPrefillData(undefined);
        setIsTaskModalOpen(true);
    };

    const handleOpenModalForEdit = (task: Task) => {
        setEditingTask(task);
        setComponentForNewTask(task.component);
        setPrefillData(undefined);
        setIsTaskModalOpen(true);
    };
    
    const handleAddFromCommon = (commonTask: any) => {
        setEditingTask(null);
        setPrefillData({
            title: commonTask.title,
            description: commonTask.description,
            estimatedTime: commonTask.estimatedTime,
        });
        setIsTaskModalOpen(true);
    }

    const handleSaveTask = (taskData: Omit<Task, 'id'> | Task) => {
        onTaskUpdate(taskData);
    };
    
    const handleAddCustomStage = () => {
        if (newStageName.trim() && selectedPart) {
            onDepartmentAdd(selectedPart.id, newStageName as TaskComponent);
            setNewStageName("");
        }
    }
    
    const allCommonDepartments = useMemo(() => {
        const defaultStages: TaskComponent[] = ['Diseño', 'Soldadura', 'Montaje', 'Pruebas', 'Logistica'];
        const combined = [...defaultStages, ...commonDepartments];
        return [...new Set(combined)]; // Remove duplicates
    }, [commonDepartments]);
    
    if (!selectedPart) {
        return (
            <div className="text-center py-16 text-muted-foreground bg-muted/20 rounded-lg">
                <p className="text-lg font-semibold">Selecciona un parte</p>
                <p>Elige un parte de la hoja de ruta de arriba para ver sus áreas y tareas.</p>
            </div>
        )
    }

    const handleAddAndSaveCommon = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (newCommonDept.trim() && selectedPart) {
            onDepartmentAdd(selectedPart.id, newCommonDept as TaskComponent);
            onSaveCommonDepartment(newCommonDept);
            toast({
                title: "Área guardada",
                description: `"${newCommonDept}" se ha añadido a tus áreas comunes.`
            });
            setNewCommonDept("");
        }
    }
    
    const handleSort = (key: SortKey) => {
        let direction: SortDirection = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const sortedTasks = (tasksToSort: Task[]) => {
        if (!sortConfig) {
            return tasksToSort;
        }

        return [...tasksToSort].sort((a, b) => {
            let aValue: any;
            let bValue: any;

            if (sortConfig.key === 'assignedToName') {
                aValue = getUserName(a.assignedToId);
                bValue = getUserName(b.assignedToId);
            } else {
                aValue = a[sortConfig.key as keyof Task];
                bValue = b[sortConfig.key as keyof Task];
            }

            if (aValue < bValue) {
                return sortConfig.direction === 'asc' ? -1 : 1;
            }
            if (aValue > bValue) {
                return sortConfig.direction === 'asc' ? 1 : -1;
            }
            return 0;
        });
    };

    const partStages = project.parts.find(p => p.id === selectedPart.id)?.stages || [];
    const partTasks = tasks.filter(t => t.partId === selectedPart.id);
    
    const handleStatusChange = (task: Task, newStatus: TaskStatus) => {
        if (task.status !== newStatus) {
            const updatedTask = { ...task, status: newStatus };
            onTaskUpdate(updatedTask);
        }
    };


    return (
        <div className="space-y-6">
            <div className="flex justify-end">
                <div className="inline-flex items-center rounded-md bg-muted p-1">
                    <Button variant={areaLayout === 'fila' ? 'secondary' : 'ghost'} size="sm" onClick={() => setAreaLayout('fila')} className="h-8 px-3">
                        <Rows className="h-4 w-4 mr-2" /> Fila
                    </Button>
                     <Button variant={areaLayout === 'cuadricula' ? 'secondary' : 'ghost'} size="sm" onClick={() => setAreaLayout('cuadricula')} className="h-8 px-3">
                        <LayoutGrid className="h-4 w-4 mr-2" /> Cuadrícula
                    </Button>
                </div>
            </div>
            <div className={cn(
                areaLayout === 'fila' ? "space-y-6" : "grid grid-cols-1 md:grid-cols-2 gap-6"
            )}>
                {partStages.map(stage => {
                    const colors = areaColors?.find(c => c.name === stage.nombre) || areaColors?.find(c => c.name === 'default');
                    const stageTasks = partTasks.filter(t => t.component === stage.nombre);
                    const pendingTasks = sortedTasks(stageTasks.filter(t => t.status !== 'finalizada'));
                    const completedTasks = stageTasks.filter(t => t.status === 'finalizada').sort((a,b) => new Date(b.finalizedAt!).getTime() - new Date(a.finalizedAt!).getTime());

                    if (!colors) return null;

                    const SortableHeader = ({ sortKey, children }: { sortKey: SortKey, children: React.ReactNode }) => (
                         <Button variant="ghost" onClick={() => handleSort(sortKey)} className="px-1 py-0 h-auto" style={{ color: colors.textColor }}>
                            {children}
                            {sortConfig?.key === sortKey && (
                                <ChevronsUpDown className="ml-2 h-3 w-3" />
                            )}
                        </Button>
                    );

                    return (
                        <div 
                            key={stage.nombre} 
                            className="rounded-lg p-4 space-y-4 border-2" 
                            style={{ backgroundColor: colors.bgColor, color: colors.textColor, borderColor: colors.textColor }}
                        >
                            <div className="space-y-2">
                                <div className="group flex items-center gap-2">
                                    <h3 className="font-semibold text-lg flex items-center capitalize" style={{ color: colors.textColor }}>
                                        {componentIcons[stage.nombre] || <Wrench className="h-4 w-4 mr-2" />}
                                        <EditableField
                                            initialValue={stage.nombre}
                                            onSave={(newName) => onDepartmentNameChange(selectedPart!.id, stage.nombre, newName)}
                                            label="Nombre del Área"
                                        />
                                    </h3>
                                    <AreaColorPicker areaName={stage.nombre} />
                                    <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100" style={{ color: colors.textColor }} onClick={() => onDepartmentDelete(selectedPart!.id, stage.nombre)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                                <Button variant="outline" size="sm" onClick={() => handleOpenModalForNew(stage.nombre as TaskComponent)} style={{ color: colors.textColor, borderColor: 'currentColor', backgroundColor: 'transparent' }}>
                                    <PlusCircle className="mr-2 h-4 w-4" />
                                    Añadir Tarea
                                </Button>
                            </div>
                            <Table className="bg-card/50 rounded-md">
                                <TableHeader>
                                    <TableRow className="border-b-foreground/10">
                                        <TableHead><SortableHeader sortKey="title">Tarea</SortableHeader></TableHead>
                                        <TableHead><SortableHeader sortKey="assignedToName">Asignado a</SortableHeader></TableHead>
                                        <TableHead><SortableHeader sortKey="status">Estado</SortableHeader></TableHead>
                                        <TableHead><SortableHeader sortKey="startDate">Inicio</SortableHeader></TableHead>
                                        <TableHead><SortableHeader sortKey="deadline">Entrega</SortableHeader></TableHead>
                                        <TableHead><SortableHeader sortKey="estimatedTime">Tiempo (Est)</SortableHeader></TableHead>
                                        <TableHead style={{ color: colors.textColor }}>Acciones</TableHead>
                                        <TableHead className="w-[50px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {pendingTasks.map(task => (
                                        <TableRow key={task.id} className="bg-card/50 hover:bg-card/90 border-b-foreground/10">
                                            <TableCell>
                                                <div className="flex items-center">
                                                    <TaskIconPicker task={task} onTaskUpdate={onTaskUpdate as (t:Task) => void} />
                                                    <EditableField
                                                        initialValue={task.title}
                                                        onSave={(newTitle) => onTaskUpdate({ ...task, title: newTitle })}
                                                        label="Título de la tarea"
                                                    />
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Select onValueChange={(value) => handleAssigneeChange(task, value)} value={task.assignedToId || 'unassigned'}>
                                                    <SelectTrigger className="h-8 w-full min-w-[150px]">
                                                        <SelectValue placeholder="Sin asignar" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="unassigned">Sin asignar</SelectItem>
                                                        {users.map(user => <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    {task.status === 'pendiente' || task.status === 'en-progreso' ? (
                                                        <>
                                                            {task.status === 'pendiente' ? (
                                                                <Button variant="ghost" size="sm" onClick={() => handleStatusChange(task, 'en-progreso')} className="text-yellow-600 hover:text-yellow-700">
                                                                    <Play className="h-4 w-4 mr-2" />
                                                                    Pendiente
                                                                </Button>
                                                            ) : (
                                                                <Button variant="ghost" size="sm" onClick={() => handleStatusChange(task, 'pendiente')} className="text-blue-600 hover:text-blue-700">
                                                                    <Pause className="h-4 w-4 mr-2" />
                                                                    En Progreso
                                                                </Button>
                                                            )}
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button variant="outline" size="sm">
                                                                        <Edit className="h-3 w-3 mr-1.5" />
                                                                        Firmar
                                                                    </Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="start" className="max-h-60 overflow-y-auto">
                                                                    <DropdownMenuLabel>Seleccionar responsable</DropdownMenuLabel>
                                                                    <DropdownMenuSeparator />
                                                                    {users.map(user => (
                                                                        <DropdownMenuItem key={user.id} onSelect={() => {
                                                                            setTaskToSign(task);
                                                                            setSigningUser(user);
                                                                        }}>
                                                                            <Avatar className="w-5 h-5 mr-2">
                                                                                <AvatarImage src={user.avatar} />
                                                                                <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                                                                            </Avatar>
                                                                            <span>{user.name}</span>
                                                                        </DropdownMenuItem>
                                                                    ))}
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        </>
                                                    ) : (
                                                        <Badge variant="secondary" className={cn("capitalize text-xs border-0", statusColorClasses[task.status])}>
                                                            {task.status.replace('-', ' ')}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <Button variant="ghost" className="px-2 font-normal">
                                                            <ClientSideDate dateString={task.startDate} />
                                                            <CalendarIcon className="ml-2 h-4 w-4" />
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-0">
                                                        <Calendar
                                                            mode="single"
                                                            selected={new Date(task.startDate)}
                                                            onSelect={(date) => handleDateChange(task, 'startDate', date)}
                                                            initialFocus
                                                            locale={es}
                                                            weekStartsOn={1}
                                                        />
                                                    </PopoverContent>
                                                </Popover>
                                            </TableCell>
                                            <TableCell>
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                         <Button variant="ghost" className="px-2 font-normal">
                                                            <ClientSideDate dateString={task.deadline} />
                                                            <CalendarIcon className="ml-2 h-4 w-4" />
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-0">
                                                        <Calendar
                                                            mode="single"
                                                            selected={new Date(task.deadline)}
                                                            onSelect={(date) => handleDateChange(task, 'deadline', date)}
                                                            initialFocus
                                                            locale={es}
                                                            weekStartsOn={1}
                                                        />
                                                    </PopoverContent>
                                                </Popover>
                                            </TableCell>
                                            <TableCell>
                                                <EditableField
                                                    initialValue={String(task.estimatedTime)}
                                                    onSave={(newTime) => onTaskUpdate({ ...task, estimatedTime: Number(newTime) })}
                                                    label="Tiempo estimado"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Button variant="outline" size="sm" onClick={() => openDescriptionModal(task)}>
                                                        Descripción
                                                    </Button>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent>
                                                        <DropdownMenuItem onClick={() => handleOpenModalForEdit(task)}>
                                                            <Pencil className="mr-2 h-4 w-4" />
                                                            Editar Tarea Completa
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem onClick={() => onTaskDelete(task.id)} className="text-destructive">
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            Eliminar
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {pendingTasks.length === 0 && (
                                        <TableRow className="border-b-foreground/10">
                                            <TableCell colSpan={8} className="text-center text-muted-foreground py-10 bg-card/50">
                                                No hay tareas pendientes en esta área.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                            {completedTasks.length > 0 && (
                                <Accordion type="single" collapsible className="w-full">
                                    <AccordionItem value="completed-tasks" className="border-none">
                                        <AccordionTrigger className="text-sm font-medium" style={{ color: colors.textColor }}>
                                            Ver {completedTasks.length} Tareas Finalizadas
                                        </AccordionTrigger>
                                        <AccordionContent>
                                            <Table className="bg-card/50 rounded-md">
                                                 <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Tarea</TableHead>
                                                        <TableHead>Horas (Est/Real)</TableHead>
                                                        <TableHead>Finalización</TableHead>
                                                        <TableHead>Acciones</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {completedTasks.map(task => (
                                                        <TableRow key={task.id} className="bg-card/50 hover:bg-card/90 border-b-foreground/10">
                                                             <TableCell className="text-foreground">
                                                                <div className="flex items-center gap-2">
                                                                    <TaskIconPicker task={task} onTaskUpdate={onTaskUpdate as (t:Task) => void} />
                                                                    {task.title}
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="text-foreground">
                                                                {`${task.estimatedTime}h / ${task.actualTime || '-'}h`}
                                                            </TableCell>
                                                            <TableCell>
                                                                <div className="flex items-center gap-2">
                                                                    <div className="flex items-center text-xs text-green-700 font-medium">
                                                                        <PenSquare className="h-4 w-4 mr-2 flex-shrink-0" />
                                                                        <div>
                                                                            <div>Firmado por {getUserName(task.finalizedByUserId)}</div>
                                                                            {task.finalizedAt && <div className="text-muted-foreground font-normal"><ClientSideDate dateString={task.finalizedAt} /></div>}
                                                                        </div>
                                                                    </div>
                                                                     <div className='flex items-center gap-1' onClick={(e) => e.stopPropagation()}>
                                                                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onUndoSignTask(task)}>
                                                                            <XCircle className="h-4 w-4 text-muted-foreground" />
                                                                        </Button>
                                                                        <SignatureHistory history={task.signatureHistory || []} users={users} />
                                                                    </div>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>
                                                                <div className="flex items-center gap-2">
                                                                    <Button variant="outline" size="sm" onClick={() => openDescriptionModal(task)}>
                                                                        Descripción
                                                                    </Button>
                                                                </div>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </AccordionContent>
                                    </AccordionItem>
                                </Accordion>
                            )}
                        </div>
                    )
                })}
            </div>

             <div className="p-4 border-2 border-dashed rounded-lg flex items-center gap-4">
                <FolderPlus className="h-6 w-6 text-muted-foreground flex-shrink-0" />
                <div className="flex-grow flex items-center gap-2">
                    <Input 
                        placeholder="Nombre de la nueva área personalizada"
                        value={newStageName}
                        onChange={(e) => setNewStageName(e.target.value)}
                        className="flex-grow"
                    />
                    <Button onClick={handleAddCustomStage}>Añadir Personalizada</Button>
                </div>
                <div className="border-l pl-4">
                     <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline">
                                Añadir Área
                                <ChevronDown className="h-4 w-4 ml-2" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuLabel>Áreas Comunes</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {allCommonDepartments.map(stage => (
                                <DropdownMenuItem key={stage} onSelect={() => onDepartmentAdd(selectedPart.id, stage as TaskComponent)}>
                                    {stage}
                                </DropdownMenuItem>
                            ))}
                            <DropdownMenuSeparator />
                            <div className='p-2 space-y-2'>
                                <p className="text-xs font-semibold text-muted-foreground px-1">Añadir nuevo al baúl</p>
                                <div className="flex items-center gap-2">
                                    <Input
                                        placeholder="Nueva área..."
                                        value={newCommonDept}
                                        onChange={(e) => setNewCommonDept(e.target.value)}
                                        onClick={(e) => e.stopPropagation()}
                                        className="h-8"
                                    />
                                    <Button
                                        size="sm"
                                        onClick={handleAddAndSaveCommon}
                                        disabled={!newCommonDept.trim()}
                                    >
                                        Añadir y Guardar
                                    </Button>
                                </div>
                            </div>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
             <TaskFormModal 
                isOpen={isTaskModalOpen}
                onClose={() => setIsTaskModalOpen(false)}
                onSave={handleSaveTask}
                task={editingTask}
                users={users}
                projects={projects}
                project={project}
                defaultComponent={componentForNewTask}
                defaultPartId={selectedPart.id}
                prefillData={prefillData}
                commonTasks={commonTasks}
            />
            {taskToSign && signingUser && (
                <TaskSignatureModal
                    isOpen={!!taskToSign}
                    onClose={() => setTaskToSign(null)}
                    task={taskToSign}
                    user={signingUser}
                    onConfirm={onSignTask}
                />
            )}
    </div>
    )
}

function ProjectNotes({ initialNotes, users, projectId, onNoteAdd }: { initialNotes: ProjectNote[], users: User[], projectId: string, onNoteAdd: (note: Omit<ProjectNote, 'id'>) => void }) {
    const [newNote, setNewNote] = useState('');
    const { toast } = useToast();

    const handleAddNote = async () => {
        if (newNote.trim() === '') return;

        // In a real app, this would be the logged-in user
        const currentUser = users.find(u => u.role === 'Admin') || users[0];

        const noteToAdd: Omit<ProjectNote, 'id'> = {
            author: currentUser.name,
            date: new Date().toISOString(),
            content: newNote,
        };
        
        onNoteAdd(noteToAdd);
        setNewNote('');

        toast({
            title: "Nota añadida",
            description: "Tu nota ha sido guardada en el proyecto.",
        });
    };
    
    return (
         <Card>
            <CardContent className="p-6 space-y-6">
                <div className="space-y-4">
                    <Textarea
                        placeholder="Escribe aquí tu nueva nota..."
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        className="min-h-[100px]"
                    />
                    <div className="flex justify-end">
                        <Button onClick={handleAddNote}>Añadir Nota</Button>
                    </div>
                </div>

                <div className="space-y-4">
                    {initialNotes.length > 0 ? (
                        [...initialNotes].reverse().map(note => (
                            <Card key={note.id} className="bg-muted/50">
                                <CardContent className="p-4">
                                    <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                                    <div className="text-xs text-muted-foreground mt-2 pt-2 border-t">
                                        {note.author} - <ClientSideDate dateString={note.date} />
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    ) : (
                        <p className="text-muted-foreground text-center py-4">
                            No hay notas para este proyecto.
                        </p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

// Helper function to convert hex to HSL
const hexToHSL = (H: string): [number, string, string] | null => {
    if (!H) return null;
    // Convert hex to RGB first
    let r = 0, g = 0, b = 0;
    if (H.length == 4) {
      r = parseInt("0x" + H[1] + H[1]);
      g = parseInt("0x" + H[2] + H[2]);
      b = parseInt("0x" + H[3] + H[3]);
    } else if (H.length == 7) {
      r = parseInt("0x" + H[1] + H[2]);
      g = parseInt("0x" + H[3] + H[4]);
      b = parseInt("0x" + H[5] + H[6]);
    }
    // Then to HSL
    r /= 255;
    g /= 255;
    b /= 255;
    let cmin = Math.min(r,g,b),
        cmax = Math.max(r,g,b),
        delta = cmax - cmin,
        h = 0,
        s = 0,
        l = 0;
  
    if (delta == 0) h = 0;
    else if (cmax == r) h = ((g - b) / delta) % 6;
    else if (cmax == g) h = (b - r) / delta + 2;
    else h = (r - g) / delta + 4;
  
    h = Math.round(h * 60);
  
    if (h < 0) h += 360;
  
    l = (cmax + cmin) / 2;
    s = delta == 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));
    s = +(s * 100).toFixed(1);
    l = +(l * 100).toFixed(1);
  
    return [h, `${s}%`, `${l}%`];
}
  
// Helper function to get contrasting text color
const getContrastingTextColor = (hexcolor?: string): string => {
    if (!hexcolor) return 'hsl(var(--primary-foreground))';
    const r = parseInt(hexcolor.substring(1, 3), 16);
    const g = parseInt(hexcolor.substring(3, 5), 16);
    const b = parseInt(hexcolor.substring(5, 7), 16);
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return (yiq >= 128) ? 'hsl(240 2% 11%)' : 'hsl(0 0% 100%)';
}

export default function ProjectDetailsClient({ project: initialProject, users }: { project: Project; users: User[] }) {
    const { projects, saveProject, tasks: allTasks, saveTask, deleteTask, addPartToProject, commonTasks, commonDepartments, saveCommonDepartment, appConfig, areaColors, saveAreaColor } = useData();
    const [selectedPart, setSelectedPart] = useState<Part | null>(null);
    const { toast } = useToast();
    const router = useRouter();
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const [isTasksDialogOpen, setIsTasksDialogOpen] = useState(false);
    const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);

    const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
    const [isDescriptionModalOpen, setIsDescriptionModalOpen] = useState(false);
    const [taskForNotes, setTaskForNotes] = useState<Task | null>(null);
    const [taskForDescription, setTaskForDescription] = useState<Task | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const internalProject = useMemo(() => projects?.find(p => p.id === initialProject.id) || initialProject, [projects, initialProject]);
    const internalTasks = useMemo(() => allTasks?.filter(t => t.projectId === internalProject.id) || [], [allTasks, internalProject.id]);
    
    useEffect(() => {
        if (internalProject.parts && internalProject.parts.length > 0 && !selectedPart) {
            setSelectedPart(internalProject.parts[0]);
        }
        // If the selected part was deleted, select the first one again
        if (selectedPart && !internalProject.parts.find(p => p.id === selectedPart.id)) {
            setSelectedPart(internalProject.parts[0] || null);
        }
    }, [internalProject.parts, selectedPart]);
    
    useEffect(() => {
        const root = document.documentElement;
        if (internalProject.color) {
            const hslColor = hexToHSL(internalProject.color);
            if (hslColor) {
                const [h, s, l] = hslColor;
                root.style.setProperty('--primary', `${h} ${s} ${l}`);
                root.style.setProperty('--primary-foreground', getContrastingTextColor(internalProject.color));
                root.style.setProperty('--ring', `hsl(${h} ${s} ${l})`);
            }
        } else {
             // Revert to default primary color from globals.css
            root.style.removeProperty('--primary');
            root.style.removeProperty('--primary-foreground');
            root.style.removeProperty('--ring');
        }

        return () => {
             // Cleanup: Remount
            root.style.removeProperty('--primary');
            root.style.removeProperty('--primary-foreground');
            root.style.removeProperty('--ring');
        }
    }, [internalProject.color]);
    
    const [projectAlerts, setProjectAlerts] = useState<ProjectAlerts | undefined>(internalProject.alerts);

    useEffect(() => {
        // Recalculate alerts whenever tasks change
        const isDone = (task: Task) => task.status === 'finalizada';
        const hoy = new Date();
        const comienzoHoy = startOfDay(hoy);
        const finalManana = endOfDay(addDays(hoy, 1));

        const atrasadas = internalTasks.filter(t => {
            if (isDone(t) || !t.deadline) return false;
            return isBefore(new Date(t.deadline), comienzoHoy);
        });

        const proximas = internalTasks.filter(t => {
            if (isDone(t) || !t.deadline) return false;
            const deadlineDate = new Date(t.deadline);
            return deadlineDate >= comienzoHoy && deadlineDate <= finalManana;
        });

        const sinAsignar = internalTasks.filter(t => !t.assignedToId && !isDone(t));
        const bloqueadas = internalTasks.filter(t => t.blocked === true && !isDone(t));

        const newAlerts: ProjectAlerts = {
            ...(internalProject.alerts || { id: '', projectId: internalProject.id, createdAt: new Date().toISOString() }),
            counters: {
                atrasadas: atrasadas.length,
                proximas: proximas.length,
                sinAsignar: sinAsignar.length,
                bloqueadas: bloqueadas.length,
            },
            items: [
                ...atrasadas.map(t => ({ type: "ATRASADA", taskId: t.id } as AlertItem)),
                ...proximas.map(t => ({ type: "PROXIMA", taskId: t.id } as AlertItem)),
                ...sinAsignar.map(t => ({ type: "SIN_ASIGNAR", taskId: t.id } as AlertItem)),
                ...bloqueadas.map(t => ({ type: "BLOQUEADA", taskId: t.id } as AlertItem)),
            ]
        };

        if (JSON.stringify(newAlerts.counters) !== JSON.stringify(projectAlerts?.counters)) {
            setProjectAlerts(newAlerts);
        }

    }, [internalTasks, internalProject.id, internalProject.alerts, projectAlerts]);

    const handleOpenNotesModal = (task: Task) => {
        const latestTask = internalTasks.find(t => t.id === task.id) || task;
        setTaskForNotes(latestTask);
        setIsNotesModalOpen(true);
    };
    
    const handleOpenDescriptionModal = (task: Task) => {
        const latestTask = internalTasks.find(t => t.id === task.id) || task;
        setTaskForDescription(latestTask);
        setIsDescriptionModalOpen(true);
    };

    const handleTaskUpdate = async (updatedTaskData: Task | Omit<Task, 'id'>) => {
        await saveTask(updatedTaskData);
    };

    const handleSignTask = (task: Task, userId: string, workDescription: string, actualTime: number) => {
        const now = new Date().toISOString();
        const newSignature: Signature = { userId, date: now, workDescription };
        
        const updatedTask: Task = {
            ...task,
            status: 'finalizada',
            progress: 100,
            actualTime,
            finalizedByUserId: userId,
            finalizedAt: now,
            signatureHistory: [...(task.signatureHistory || []), newSignature],
        };
        handleTaskUpdate(updatedTask);
    };

    const handleUndoSignTask = (task: Task) => {
        const updatedTask: Task = {
            ...task,
            status: 'en-progreso',
            progress: 0,
            finalizedByUserId: undefined,
            finalizedAt: undefined,
        };
        handleTaskUpdate(updatedTask);
    };

    const handleTaskDelete = async (taskId: string) => {
        await deleteTask(taskId);
    };

    const handlePartSelect = (part: Part) => {
        setSelectedPart(part);
    };
    
    const handleCloseProject = async () => {
        await saveProject({ ...internalProject, status: 'cerrado' });
        toast({
            title: "Proyecto Cerrado",
            description: `El proyecto "${internalProject.name}" ha sido movido a los archivos.`,
        });
        router.push('/dashboard');
    }
    
    const handleAddNote = async (note: Omit<ProjectNote, 'id'>) => {
        const newNote = { ...note, id: crypto.randomUUID() };
        const updatedNotes = [...(internalProject.notes || []), newNote];
        const updatedProject = { ...internalProject, notes: updatedNotes };
        await saveProject(updatedProject);
    };

    const handleAddDepartment = async (partId: string, stageName: TaskComponent) => {
        const updatedParts = internalProject.parts.map(part => {
            if (part.id === partId) {
                if (part.stages.some(s => s.nombre.toLowerCase() === stageName.toLowerCase())) {
                    toast({
                        variant: 'destructive',
                        title: "Error",
                        description: `El área "${stageName}" ya existe en este parte.`,
                    });
                    return part;
                }
                const newStage = {
                    nombre: stageName,
                    estado: 'pendiente' as const,
                    responsableId: users.find(u => u.role === 'Oficina Técnica')?.id || users[0].id,
                    porcentaje: 0,
                };
                return { ...part, stages: [...part.stages, newStage] };
            }
            return part;
        });
        const updatedProject = { ...internalProject, parts: updatedParts };
        await saveProject(updatedProject);
    };
    
    const handleAddPart = async (partName?: string) => {
        const newPart = await addPartToProject(internalProject.id, partName);
        if (newPart) {
            setSelectedPart(newPart);
            toast({
                title: 'Parte Añadido',
                description: 'Se ha añadido un nuevo parte al proyecto. Ya puedes añadir áreas y tareas.',
            });
        }
    };

    const handlePartDelete = async (partId: string) => {
        const updatedParts = internalProject.parts.filter(p => p.id !== partId);
        const updatedProject = { ...internalProject, parts: updatedParts };
        await saveProject(updatedProject);

        if (selectedPart?.id === partId) {
            setSelectedPart(updatedParts.length > 0 ? updatedParts[0] : null);
        }

        toast({
            title: 'Parte Eliminado',
            description: 'El parte ha sido eliminado del proyecto.',
        });
    }

    const handleDepartmentDelete = async (partId: string, stageName: string) => {
        const updatedParts = internalProject.parts.map(part => {
            if (part.id === partId) {
                return { ...part, stages: part.stages.filter(s => s.nombre !== stageName) };
            }
            return part;
        });
        const updatedProject = { ...internalProject, parts: updatedParts };
        await saveProject(updatedProject);
    }

    const handleProjectFieldChange = async (projectData: Partial<Project>) => {
        const updatedProject = { ...internalProject, ...projectData };
        await saveProject(updatedProject);
        toast({
          title: 'Proyecto Actualizado',
          description: `Los detalles del proyecto se han actualizado.`,
        });
    };

    const handlePartNameChange = async (partId: string, newName: string) => {
        const updatedParts = internalProject.parts.map(part => 
            part.id === partId ? { ...part, name: newName } : part
        );
        const updatedProject = { ...internalProject, parts: updatedParts };
        await saveProject(updatedProject);
        toast({
            title: 'Parte Actualizado',
            description: `El nombre del parte se ha actualizado a "${newName}".`,
        });
    };
    
    const handleDepartmentNameChange = async (partId: string, oldStageName: string, newStageName: string) => {
        const updatedParts = internalProject.parts.map(part => {
            if (part.id === partId) {
                const stages = part.stages.map(stage =>
                    stage.nombre === oldStageName ? { ...stage, nombre: newStageName as TaskComponent } : stage
                );
                return { ...part, stages };
            }
            return part;
        });
        
        const tasksToUpdate = internalTasks.filter(task => task.partId === partId && task.component === oldStageName);
        for (const task of tasksToUpdate) {
            await saveTask({ ...task, component: newStageName as TaskComponent });
        }

        const updatedProject = { ...internalProject, parts: updatedParts };
        await saveProject(updatedProject);

        toast({
            title: 'Área Actualizada',
            description: `El nombre del área se ha actualizado a "${newStageName}".`,
        });
    };
    
    const handlePartOrderChange = async (newParts: Part[]) => {
        const updatedProject = { ...internalProject, parts: newParts };
        await saveProject(updatedProject);
    }

    const handleGeneratePdf = async (selection: PdfSelection) => {
        setIsGeneratingPdf(true);
        try {
            await generatePendingTasksPdf(internalProject, internalTasks, users, appConfig.logoUrl, areaColors, selection);
            toast({
                title: "PDF Generado",
                description: "El archivo de tareas pendientes se ha descargado.",
            });
        } catch (error) {
            console.error("Error generating PDF:", error);
            toast({
                variant: "destructive",
                title: "Error al generar PDF",
                description: "No se pudo crear el archivo. Revisa la consola para más detalles.",
            });
        } finally {
            setIsGeneratingPdf(false);
            setIsPdfModalOpen(false);
        }
    };

    const projectManager = useMemo(() => users.find(u => u.id === internalProject.projectManagerId), [users, internalProject.projectManagerId]);
    const managers = users;
    const pendingTasks = useMemo(() => internalTasks.filter(t => t.status !== 'finalizada').sort((a,b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime()), [internalTasks]);
    
    return (
        <div className="space-y-6">
            <Card onDoubleClick={() => setIsEditModalOpen(true)} className={cn("cursor-pointer bg-primary/5")}>
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div className="space-y-1">
                            <h1 className="font-headline text-3xl">{internalProject.name}</h1>
                             <div className="group flex items-center gap-2">
                                <p className="text-lg text-muted-foreground">{internalProject.client}</p>
                                <ProjectColorPicker project={internalProject} onColorChange={(color) => handleProjectFieldChange({ color })} triggerClassName='h-8 w-8' />
                            </div>
                        </div>
                         <div className="flex items-center gap-2">
                             <ProjectQRCode 
                                url={`https://studio--machinetrack-uauk1.us-central1.hosted.app/dashboard/projects/${internalProject.id}`}
                                title={`QR para ${internalProject.name}`}
                                description="Escanea para acceder directamente a la vista de este proyecto."
                            />
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setIsTasksDialogOpen(true)}
                            >
                                <ClipboardList className="mr-2 h-4 w-4" />
                                Tareas Pendientes
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setIsPdfModalOpen(true)}
                                disabled={isGeneratingPdf}
                            >
                                {isGeneratingPdf ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <FileDown className="mr-2 h-4 w-4" />
                                )}
                                PDF Tareas Pendientes
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => setIsEditModalOpen(true)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Editar Detalles
                            </Button>
                             {internalProject.status !== 'cerrado' && (
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="outline" size="sm">
                                            <Archive className="mr-2 h-4 w-4" />
                                            Cerrar Proyecto
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                        <AlertDialogTitle>¿Estás seguro de que quieres cerrar este proyecto?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Esta acción cambiará el estado del proyecto a "cerrado" y lo moverá al archivo.
                                            Podrás consultarlo más tarde, pero no aparecerá en la lista de proyectos activos.
                                        </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleCloseProject}>Sí, cerrar proyecto</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                             )}
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <ProjectAlerts 
                        alerts={projectAlerts} 
                        project={internalProject}
                        tasks={internalTasks}
                        users={users}
                    />
                     <div>
                        <div className="flex justify-between text-sm text-muted-foreground mb-1">
                            <span>Progreso Total</span>
                            <span>{internalProject.progress}%</span>
                        </div>
                        <Progress value={internalProject.progress} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-6 gap-4 text-sm">
                        <div className="flex items-center md:justify-center text-muted-foreground">
                            <CalendarIcon className="h-4 w-4 mr-2"/>
                            <span>Inicio: <ClientSideDate dateString={internalProject.startDate} /></span>
                        </div>
                        <div className="flex items-center md:justify-center text-muted-foreground">
                            <CheckCircle className="h-4 w-4 mr-2"/>
                            <span>Entrega: <ClientSideDate dateString={internalProject.deliveryDate} /></span>
                        </div>
                        <div className="flex items-center md:justify-center text-muted-foreground">
                            <Clock className="h-4 w-4 mr-2"/>
                            <span>H. Estimadas: <span className="font-medium text-foreground ml-1">{internalProject.totalEstimatedTime?.toFixed(1) || 0}h</span></span>
                        </div>
                        <div className="flex items-center md:justify-center text-muted-foreground">
                            <Clock className="h-4 w-4 mr-2"/>
                            <span>H. Reales: <span className="font-medium text-foreground ml-1">{internalProject.totalActualTime?.toFixed(1) || 0}h</span></span>
                        </div>
                        <div className="flex items-center md:justify-center text-muted-foreground">
                            <Timer className="h-4 w-4 mr-2"/>
                            <span>H. Pendientes: <span className="font-medium text-foreground ml-1">{internalProject.totalPendingEstimatedTime?.toFixed(1) || 0}h</span></span>
                        </div>
                         <div className="flex items-center md:justify-center text-muted-foreground group">
                            <UserSquare className="h-4 w-4 mr-2"/>
                            <span>Jefe de Proyecto:</span>
                            <span className="font-medium text-foreground ml-2">{projectManager?.name || 'No asignado'}</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            
            <PartsRoadmap 
                project={internalProject}
                tasks={internalTasks}
                onPartSelect={handlePartSelect}
                selectedPart={selectedPart}
                onPartNameChange={handlePartNameChange}
                onAddPart={() => handleAddPart()}
                onPartDelete={handlePartDelete}
                onPartOrderChange={handlePartOrderChange}
            />

            <Tabs defaultValue="tasks">
                <div className="flex items-center justify-between">
                    <TabsList>
                        <TabsTrigger value="tasks">Áreas</TabsTrigger>
                        <TabsTrigger value="notes">Notas</TabsTrigger>
                    </TabsList>
                    {selectedPart && (
                        <div className="text-sm font-medium text-muted-foreground">
                            Mostrando áreas para: <span className="font-bold text-foreground">{selectedPart.name}</span>
                        </div>
                    )}
                </div>
                <TabsContent value="tasks" className="mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                    <TasksByComponent 
                        tasks={internalTasks.filter(t => t.partId === selectedPart?.id)} 
                        users={users} 
                        project={internalProject}
                        commonTasks={commonTasks || []}
                        commonDepartments={commonDepartments || []}
                        onTaskUpdate={handleTaskUpdate} 
                        onTaskDelete={handleTaskDelete}
                        onSignTask={handleSignTask}
                        onUndoSignTask={handleUndoSignTask}
                        selectedPart={selectedPart}
                        onDepartmentAdd={handleAddDepartment}
                        onDepartmentDelete={handleDepartmentDelete}
                        onDepartmentNameChange={handleDepartmentNameChange}
                        openNotesModal={handleOpenNotesModal}
                        openDescriptionModal={handleOpenDescriptionModal}
                        onSaveCommonDepartment={saveCommonDepartment}
                        />
                </TabsContent>
                <TabsContent value="notes">
                    <ProjectNotes 
                        initialNotes={internalProject.notes || []} 
                        users={users} 
                        projectId={internalProject.id} 
                        onNoteAdd={handleAddNote}
                    />
                </TabsContent>
            </Tabs>
            
             {taskForNotes && (
                 <TaskNotesModal
                    isOpen={isNotesModalOpen}
                    onClose={() => setIsNotesModalOpen(false)}
                    task={taskForNotes}
                    users={users}
                    onTaskUpdate={handleTaskUpdate}
                />
             )}
              {taskForDescription && (
                 <TaskDescriptionModal
                    isOpen={isDescriptionModalOpen}
                    onClose={() => setIsDescriptionModalOpen(false)}
                    task={taskForDescription}
                    onTaskUpdate={handleTaskUpdate}
                />
             )}
            <ProjectEditModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                project={internalProject}
                onSave={handleProjectFieldChange}
                users={users}
            />
             <PdfOptionsModal
                isOpen={isPdfModalOpen}
                onClose={() => setIsPdfModalOpen(false)}
                project={internalProject}
                tasks={internalTasks}
                onGenerate={handleGeneratePdf}
                isGenerating={isGeneratingPdf}
            />
            <AlertDialog open={isTasksDialogOpen} onOpenChange={setIsTasksDialogOpen}>
                <AlertDialogContent className="sm:max-w-2xl">
                    <AlertDialogHeader>
                    <AlertDialogTitle>Tareas Pendientes</AlertDialogTitle>
                    <AlertDialogDescription>
                        Listado de todas las tareas pendientes para el proyecto <strong>{internalProject.name}</strong>, ordenadas por fecha de entrega.
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="max-h-[60vh] overflow-y-auto p-1 space-y-4">
                        <div className="space-y-2">
                            {pendingTasks.map(task => (
                                <div key={task.id} className="flex justify-between items-center text-sm p-2 bg-background rounded-md border">
                                    <div>
                                        <p className="font-medium">{task.title}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {users.find(u => u.id === task.assignedToId)?.name || 'Sin asignar'}
                                            {' - '}
                                            <span className="font-semibold">{internalProject.parts.find(p => p.id === task.partId)?.name} / {task.component}</span>
                                        </p>
                                    </div>
                                    <DeadlineBadge deadline={task.deadline} />
                                </div>
                            ))}
                        </div>
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogAction onClick={() => setIsTasksDialogOpen(false)}>Entendido</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
