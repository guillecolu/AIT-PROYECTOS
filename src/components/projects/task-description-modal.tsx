
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import type { Task } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

interface TaskDescriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task;
  onTaskUpdate: (task: Task) => void;
}

export default function TaskDescriptionModal({ isOpen, onClose, task, onTaskUpdate }: TaskDescriptionModalProps) {
  const [description, setDescription] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    if (task) {
      setDescription(task.description || '');
    }
  }, [task]);

  const handleSave = () => {
    const updatedTask = {
      ...task,
      description: description,
    };
    onTaskUpdate(updatedTask);
    toast({ title: 'Descripción actualizada' });
    onClose();
  };

  if (!task) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Descripción de la Tarea: "{task.title}"</DialogTitle>
          <DialogDescription>
            Visualiza y edita la descripción detallada para esta tarea.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
            <Textarea
                placeholder="Añade una descripción para esta tarea..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[200px]"
            />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave}>Guardar Descripción</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
