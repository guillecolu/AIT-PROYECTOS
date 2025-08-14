

'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CalendarIcon, UsersIcon, CheckCircle, Wrench, Zap, Code, Factory, PlusCircle, MoreHorizontal, Pencil, Trash2, UserSquare, XCircle, PenSquare, Edit, Archive, FolderPlus, ChevronDown, Palette, History, MessageSquare, Save, Paperclip, FileDown, Loader2, BrainCircuit } from 'lucide-react';
import type { TaskComponent, Task, User, Project, ProjectNote, TaskStatus, Part, Signature, TaskComment, CommonTask, Attachment } from '@/lib/types';
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
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useData } from '@/hooks/use-data';
import PartsRoadmap from './parts-roadmap';
import { Input } from '../ui/input';
import EditableField from '../ui/editable-field';
import ProjectColorPicker from './project-color-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import ProjectEditModal from './project-edit-modal';
import { generatePendingTasksPdf } from '@/lib/pdf-generator';
import ProjectFiles from './project-files';
import ProjectAlerts from './project-alerts';
import { generateDailySummary } from '@/ai/flows/generate-daily-summary';
import type { DailySummaryOutput } from '@/ai/flows/generate-daily-summary.types';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';


const componentIcons: Record<TaskComponent, React.ReactNode> = {
    'Estructura': <Wrench className="h-4 w-4 mr-2" />,
    'Cableado': <Zap className="h-4 w-4 mr-2" />,
    'Programación': <Code className="h-4 w-4 mr-2" />,
    'Ensamblaje': <Factory className="h-4 w-4 mr-2" />,
    'Diseño': <Wrench className="h-4 w-4 mr-2" />,
    'Corte': <Zap className="h-4 w-4 mr-2" />,
    'Soldadura': <Code className="h-4 w-4 mr-2" />,
    'Montaje': <Factory className="h-4 w-4 mr-2" />,
    'Pruebas': <CheckCircle className="h-4 w-4 mr-2" />,
}

const statusColorClasses: Record<TaskStatus, string> = {
    pendiente: 'bg-yellow-100 text-yellow-800',
    'en-progreso': 'bg-blue-100 text-blue-800',
    'para-soldar': 'bg-orange-100 text-orange-800',
    montada: 'bg-purple-100 text-purple-800',
    finalizada: 'bg-green-100 text-green-800',
};

const ClientSideDate = ({ dateString, format = 'dd/MM/yyyy' }: { dateString: string, format?: 'dd/MM/yyyy' | 'PPpp' }) => {
    const [formattedDate, setFormattedDate] = useState('');
    const { format: formatDate, es } = require('date-fns');

    useEffect(() => {
        setFormattedDate(formatDate(new Date(dateString), format, { locale: es }));
    }, [dateString, format, formatDate, es]);

    return <>{formattedDate}</>;
};

function SignatureHistory({ history, users }: { history: Signature[], users: User[] }) {
    const getUserName = (id?: string) => users.find(u => u.id === id)?.name || 'Desconocido';
    
    if (!history || history.length === 0) {
        return null;
    }

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                    <History className="h-4 w-4 text-muted-foreground" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
                <div className="grid gap-4">
                <div className="space-y-2">
                    <h4 className="font-medium leading-none">Historial de Firmas</h4>
                    <p className="text-sm text-muted-foreground">
                    Registro de todas las veces que esta tarea ha sido marcada como finalizada.
                    </p>
                </div>
                <div className="grid gap-2">
                   {history.map((sig, index) => (
                     <div key={index} className="grid grid-cols-[auto_1fr] items-center gap-x-4">
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">{index + 1}.</span>
                        </div>
                        <div className="text-sm">
                            <span className="font-semibold">{getUserName(sig.userId)}</span>
                            <div className="text-xs text-muted-foreground">
                                <ClientSideDate dateString={sig.date} format="PPpp" />
                            </div>
                        </div>
                    </div>
                   ))}
                </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}


