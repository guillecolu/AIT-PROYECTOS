'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import type { Stage, User, StageStatus, TaskComponent } from '@/lib/types';
import { CheckCircle, Clock, Loader } from 'lucide-react';

interface RoadmapProps {
  stages: Stage[];
  users: User[];
  onStageClick: (component: TaskComponent) => void;
  selectedStage: TaskComponent | null;
}

const statusStyles: Record<StageStatus, { border: string, bg: string, text: string, icon: React.ReactNode }> = {
  pendiente: {
    border: 'border-status-pending',
    bg: 'bg-status-pending/10',
    text: 'text-status-pending',
    icon: <Clock className="h-4 w-4" />,
  },
  en_proceso: {
    border: 'border-status-in-process',
    bg: 'bg-status-in-process/10',
    text: 'text-status-in-process',
    icon: <Loader className="h-4 w-4 animate-spin" />,
  },
  completo: {
    border: 'border-status-complete',
    bg: 'bg-status-complete/10',
    text: 'text-status-complete',
    icon: <CheckCircle className="h-4 w-4" />,
  },
};

const ClientSideDate = ({ dateString }: { dateString: string }) => {
    const [formattedDate, setFormattedDate] = useState('');

    useEffect(() => {
        if (dateString) {
            setFormattedDate(new Date(dateString).toLocaleDateString('es-ES'));
        }
    }, [dateString]);

    return <>{formattedDate || ''}</>;
};


const StageCard = ({ stage, user, onClick, isSelected }: { stage: Stage; user?: User; onClick: () => void; isSelected: boolean }) => {
  const styles = statusStyles[stage.estado];

  return (
    <Card 
        onClick={onClick}
        className={cn(
            "w-64 shrink-0 cursor-pointer hover:shadow-lg transition-all border-t-4", 
            styles.border, 
            styles.bg,
            isSelected && 'ring-2 ring-primary ring-offset-2 ring-offset-background'
        )}>
      <CardHeader className="p-4 pb-2">
         <div className="flex items-center justify-between">
            <h3 className={cn("text-sm font-semibold uppercase tracking-wider", styles.text)}>{stage.estado.replace('_', ' ')}</h3>
             <div className={cn("text-xs font-semibold px-2 py-1 rounded-full text-primary-foreground", `bg-${styles.border.replace('border-','')}`)}>
                {stage.porcentaje}%
            </div>
         </div>
        <CardTitle className="text-lg font-headline pt-2">{stage.nombre}</CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0 space-y-4">
        <Progress value={stage.porcentaje} className="h-2" />
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={user?.avatar} alt={user?.name} />
              <AvatarFallback>{user?.name?.charAt(0)}</AvatarFallback>
            </Avatar>
            <span className="font-medium">{user?.name || 'Sin asignar'}</span>
          </div>
        </div>
        {(stage.fechaFinEstimada || stage.fechaFinReal) && (
            <div className="text-xs text-muted-foreground space-y-1 border-t pt-2 mt-2">
                {stage.fechaFinEstimada && <div>Estimado: <ClientSideDate dateString={stage.fechaFinEstimada} /></div>}
                {stage.fechaFinReal && <div className="font-semibold">Real: <ClientSideDate dateString={stage.fechaFinReal} /></div>}
            </div>
        )}
      </CardContent>
    </Card>
  );
};

export default function Roadmap({ stages, users, onStageClick, selectedStage }: RoadmapProps) {
  const getUser = (id: string) => users.find((u) => u.id === id);

  return (
    <div>
        <h2 className="text-2xl font-headline font-semibold mb-4">Hoja de Ruta</h2>
        <ScrollArea>
        <div className="flex space-x-4 pb-4">
            {stages.map((stage, index) => (
            <div key={index} className="flex items-center">
                <StageCard 
                    stage={stage} 
                    user={getUser(stage.responsableId)} 
                    onClick={() => onStageClick(stage.nombre as TaskComponent)}
                    isSelected={selectedStage === stage.nombre}
                />
                {index < stages.length - 1 && (
                <div className="w-8 h-px bg-border mx-2"></div>
                )}
            </div>
            ))}
        </div>
        <ScrollBar orientation="horizontal" />
        </ScrollArea>
    </div>
  );
}
