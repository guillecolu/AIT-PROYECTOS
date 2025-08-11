

'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { Part } from '@/lib/types';
import { Folder, FolderOpen, FolderPlus, Trash2 } from 'lucide-react';
import EditableField from '../ui/editable-field';
import { Button } from '../ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface PartsRoadmapProps {
  project: {
    parts: Part[];
    color?: string;
  };
  onPartSelect: (part: Part) => void;
  selectedPart: Part | null;
  onPartNameChange: (partId: string, newName: string) => void;
  onAddPart: () => void;
  onPartDelete: (partId: string) => void;
}

const PartCard = ({ part, onClick, isSelected, onNameChange, onDelete }: { part: Part; onClick: () => void; isSelected: boolean, onNameChange: (newName: string) => void; onDelete: () => void; }) => {
  const [isEditing, setIsEditing] = useState(false);
  const totalStages = part.stages.length;
  const completedStages = part.stages.filter(s => s.porcentaje === 100).length;
  const progress = part.progress || 0;

  return (
    <div
      onClick={onClick}
      className={cn(
        "group relative h-auto p-0 border-t-4 w-full rounded-lg cursor-pointer",
        isSelected ? 'border-primary' : 'border-transparent',
      )}
    >
      <Card className={cn(
        "w-full h-full hover:shadow-md transition-shadow",
        isSelected && 'bg-primary/5'
      )}>
        <CardContent className="p-4 flex items-center gap-4">
          {isSelected ? <FolderOpen className="h-8 w-8 text-primary" /> : <Folder className="h-8 w-8 text-muted-foreground" />}
          <div className="flex-grow text-left space-y-2">
            <EditableField
              initialValue={part.name}
              onSave={onNameChange}
              label="Nombre del Parte"
              className="text-base font-bold"
              onEditingChange={setIsEditing}
            />
            <p className="text-sm text-muted-foreground">{completedStages} de {totalStages} departamentos completados</p>
            <div className="flex items-center gap-2 mt-2">
              <div className="w-full bg-muted rounded-full h-1.5">
                <div className="bg-primary h-1.5 rounded-full transition-all duration-500 ease-in-out" style={{ width: `${progress}%` }}></div>
              </div>
              <span className="text-xs font-semibold">{progress}%</span>
            </div>
          </div>
        </CardContent>
      </Card>
      <div className={cn(isEditing && 'hidden')}>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => e.stopPropagation()}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent onClick={(e) => e.stopPropagation()}>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Estás seguro de que quieres eliminar este parte?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer. Se eliminará permanentemente el parte <span className="font-bold">{part.name}</span> y todas las tareas asociadas.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={(e) => { e.stopPropagation(); onDelete(); }}>Sí, eliminar</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default function PartsRoadmap({ project, onPartSelect, selectedPart, onPartNameChange, onAddPart, onPartDelete }: PartsRoadmapProps) {

  if (!project.parts || project.parts.length === 0) {
    return (
        <Card>
            <CardContent className="p-6">
                <div className="text-center py-10 text-muted-foreground flex flex-col items-center gap-4">
                    <FolderPlus className="h-12 w-12" />
                    <p className="font-semibold">Este proyecto no tiene partes definidos.</p>
                    <p className="text-sm">Para añadir tareas, primero debes crear al menos un parte.</p>
                    <Button onClick={onAddPart} className="mt-2">
                        <FolderPlus className="mr-2 h-4 w-4" />
                        Añadir el primer parte
                    </Button>
                </div>
            </CardContent>
      </Card>
    )
  }

  return (
    <div>
      <h2 className="text-2xl font-headline font-semibold mb-4">Partes del Proyecto</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-start">
        {project.parts.map((part) => (
            <PartCard
              key={part.id}
              part={part}
              onClick={() => onPartSelect(part)}
              isSelected={selectedPart?.id === part.id}
              onNameChange={(newName) => onPartNameChange(part.id, newName)}
              onDelete={() => onPartDelete(part.id)}
            />
        ))}
        <Button variant="outline" className="h-full min-h-[130px] w-full rounded-lg flex-shrink-0 flex flex-col items-center justify-center" onClick={onAddPart}>
          <FolderPlus className="h-8 w-8 text-muted-foreground mb-2" />
          <span className="text-muted-foreground">Añadir Parte</span>
        </Button>
      </div>
    </div>
  );
}
