
'use client';

import { useState, useEffect } from 'react';
import type { Project, Part, Stage, Task } from '@/lib/types';
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
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export type PdfSelection = Record<string, Record<string, boolean>>;

interface PdfOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  tasks: Task[];
  onGenerate: (selection: PdfSelection) => void;
  isGenerating: boolean;
}

export default function PdfOptionsModal({ isOpen, onClose, project, onGenerate, isGenerating, tasks }: PdfOptionsModalProps) {
  const [selection, setSelection] = useState<PdfSelection>({});

  const pendingTasks = (tasks || []).filter(t => t.status !== 'finalizada');

  const hasPendingTasks = (partId: string, stageName?: string) => {
    if (stageName) {
      return pendingTasks.some(t => t.partId === partId && t.component === stageName);
    }
    return pendingTasks.some(t => t.partId === partId);
  };


  useEffect(() => {
    if (project && isOpen) {
      const initialSelection: PdfSelection = {};
      project.parts.forEach(part => {
        initialSelection[part.id] = {};
        part.stages.forEach(stage => {
          initialSelection[part.id][stage.nombre] = false;
        });
      });
      setSelection(initialSelection);
    }
  }, [project, isOpen]);

  const handleSelectAll = (checked: boolean) => {
    const newSelection: PdfSelection = {};
    project.parts.forEach(part => {
      newSelection[part.id] = {};
      part.stages.forEach(stage => {
        if (hasPendingTasks(part.id, stage.nombre)) {
          newSelection[part.id][stage.nombre] = checked;
        } else {
            newSelection[part.id][stage.nombre] = false;
        }
      });
    });
    setSelection(newSelection);
  };

  const handlePartToggle = (partId: string, checked: boolean) => {
    setSelection(prev => {
      const newSelection = { ...prev };
      if (!newSelection[partId]) newSelection[partId] = {};
      const part = project.parts.find(p => p.id === partId);
      part?.stages.forEach(stage => {
        if(hasPendingTasks(partId, stage.nombre)) {
            newSelection[partId][stage.nombre] = checked;
        }
      });
      return newSelection;
    });
  };

  const handleStageToggle = (partId: string, stageName: string, checked: boolean) => {
    setSelection(prev => {
      const newSelection = { ...prev };
      if (!newSelection[partId]) newSelection[partId] = {};
      newSelection[partId][stageName] = checked;
      return newSelection;
    });
  };

  const isAllSelected = () => {
    return Object.values(selection).every(part => 
      Object.entries(part).every(([stageName, isSelected]) => {
          const partId = Object.keys(selection).find(key => selection[key] === part)!;
          return !hasPendingTasks(partId, stageName) || isSelected;
      })
    );
  };

  const isPartSelected = (partId: string) => {
    const part = project.parts.find(p => p.id === partId);
    if (!part || !part.stages || part.stages.length === 0) return false;
    // True if every stage that HAS pending tasks is selected
    return part.stages.every(s => !hasPendingTasks(partId, s.nombre) || selection[partId]?.[s.nombre]);
  }

  const isPartIndeterminate = (partId: string) => {
    if (!hasPendingTasks(partId)) return false;

    const partSelection = selection[partId] || {};
    const selectedCount = Object.values(partSelection).filter(Boolean).length;
    
    const totalSelectableStages = project.parts
        .find(p => p.id === partId)?.stages
        .filter(s => hasPendingTasks(partId, s.nombre)).length || 0;
        
    return selectedCount > 0 && selectedCount < totalSelectableStages;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Opciones de Exportación PDF</DialogTitle>
          <DialogDescription>
            Selecciona qué partes y áreas del proyecto quieres incluir en el informe de tareas pendientes.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] my-4 pr-6">
            <div className="space-y-4">
                <div className="flex items-center space-x-2">
                    <Checkbox
                        id="select-all"
                        checked={isAllSelected()}
                        onCheckedChange={(checked) => handleSelectAll(checked === true)}
                    />
                    <label htmlFor="select-all" className="text-sm font-medium leading-none">
                        Seleccionar Todo
                    </label>
                </div>

                 <Accordion type="multiple" className="w-full" defaultValue={project.parts.map(p => p.id)}>
                    {project.parts.map(part => (
                        <AccordionItem value={part.id} key={part.id} className="border-b">
                             <div className="flex items-center space-x-3">
                                <Checkbox
                                    id={`part-${part.id}`}
                                    checked={isPartSelected(part.id)}
                                    onCheckedChange={(checked) => handlePartToggle(part.id, checked === true)}
                                    disabled={!hasPendingTasks(part.id)}
                                    aria-label={`Seleccionar parte ${part.name}`}
                                    data-state={isPartIndeterminate(part.id) ? 'indeterminate' : (isPartSelected(part.id) ? 'checked' : 'unchecked')}
                                />
                                <AccordionTrigger disabled={!hasPendingTasks(part.id)} className="flex-1 py-2 font-semibold text-left data-[disabled]:opacity-50 data-[disabled]:cursor-not-allowed">
                                    <label htmlFor={`part-${part.id}`} className={cn(!hasPendingTasks(part.id) ? "cursor-not-allowed" : "cursor-pointer")}>
                                         {part.name}
                                    </label>
                                </AccordionTrigger>
                            </div>
                            <AccordionContent>
                                <div className="pl-8 space-y-2 pt-2">
                                    {part.stages.map(stage => (
                                         <div key={stage.nombre} className={cn(
                                             "flex items-center space-x-2",
                                             !hasPendingTasks(part.id, stage.nombre) && "opacity-50 cursor-not-allowed"
                                         )}>
                                            <Checkbox
                                                id={`${part.id}-${stage.nombre}`}
                                                checked={selection[part.id]?.[stage.nombre] || false}
                                                onCheckedChange={(checked) => handleStageToggle(part.id, stage.nombre, checked === true)}
                                                disabled={!hasPendingTasks(part.id, stage.nombre)}
                                            />
                                            <label htmlFor={`${part.id}-${stage.nombre}`} className={cn(
                                                "text-sm leading-none",
                                                !hasPendingTasks(part.id, stage.nombre) && "cursor-not-allowed"
                                            )}>
                                                {stage.nombre}
                                            </label>
                                        </div>
                                    ))}
                                    {part.stages.length === 0 && <p className="text-sm text-muted-foreground">No hay áreas en este parte.</p>}
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                 </Accordion>
            </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isGenerating}>Cancelar</Button>
          <Button onClick={() => onGenerate(selection)} disabled={isGenerating}>
            {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isGenerating ? 'Generando...' : 'Generar PDF'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
