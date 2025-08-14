

'use client';

import { useState, useEffect } from 'react';
import type { Project, ProjectAlerts, Task, User } from '@/lib/types';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { AlertTriangle, Clock, UserX, ShieldAlert } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { startOfDay, addDays, isBefore, endOfDay } from 'date-fns';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ProjectAlertsProps {
    alerts: ProjectAlerts | undefined;
    project: Project;
    tasks: Task[];
    users: User[];
}

const alertConfig = {
    atrasadas: {
        label: "Atrasadas",
        icon: AlertTriangle,
        color: "bg-red-100 text-red-800 border-red-200 hover:bg-red-200",
        description: "Tareas cuya fecha de entrega ya ha pasado y no están finalizadas."
    },
    proximas: {
        label: "Vencen Pronto",
        icon: Clock,
        color: "bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200",
        description: "Tareas que vencen en los próximos 3 días."
    },
    sinAsignar: {
        label: "Sin Asignar",
        icon: UserX,
        color: "bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200",
        description: "Tareas que no tienen un responsable asignado."
    },
    bloqueadas: {
        label: "Bloqueadas",
        icon: ShieldAlert,
        color: "bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-200",
        description: "Tareas que han sido marcadas como bloqueadas."
    }
};

const ClientSideDate = ({ dateString }: { dateString: string }) => {
    const [formattedDate, setFormattedDate] = useState('');

    useEffect(() => {
        if (dateString) {
            setFormattedDate(format(new Date(dateString), 'dd/MM/yyyy', { locale: es }));
        }
    }, [dateString]);

    return <>{formattedDate}</>;
};


export default function ProjectAlerts({ alerts, project, tasks, users }: ProjectAlertsProps) {
    const [selectedAlertType, setSelectedAlertType] = useState<keyof typeof alertConfig | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    if (!alerts || !alerts.counters) {
        return null;
    }
    
    const alertEntries = Object.entries(alerts.counters)
        .map(([key, value]) => ({ key: key as keyof typeof alertConfig, value }))
        .filter(item => item.value > 0);

    if (alertEntries.length === 0) {
        return null; // Or a "no alerts" message
    }

    const getFilteredTasks = () => {
        if (!selectedAlertType) return [];
        
        const hoy = new Date();
        const comienzoHoy = startOfDay(hoy);
        const finalHoy = endOfDay(hoy);
        const proximasLimite = addDays(comienzoHoy, 3);
        const isDone = (task: Task) => task.status === 'finalizada';

        switch(selectedAlertType) {
            case 'atrasadas':
                return tasks.filter(t => t.deadline && isBefore(new Date(t.deadline), comienzoHoy) && !isDone(t));
            case 'proximas':
                 return tasks.filter(t => {
                    if (!t.deadline || isDone(t)) return false;
                    const deadlineDate = new Date(t.deadline);
                    return deadlineDate > finalHoy && deadlineDate <= proximasLimite;
                });
            case 'sinAsignar':
                return tasks.filter(t => !t.assignedToId && !isDone(t));
            case 'bloqueadas':
                 return tasks.filter(t => t.blocked === true);
            default:
                return [];
        }
    };
    
    const selectedAlertConfig = selectedAlertType ? alertConfig[selectedAlertType] : null;
    const filteredTasks = getFilteredTasks();
    const getUserName = (id?: string) => users.find(u => u.id === id)?.name || 'Sin asignar';


    return (
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <div className="bg-muted/50 p-3 rounded-lg border">
                <div className="flex items-center gap-4">
                    <h4 className="text-sm font-semibold text-muted-foreground flex-shrink-0">Alertas Activas:</h4>
                    <div className="flex flex-wrap items-center gap-3">
                        {alertEntries.map(({ key, value }) => {
                            const config = alertConfig[key as keyof typeof alertConfig];
                            if (!config) return null;
                            const Icon = config.icon;
                            return (
                                <Button 
                                    key={key}
                                    variant="secondary" 
                                    size="sm" 
                                    className={`h-8 ${config.color}`}
                                    onClick={() => {
                                        setSelectedAlertType(key);
                                        setIsModalOpen(true);
                                    }}
                                >
                                    <Icon className="h-4 w-4 mr-2" />
                                    {config.label}
                                    <Badge variant="secondary" className="ml-2 bg-white/70 text-inherit">{value}</Badge>
                                </Button>
                            )
                        })}
                    </div>
                </div>
            </div>
            <DialogContent className="sm:max-w-3xl">
                <DialogHeader>
                    {selectedAlertConfig && (
                        <>
                            <DialogTitle className="flex items-center gap-2 text-xl">
                                <selectedAlertConfig.icon className={`h-6 w-6 ${alertConfig[selectedAlertType!].color.replace('bg-', 'text-').replace('-100', '-800')}`} />
                                {selectedAlertConfig.label}
                            </DialogTitle>
                            <DialogDescription>
                                {selectedAlertConfig.description}
                            </DialogDescription>
                        </>
                    )}
                </DialogHeader>
                <div className="max-h-[60vh] overflow-y-auto my-4 pr-2">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Tarea</TableHead>
                                <TableHead>Parte</TableHead>
                                <TableHead>Asignado a</TableHead>
                                <TableHead>Fecha Entrega</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredTasks.length > 0 ? filteredTasks.map(task => (
                                <TableRow key={task.id}>
                                    <TableCell className="font-medium">{task.title}</TableCell>
                                    <TableCell className="text-muted-foreground">{project.parts.find(p => p.id === task.partId)?.name}</TableCell>
                                    <TableCell className="text-muted-foreground">{getUserName(task.assignedToId)}</TableCell>
                                    <TableCell className="text-muted-foreground"><ClientSideDate dateString={task.deadline} /></TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center">
                                        No hay tareas que cumplan este criterio.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cerrar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
