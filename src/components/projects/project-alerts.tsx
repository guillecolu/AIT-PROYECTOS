

'use client';

import type { ProjectAlerts } from '@/lib/types';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { AlertTriangle, Clock, UserX, ShieldAlert } from 'lucide-react';

interface ProjectAlertsProps {
    alerts: ProjectAlerts | undefined;
}

const alertConfig = {
    atrasadas: {
        label: "Atrasadas",
        icon: AlertTriangle,
        color: "bg-red-100 text-red-800 border-red-200 hover:bg-red-200",
        actionLabel: "Ver Atrasadas"
    },
    proximas: {
        label: "Vencen Pronto",
        icon: Clock,
        color: "bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200",
        actionLabel: "Ver Próximas"
    },
    sinAsignar: {
        label: "Sin Asignar",
        icon: UserX,
        color: "bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200",
        actionLabel: "Ver Sin Asignar"
    },
    bloqueadas: {
        label: "Bloqueadas",
        icon: ShieldAlert,
        color: "bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-200",
        actionLabel: "Ver Bloqueadas"
    }
}

export default function ProjectAlerts({ alerts }: ProjectAlertsProps) {
    if (!alerts || !alerts.counters) {
        return null;
    }
    
    const alertEntries = Object.entries(alerts.counters)
        .map(([key, value]) => ({ key, value }))
        .filter(item => item.value > 0);

    if (alertEntries.length === 0) {
        return null; // Or a "no alerts" message
    }

    return (
        <div className="bg-muted/50 p-3 rounded-lg border">
            <div className="flex items-center gap-4">
                <h4 className="text-sm font-semibold text-muted-foreground flex-shrink-0">Alertas Activas:</h4>
                <div className="flex flex-wrap items-center gap-3">
                    {alertEntries.map(({ key, value }) => {
                        const config = alertConfig[key as keyof typeof alertConfig];
                        if (!config) return null;
                        const Icon = config.icon;
                        return (
                            <Button key={key} variant="secondary" size="sm" className={`h-8 ${config.color}`}>
                                <Icon className="h-4 w-4 mr-2" />
                                {config.label}
                                <Badge variant="secondary" className="ml-2 bg-white/70 text-inherit">{value}</Badge>
                            </Button>
                        )
                    })}
                </div>
            </div>
        </div>
    );
}
