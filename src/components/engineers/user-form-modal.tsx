
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectSeparator } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import type { User, UserRole } from '@/lib/types';
import { useEffect, useState } from 'react';
import { useData } from '@/hooks/use-data';
import { Loader2, PlusCircle } from 'lucide-react';


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
  const { userRoles, saveUserRole } = useData();
  const [isLoading, setIsLoading] = useState(false);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  
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
    try {
      await onSave(user ? { ...user, ...data } : data);
      onClose();
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false);
    }
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
                role: 'Oficina Técnica',
            });
        }
    }
  }, [isOpen, user, form]);

  const handleAddNewCategory = async () => {
    if (newCategoryName.trim()) {
      await saveUserRole(newCategoryName);
      form.setValue('role', newCategoryName, { shouldValidate: true });
      setNewCategoryName("");
      setIsAddCategoryOpen(false);
    }
  }

  return (
    <>
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
                  <Select 
                    onValueChange={(value) => {
                      if (value === '__add_new__') {
                        setIsAddCategoryOpen(true);
                      } else {
                        field.onChange(value);
                      }
                    }} 
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {userRoles.map((role) => (
                        <SelectItem key={role} value={role}>{role}</SelectItem>
                      ))}
                      <SelectSeparator />
                      <SelectItem value="__add_new__">
                        <span className="flex items-center gap-2">
                          <PlusCircle className="h-4 w-4" />
                          Crear nueva categoría...
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
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

    <AlertDialog open={isAddCategoryOpen} onOpenChange={setIsAddCategoryOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Añadir Nueva Categoría</AlertDialogTitle>
                <AlertDialogDescription>
                    Escribe el nombre para la nueva categoría o rol de usuario.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-2">
                 <Input 
                    placeholder="Ej: Dirección de Área"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    autoFocus
                />
            </div>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleAddNewCategory}>Añadir</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
