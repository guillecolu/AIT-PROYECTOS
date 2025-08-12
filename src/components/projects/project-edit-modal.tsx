
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import type { Project, User } from '@/lib/types';
import { useEffect, useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Calendar } from '../ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarIcon, Loader2 } from 'lucide-react';

const projectEditSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio.'),
  client: z.string().min(1, 'El cliente es obligatorio.'),
  projectManagerId: z.string().min(1, 'Asigna un jefe de proyecto.'),
  startDate: z.date({ required_error: 'La fecha de inicio es obligatoria.' }),
  deliveryDate: z.date({ required_error: 'La fecha de entrega es obligatoria.' }),
}).refine(data => data.deliveryDate >= data.startDate, {
  message: "La fecha de entrega debe ser posterior o igual a la de inicio.",
  path: ["deliveryDate"],
});

type ProjectEditFormData = z.infer<typeof projectEditSchema>;

interface ProjectEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<Project>) => void;
  project: Project;
  users: User[];
}

export default function ProjectEditModal({ isOpen, onClose, onSave, project, users }: ProjectEditModalProps) {
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<ProjectEditFormData>({
        resolver: zodResolver(projectEditSchema),
    });

    useEffect(() => {
        if (project && isOpen) {
            form.reset({
                name: project.name,
                client: project.client,
                projectManagerId: project.projectManagerId,
                startDate: new Date(project.startDate),
                deliveryDate: new Date(project.deliveryDate),
            });
        }
    }, [project, isOpen, form]);

    const managers = users.filter(u => u.role === 'Engineer');

    const onSubmit = async (data: ProjectEditFormData) => {
        setIsLoading(true);
        try {
            onSave({
                ...data,
                startDate: data.startDate.toISOString(),
                deliveryDate: data.deliveryDate.toISOString(),
            });
            onClose();
        } catch (error) {
            console.error("Error updating project", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Editar Detalles del Proyecto</DialogTitle>
                    <DialogDescription>
                        Realiza cambios en la información general del proyecto.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
                        <div className="grid md:grid-cols-2 gap-4">
                            <FormField name="name" render={({ field }) => (
                                <FormItem>
                                <FormLabel>Nombre del Proyecto</FormLabel>
                                <FormControl><Input {...field} /></FormControl>
                                <FormMessage />
                                </FormItem>
                            )} />
                            <FormField name="client" render={({ field }) => (
                                <FormItem>
                                <FormLabel>Cliente</FormLabel>
                                <FormControl><Input {...field} /></FormControl>
                                <FormMessage />
                                </FormItem>
                            )} />
                        </div>
                        <div className="grid md:grid-cols-3 gap-4">
                            <FormField name="startDate" render={({ field }) => (
                                <FormItem className="flex flex-col pt-2">
                                <FormLabel>Fecha de Inicio</FormLabel>
                                <Popover>
                                    <PopoverTrigger asChild><FormControl>
                                        <Button variant="outline" className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                            {field.value ? format(field.value, "PPP", { locale: es }) : <span>Elige fecha</span>}
                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                        </Button>
                                    </FormControl></PopoverTrigger>
                                    <PopoverContent align="start" className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus locale={es}/></PopoverContent>
                                </Popover>
                                <FormMessage/>
                                </FormItem>
                            )}/>
                            <FormField name="deliveryDate" render={({ field }) => (
                                <FormItem className="flex flex-col pt-2">
                                <FormLabel>Fecha de Entrega</FormLabel>
                                <Popover>
                                    <PopoverTrigger asChild><FormControl>
                                        <Button variant="outline" className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                            {field.value ? format(field.value, "PPP", { locale: es }) : <span>Elige fecha</span>}
                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                        </Button>
                                    </FormControl></PopoverTrigger>
                                    <PopoverContent align="start" className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus locale={es}/></PopoverContent>
                                </Popover>
                                <FormMessage/>
                                </FormItem>
                            )}/>
                                <FormField name="projectManagerId" render={({ field }) => (
                                <FormItem className="flex flex-col pt-2">
                                    <FormLabel>Jefe de Proyecto</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger></FormControl>
                                        <SelectContent>
                                            {managers.map(user => <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>
                        <DialogFooter className="pt-4">
                            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>Cancelar</Button>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Guardar Cambios
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
