
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
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { Task, TaskComment, User } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface TaskNotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task;
  users: User[];
  onTaskUpdate: (task: Task) => void;
}

const ClientSideDate = ({ dateString }: { dateString: string }) => {
    const [formattedDate, setFormattedDate] = useState('');
    const { format, es } = require('date-fns');

    useEffect(() => {
        setFormattedDate(format(new Date(dateString), 'PPp', { locale: es }));
    }, [dateString, format, es]);

    return <>{formattedDate}</>;
};

export default function TaskNotesModal({ isOpen, onClose, task, users, onTaskUpdate }: TaskNotesModalProps) {
  const [newComment, setNewComment] = useState('');
  const { toast } = useToast();
  const [internalTask, setInternalTask] = useState(task);

  useEffect(() => {
    setInternalTask(task);
  }, [task]);

  const getUser = (id?: string) => users.find(u => u.id === id);
  // In a real app, you'd get the current logged-in user
  const currentUser = users.find(u => u.role === 'Admin') || users[0];

  const handleAddComment = () => {
    if (!newComment.trim()) return;

    const comment: TaskComment = {
      id: crypto.randomUUID(),
      authorId: currentUser.id,
      date: new Date().toISOString(),
      content: newComment,
      isClosed: false,
    };

    const updatedTask = {
      ...internalTask,
      comments: [...(internalTask.comments || []), comment],
    };

    onTaskUpdate(updatedTask);
    setInternalTask(updatedTask); // Update local state immediately
    setNewComment('');
    toast({ title: 'Nota añadida' });
  };

  const handleToggleComment = (commentId: string) => {
    const updatedComments = internalTask.comments?.map(c =>
      c.id === commentId ? { ...c, isClosed: !c.isClosed } : c
    );

    const updatedTask = {
      ...internalTask,
      comments: updatedComments,
    };
    
    onTaskUpdate(updatedTask);
    setInternalTask(updatedTask); // Update local state immediately
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Notas para la Tarea: "{internalTask.title}"</DialogTitle>
          <DialogDescription>
            Añade, revisa y gestiona las notas y puntos de control para esta tarea.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <ScrollArea className="h-72 w-full pr-4">
            <div className="space-y-4">
              {internalTask.comments && internalTask.comments.length > 0 ? (
                internalTask.comments.map(comment => {
                  const author = getUser(comment.authorId);
                  return (
                    <div key={comment.id} className="flex items-start gap-4">
                      <Checkbox
                        id={`comment-${comment.id}`}
                        checked={comment.isClosed}
                        onCheckedChange={() => handleToggleComment(comment.id)}
                        className="mt-1"
                      />
                      <div className="grid gap-1.5 flex-1">
                        <label
                          htmlFor={`comment-${comment.id}`}
                          className={cn("text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70", comment.isClosed && "line-through text-muted-foreground")}
                        >
                          {comment.content}
                        </label>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Avatar className="h-4 w-4">
                                <AvatarImage src={author?.avatar} alt={author?.name} />
                                <AvatarFallback>{author?.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <span>{author?.name}</span>
                            <span>&bull;</span>
                            <span><ClientSideDate dateString={comment.date} /></span>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-center text-muted-foreground py-8">
                  No hay notas para esta tarea.
                </p>
              )}
            </div>
          </ScrollArea>
          <div className="space-y-2">
            <Textarea
              placeholder="Escribe una nueva nota..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
            />
            <Button onClick={handleAddComment} disabled={!newComment.trim()}>
              Añadir Nota
            </Button>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
