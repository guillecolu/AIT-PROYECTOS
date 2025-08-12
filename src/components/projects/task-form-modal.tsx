

'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import type { Task, User, TaskStatus, TaskComponent, TaskPriority, Project, Part, CommonTask } from '@/lib/types';
import { useEffect, useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarIcon, Save, Paperclip, X } from 'lucide-react';
import { Calendar } from '../ui/calendar';
import { useData } from '@/hooks/use-data';
import { useToast } from '@/hooks/use-toast';

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
  attachment: z.instanceof(File).optional(),
});

interface TaskFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<Task, 'id'> | Task, attachment?: File) => void;
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
  const { saveCommonTask } = useData();
  const { toast } = useToast();
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [attachmentName, setAttachmentName] = useState<string | null>(task?.attachmentName || null);

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
      
      setAttachmentName(task?.attachmentName || null);

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
    
    const { attachment, ...taskData } = data;
    
    const completeTaskData = { 
        ...taskData, 
        deadline: data.deadline.toISOString(),
        component: component,
    };
    
    if (task) {
        onSave({ ...task, ...completeTaskData }, attachment);
    } else {
        onSave(completeTaskData, attachment);
    }
    onClose();
  };
  
    const handleSaveAsCommonTask = () => {
        const values = form.getValues();
        if (!values.title) {
            toast({ variant: "destructive", title: "El título es obligatorio para guardar una tarea común." });
            return;
        }
        const commonTask: CommonTask = {
            id: crypto.randomUUID(),
            title: values.title,
            description: values.description || '',
            estimatedTime: values.estimatedTime,
        };
        saveCommonTask(commonTask);
        toast({ title: "Tarea guardada", description: `"${values.title}" se ha añadido a tus tareas comunes.`});
    };

    const handlePrefillFromCommonTask = (commonTaskId: string) => {
        const selectedCommonTask = commonTasks.find(ct => ct.id === commonTaskId);
        if (selectedCommonTask) {
            form.setValue('title', selectedCommonTask.title);
            form.setValue('description', selectedCommonTask.description);
            form.setValue('estimatedTime', selectedCommonTask.estimatedTime);
        }
    }
    
    const partsForSelectedProject = projects.find(p => p.id === selectedProjectId)?.parts || [];
    
    const handleRemoveAttachment = () => {
        form.setValue('attachment', undefined);
        setAttachmentName(null);
        if (task) {
            onSave({ ...task, attachmentURL: '', attachmentName: '' });
        }
    }

  return (
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
                    {commonTasks.length > 0 && (
                         <FormItem>
                            <FormLabel>Tareas Comunes (Opcional)</FormLabel>
                             <Select onValueChange={handlePrefillFromCommonTask}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar para autocompletar..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {commonTasks.map(ct => (
                                        <SelectItem key={ct.id} value={ct.id}>{ct.title}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </FormItem>
                    )}
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
                     <FormField
                        control={form.control}
                        name="attachment"
                        render={({ field: { value, onChange, ...fieldProps } }) => (
                            <FormItem>
                                <FormLabel>Adjuntar Archivo</FormLabel>
                                {attachmentName ? (
                                    <div className="flex items-center gap-2 text-sm p-2 bg-muted/50 rounded-md">
                                        <Paperclip className="h-4 w-4 text-muted-foreground"/>
                                        <span className="flex-grow truncate">{attachmentName}</span>
                                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleRemoveAttachment}>
                                            <X className="h-4 w-4"/>
                                        </Button>
                                    </div>
                                ) : (
                                    <FormControl>
                                        <Input 
                                            type="file" 
                                            {...fieldProps}
                                            onChange={(event) => {
                                                const file = event.target.files?.[0];
                                                onChange(file);
                                                setAttachmentName(file?.name || null);
                                            }}
                                            className="pt-2"
                                        />
                                    </FormControl>
                                )}
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
             </div>
            <DialogFooter className="pt-8 flex justify-between w-full">
              <Button type="button" variant="secondary" onClick={handleSaveAsCommonTask}>
                <Save className="mr-2 h-4 w-4" />
                Guardar como tarea común
              </Button>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
                <Button type="submit">Guardar Tarea</Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
