
'use client';

import { useState, useEffect } from 'react';
import type { User } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';

interface UserPdfOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: User[];
  onGenerate: (selectedUserIds: string[]) => void;
  isGenerating: boolean;
}

export default function UserPdfOptionsModal({ isOpen, onClose, users, onGenerate, isGenerating }: UserPdfOptionsModalProps) {
  const [selection, setSelection] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (isOpen) {
      const initialSelection = users.reduce((acc, user) => {
        acc[user.id] = false;
        return acc;
      }, {} as Record<string, boolean>);
      setSelection(initialSelection);
    }
  }, [users, isOpen]);

  const handleSelectAll = (checked: boolean) => {
    const newSelection: Record<string, boolean> = {};
    users.forEach(user => {
      newSelection[user.id] = checked;
    });
    setSelection(newSelection);
  };

  const handleUserToggle = (userId: string, checked: boolean) => {
    setSelection(prev => ({
      ...prev,
      [userId]: checked,
    }));
  };

  const isAllSelected = () => {
    return Object.values(selection).every(isSelected => isSelected);
  };

  const handleGenerateClick = () => {
    const selectedIds = Object.entries(selection)
      .filter(([, isSelected]) => isSelected)
      .map(([userId]) => userId);
    onGenerate(selectedIds);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Opciones de Exportación PDF por Usuario</DialogTitle>
          <DialogDescription>
            Selecciona los usuarios cuyas tareas pendientes quieres incluir en el informe.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] my-4 pr-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="select-all-users"
                checked={isAllSelected()}
                onCheckedChange={(checked) => handleSelectAll(checked === true)}
              />
              <label htmlFor="select-all-users" className="text-sm font-medium leading-none">
                Seleccionar Todo
              </label>
            </div>

            <div className="space-y-2">
              {users.map(user => (
                <div key={user.id} className="flex items-center space-x-3 rounded-md p-2 hover:bg-muted">
                   <Checkbox
                        id={`user-${user.id}`}
                        checked={selection[user.id] || false}
                        onCheckedChange={(checked) => handleUserToggle(user.id, checked === true)}
                    />
                  <label htmlFor={`user-${user.id}`} className="flex-1 flex items-center gap-3 cursor-pointer">
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatar} alt={user.name} />
                        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className='flex-1'>
                        <p className="text-sm font-medium leading-none">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.role}</p>
                    </div>
                  </label>
                </div>
              ))}
            </div>
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isGenerating}>Cancelar</Button>
          <Button onClick={handleGenerateClick} disabled={isGenerating}>
            {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isGenerating ? 'Generando...' : 'Generar PDF'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
