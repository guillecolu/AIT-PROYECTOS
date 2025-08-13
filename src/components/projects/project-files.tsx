

'use client';

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import type { Project, Part, Attachment } from '@/lib/types';
import { UploadCloud, File as FileIcon, Trash2, Link as LinkIcon, Loader2, FolderSearch, PlusCircle } from 'lucide-react';
import { Label } from '../ui/label';

interface ProjectFilesProps {
    project: Project;
    selectedPart: Part | null;
    onLinkAdd: (partId: string, url: string, name: string) => Promise<void>;
    onFileDelete: (partId: string, attachmentId: string) => Promise<void>;
}

const PartLinker = ({ part, onLinkAdd, onFileDelete }: { part: Part; onLinkAdd: (partId: string, url: string, name: string) => Promise<void>; onFileDelete: (partId: string, attachmentId: string) => Promise<void> }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [newLinkUrl, setNewLinkUrl] = useState('');
    const [newLinkName, setNewLinkName] = useState('');
    const { toast } = useToast();
    
    const handleAddLink = async () => {
        if (!newLinkUrl.trim() || !newLinkName.trim()) {
            toast({ variant: 'destructive', title: 'Error', description: 'Por favor, introduce un nombre y una URL para el enlace.' });
            return;
        }

        setIsLoading(true);
        try {
            await onLinkAdd(part.id, newLinkUrl, newLinkName);
            setNewLinkUrl('');
            setNewLinkName('');
            toast({ title: 'Enlace añadido', description: 'El enlace se ha guardado en el proyecto.' });
        } catch (error) {
            console.error("Link add error:", error);
            toast({ variant: 'destructive', title: 'Error al añadir', description: 'No se pudo guardar el enlace.' });
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleDelete = async (attachmentId: string) => {
         await onFileDelete(part.id, attachmentId);
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>{part.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex flex-col gap-4 rounded-lg border p-4">
                    <div className='space-y-1'>
                        <Label htmlFor="link-name">Nombre del Enlace</Label>
                        <Input 
                            id="link-name"
                            placeholder="Ej: Plano de montaje"
                            value={newLinkName}
                            onChange={(e) => setNewLinkName(e.target.value)}
                            disabled={isLoading}
                        />
                    </div>
                     <div className='space-y-1'>
                        <Label htmlFor="link-url">URL del Archivo</Label>
                        <Input 
                            id="link-url"
                            placeholder="https://ejemplo.com/documento.pdf"
                            value={newLinkUrl}
                            onChange={(e) => setNewLinkUrl(e.target.value)}
                            disabled={isLoading}
                        />
                    </div>
                    <Button onClick={handleAddLink} disabled={isLoading} className="self-end">
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                        {isLoading ? 'Añadiendo...' : 'Añadir Enlace'}
                    </Button>
                </div>

                {part.attachments && part.attachments.length > 0 && (
                    <div className="space-y-2">
                        <h4 className="font-medium text-sm">Enlaces Guardados</h4>
                        <div className="space-y-2 rounded-md border p-2">
                             {part.attachments.map(att => (
                                <div key={att.id} className="flex items-center gap-3 p-2 hover:bg-muted/50 rounded-md group">
                                    <LinkIcon className="h-5 w-5 text-muted-foreground" />
                                    <div className="flex-grow">
                                        <a href={att.url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium hover:underline truncate">{att.name}</a>
                                        <p className="text-xs text-muted-foreground">
                                            Añadido el {new Date(att.uploadedAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleDelete(att.id)}>
                                        <Trash2 className="h-4 w-4 text-destructive"/>
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};


export default function ProjectFiles({ project, selectedPart, onLinkAdd, onFileDelete }: ProjectFilesProps) {

    if (!selectedPart) {
        return (
            <Card>
                <CardContent className="p-6">
                     <div className="text-center py-16 text-muted-foreground flex flex-col items-center gap-4">
                        <FolderSearch className="h-12 w-12" />
                        <p className="font-semibold text-lg">Selecciona un parte</p>
                        <p className="text-sm">Elige un parte de la hoja de ruta para ver sus enlaces guardados.</p>
                    </div>
                </CardContent>
            </Card>
        );
    }
    
    return (
        <div>
             <PartLinker part={selectedPart} onLinkAdd={onLinkAdd} onFileDelete={onFileDelete} />
        </div>
    );
}
