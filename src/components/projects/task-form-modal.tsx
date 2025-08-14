
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectSeparator, SelectGroup, SelectLabel } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import type { Task, User, TaskStatus, TaskComponent, TaskPriority, Project, Part, CommonTask, TaskComment } from '@/lib/types';
import { useEffect, useState, useMemo } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarIcon, PlusCircle, Save, Trash2 } from 'lucide-react';
import { Calendar } from '../ui/calendar';
import { useData } from '@/hooks/use-data';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';


const taskSchema = z.object({
  title: z.string().min(1, 'El título es obligatorio.'),
  description: z.string().optional(),
  projectId: z.string().min(1, "El proyecto es obligatorio"),
  partId: z.string().min(1, "El parte es obligatorio"),
  assignedToId: z.string().min(1, 'Por favor, asigna un usuario.'),
  status: z.enum(['pendiente', 'para-soldar', 'montada', 'finalizada', 'en-progreso']),
  estimatedTime: z.coerce.number().min(0, 'El tiempo estimado debe ser un número positivo.'),
  actualTime: z.coerce.number().min(0, 'El tiempo real debe ser un número positivo.'),
  priority: z.enum(['Baja', 'Media', 'Alta']),
  deadline: z.date({ required_error: 'La fecha límite es obligatoria.'}),
  progress: z.coerce.number().min(0).max(100, 'El progreso debe estar entre 0 y 100.'),
});

interface TaskFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<Task, 'id'> | Task) => void;
  task: Task | null;
  users: User[];
  projects: Project[];
  project?: Project; 
  defaultComponent: TaskComponent | null;
  defaultAssigneeId?: string;
  defaultPartId?: string;
  prefillData?: Partial<Task>;
  commonTasks?: CommonTask[];
}

