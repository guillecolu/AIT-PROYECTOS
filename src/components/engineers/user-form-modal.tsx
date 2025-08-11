
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import type { User, UserRole } from '@/lib/types';
import { useEffect } from 'react';

const userRoles: UserRole[] = ['Admin', 'Manager', 'Engineer', 'Taller', 'Eléctrico', 'Comercial', 'Dirección de Proyecto', 'Dirección de Área'];

const userSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio.'),
  email: z.string().email('Introduce un email válido.'),
  role: z.enum(userRoles as [UserRole, ...UserRole[]]),
});

type UserFormData = z.infer<typeof userSchema>;

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: User | Omit<User, 'id'>) => Promise<void>;
  user: User | null;
}

export default function UserFormModal({ isOpen, onClose, onSave, user }: UserFormModalProps) {
  
  const form = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: '',
      email: '',
      role: 'Engineer',
    },
  });

  const onSubmit = async (data: UserFormData) => {
    if (user) {
        await onSave({ ...user, ...data });
    } else {
        await onSave(data);
    }
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
        } else {
            form.reset({
                name: '',
                email: '',
                role: 'Engineer',
            });
        }
    }
  }, [isOpen, user, form]);


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
                <FormItem>
                  <FormLabel>Categoría / Rol</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                        {userRoles.map(role => (
                          <SelectItem key={role} value={role}>{role}</SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
              <Button type="submit">Guardar Cambios</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
