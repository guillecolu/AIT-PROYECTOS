
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import type { Task, User } from '@/lib/types';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const signatureSchema = z.object({
  workDescription: z.string().min(1, 'La descripción del trabajo es obligatoria.'),
  actualTime: z.coerce.number().min(0.1, 'Las horas reales deben ser mayores que cero.'),
});

type SignatureFormData = z.infer<typeof signatureSchema>;

interface TaskSignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task;
  user: User; // The user who is signing
  onConfirm: (task: Task, userId: string, workDescription: string, actualTime: number) => void;
}

export default function TaskSignatureModal({ isOpen, onClose, task, user, onConfirm }: TaskSignatureModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<SignatureFormData>({
    resolver: zodResolver(signatureSchema),
    defaultValues: {
      workDescription: '',
      actualTime: task.actualTime || task.estimatedTime || 0,
    },
  });

  useEffect(() => {
    if (isOpen) {
      form.reset({
        workDescription: '',
        actualTime: task.actualTime || task.estimatedTime || 0,
      });
    }
  }, [isOpen, task, form]);

  const onSubmit = async (data: SignatureFormData) => {
    setIsLoading(true);
    try {
      onConfirm(task, user.id, data.workDescription, data.actualTime);
      toast({
        title: '¡Tarea Finalizada!',
        description: `La tarea "${task.title}" ha sido firmada por ${user.name}.`,
      });
      onClose();
    } catch (e) {
      console.error('Error al firmar la tarea:', e);
      toast({
        variant: 'destructive',
        title: 'Error al Firmar',
        description: 'No se pudo guardar la firma. Por favor, inténtalo de nuevo.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!task) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Finalizar y Firmar Tarea</DialogTitle>
          <DialogDescription>
            Confirma la finalización de la tarea "{task.title}" y añade los detalles del trabajo realizado.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="workDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción del Trabajo Realizado</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Ej: Se ha montado el soporte principal y se han realizado las soldaduras según plano."
                    />
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
                  <FormLabel>Horas Reales Invertidas</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.5" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirmar y Firmar
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