export default function TaskFormModal({ isOpen, onClose, onSave, task, users, projects = [], project, defaultComponent, defaultAssigneeId, defaultPartId, prefillData, commonTasks = [] }: TaskFormModalProps) {
  const { saveCommonTask, deleteCommonTask } = useData();
  const { toast } = useToast();
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const isMobile = useIsMobile();
  const [isAddCommonTaskOpen, setIsAddCommonTaskOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<CommonTask | null>(null);

  const form = useForm<z.infer<typeof taskSchema>>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: '',
      description: '',
      projectId: '',
      partId: '',
      assignedToId: defaultAssigneeId || '',
      status: 'pendiente',
      estimatedTime: 0,
      actualTime: 0,
      priority: 'Media',
      progress: 0,
    },
  });

  useEffect(() => {
    if (isOpen) {
      const initialProjectId = task?.projectId || project?.id || (projects.length > 0 ? projects[0].id : '');
      setSelectedProjectId(initialProjectId);

      const partsForProject = projects.find(p => p.id === initialProjectId)?.parts || [];
      

      if (task) {
        form.reset({
          title: task.title,
          description: task.description || '',
          projectId: task.projectId,
          partId: task.partId,
          assignedToId: task.assignedToId,
          status: task.status,
          estimatedTime: task.estimatedTime,
          actualTime: task.actualTime,
          priority: task.priority,
          deadline: new Date(task.deadline),
          progress: task.progress,
        });
      } else {
        form.reset({
          title: prefillData?.title || '',
          description: prefillData?.description || '',
          projectId: initialProjectId,
          partId: defaultPartId || partsForProject[0]?.id || '',
          assignedToId: defaultAssigneeId || '',
          status: 'pendiente',
          estimatedTime: prefillData?.estimatedTime || 0,
          actualTime: 0,
          priority: 'Media',
          deadline: new Date(),
          progress: 0,
        });
      }
    }
  }, [isOpen, task, projects, project, defaultComponent, form, defaultAssigneeId, defaultPartId, prefillData]);

  const onSubmit = (data: z.infer<typeof taskSchema>) => {
    const component = task ? task.component : defaultComponent;
    if (!component) {
        console.error("Component is missing");
        return;
    }

    const { ...taskData } = data;

    let finalTaskData: Omit<Task, 'id'> | Task;

    if (task) {
        finalTaskData = { ...task, ...taskData, deadline: data.deadline.toISOString(), component };
    } else {
        finalTaskData = { ...taskData, deadline: data.deadline.toISOString(), component } as Omit<Task, 'id'> & { component: TaskComponent };
    }

    onSave(finalTaskData);
    onClose();
  };
  
    const handleSaveAsCommonTask = () => {
        const values = form.getValues();
        const component = task ? task.component : defaultComponent;

        if (!values.title) {
            toast({ variant: "destructive", title: "El título es obligatorio para guardar una tarea común." });
            return;
        }
        if (!component) {
             toast({ variant: "destructive", title: "Se requiere un área para guardar la tarea común." });
            return;
        }
        const commonTask: CommonTask = {
            id: crypto.randomUUID(),
            title: values.title,
            description: values.description || '',
            estimatedTime: values.estimatedTime,
            component: component,
        };
        saveCommonTask(commonTask);
        toast({ title: "Tarea guardada", description: `"${values.title}" se ha añadido a tus tareas comunes.`});
        setIsAddCommonTaskOpen(false);
    };

    const handlePrefillFromCommonTask = (selectedCommonTask: CommonTask) => {
        if (selectedCommonTask) {
            form.setValue('title', selectedCommonTask.title);
            form.setValue('description', selectedCommonTask.description);
            form.setValue('estimatedTime', selectedCommonTask.estimatedTime);
        }
    }

    const handleDeleteClick = (e: React.MouseEvent, commonTask: CommonTask) => {
        e.stopPropagation();
        setTaskToDelete(commonTask);
    }

    const confirmDeleteCommonTask = async () => {
        if (!taskToDelete) return;
        await deleteCommonTask(taskToDelete.id);
        toast({ title: "Tarea común eliminada" });
        setTaskToDelete(null);
    }
    
    const partsForSelectedProject = projects.find(p => p.id === selectedProjectId)?.parts || [];

    const groupedCommonTasks = useMemo(() => {
        return commonTasks.reduce((acc, task) => {
            const component = task.component || 'General';
            if (!acc[component]) {
                acc[component] = [];
            }
            acc[component].push(task);
            return acc;
        }, {} as Record<string, CommonTask[]>);
    }, [commonTasks]);
    

  return (
    <>
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{task ? 'Editar Tarea' : 'Añadir Nueva Tarea'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4 max-h-[70vh] overflow-y-auto pr-4">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                {/* Columna Izquierda */}
                <div className="space-y-6">
                    <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Título de la Tarea</FormLabel>
                        <FormControl>
                            <Input {...field} placeholder="Ej: Montar el chasis principal"/>
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                     {commonTasks.length > 0 && (
                        <div className="space-y-2">
                             <FormLabel>Tareas Comunes (Opcional)</FormLabel>
                             <Accordion type="multiple" className="w-full">
                                {Object.entries(groupedCommonTasks).map(([component, tasks]) => (
                                    <AccordionItem value={component} key={component}>
                                        <AccordionTrigger className="text-sm py-2">
                                            {component} ({tasks.length})
                                        </AccordionTrigger>
                                        <AccordionContent>
                                             <div className="space-y-1 pl-2">
                                                {tasks.map(ct => (
                                                    <div key={ct.id} className="group flex items-center justify-between">
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            className="flex-grow justify-start font-normal text-sm"
                                                            onClick={() => handlePrefillFromCommonTask(ct)}
                                                        >
                                                            {ct.title}
                                                            <span className="text-muted-foreground ml-2">({ct.estimatedTime}h)</span>
                                                        </Button>
                                                         <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100"
                                                            onClick={(e) => handleDeleteClick(e, ct)}
                                                        >
                                                            <Trash2 className="h-4 w-4 text-destructive" />
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>
                                ))}
                             </Accordion>
                        </div>
                    )}
                    <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Descripción</FormLabel>
                        <FormControl>
                            <Textarea {...field} placeholder="Añade detalles o notas importantes sobre la tarea..." className="min-h-[100px]"/>
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                        control={form.control}
                        name="projectId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Proyecto</FormLabel>
                                <Select onValueChange={(value) => {
                                    field.onChange(value);
                                    setSelectedProjectId(value);
                                    form.setValue('partId', '', { shouldValidate: true });
                                }} value={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecciona un proyecto" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {projects.map((p) => (
                                            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                     <FormField
                        control={form.control}
                        name="partId"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Parte del Proyecto</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value} disabled={!selectedProjectId}>
                            <FormControl>
                                <SelectTrigger>
                                <SelectValue placeholder="Selecciona un parte" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {partsForSelectedProject.map((part: Part) => (
                                <SelectItem key={part.id} value={part.id}>{part.name}</SelectItem>
                                ))}
                            </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="assignedToId"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Seleccionar trabajador</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                            <FormControl>
                                <SelectTrigger>
                                <SelectValue placeholder="Selecciona un trabajador" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {users.map(user => (
                                <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                                ))}
                            </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                </div>

                {/* Columna Derecha */}
                <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                         <FormField
                            control={form.control}
                            name="status"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Estado</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                    <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecciona un estado" />
                                    </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                    <SelectItem value="pendiente">Pendiente</SelectItem>
                                    <SelectItem value="en-progreso">En Progreso</SelectItem>
                                    <SelectItem value="para-soldar">Para Soldar</SelectItem>
                                    <SelectItem value="montada">Montada</SelectItem>
                                    <SelectItem value="finalizada">Finalizada</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                                </FormItem>
                            )}
                            />
                            <FormField
                            control={form.control}
                            name="priority"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Prioridad</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                    <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecciona una prioridad" />
                                    </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                    <SelectItem value="Baja">Baja</SelectItem>
                                    <SelectItem value="Media">Media</SelectItem>
                                    <SelectItem value="Alta">Alta</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                     <FormField
                        control={form.control}
                        name="deadline"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                            <FormLabel>Fecha Límite</FormLabel>
                             {isMobile ? (
                                <Calendar
                                    mode="single"
                                    selected={field.value}
                                    onSelect={field.onChange}
                                    className="rounded-md border"
                                    locale={es}
                                />
                             ) : (
                                <Popover>
                                    <PopoverTrigger asChild>
                                    <FormControl>
                                        <Button
                                        variant={"outline"}
                                        className={cn(
                                            "pl-3 text-left font-normal",
                                            !field.value && "text-muted-foreground"
                                        )}
                                        >
                                        {field.value ? (
                                            format(field.value, "PPP", { locale: es })
                                        ) : (
                                            <span>Elige una fecha</span>
                                        )}
                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                        </Button>
                                    </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={field.value}
                                        onSelect={field.onChange}
                                        initialFocus
                                        locale={es}
                                    />
                                    </PopoverContent>
                                </Popover>
                             )}
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                     <FormField
                        control={form.control}
                        name="progress"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Progreso (%)</FormLabel>
                            <FormControl>
                            <Input type="number" {...field} placeholder="0"/>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <div className="grid grid-cols-2 gap-6">
                        <FormField
                            control={form.control}
                            name="estimatedTime"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Tiempo Est. (h)</FormLabel>
                                <FormControl>
                                <Input type="number" {...field} placeholder="0" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="actualTime"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Tiempo Real (h)</FormLabel>
                                <FormControl>
                                <Input type="number" {...field} placeholder="0"/>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                    </div>
                </div>
             </div>
            <DialogFooter className="pt-8">
                 <Button type="button" variant="outline" onClick={() => setIsAddCommonTaskOpen(true)}>
                    <Save className="mr-2 h-4 w-4" />
                    Guardar como Tarea Común
                </Button>
                <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
                <Button type="submit">Guardar Tarea</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>

    <AlertDialog open={isAddCommonTaskOpen} onOpenChange={setIsAddCommonTaskOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Guardar como Tarea Común</AlertDialogTitle>
                <AlertDialogDescription>
                    La tarea actual se guardará como una plantilla para poder reutilizarla. Solo se guardará el título, la descripción y el tiempo estimado.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleSaveAsCommonTask}>Guardar Tarea Común</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>

     <AlertDialog open={!!taskToDelete} onOpenChange={() => setTaskToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                <AlertDialogDescription>
                    Esta acción eliminará la tarea común "<span className="font-bold">{taskToDelete?.title}</span>" de forma permanente. No se puede deshacer.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={confirmDeleteCommonTask}>Sí, eliminar</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
