
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import type { Project, ProjectStatus, User } from '@/lib/types';
import { cn } from '@/lib/utils';
import { differenceInDays } from 'date-fns';
import { UserSquare, Trash2, AlertTriangle, Palette, RotateCcw, Trash } from 'lucide-react';
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
import { Button, buttonVariants } from '../ui/button';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useData } from '@/hooks/use-data';
import ProjectColorPicker from '../projects/project-color-picker';

const statusStyles: Record<ProjectStatus, string> = {
    activo: 'border-t-primary',
    pausado: 'border-t-status-pending',
    cerrado: 'border-t-status-complete',
    eliminado: 'border-t-destructive'
};

const statusBadgeClasses: Record<ProjectStatus, string> = {
    activo: 'bg-green-100 text-green-800 border-green-200',
    pausado: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    cerrado: 'bg-gray-100 text-gray-800 border-gray-200',
    eliminado: 'bg-red-100 text-red-800 border-red-200',
};

export default function ProjectCard({ project, users }: { project: Project, users: User[] }) {
    const { id, name, client, status, progress, deliveryDate, projectManagerId, isUrgent, color } = project;
    const { toast } = useToast();
    const { deleteProject, saveProject } = useData();
    const [isDeleting, setIsDeleting] = useState(false);
    const [isRestoring, setIsRestoring] = useState(false);
    const daysRemaining = differenceInDays(new Date(deliveryDate), new Date());
    const projectManager = users.find(u => u.id === projectManagerId);

    let deliveryText = '';
    if (status === 'cerrado') {
        deliveryText = 'Completado';
    } else if (daysRemaining < 0) {
        deliveryText = `Retrasado por ${Math.abs(daysRemaining)} días`;
    } else {
        deliveryText = `Faltan ${daysRemaining} días`;
    }

    const handleSoftDelete = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDeleting(true);
        try {
            await saveProject({ ...project, status: 'eliminado' });
            toast({ title: "Proyecto Movido a Eliminados", description: `El proyecto "${name}" se ha movido a la papelera.` });
        } catch (error) {
            console.error("Error moving project to deleted:", error);
            toast({ variant: "destructive", title: "Error", description: "No se pudo mover el proyecto." });
        } finally {
            setIsDeleting(false);
        }
    };
    
     const handlePermanentDelete = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDeleting(true);
        try {
            await deleteProject(id);
            toast({ title: "Proyecto Eliminado Permanentemente", description: `El proyecto "${name}" ha sido eliminado para siempre.` });
        } catch (error) {
            console.error("Error deleting project permanently:", error);
            toast({ variant: "destructive", title: "Error", description: "No se pudo eliminar el proyecto." });
        } finally {
            setIsDeleting(false);
        }
    };

    const handleRestore = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsRestoring(true);
        try {
            await saveProject({ ...project, status: 'activo' });
            toast({ title: "Proyecto Restaurado", description: `El proyecto "${name}" ha vuelto a estar activo.` });
        } catch (error) {
            console.error("Error restoring project:", error);
            toast({ variant: "destructive", title: "Error", description: "No se pudo restaurar el proyecto." });
        } finally {
            setIsRestoring(false);
        }
    };
    
    const toggleUrgent = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        try {
            await saveProject({ ...project, isUrgent: !isUrgent });
        } catch (error) {
            console.error("Error toggling urgent status:", error);
            toast({ variant: "destructive", title: "Error", description: "No se pudo actualizar el estado de urgencia." });
        }
    };
    
    const handleColorChange = async (newColor: string) => {
        await saveProject({ ...project, color: newColor });
    };

    const getBorderColorClass = () => {
        if (isUrgent) return 'border-t-destructive';
        if (color) return ''; // We will use inline style for custom color
        return statusStyles[status];
    };

    const getBorderStyle = () => {
        if (isUrgent || !color) return {};
        return { borderTopColor: color, '--project-card-color': color } as React.CSSProperties;
    };
    
    const cardContent = (
        <>
            <CardHeader className="p-4">
                <div className="flex justify-between items-start">
                    <CardTitle className="font-headline text-base mb-1 pr-8">{name}</CardTitle>
                    <div className="flex items-center gap-2">
                        {isUrgent && <AlertTriangle className="h-4 w-4 text-destructive" />}
                        <Badge variant="outline" className={cn("capitalize flex-shrink-0 transition-none", statusBadgeClasses[status])}>{status}</Badge>
                    </div>
                </div>
                <CardDescription>{client}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow space-y-2 p-4 pt-0">
                <div className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Progreso</span>
                        <span>{progress}%</span>
                    </div>
                    <Progress value={progress} aria-label={`${progress}% completado`} className={cn("h-1.5", isUrgent && '[&>div]:bg-destructive')} indicatorStyle={{ backgroundColor: !isUrgent && color ? color : undefined }}/>
                </div>
                {projectManager && (
                    <div className="flex items-center text-xs text-muted-foreground pt-2 border-t border-dashed">
                    <UserSquare className="h-3 w-3 mr-2" />
                    <span className="mr-1">Jefe de Proyecto:</span>
                    <span className="font-medium text-foreground">{projectManager.name}</span>
                    </div>
                )}
            </CardContent>
            <CardFooter className="p-4 pt-0 flex justify-between items-center">
                 <div className={cn(
                    "text-xs text-muted-foreground",
                    status !== 'cerrado' && daysRemaining < 0 && "text-destructive font-semibold"
                )}>
                    {status === 'eliminado' ? 'En la papelera' : deliveryText}
                </div>
                {status === 'eliminado' ? (
                     <div className="flex items-center gap-1">
                         <Button variant="outline" size="sm" onClick={handleRestore} disabled={isRestoring}>
                            <RotateCcw className="h-3 w-3 mr-1.5" />
                            {isRestoring ? 'Restaurando...' : 'Restaurar'}
                        </Button>
                         <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="sm" disabled={isDeleting}>
                                    <Trash className="h-3 w-3 mr-1.5" />
                                    Eliminar
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                <AlertDialogTitle>¿Estás ABSOLUTAMENTE seguro?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Esta acción no se puede deshacer. Esto eliminará permanentemente el proyecto y todas sus tareas asociadas para siempre.
                                </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={handlePermanentDelete} disabled={isDeleting} className={buttonVariants({ variant: "destructive" })}>
                                    {isDeleting ? "Eliminando..." : "Sí, eliminar permanentemente"}
                                </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                     </div>
                ) : (
                    <div className="flex items-center gap-1" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                        <ProjectColorPicker project={project} onColorChange={handleColorChange} triggerButtonSize='icon' triggerClassName='h-7 w-7'/>
                        {status !== 'cerrado' && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={toggleUrgent}
                            >
                                <AlertTriangle className={cn("h-4 w-4 text-muted-foreground", isUrgent && "text-destructive fill-destructive/20")} />
                            </Button>
                        )}
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-7 w-7"
                                >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                <AlertDialogTitle>¿Mover proyecto a la papelera?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    El proyecto <span className="font-bold">{name}</span> se moverá a la sección de "Eliminados". Podrás restaurarlo o eliminarlo permanentemente desde allí.
                                </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={handleSoftDelete} disabled={isDeleting}>
                                    {isDeleting ? "Moviendo..." : "Sí, mover a la papelera"}
                                </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                )}
            </CardFooter>
        </>
    );

    return (
         <Card 
            className={cn(
                "group relative hover:shadow-lg transition-all duration-300 h-full flex flex-col border-t-4",
                status === 'eliminado' ? 'opacity-80 hover:opacity-100' : 'hover:scale-105 active:scale-95',
                getBorderColorClass()
            )}
            style={getBorderStyle()}
        >
            {status !== 'eliminado' ? (
                 <Link href={`/dashboard/projects/${id}`} className="flex flex-col flex-grow h-full transition-transform duration-200 ease-in-out ">
                    {cardContent}
                 </Link>
            ) : (
                <div className="flex flex-col flex-grow h-full">
                    {cardContent}
                </div>
            )}
        </Card>
    );
}