function TasksByComponent({ tasks, users, project, commonTasks, commonDepartments, onTaskUpdate, onTaskDelete, selectedPart, onDepartmentAdd, onDepartmentDelete, onDepartmentNameChange, openNotesModal, openDescriptionModal, onSignTask, onUndoSignTask, onSaveCommonDepartment }: { tasks: Task[], users: User[], project: Project, commonTasks: any[], commonDepartments: string[], onTaskUpdate: (task: Task | Omit<Task, 'id'>) => void, onTaskDelete: (taskId: string) => void, selectedPart: Part | null, onDepartmentAdd: (partId: string, stageName: TaskComponent) => void, onDepartmentDelete: (partId: string, stageName: string) => void, onDepartmentNameChange: (partId: string, oldStageName: string, newStageName: string) => void, openNotesModal: (task: Task) => void, openDescriptionModal: (task: Task) => void, onSignTask: (task: Task, userId: string) => void, onUndoSignTask: (task: Task) => void, onSaveCommonDepartment: (name: string) => void }) {
    
    const getUserName = (id?: string) => users.find(u => u.id === id)?.name || 'Sin asignar';
    
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [componentForNewTask, setComponentForNewTask] = useState<TaskComponent | null>(null);
    const [newStageName, setNewStageName] = useState("");
    const [prefillData, setPrefillData] = useState<Partial<Task> | undefined>(undefined);

    const [newCommonDept, setNewCommonDept] = useState("");
    const { toast } = useToast();
    const { projects } = useData();

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
        const defaultStages: TaskComponent[] = ['Diseño', 'Soldadura', 'Montaje', 'Pruebas'];
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

    const partStages = project.parts.find(p => p.id === selectedPart.id)?.stages || [];
    const partTasks = tasks.filter(t => t.partId === selectedPart.id);
    

    return (
        <div className="space-y-6">
            <div className="space-y-8">
                {partStages.map(stage => {
                    const stageTasks = partTasks.filter(t => t.component === stage.nombre);
                    return (
                        <div key={stage.nombre}>
                             <div className="flex items-center justify-between mb-2">
                                <div className="group flex items-center gap-2">
                                     <h3 className="font-semibold text-lg flex items-center capitalize">
                                        {componentIcons[stage.nombre as TaskComponent] || <Wrench className="h-4 w-4 mr-2" />}
                                        <EditableField
                                            initialValue={stage.nombre}
                                            onSave={(newName) => onDepartmentNameChange(selectedPart!.id, stage.nombre, newName)}
                                            label="Nombre del Área"
                                        />
                                    </h3>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100" onClick={() => onDepartmentDelete(selectedPart!.id, stage.nombre)}>
                                        <Trash2 className="h-4 w-4 text-destructive/70 hover:text-destructive" />
                                    </Button>
                                </div>
                            </div>
                             <div className="flex justify-start mb-4 gap-2">
                                <Button variant="outline" size="sm" onClick={() => handleOpenModalForNew(stage.nombre as TaskComponent)}>
                                    <PlusCircle className="mr-2 h-4 w-4" />
                                    Añadir Tarea
                                </Button>
                            </div>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Tarea</TableHead>
                                        <TableHead>Asignado a</TableHead>
                                        <TableHead>Estado</TableHead>
                                        <TableHead>Entrega</TableHead>
                                        <TableHead>Tiempo (Est/Real)</TableHead>
                                        <TableHead>Acciones</TableHead>
                                        <TableHead className="w-[50px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {stageTasks.map(task => (
                                        <TableRow key={task.id} onDoubleClick={() => handleOpenModalForEdit(task)} className="cursor-pointer">
                                            <TableCell>{task.title}</TableCell>
                                            <TableCell>{getUserName(task.assignedToId)}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    {task.status === 'finalizada' ? (
                                                        <>
                                                            <div className="flex items-center text-xs text-green-700 font-medium">
                                                                <PenSquare className="h-4 w-4 mr-2 flex-shrink-0" />
                                                                <div>
                                                                    <div>Firmado por {getUserName(task.finalizedByUserId)}</div>
                                                                    {task.finalizedAt && <div className="text-muted-foreground font-normal"><ClientSideDate dateString={task.finalizedAt} /></div>}
                                                                </div>
                                                            </div>
                                                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onUndoSignTask(task)}>
                                                                <XCircle className="h-4 w-4 text-muted-foreground" />
                                                            </Button>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button variant="outline" size="sm">
                                                                        <Edit className="h-3 w-3 mr-1.5" />
                                                                        Firmar
                                                                    </Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="start">
                                                                    <DropdownMenuLabel>Seleccionar responsable</DropdownMenuLabel>
                                                                    <DropdownMenuSeparator />
                                                                    {users.map(user => (
                                                                        <DropdownMenuItem key={user.id} onSelect={() => onSignTask(task, user.id)}>
                                                                            <Avatar className="w-5 h-5 mr-2">
                                                                                <AvatarImage src={user.avatar} />
                                                                                <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                                                                            </Avatar>
                                                                            <span>{user.name}</span>
                                                                        </DropdownMenuItem>
                                                                    ))}
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                            <Badge className={cn("capitalize border-0", statusColorClasses[task.status])}>
                                                                {task.status.replace('-', ' ')}
                                                            </Badge>
                                                        </>
                                                    )}
                                                     <SignatureHistory history={task.signatureHistory || []} users={users} />
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <ClientSideDate dateString={task.deadline} />
                                            </TableCell>
                                            <TableCell>{task.estimatedTime}h / {task.actualTime > 0 ? `${task.actualTime}h` : '-'}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Button variant="outline" size="sm" onClick={() => openDescriptionModal(task)}>
                                                        Descripción
                                                    </Button>
                                                    <Button variant="outline" size="sm" onClick={() => openNotesModal(task)}>
                                                        Notas ({task.comments?.length || 0})
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
                                    {stageTasks.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={8} className="text-center text-muted-foreground py-10">
                                                Aún no hay tareas para esta área.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )
                })}

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
                                    <DropdownMenuItem key={stage} onSelect={() => onDepartmentAdd(selectedPart.id, stage)}>
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

export default function ProjectDetailsClient({ project: initialProject, tasks: initialTasks, users }: { project: Project, tasks: Task[], users: User[] }) {
    const { saveProject, saveTask, deleteTask, addPartToProject, addAttachmentToPart, deleteAttachmentFromPart, commonTasks, commonDepartments, saveCommonDepartment, projects, appConfig } = useData();
    const [selectedPart, setSelectedPart] = useState<Part | null>(null);
    const { toast } = useToast();
    const router = useRouter();
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
    const [summaryContent, setSummaryContent] = useState<DailySummaryOutput | null>(null);
    const [isSummaryDialogOpen, setIsSummaryDialogOpen] = useState(false);

    const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
    const [isDescriptionModalOpen, setIsDescriptionModalOpen] = useState(false);
    const [taskForNotes, setTaskForNotes] = useState<Task | null>(null);
    const [taskForDescription, setTaskForDescription] = useState<Task | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    // Use internal state to manage optimistic updates for project and tasks
    const [internalProject, setInternalProject] = useState(initialProject);
    const [internalTasks, setInternalTasks] = useState(initialTasks);

     useEffect(() => {
        setInternalProject(initialProject);
    }, [initialProject]);

    useEffect(() => {
        setInternalTasks(initialTasks);
    }, [initialTasks]);

    useEffect(() => {
        if (internalProject.parts && internalProject.parts.length > 0 && !selectedPart) {
            setSelectedPart(internalProject.parts[0]);
        }
        // If the selected part was deleted, select the first one again
        if (selectedPart && !internalProject.parts.find(p => p.id === selectedPart.id)) {
            setSelectedPart(internalProject.parts[0] || null);
        }
    }, [internalProject, selectedPart]);
    
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

    const handleOpenNotesModal = (task: Task) => {
        // Ensure we have the latest version of the task
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
        if ('id' in updatedTaskData) {
            setInternalTasks(prevTasks => prevTasks.map(t => t.id === updatedTaskData.id ? { ...t, ...updatedTaskData } : t));
        } else {
            const newTask = { ...updatedTaskData, id: crypto.randomUUID() } as Task;
            setInternalTasks(prevTasks => [...prevTasks, newTask]);
        }
        
        await saveTask(updatedTaskData);
        
        // This will trigger a re-fetch or re-calculation in useData hook
        const latestProjectState = projects.find(p => p.id === initialProject.id);
        if (latestProjectState) {
          setInternalProject(latestProjectState);
        }
    };

    const handleSignTask = (task: Task, userId: string) => {
        const now = new Date().toISOString();
        const newSignature = { userId, date: now };
        
        const updatedTask: Task = {
            ...task,
            status: 'finalizada',
            progress: 100, // Signing a task marks it as 100% complete
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
            progress: 90, // Revert progress to a high-value, but not 100
            finalizedByUserId: undefined,
            finalizedAt: undefined,
        };
        handleTaskUpdate(updatedTask);
    };

    const handleTaskDelete = async (taskId: string) => {
        setInternalTasks(prevTasks => prevTasks.filter(t => t.id !== taskId));
        await deleteTask(taskId);
        // This will trigger a re-fetch or re-calculation in useData hook
        const latestProjectState = projects.find(p => p.id === initialProject.id);
        if (latestProjectState) {
          setInternalProject(latestProjectState);
        }
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
        setInternalProject(updatedProject); // Optimistic update
        await saveProject(updatedProject);
    }

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
        setInternalProject(updatedProject); // Optimistic update
        await saveProject(updatedProject);
    };
    
    const handleAddPart = async (partName?: string) => {
        const newPart = await addPartToProject(internalProject.id, partName);
        if (newPart) {
            const updatedProject = { ...internalProject, parts: [...internalProject.parts, newPart] };
            setInternalProject(updatedProject);
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
        setInternalProject(updatedProject); // Optimistic update
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
        setInternalProject(updatedProject); // Optimistic update
        await saveProject(updatedProject);
    }

    const handleProjectFieldChange = async (projectData: Partial<Project>) => {
        const updatedProject = { ...internalProject, ...projectData };
        setInternalProject(updatedProject); // Optimistic update
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
        setInternalProject(updatedProject); // Optimistic update
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
        setInternalProject(updatedProject); // Optimistic update
        await saveProject(updatedProject);

        toast({
            title: 'Área Actualizada',
            description: `El nombre del área se ha actualizado a "${newName}".`,
        });
    };
    
    const handlePartOrderChange = async (newParts: Part[]) => {
        const updatedProject = { ...internalProject, parts: newParts };
        setInternalProject(updatedProject);
        await saveProject(updatedProject);
    }

    const handleGeneratePdf = async () => {
        setIsGeneratingPdf(true);
        try {
            await generatePendingTasksPdf(internalProject, internalTasks, users, appConfig.logoUrl);
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
        }
    };

    const handleGenerateDailySummary = async () => {
        setIsGeneratingSummary(true);
        try {
            const pendingTasks = internalTasks.filter(t => t.status !== 'finalizada');
            const tasksForSummary = pendingTasks.map(t => ({
                title: t.title,
                status: t.status,
                deadline: t.deadline,
                assignedToName: users.find(u => u.id === t.assignedToId)?.name || 'Sin asignar',
                priority: t.priority
            }));

            const result = await generateDailySummary({
                projectName: internalProject.name,
                tasks: tasksForSummary,
            });

            setSummaryContent(result);
            setIsSummaryDialogOpen(true);

        } catch (error) {
            console.error("Error generating daily summary:", error);
            toast({
                variant: "destructive",
                title: "Error al generar Resumen",
                description: "No se pudo crear el resumen. Inténtalo de nuevo.",
            });
        } finally {
            setIsGeneratingSummary(false);
        }
    };
    
    const handleFileUploaded = async (partId: string, file: File) => {
        await addAttachmentToPart(internalProject.id, partId, file);
        // The useData hook will update the state, which will cause a re-render
    };

    const handleFileDeleted = async (partId: string, attachmentId: string) => {
        await deleteAttachmentFromPart(internalProject.id, partId, attachmentId);
    };

    const projectManager = useMemo(() => users.find(u => u.id === internalProject.projectManagerId), [users, internalProject.projectManagerId]);
    const managers = users.filter(u => u.role === 'Oficina Técnica');
    const pendingTasksCount = useMemo(() => internalTasks.filter(t => t.status !== 'finalizada').length, [internalTasks]);
    
    return (
        <div className="space-y-6">
            <Card onDoubleClick={() => setIsEditModalOpen(true)} className={cn("cursor-pointer bg-primary/5")}>
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div className="space-y-1">
                            <div className="group flex items-center gap-2">
                                <h1 className="font-headline text-3xl">{internalProject.name}</h1>
                                <ProjectColorPicker project={internalProject} onColorChange={(color) => handleProjectFieldChange({ color })} triggerClassName='h-8 w-8' />
                             </div>
                             <div className="group flex items-center gap-2">
                                <p className="text-lg text-muted-foreground">{internalProject.client}</p>
                            </div>
                        </div>
                         <div className="flex items-center gap-2">
                             <Button onClick={handleGenerateDailySummary} disabled={isGeneratingSummary}>
                                {isGeneratingSummary ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BrainCircuit className="mr-2 h-4 w-4" />}
                                Resumen Diario
                            </Button>
                             <Button onClick={handleGeneratePdf} disabled={isGeneratingPdf}>
                                {isGeneratingPdf ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileDown className="mr-2 h-4 w-4" />}
                                PDF Tareas Pendientes
                                <Badge variant="secondary" className="ml-2">{pendingTasksCount}</Badge>
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
                    <ProjectAlerts alerts={internalProject.alerts} />
                     <div>
                        <div className="flex justify-between text-sm text-muted-foreground mb-1">
                            <span>Progreso Total</span>
                            <span>{internalProject.progress}%</span>
                        </div>
                        <Progress value={internalProject.progress} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center md:justify-center text-muted-foreground">
                            <CalendarIcon className="h-4 w-4 mr-2"/>
                            <span>Inicio: {internalProject.startDate ? <ClientSideDate dateString={internalProject.startDate} /> : ''}</span>
                        </div>
                        <div className="flex items-center md:justify-center text-muted-foreground">
                            <CheckCircle className="h-4 w-4 mr-2"/>
                            <span>Entrega: {internalProject.deliveryDate ? <ClientSideDate dateString={internalProject.deliveryDate} /> : ''}</span>
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
                        <TabsTrigger value="files">Archivos</TabsTrigger>
                    </TabsList>
                     {selectedPart && (
                        <div className="text-sm font-medium text-muted-foreground">
                            Mostrando áreas para: <span className="font-bold text-foreground">{selectedPart.name}</span>
                        </div>
                    )}
                </div>
                <TabsContent value="tasks">
                    <Card>
                        <CardContent className="p-6">
                            <TasksByComponent 
                                tasks={internalTasks.filter(t => t.partId === selectedPart?.id)} 
                                users={users} 
                                project={internalProject}
                                commonTasks={commonTasks}
                                commonDepartments={commonDepartments}
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
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="notes">
                     <ProjectNotes 
                        initialNotes={internalProject.notes || []} 
                        users={users} 
                        projectId={internalProject.id} 
                        onNoteAdd={handleAddNote}
                     />
                </TabsContent>
                <TabsContent value="files">
                    <ProjectFiles 
                        project={internalProject}
                        selectedPart={selectedPart}
                        onFileUpload={handleFileUploaded}
                        onFileDelete={handleFileDeleted}
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
            <AlertDialog open={isSummaryDialogOpen} onOpenChange={setIsSummaryDialogOpen}>
                <AlertDialogContent className="sm:max-w-2xl">
                    <AlertDialogHeader>
                    <AlertDialogTitle>Resumen Diario</AlertDialogTitle>
                    <AlertDialogDescription>
                        Estas son las recomendaciones y prioridades para el proyecto <strong>{internalProject.name}</strong> para hoy.
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="max-h-[60vh] overflow-y-auto p-1 space-y-4">
                        <div className="p-4 bg-muted/50 rounded-md text-sm whitespace-pre-wrap">
                            {summaryContent?.summary}
                        </div>
                        <Accordion type="single" collapsible>
                            <AccordionItem value="pending-tasks">
                                <AccordionTrigger>Ver Tareas Pendientes</AccordionTrigger>
                                <AccordionContent>
                                    <div className="space-y-2">
                                        {internalTasks
                                            .filter(t => t.status !== 'finalizada')
                                            .sort((a,b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
                                            .map(task => (
                                            <div key={task.id} className="flex justify-between items-center text-sm p-2 bg-background rounded-md">
                                                <div>
                                                    <p className="font-medium">{task.title}</p>
                                                    <p className="text-xs text-muted-foreground">{users.find(u => u.id === task.assignedToId)?.name || 'Sin asignar'}</p>
                                                </div>
                                                <Badge variant="outline"><ClientSideDate dateString={task.deadline} /></Badge>
                                            </div>
                                        ))}
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    </div>
                    <AlertDialogFooter>
                    <AlertDialogAction onClick={() => setIsSummaryDialogOpen(false)}>Entendido</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
