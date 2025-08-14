
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, GripVertical, PlusCircle, Save, Trash2, X, Loader2 } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Project, Part, User } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useData } from '@/hooks/use-data';

const partSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'El nombre del parte es obligatorio'),
});

const projectSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio.'),
  client: z.string().min(1, 'El cliente es obligatorio.'),
  projectManagerId: z.string().min(1, 'Asigna un jefe de proyecto.'),
  startDate: z.date({ required_error: 'La fecha de inicio es obligatoria.' }),
  deliveryDate: z.date({ required_error: 'La fecha de entrega es obligatoria.' }),
  parts: z.array(partSchema).min(1, 'Debes añadir al menos un parte al proyecto.'),
}).refine(data => data.deliveryDate >= data.startDate, {
  message: "La fecha de entrega debe ser posterior o igual a la de inicio.",
  path: ["deliveryDate"],
});

type ProjectFormData = z.infer<typeof projectSchema>;

export default function CreateProjectClient() {
  const router = useRouter();
  const { toast } = useToast();
  const { users, saveProject } = useData();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: '',
      client: '',
      parts: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'parts',
  });

  const handleAddPart = () => {
    append({
      id: crypto.randomUUID(),
      name: `Nuevo Parte ${fields.length + 1}`,
    });
  };

  const handleSaveProject = async (data: ProjectFormData) => {
    setIsLoading(true);
    
    const allEngineerIds = users?.filter(u => u.role === 'Oficina Técnica' || u.role === 'Taller' || u.role === 'Eléctrico').map(u => u.id) ?? [];

    const newProject: Omit<Project, 'id'> = {
      name: data.name,
      client: data.client,
      projectManagerId: data.projectManagerId,
      startDate: data.startDate.toISOString(),
      deliveryDate: data.deliveryDate.toISOString(),
      status: 'activo',
      progress: 0,
      engineerIds: allEngineerIds, // Assign all potential engineers initially
      parts: data.parts.map(part => ({
        ...part,
        id: crypto.randomUUID(),
        stages: [], // Start with an empty array of stages
      })),
      notes: [],
    };

    try {
      const savedProject = await saveProject(newProject);
      toast({
        title: "¡Proyecto Creado!",
        description: `El proyecto "${savedProject.name}" ha sido guardado exitosamente.`,
      });
      router.push(`/dashboard/projects/${savedProject.id}`);
    } catch (error) {
      console.error("Error al crear proyecto:", error);
      toast({
        variant: 'destructive',
        title: "Error al Guardar",
        description: "No se pudo guardar el proyecto. Revisa la consola para más detalles.",
      });
    } finally {
        setIsLoading(false);
    }
  };

  const managers = users?.filter(u => u.role === 'Oficina Técnica' || u.role === 'Dirección de Proyecto') ?? [];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSaveProject)} className="space-y-8">
        <div className="flex justify-between items-center">
            <div>
                <h1 className="text-3xl font-bold font-headline">Crear Nuevo Proyecto</h1>
                <p className="text-muted-foreground">Define los detalles y las partes principales de tu proyecto.</p>
            </div>
            <div className="flex gap-2">
                 <Button type="button" variant="outline" onClick={() => router.push('/dashboard')} disabled={isLoading}>
                    <X className="mr-2 h-4 w-4" />
                    Cancelar
                </Button>
                <Button type="submit" disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    {isLoading ? 'Guardando...' : 'Guardar Proyecto'}
                </Button>
            </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Información General</CardTitle>
            <CardDescription>Datos básicos del proyecto y cliente.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger></FormControl>
                            <SelectContent>
                                {managers.map(user => <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )} />
            </div>
          </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Partes del Proyecto</CardTitle>
                <CardDescription>Añade y nombra las partes o sub-proyectos que componen este proyecto. Las áreas se definirán dentro de cada parte más adelante.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {fields.map((field, index) => (
                        <Card key={field.id} className="p-4 bg-muted/30 relative">
                            <div className="flex items-center gap-4">
                                 <GripVertical className="h-5 w-5 text-muted-foreground mt-9 cursor-grab"/>
                                 <div className="flex-1">
                                    <FormField
                                        control={form.control}
                                        name={`parts.${index}.name`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Nombre del Parte</FormLabel>
                                                <FormControl><Input {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                 </div>
                                 <Button variant="ghost" size="icon" onClick={() => remove(index)} className="mt-7">
                                     <Trash2 className="h-4 w-4 text-destructive" />
                                 </Button>
                            </div>
                        </Card>
                    ))}
                </div>
                {fields.length === 0 && (
                    <div className="text-center py-10 border-2 border-dashed rounded-lg">
                        <p className="text-muted-foreground">Este proyecto todavía no tiene partes.</p>
                        <p className="text-sm text-muted-foreground">Usa el botón de abajo para empezar a añadir.</p>
                    </div>
                )}
                 <FormMessage className='pt-2'>{form.formState.errors.parts?.message}</FormMessage>

                 <Button type="button" variant="outline" className="mt-6 w-full" onClick={handleAddPart}>
                    <PlusCircle className="mr-2 h-4 w-4"/>
                    Añadir Parte
                </Button>
            </CardContent>
        </Card>

      </form>
    </Form>
  );
}
