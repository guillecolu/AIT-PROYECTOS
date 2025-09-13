

'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { Part, Task } from '@/lib/types';
import { Folder, FolderOpen, FolderPlus, Trash2, GripVertical, Clock, Timer } from 'lucide-react';
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
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, horizontalListSortingStrategy, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface PartsRoadmapProps {
  project: {
    id: string;
    parts: Part[];
    color?: string;
  };
  tasks: Task[];
  onPartSelect: (part: Part) => void;
  selectedPart: Part | null;
  onPartNameChange: (partId: string, newName: string) => void;
  onAddPart: () => void;
  onPartDelete: (partId: string) => void;
  onPartOrderChange: (parts: Part[]) => void;
}

const PartCard = ({ part, tasks, onClick, isSelected, onNameChange, onDelete }: { part: Part; tasks: Task[]; onClick: () => void; isSelected: boolean, onNameChange: (newName: string) => void; onDelete: () => void; }) => {
  const [isEditing, setIsEditing] = useState(false);
  
  const partTasks = tasks.filter(t => t.partId === part.id);
  const totalTasks = partTasks.length;
  const completedTasks = partTasks.filter(t => t.status === 'finalizada').length;
  
  const progress = part.progress || 0;
  
   const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: part.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

  return (
    <div ref={setNodeRef} style={style}>
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
            <div {...attributes} {...listeners} className="cursor-grab p-1 touch-none">
                <GripVertical className="h-6 w-6 text-muted-foreground"/>
            </div>
            {isSelected ? <FolderOpen className="h-8 w-8 text-primary" /> : <Folder className="h-8 w-8 text-muted-foreground" />}
            <div className="flex-grow text-left space-y-2">
                <EditableField
                initialValue={part.name}
                onSave={onNameChange}
                label="Nombre del Parte"
                className="text-base font-bold"
                onEditingChange={setIsEditing}
                />
                <p className="text-sm text-muted-foreground">{completedTasks} de {totalTasks} tareas completadas</p>
                <div className="flex items-center gap-2 mt-1">
                    <div className="w-full bg-muted rounded-full h-1.5">
                        <div className="bg-primary h-1.5 rounded-full transition-all duration-500 ease-in-out" style={{ width: `${progress}%` }}></div>
                    </div>
                    <span className="text-xs font-semibold">{progress}%</span>
                </div>
                <div className="text-xs text-muted-foreground border-t pt-2 mt-2 space-y-1">
                    <div className="flex items-center justify-between" title="Horas Estimadas">
                        <div className="flex items-center gap-1.5">
                            <Clock className="h-3 w-3"/>
                            <span>Estimadas</span>
                        </div>
                        <span className="font-medium text-foreground">{part.totalEstimatedTime?.toFixed(1) || 0}h</span>
                    </div>
                     <div className="flex items-center justify-between" title="Horas Reales">
                         <div className="flex items-center gap-1.5">
                            <Clock className="h-3 w-3"/>
                            <span>Reales</span>
                        </div>
                        <span className="font-medium text-foreground">{part.totalActualTime?.toFixed(1) || 0}h</span>
                    </div>
                    <div className="flex items-center justify-between" title="Horas Pendientes (Estimadas)">
                         <div className="flex items-center gap-1.5">
                            <Timer className="h-3 w-3" />
                            <span>Pendientes</span>
                        </div>
                        <span className="font-medium text-foreground">{part.totalPendingEstimatedTime?.toFixed(1) || 0}h</span>
                    </div>
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
    </div>
  );
};

export default function PartsRoadmap({ project, tasks, onPartSelect, selectedPart, onPartNameChange, onAddPart, onPartDelete, onPartOrderChange }: PartsRoadmapProps) {

   const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

   const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = project.parts.findIndex((item) => item.id === active.id);
            const newIndex = project.parts.findIndex((item) => item.id === over.id);
            const newOrder = arrayMove(project.parts, oldIndex, newIndex);
            onPartOrderChange(newOrder);
        }
    };


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
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={project.parts.map(p => p.id)} strategy={horizontalListSortingStrategy}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-start">
                    {project.parts.map((part) => (
                        <PartCard
                        key={part.id}
                        part={part}
                        tasks={tasks}
                        onClick={() => onPartSelect(part)}
                        isSelected={selectedPart?.id === part.id}
                        onNameChange={(newName) => onPartNameChange(part.id, newName)}
                        onDelete={() => onPartDelete(part.id)}
                        />
                    ))}
                    <Button variant="outline" className="h-full min-h-[210px] w-full rounded-lg flex-shrink-0 flex flex-col items-center justify-center" onClick={onAddPart}>
                    <FolderPlus className="h-8 w-8 text-muted-foreground mb-2" />
                    <span className="text-muted-foreground">Añadir Parte</span>
                    </Button>
                </div>
            </SortableContext>
       </DndContext>
    </div>
  );
}
