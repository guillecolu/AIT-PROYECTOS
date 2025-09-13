

'use client';

import { useState, useMemo, useEffect, ChangeEvent, useRef } from 'react';
import type { User, Project, Task, TaskStatus, TaskPriority, UserRole, CommonTask, Signature } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertTriangle, ChevronsUpDown, PlusCircle, Trash2, UserPlus, Briefcase, Zap, Cog, Building, UserCheck, Pencil, GripVertical, Loader2, Edit, PenSquare, XCircle, History, CalendarDays, Undo2, FileDown, QrCode } from 'lucide-react';
import { cn } from '@/lib/utils';
import TaskFormModal from '@/components/projects/task-form-modal';
import UserFormModal from './user-form-modal';
import { useData } from '@/hooks/use-data';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import TaskDescriptionModal from '@/components/projects/task-description-modal';
import { differenceInCalendarDays, isPast, isToday, isTomorrow, isAfter, startOfDay, endOfDay, addDays, getDay, subDays, format, getWeek, addWeeks, startOfWeek, Day } from 'date-fns';
import { es } from 'date-fns/locale';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import TaskSignatureModal from '@/components/projects/task-signature-modal';
import { Progress } from '../ui/progress';
import UserPdfOptionsModal from './user-pdf-options-modal';
import { generateUserTasksPdf } from '@/lib/pdf-generator';
import { useToast } from '@/hooks/use-toast';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import SignatureHistory from '../projects/signature-history';


interface TeamTasksClientProps {}

const getWorkloadStatus = (tasks: Task[]) => {
    const hasDelayed = tasks.some(t => new Date(t.deadline) < new Date() && t.status !== 'finalizada');
    if (hasDelayed) return 'retrasado';
    return 'en-tiempo';
}

const statusBadgeClasses: Record<ReturnType<typeof getWorkloadStatus>, string> = {
    'retrasado': 'bg-red-100 text-red-700',
    'en-tiempo': 'bg-green-100 text-green-700',
};

const statusDotClasses: Record<ReturnType<typeof getWorkloadStatus>, string> = {
    'retrasado': 'bg-red-500',
    'en-tiempo': 'bg-green-500',
};

const taskStatusBadgeClasses: Record<TaskStatus, string> = {
    'en-progreso': 'bg-status-in-process text-blue-800',
    'pendiente': 'bg-status-pending text-yellow-800',
    'finalizada': 'bg-status-complete text-green-800',
    'montada': 'bg-purple-100 text-purple-800',
    'para-soldar': 'bg-orange-100 text-orange-800',
}

const priorityOrder: Record<TaskPriority, number> = {
    'Alta': 3,
    'Media': 2,
    'Baja': 1,
};

const categoryIcons: Record<string, React.ReactNode> = {
    'Admin': <UserCheck className="h-5 w-5" />,
    'Manager': <UserCheck className="h-5 w-5" />,
    'Oficina Técnica': <Cog className="h-5 w-5" />,
    'Taller': <Briefcase className="h-5 w-5" />,
    'Eléctrico': <Zap className="h-5 w-5" />,
    'Comercial': <Building className="h-5 w-5" />,
    'Dirección de Proyecto': <UserCheck className="h-5 w-5" />,
    'Dirección de Área': <UserCheck className="h-5 w-5" />,
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


const SortableUserItem = ({ user, tasks, isSelected, onSelect, onEdit, onDelete, itemRef }: { user: User, tasks: Task[], isSelected: boolean, onSelect: (user: User) => void, onEdit: (user: User) => void, onDelete: (user: User) => void, itemRef: (node: HTMLDivElement | null) => void }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: user.id });

    const style = {
        transform: transform ? CSS.Transform.toString(transform) : undefined,
        transition: transform !== null ? transition : 'none',
    };
    
    const userTasks = tasks.filter(t => t.assignedToId === user.id);
    const workloadStatus = getWorkloadStatus(userTasks);
    const hasUrgentTask = userTasks.some(t => t.isUrgent);
    
    const combinedRef = (node: HTMLDivElement | null) => {
        setNodeRef(node);
        itemRef(node);
    };


    return (
        <div ref={combinedRef} style={style} className="relative group rounded-md touch-none">
             <div
                onClick={() => onSelect(user)}
                className={cn(
                    "flex items-center gap-3 p-2 text-left w-full hover:bg-accent transition-colors rounded-md",
                    isSelected && "bg-accent"
                )}
            >
                <div {...attributes} {...listeners} className="cursor-grab p-1">
                    <GripVertical className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1">
                    <p className="font-medium text-sm flex items-center gap-2">
                        {user.name}
                        {hasUrgentTask && <AlertTriangle className="h-4 w-4 text-destructive" />}
                    </p>
                    <Badge variant="outline" className={cn("text-xs font-semibold capitalize border-none px-2 py-0.5 mt-1 inline-flex items-center gap-2", statusBadgeClasses[workloadStatus])}>
                         <div className={cn("h-1.5 w-1.5 rounded-full", statusDotClasses[workloadStatus])}></div>
                        {workloadStatus === 'retrasado' ? 'Con Retraso' : 'En Tiempo'}
                    </Badge>
                </div>
            </div>
             <div className="absolute top-1/2 right-1 -translate-y-1/2 flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(user)}>
                    <Pencil className="h-4 w-4 text-muted-foreground" />
                </Button>
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                         <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); }}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>¿Estás seguro de que quieres eliminar a este usuario?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Esta acción es permanente. Las tareas asignadas a {user.name} quedarán sin asignar.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => onDelete(user)}>Sí, eliminar</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
             </div>
        </div>
    );
};


