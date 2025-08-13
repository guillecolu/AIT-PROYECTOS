
'use client';

import { useState, useMemo, useEffect, ChangeEvent } from 'react';
import type { User, Project, Task, TaskStatus, TaskPriority, UserRole } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { AlertTriangle, ChevronsUpDown, PlusCircle, Trash2, UserPlus, Briefcase, Zap, Cog, Building, UserCheck, Pencil, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import TaskFormModal from '@/components/projects/task-form-modal';
import MeetingModal from '../meeting-modal';
import UserFormModal from './user-form-modal';
import { useData } from '@/hooks/use-data';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface TeamTasksClientProps {}

const getWorkloadStatus = (tasks: Task[]) => {
    const hasDelayed = tasks.some(t => new Date(t.deadline) < new Date() && t.status !== 'finalizada');
    if (hasDelayed) return 'retrasado';
    return 'en-tiempo';
}

const statusBadgeClasses: Record<ReturnType<typeof getWorkloadStatus>, string> = {
    'retrasado': 'bg-status-delayed text-red-800 border-red-200',
    'en-tiempo': 'bg-status-complete text-green-800 border-green-200',
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


const ClientSideDate = ({ dateString }: { dateString: string }) => {
    const [formattedDate, setFormattedDate] = useState('');

    useEffect(() => {
        const { format, es } = require('date-fns');
        setFormattedDate(format(new Date(dateString), 'dd/MM/yyyy', { locale: es }));
    }, [dateString]);

    return <>{formattedDate}</>;
};

const SortableUserItem = ({ user, tasks, isSelected, onSelect, onEdit, onDelete }: { user: User, tasks: Task[], isSelected: boolean, onSelect: (user: User) => void, onEdit: (user: User) => void, onDelete: (user: User) => void }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: user.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };
    
    const userTasks = tasks.filter(t => t.assignedToId === user.id);
    const workloadStatus = getWorkloadStatus(userTasks);
    const hasUrgentTask = userTasks.some(t => t.isUrgent);

    return (
        <div ref={setNodeRef} style={style} className="relative group rounded-md touch-none">
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
                <Avatar className="h-9 w-9">
                    <AvatarImage src={user.avatar} alt={user.name} data-ai-hint="person face" />
                    <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                    <p className="font-medium text-sm flex items-center gap-2">
                        {user.name}
                        {hasUrgentTask && <AlertTriangle className="h-4 w-4 text-destructive" />}
                    </p>
                    <Badge variant="outline" className={cn("text-xs font-medium capitalize mt-1", statusBadgeClasses[workloadStatus])}>
                        <span className={cn("h-2 w-2 rounded-full mr-1.5", statusDotClasses[workloadStatus])}></span>
                        {workloadStatus === 'retrasado' ? 'Con retraso' : 'En tiempo'}
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


export default function TeamTasksClient(props: TeamTasksClientProps) {
    const { users, setUsers, projects, tasks, saveTask, saveUser, deleteUser, loading, userRoles } = useData();
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [isMeetingModalOpen, setIsMeetingModalOpen] = useState(false);
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [userToDelete, setUserToDelete] = useState<User | null>(null);
    const [sortPriority, setSortPriority] = useState<'asc' | 'desc' | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );
    
    useEffect(() => {
        if (!selectedUser && users.length > 0) {
            setSelectedUser(users.find(u => u.role === 'Oficina Técnica') || users[0]);
        }
    }, [users, selectedUser]);


    const getProjectName = (projectId: string) => projects.find(p => p.id === projectId)?.name || 'N/A';
    
    const selectedUserTasks = useMemo(() => {
        if (!selectedUser) return [];
        let filtered = tasks.filter(task => task.assignedToId === selectedUser.id);
        if (sortPriority) {
            filtered.sort((a, b) => {
                const orderA = priorityOrder[a.priority];
                const orderB = priorityOrder[b.priority];
                return sortPriority === 'asc' ? orderA - orderB : orderB - orderA;
            });
        }
        return filtered;
    }, [tasks, selectedUser, sortPriority]);
    
    const handleSaveTask = async (taskData: Omit<Task, 'id'> | Task) => {
        await saveTask(taskData);
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
            setSelectedUser(savedUser); // Select the new user
        }
    }
    
     const handleDeleteUser = async () => {
        if (!userToDelete) return;
        
        await deleteUser(userToDelete.id);
        
        setUserToDelete(null);

        if (selectedUser?.id === userToDelete.id) {
            const newUsers = users.filter(u => u.id !== userToDelete.id);
            setSelectedUser(newUsers.length > 0 ? newUsers.find(u => u.role === 'Oficina Técnica') || newUsers[0] : null);
        }
    };

    const handleOpenUserModal = (user: User | null) => {
        setEditingUser(user);
        setIsUserModalOpen(true);
    }

    const toggleTaskUrgency = async (task: Task) => {
        await saveTask({ ...task, isUrgent: !task.isUrgent });
    };

    const handleProgressChange = async (task: Task, e: ChangeEvent<HTMLInputElement>) => {
        const newProgress = Math.max(0, Math.min(100, Number(e.target.value)));
        await saveTask({ 
            ...task, 
            progress: newProgress,
            status: newProgress === 100 ? 'finalizada' : task.status === 'finalizada' ? 'en-progreso' : task.status
          });
    };
    
    const toggleSortPriority = () => {
        setSortPriority(prev => {
            if (prev === 'desc') return 'asc';
            if (prev === 'asc') return null;
            return 'desc';
        })
    }

    const selectedUserProjects = useMemo(() => {
        if (!selectedUser) return [];
        return projects.filter(p => selectedUser.assignedProjectIds.includes(p.id));
    }, [projects, selectedUser]);

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            setUsers((items) => {
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
    
     if (loading) {
         return <div>Cargando...</div>;
     }

     if (users.length === 0) {
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

    const groupedUsers = users.reduce((acc, user) => {
        const role = user.role;
        if (!acc[role]) {
            acc[role] = [];
        }
        acc[role].push(user);
        return acc;
    }, {} as Record<UserRole, User[]>);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                 <h1 className="text-3xl font-bold font-headline">Personas y Tareas Asignadas</h1>
                 <Button onClick={() => handleOpenUserModal(null)}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Añadir Miembro
                </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-[320px_1fr] gap-8 items-start">
                <Card>
                    <CardContent className="p-2">
                        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                            <SortableContext items={users.map(u => u.id)} strategy={verticalListSortingStrategy}>
                                 <Accordion type="multiple" className="w-full" defaultValue={userRoles}>
                                    {userRoles.map(category => (
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
                                                            tasks={tasks}
                                                            isSelected={selectedUser?.id === user.id}
                                                            onSelect={setSelectedUser}
                                                            onEdit={handleOpenUserModal}
                                                            onDelete={setUserToDelete}
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
                         <div>
                            <CardTitle className="text-xl font-bold">Tareas Asignadas a {selectedUser.name}</CardTitle>
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
                                    <TableHead>Tarea</TableHead>
                                    <TableHead>Proyecto</TableHead>
                                    <TableHead>Estado</TableHead>
                                    <TableHead>Avance</TableHead>
                                    <TableHead>Entrega</TableHead>
                                    <TableHead>
                                        <Button variant="ghost" onClick={toggleSortPriority} className="px-1 py-0 h-auto">
                                            Prioridad
                                            <ChevronsUpDown className="ml-2 h-3 w-3" />
                                        </Button>
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {selectedUserTasks.map(task => (
                                    <TableRow key={task.id} className={cn(task.isUrgent && 'bg-red-50 dark:bg-red-900/20')}>
                                        <TableCell>
                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleTaskUrgency(task)}>
                                                <AlertTriangle className={cn("h-4 w-4 text-muted-foreground", task.isUrgent && 'text-red-500 fill-red-500/20')} />
                                            </Button>
                                        </TableCell>
                                        <TableCell className="font-medium">{task.title}</TableCell>
                                        <TableCell className="text-muted-foreground">{getProjectName(task.projectId)}</TableCell>
                                        <TableCell>
                                            <Badge variant="secondary" className={cn(
                                                "capitalize text-xs",
                                                taskStatusBadgeClasses[task.status]
                                            )}>
                                                {task.status.replace('-', ' ')}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Input
                                                    type="number"
                                                    value={task.progress}
                                                    onChange={(e) => handleProgressChange(task, e)}
                                                    className="w-16 h-8 text-center"
                                                />
                                                <span className="text-muted-foreground">%</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-sm">
                                            <ClientSideDate dateString={task.deadline} />
                                        </TableCell>
                                        <TableCell className="text-sm">{task.priority}</TableCell>
                                    </TableRow>
                                ))}
                                {selectedUserTasks.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                                            Este usuario no tiene tareas asignadas.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                         <div className="mt-4 text-right">
                             <Button onClick={() => setIsMeetingModalOpen(true)} variant="link" className="text-sm font-medium">
                                 Ver en línea de tiempo
                             </Button>
                         </div>
                    </CardContent>
                </Card>
                ) : (
                    <Card>
                        <CardContent className="p-6 h-full flex items-center justify-center">
                            <div className="text-center text-muted-foreground">
                                <p className="text-lg">Selecciona un miembro del equipo</p>
                                <p>Elige a alguien de la lista para ver sus tareas asignadas.</p>
                            </div>
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
                users={users}
                projects={projects}
                defaultComponent={null}
                defaultAssigneeId={selectedUser.id}
            /> }
            <UserFormModal
                isOpen={isUserModalOpen}
                onClose={() => setIsUserModalOpen(false)}
                onSave={handleSaveUser}
                user={editingUser}
            />
            <MeetingModal
                isOpen={isMeetingModalOpen}
                onOpenChange={setIsMeetingModalOpen}
                initialFilteredProjects={selectedUserProjects}
            />
        </div>
    );
}
