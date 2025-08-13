
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import type { User, UserRole } from '@/lib/types';
import { useEffect, useState } from 'react';
import { useData } from '@/hooks/use-data';
import { Popover, PopoverTrigger, PopoverContent } from '../ui/popover';
import { cn } from '@/lib/utils';
import { Check, ChevronsUpDown, Trash2, Loader2, PlusCircle } from 'lucide-react';


const userSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio.'),
  email: z.string().email('Introduce un email válido.'),
  role: z.string().min(1, 'El rol es obligatorio.'),
});

type UserFormData = z.infer<typeof userSchema>;

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: User | Omit<User, 'id'>) => Promise<void>;
  user: User | null;
}

export default function UserFormModal({ isOpen, onClose, onSave, user }: UserFormModalProps) {
  const { userRoles, saveUserRole, deleteUserRole } = useData();
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState("")

  const form = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: '',
      email: '',
      role: '',
    },
  });

  const onSubmit = async (data: UserFormData) => {
    setIsLoading(true);
    // If the role is new, save it first
    if (!userRoles.find(r => r.toLowerCase() === data.role.toLowerCase())) {
        await saveUserRole(data.role);
    }
    
    if (user) {
        await onSave({ ...user, ...data });
    } else {
        await onSave(data);
    }
    setIsLoading(false);
    onClose();
  };
  
  useEffect(() => {
    if (isOpen) {
        if (user) {
            form.reset({
                name: user.name,
                email: user.email,
                role: user.role,
            });
            setValue(user.role)
        } else {
            form.reset({
                name: '',
                email: '',
                role: 'Oficina Técnica',
            });
            setValue('Oficina Técnica');
        }
    }
  }, [isOpen, user, form]);

  const handleDeleteRole = (e: React.MouseEvent, role: string) => {
    e.stopPropagation();
    e.preventDefault();
    deleteUserRole(role);
  }


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{user ? 'Editar Miembro' : 'Añadir Nuevo Miembro'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre Completo</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl><Input type="email" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Categoría / Rol</FormLabel>
                  <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={open}
                          className="w-full justify-between"
                        >
                          {field.value
                            ? userRoles.find(
                                (role) => role.toLowerCase() === field.value.toLowerCase()
                              ) || field.value
                            : "Seleccionar categoría..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[280px] p-0">
                       <Command>
                            <CommandInput 
                                placeholder="Buscar o crear categoría..."
                                onValueChange={(search) => setValue(search)}
                                value={value}
                            />
                            <CommandList>
                                <CommandEmpty>
                                    <Button
                                        variant="ghost"
                                        className="w-full"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            field.onChange(value);
                                            setOpen(false)
                                        }}
                                    >
                                        <PlusCircle className="mr-2 h-4 w-4" />
                                        Crear y seleccionar "{value}"
                                    </Button>
                                </CommandEmpty>
                                <CommandGroup>
                                {userRoles.map((role) => (
                                    <CommandItem
                                        value={role}
                                        key={role}
                                        onSelect={(currentValue) => {
                                            const newValue = userRoles.find(r => r.toLowerCase() === currentValue);
                                            if (newValue) {
                                                field.onChange(newValue);
                                                setValue(newValue);
                                            }
                                            setOpen(false);
                                        }}
                                        className="flex justify-between"
                                    >
                                        <div className="flex items-center">
                                            <Check
                                            className={cn(
                                                "mr-2 h-4 w-4",
                                                field.value === role ? "opacity-100" : "opacity-0"
                                            )}
                                            />
                                            {role}
                                        </div>
                                         <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => handleDeleteRole(e, role)}>
                                            <Trash2 className="h-4 w-4 text-destructive/70"/>
                                         </Button>
                                    </CommandItem>
                                ))}
                                </CommandGroup>
                           </CommandList>
                       </Command>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>Cancelar</Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                Guardar Cambios
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