type SortKey = 'title' | 'projectName' | 'partName' | 'startDate' | 'estimatedTime' | 'deadline' | 'priority';
type SortDirection = 'asc' | 'desc';
type WorkloadSortKey = 'user' | 'pendingHours' | 'totalRealHours';
type ViewMode = 'delayed' | number;


export default function TeamTasksClient(props: TeamTasksClientProps) {
    const { users, setUsers, projects, tasks, saveTask, saveUser, deleteUser, loading, userRoles, commonTasks, appConfig } = useData();
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [userToDelete, setUserToDelete] = useState<User | null>(null);
    const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection } | null>(null);
    const [workloadSortConfig, setWorkloadSortConfig] = useState<{ key: WorkloadSortKey; direction: SortDirection } | null>({ key: 'totalRealHours', direction: 'desc' });
    const [isDescriptionModalOpen, setIsDescriptionModalOpen] = useState(false);
    const [taskForDescription, setTaskForDescription] = useState<Task | null>(null);
    const [taskToSign, setTaskToSign] = useState<Task | null>(null);
    const [selectedView, setSelectedView] = useState<ViewMode>(0);
    const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const { toast } = useToast();
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const router = useRouter();
    const userItemRefs = useRef<Map<string, HTMLDivElement | null>>(new Map());

    const handleSetSelectedUser = (user: User | null) => {
        setSelectedUser(user);
        const params = new URLSearchParams(searchParams.toString());
        if (user) {
            params.set('userId', user.id);
        } else {
            params.delete('userId');
        }
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
    };

    useEffect(() => {
        if (loading) return;
        const userIdFromUrl = searchParams.get('userId');
        if (userIdFromUrl) {
            if (selectedUser?.id !== userIdFromUrl) {
                const userToSelect = users?.find(u => u.id === userIdFromUrl);
                if (userToSelect) {
                    setSelectedUser(userToSelect);
                }
            }
        } else {
            // If there's no userId in the URL, but a user is selected, deselect them.
            // This happens when the user manually removes the query param or clicks a link to the base page.
            if (selectedUser) {
                setSelectedUser(null);
            }
        }
    }, [searchParams, users, loading, selectedUser]);


    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );
    
    const getProjectName = (projectId: string) => projects?.find(p => p.id === projectId)?.name || 'N/A';
    const getPartName = (projectId: string, partId: string) => projects?.find(p => p.id === projectId)?.parts.find(p => p.id === partId)?.name || 'N/A';
    
    const { pendingTasks, completedTasks } = useMemo(() => {
        if (!selectedUser || !tasks) return { pendingTasks: [], completedTasks: [] };
        
        let userTasks = tasks.filter(task => task.assignedToId === selectedUser.id);
        
        let pending = userTasks.filter(t => t.status !== 'finalizada');
        const completed = userTasks.filter(t => t.status === 'finalizada').sort((a,b) => new Date(b.finalizedAt!).getTime() - new Date(a.finalizedAt!).getTime());

        if (sortConfig) {
            pending.sort((a, b) => {
                let aValue: any;
                let bValue: any;

                if (sortConfig.key === 'projectName') {
                    aValue = getProjectName(a.projectId);
                    bValue = getProjectName(b.projectId);
                } else if (sortConfig.key === 'partName') {
                    aValue = getPartName(a.projectId, a.partId);
                    bValue = getPartName(b.projectId, b.partId);
                } else if (sortConfig.key === 'priority') {
                    aValue = priorityOrder[a.priority];
                } else {
                    aValue = a[sortConfig.key as keyof Task];
                    bValue = b[sortConfig.key as keyof Task];
                }
                
                if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return { pendingTasks: pending, completedTasks: completed };
    }, [tasks, selectedUser, sortConfig, projects]);
    
    const handleSaveTask = async (taskData: Omit<Task, 'id'> | Task) => {
        await saveTask(taskData);
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
        handleSaveTask(updatedTask);
        setTaskToSign(null);
    };

    const handleUndoSignTask = (task: Task) => {
        const updatedTask: Task = {
            ...task,
            status: 'en-progreso',
            progress: 0,
            finalizedByUserId: undefined,
            finalizedAt: undefined,
        };
        handleSaveTask(updatedTask);
    };
    
    const handleSaveUser = async (userData: Omit<User, 'id'> | User) => {
        if ('id' in userData) {
            await saveUser(userData);
        } else {
            const newUser: Omit<User, 'id'> = {
                ...userData,
                avatar: `https://placehold.co/100x100.png`,
                assignedProjectIds: [],
            };
            const savedUser = await saveUser(newUser);
            handleSetSelectedUser(savedUser); // Select the new user
        }
    }
    
     const handleDeleteUser = async () => {
        if (!userToDelete || !users) return;
        
        await deleteUser(userToDelete.id);
        
        setUserToDelete(null);

        if (selectedUser?.id === userToDelete.id) {
            const newUsers = users.filter(u => u.id !== userToDelete.id);
            handleSetSelectedUser(newUsers.length > 0 ? newUsers.find(u => u.role === 'Oficina Técnica') || newUsers[0] : null);
        }
    };

    const handleOpenUserModal = (user: User | null) => {
        setEditingUser(user);
        setIsUserModalOpen(true);
    }

    const toggleTaskUrgency = async (task: Task) => {
        await saveTask({ ...task, isUrgent: !task.isUrgent });
    };
    
    const handleSort = (key: SortKey) => {
        let direction: SortDirection = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const handleWorkloadSort = (key: WorkloadSortKey) => {
        let direction: SortDirection = 'asc';
        if (workloadSortConfig && workloadSortConfig.key === key && workloadSortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setWorkloadSortConfig({ key, direction });
    };

    const selectedUserProjects = useMemo(() => {
        if (!selectedUser || !projects) return [];
        return projects.filter(p => selectedUser.assignedProjectIds.includes(p.id));
    }, [projects, selectedUser]);
    
    const handleOpenDescriptionModal = (task: Task) => {
        const latestTask = tasks?.find(t => t.id === task.id) || task;
        setTaskForDescription(latestTask);
        setIsDescriptionModalOpen(true);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id && users) {
            setUsers((items) => {
                if (!items) return null;
                const oldIndex = items.findIndex((item) => item.id === active.id);
                const newIndex = items.findIndex((item) => item.id === over.id);
                const newOrder = arrayMove(items, oldIndex, newIndex);

                // Update order property and save to db
                newOrder.forEach((user, index) => {
                    if (user.order !== index) {
                        user.order = index;
                        saveUser(user);
                    }
                });

                return newOrder;
            });
        }
    };
    
    const groupedUsers = useMemo(() => {
        if (!users) return {};
        return users.reduce((acc, user) => {
            const role = user.role;
            if (!acc[role]) {
                acc[role] = [];
            }
            acc[role].push(user);
            return acc;
        }, {} as Record<UserRole, User[]>);
    }, [users]);
    
    const { workloadSummary, weekButtons } = useMemo(() => {
        let summary: { user: User; pendingHours: number, totalRealHours: number }[] = [];

        if (selectedView === 'delayed') {
            if (users && tasks) {
                users.forEach(user => {
                    const delayedTasks = tasks.filter(task => {
                        return task.assignedToId === user.id &&
                               task.status !== 'finalizada' &&
                               isPast(new Date(task.deadline)) &&
                               !isToday(new Date(task.deadline));
                    });
                    if (delayedTasks.length > 0) {
                        const pendingHours = delayedTasks.reduce((sum, task) => sum + (task.estimatedTime || 0), 0);
                        summary.push({ user, pendingHours, totalRealHours: pendingHours });
                    }
                });
            }
        } else {
            const today = new Date();
            const currentDay = getDay(today) as Day;
            const diff = (currentDay - 5 + 7) % 7;
            const startOfThisWeek = startOfDay(subDays(today, diff));

            const weekRanges = Array.from({ length: 4 }).map((_, i) => {
                const weekStart = addWeeks(startOfThisWeek, i);
                return { start: weekStart, end: endOfDay(addDays(weekStart, 6)) };
            });

            const selectedRange = weekRanges[selectedView];

            if (users && tasks && selectedRange) {
                users.forEach(user => {
                    const pendingUserTasks = tasks.filter(task =>
                        task.assignedToId === user.id &&
                        task.status !== 'finalizada' &&
                        new Date(task.deadline) >= selectedRange.start &&
                        new Date(task.deadline) <= selectedRange.end
                    );
                    const completedUserTasks = tasks.filter(task =>
                        task.assignedToId === user.id &&
                        task.status === 'finalizada' &&
                        task.finalizedAt &&
                        new Date(task.finalizedAt) >= selectedRange.start &&
                        new Date(task.finalizedAt) <= selectedRange.end
                    );
                    if (pendingUserTasks.length > 0 || completedUserTasks.length > 0) {
                        const pendingHours = pendingUserTasks.reduce((sum, task) => sum + (task.estimatedTime || 0), 0);
                        const completedHours = completedUserTasks.reduce((sum, task) => sum + (task.actualTime || 0), 0);
                        summary.push({ user, pendingHours, totalRealHours: pendingHours + completedHours });
                    }
                });
            }
        }
        
        if (workloadSortConfig) {
            summary.sort((a, b) => {
                const key = workloadSortConfig.key;
                let aValue: any;
                let bValue: any;

                if (key === 'user') {
                    aValue = a.user.name;
                    bValue = b.user.name;
                } else {
                    aValue = a[key];
                    bValue = b[key];
                }

                if (aValue < bValue) return workloadSortConfig.direction === 'asc' ? -1 : 1;
                if (aValue > bValue) return workloadSortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        
        const todayForWeeks = new Date();
        const currentDayForWeeks = getDay(todayForWeeks) as Day;
        const diffForWeeks = (currentDayForWeeks - 5 + 7) % 7;
        const startOfThisWeekForWeeks = startOfDay(subDays(todayForWeeks, diffForWeeks));
        
        const calculatedWeekButtons = Array.from({ length: 4 }).map((_, i) => {
            const weekStart = addWeeks(startOfThisWeekForWeeks, i);
            const thursdayOfWeek = addDays(weekStart, 6); // A week from Friday to Thursday
            return {
                label: i === 0 ? 'Semana Actual' : `Semana ${i + 1}`,
                weekNumber: getWeek(thursdayOfWeek, { weekStartsOn: 1 }), // ISO week number
            };
        });

        return {
            workloadSummary: summary,
            weekButtons: calculatedWeekButtons
        };
    }, [users, tasks, selectedView, workloadSortConfig]);
    
    const handleGeneratePdf = async (selectedUserIds: string[]) => {
        if (!users || !tasks || !projects) return;
        setIsGeneratingPdf(true);
        try {
            const selectedUsers = users.filter(u => selectedUserIds.includes(u.id));
            if (selectedUsers.length === 0) {
                 toast({
                    variant: "destructive",
                    title: "Ningún usuario seleccionado",
                    description: "Por favor, selecciona al menos un usuario para generar el PDF.",
                });
                return;
            }
            
            await generateUserTasksPdf(selectedUsers, tasks, projects, appConfig.logoUrl);
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


     if (loading) {
         return <div className="flex items-center justify-center p-20"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
     }

     if (!users || users.length === 0) {
        return (
             <div className="space-y-6">
                 <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold font-headline">Equipo y Tareas Asignadas</h1>
                    <Button onClick={() => handleOpenUserModal(null)}>
                        <UserPlus className="mr-2 h-4 w-4" />
                        Añadir Miembro
                    </Button>
                </div>
                <div className="text-center py-20 text-muted-foreground">
                    <p className="text-lg">No hay miembros en el equipo.</p>
                    <p>Añade un nuevo miembro para empezar a asignar tareas.</p>
                </div>
                 <UserFormModal
                    isOpen={isUserModalOpen}
                    onClose={() => setIsUserModalOpen(false)}
                    onSave={handleSaveUser}
                    user={editingUser}
                />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                 <h1 className="text-3xl font-bold font-headline">Personas y Tareas Asignadas</h1>
                 <div className="flex items-center gap-2">
                     <Button
                        variant="outline"
                        onClick={() => setIsPdfModalOpen(true)}
                        disabled={isGeneratingPdf}
                     >
                        {isGeneratingPdf ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileDown className="mr-2 h-4 w-4" />}
                        Imprimir Tareas a PDF
                    </Button>
                    <Button onClick={() => handleOpenUserModal(null)}>
                        <UserPlus className="mr-2 h-4 w-4" />
                        Añadir Miembro
                    </Button>
                 </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[320px_1fr] gap-8 items-start">
                <Card>
                    <CardContent className="p-2">
                        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                            <SortableContext items={(users || []).map(u => u.id)} strategy={verticalListSortingStrategy}>
                                 <Accordion type="multiple" className="w-full">
                                    {userRoles && userRoles.map(category => (
                                        groupedUsers[category] && (
                                            <AccordionItem value={category} key={category} className="border-none">
                                                <AccordionTrigger className="py-2 px-2 hover:bg-muted/50 rounded-md">
                                                     <h3 className="font-semibold text-sm text-muted-foreground flex items-center gap-2">
                                                        {categoryIcons[category] || <Briefcase className="h-5 w-5" />}
                                                        {category}
                                                        <Badge variant="secondary" className="ml-2">{groupedUsers[category].length}</Badge>
                                                    </h3>
                                                </AccordionTrigger>
                                                <AccordionContent className="pl-4 pt-2">
                                                     {groupedUsers[category].map(user => (
                                                        <SortableUserItem
                                                            key={user.id}
                                                            user={user}
                                                            tasks={tasks || []}
                                                            isSelected={selectedUser?.id === user.id}
                                                            onSelect={handleSetSelectedUser}
                                                            onEdit={handleOpenUserModal}
                                                            onDelete={setUserToDelete}
                                                            itemRef={(node) => {
                                                                if (node) {
                                                                    userItemRefs.current.set(user.id, node);
                                                                } else {
                                                                    userItemRefs.current.delete(user.id);
                                                                }
                                                            }}
                                                        />
                                                    ))}
                                                </AccordionContent>
                                            </AccordionItem>
                                        )
                                    ))}
                                 </Accordion>
                            </SortableContext>
                        </DndContext>
                    </CardContent>
                </Card>

                { selectedUser ? (
                <Card>
                    <CardHeader className="p-6 flex-row justify-between items-center">
                        <div className="flex items-center gap-4">
                            <Button variant="ghost" size="icon" onClick={() => handleSetSelectedUser(null)}>
                                <Undo2 className="h-5 w-5" />
                            </Button>
                            <div className="flex items-center gap-2">
                                <CardTitle className="text-xl font-bold">{selectedUser.name}</CardTitle>
                            </div>
                        </div>
                        <Button onClick={() => setIsTaskModalOpen(true)}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Asignar Tarea
                        </Button>
                    </CardHeader>
                    <CardContent className="p-6 pt-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[50px]"></TableHead>
                                    <TableHead>
                                        <Button variant="ghost" onClick={() => handleSort('title')} className="px-1 py-0 h-auto">
                                            Tarea <ChevronsUpDown className="ml-2 h-3 w-3" />
                                        </Button>
                                    </TableHead>
                                    <TableHead>
                                         <Button variant="ghost" onClick={() => handleSort('partName')} className="px-1 py-0 h-auto">
                                            Parte <ChevronsUpDown className="ml-2 h-3 w-3" />
                                        </Button>
                                    </TableHead>
                                    <TableHead>
                                        <Button variant="ghost" onClick={() => handleSort('startDate')} className="px-1 py-0 h-auto">
                                            Fecha Inicio <ChevronsUpDown className="ml-2 h-3 w-3" />
                                        </Button>
                                    </TableHead>
                                    <TableHead>
                                        <Button variant="ghost" onClick={() => handleSort('deadline')} className="px-1 py-0 h-auto">
                                            Entrega <ChevronsUpDown className="ml-2 h-3 w-3" />
                                        </Button>
                                    </TableHead>
                                    <TableHead>Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {pendingTasks.map(task => (
                                    <TableRow key={task.id} className="hover:bg-muted/50 cursor-pointer" onClick={() => handleOpenDescriptionModal(task)}>
                                        <TableCell onClick={(e) => e.stopPropagation()}>
                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleTaskUrgency(task)}>
                                                <AlertTriangle className={cn("h-4 w-4 text-muted-foreground", task.isUrgent && 'text-red-500 fill-red-500/20')} />
                                            </Button>
                                        </TableCell>
                                        <TableCell className="font-medium">{task.title}</TableCell>
                                        <TableCell className="text-muted-foreground">{getPartName(task.projectId, task.partId)}</TableCell>
                                        <TableCell>
                                             <ClientSideDate dateString={task.startDate} />
                                        </TableCell>
                                        <TableCell>
                                            <DeadlineBadge deadline={task.deadline} />
                                        </TableCell>
                                        <TableCell onClick={(e) => e.stopPropagation()}>
                                             <Button variant="outline" size="sm" onClick={() => setTaskToSign(task)} disabled={!selectedUser}>
                                                <Edit className="h-3 w-3 mr-1.5" />
                                                Firmar
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {pendingTasks.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                                            Este usuario no tiene tareas pendientes asignadas.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>

                        {completedTasks.length > 0 && (
                            <Accordion type="single" collapsible className="w-full mt-4">
                                <AccordionItem value="completed-tasks">
                                    <AccordionTrigger>Ver {completedTasks.length} Tareas Finalizadas</AccordionTrigger>
                                    <AccordionContent>
                                        <Table>
                                            <TableHeader>
                                                 <TableRow>
                                                    <TableHead>Tarea</TableHead>
                                                    <TableHead>Parte</TableHead>
                                                    <TableHead>Horas (Est/Real)</TableHead>
                                                    <TableHead>Finalización</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {completedTasks.map(task => (
                                                    <TableRow key={task.id} className="cursor-pointer" onClick={() => handleOpenDescriptionModal(task)}>
                                                        <TableCell className="font-medium">{task.title}</TableCell>
                                                        <TableCell className="text-muted-foreground">{getPartName(task.projectId, task.partId)}</TableCell>
                                                        <TableCell className="text-muted-foreground">{`${task.estimatedTime}h / ${task.actualTime || '-'}h`}</TableCell>
                                                        <TableCell>
                                                            <div className="flex items-center gap-2 text-xs font-semibold text-green-700">
                                                                <PenSquare className="h-4 w-4 mr-2 flex-shrink-0" />
                                                                <div>
                                                                    <div>Firmado por {users?.find(u=>u.id === task.finalizedByUserId)?.name}</div>
                                                                    {task.finalizedAt && <div className="text-muted-foreground font-normal"><ClientSideDate dateString={task.finalizedAt} /></div>}
                                                                </div>
                                                                <div className='flex items-center gap-1' onClick={(e) => e.stopPropagation()}>
                                                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleUndoSignTask(task)}>
                                                                        <XCircle className="h-4 w-4 text-muted-foreground" />
                                                                    </Button>
                                                                    <SignatureHistory history={task.signatureHistory || []} users={users || []} />
                                                                </div>
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
                    </CardContent>
                </Card>
                ) : (
                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <div>
                                <CardTitle>Resumen de Carga de Trabajo</CardTitle>
                                <CardDescription>
                                    {selectedView === 'delayed' ? 'Horas de todas las tareas retrasadas.' : 'Horas para la semana seleccionada (de viernes a jueves).'}
                                </CardDescription>
                            </div>
                             <div className="flex items-center gap-1 rounded-md bg-muted p-1">
                                 <Button
                                    size="sm"
                                    variant={selectedView === 'delayed' ? 'destructive' : 'ghost'}
                                    onClick={() => setSelectedView('delayed')}
                                    className="h-8 px-3 flex gap-2"
                                >
                                    <AlertTriangle className="h-4 w-4" />
                                    <span>Tareas Atrasadas</span>
                                </Button>
                                <div className="h-6 w-px bg-border mx-1"></div>
                                {weekButtons.map((week, index) => (
                                    <Button
                                        key={index}
                                        size="sm"
                                        variant={selectedView === index ? 'secondary' : 'ghost'}
                                        onClick={() => setSelectedView(index)}
                                        className="h-8 px-3 flex gap-2"
                                    >
                                        <span>{week.label}</span>
                                        <Badge variant="outline" className="text-xs">{week.weekNumber}</Badge>
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>
                                        <Button variant="ghost" onClick={() => handleWorkloadSort('user')} className="px-1 py-0 h-auto">
                                            Trabajador
                                            <ChevronsUpDown className="ml-2 h-3 w-3" />
                                        </Button>
                                    </TableHead>
                                    <TableHead className="text-right">
                                        <Button variant="ghost" onClick={() => handleWorkloadSort('pendingHours')} className="px-1 py-0 h-auto text-right w-full justify-end">
                                            Horas Pendientes
                                            <ChevronsUpDown className="ml-2 h-3 w-3" />
                                        </Button>
                                    </TableHead>
                                    <TableHead className="text-right">
                                         <Button variant="ghost" onClick={() => handleWorkloadSort('totalRealHours')} className="px-1 py-0 h-auto text-right w-full justify-end">
                                            Horas Totales Reales
                                            <ChevronsUpDown className="ml-2 h-3 w-3" />
                                        </Button>
                                    </TableHead>
                                    <TableHead className="w-[200px]">Carga de Trabajo (40h)</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {workloadSummary.map(({ user, pendingHours, totalRealHours }) => {
                                    const isOverloaded = totalRealHours > 40;
                                    return (
                                        <TableRow key={user.id} onClick={() => handleSetSelectedUser(user)} className="cursor-pointer hover:bg-muted/50">
                                            <TableCell className="font-medium">{user.name}</TableCell>
                                            <TableCell className="text-right font-semibold text-amber-600">{pendingHours.toFixed(1)}h</TableCell>
                                            <TableCell className={cn("text-right font-bold", isOverloaded && "text-destructive")}>
                                                <div className="flex items-center justify-end gap-2">
                                                    {isOverloaded && <AlertTriangle className="h-4 w-4" />}
                                                    {totalRealHours.toFixed(1)}h
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Progress value={isOverloaded ? 100 : (totalRealHours / 40) * 100} className="h-3" indicatorStyle={isOverloaded ? { backgroundColor: 'hsl(var(--destructive))' } : undefined} />
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                                {workloadSummary.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                                            {selectedView === 'delayed'
                                                ? 'No hay tareas atrasadas para ningún usuario.'
                                                : 'No hay tareas con fecha de entrega en esta semana.'
                                            }
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
                ) }
            </div>

            <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción no se puede deshacer. Esto eliminará permanentemente al usuario
                            <span className="font-bold"> {userToDelete?.name}</span> y desasignará sus tareas.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setUserToDelete(null)}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteUser}>Sí, eliminar</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            
            { selectedUser && <TaskFormModal 
                isOpen={isTaskModalOpen}
                onClose={() => setIsTaskModalOpen(false)}
                onSave={handleSaveTask}
                task={null}
                users={users || []}
                projects={projects || []}
                defaultComponent={null}
                defaultAssigneeId={selectedUser.id}
                commonTasks={commonTasks || []}
            /> }
             {taskForDescription && (
                 <TaskDescriptionModal
                    isOpen={isDescriptionModalOpen}
                    onClose={() => setIsDescriptionModalOpen(false)}
                    task={taskForDescription}
                    onTaskUpdate={handleSaveTask}
                />
             )}
            <UserFormModal
                isOpen={isUserModalOpen}
                onClose={() => setIsUserModalOpen(false)}
                onSave={handleSaveUser}
                user={editingUser}
            />
            {taskToSign && selectedUser && (
                <TaskSignatureModal
                    isOpen={!!taskToSign}
                    onClose={() => setTaskToSign(null)}
                    task={taskToSign}
                    user={selectedUser}
                    onConfirm={handleSignTask}
                />
            )}
             <UserPdfOptionsModal
                isOpen={isPdfModalOpen}
                onClose={() => setIsPdfModalOpen(false)}
                users={users || []}
                onGenerate={handleGeneratePdf}
                isGenerating={isGeneratingPdf}
            />
        </div>
    );
}
