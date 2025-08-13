
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
import { UploadCloud, File as FileIcon, Trash2, Link as LinkIcon, Loader2 } from 'lucide-react';

interface ProjectFilesProps {
    project: Project;
    onFileUpload: (partId: string, file: File) => Promise<void>;
    onFileDelete: (partId: string, attachmentId: string) => Promise<void>;
}

const PartFileDropzone = ({ part, onFileUpload, onFileDelete }: { part: Part; onFileUpload: (partId: string, file: File) => void; onFileDelete: (partId: string, attachmentId: string) => void }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };
    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
    };
    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            handleFileUpload(files[0]);
        }
    };
    
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            handleFileUpload(files[0]);
        }
    }

    const handleFileUpload = async (file: File) => {
        setIsLoading(true);
        try {
            await onFileUpload(part.id, file);
        } catch (error) {
            console.error("File upload error:", error);
            toast({ variant: 'destructive', title: 'Error al subir', description: 'No se pudo subir el archivo.' });
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
                <div
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={cn(
                        "relative flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg cursor-pointer transition-colors",
                        isDragging ? "border-primary bg-primary/10" : "border-border hover:border-primary/50 hover:bg-muted/50"
                    )}
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="h-8 w-8 text-primary animate-spin mb-2" />
                            <p className="text-sm text-muted-foreground">Subiendo...</p>
                        </>
                    ) : (
                        <>
                            <UploadCloud className="h-8 w-8 text-muted-foreground mb-2" />
                            <p className="text-sm text-muted-foreground">
                                <span className="font-semibold text-primary">Haz clic para subir</span> o arrastra y suelta un archivo
                            </p>
                            <p className="text-xs text-muted-foreground">Cualquier tipo de archivo</p>
                        </>
                    )}
                     <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        onChange={handleFileSelect}
                        disabled={isLoading}
                    />
                </div>

                {part.attachments && part.attachments.length > 0 && (
                    <div className="space-y-2">
                        <h4 className="font-medium text-sm">Archivos Subidos</h4>
                        <div className="space-y-2 rounded-md border p-2">
                             {part.attachments.map(att => (
                                <div key={att.id} className="flex items-center gap-3 p-2 hover:bg-muted/50 rounded-md group">
                                    <FileIcon className="h-5 w-5 text-muted-foreground" />
                                    <div className="flex-grow">
                                        <a href={att.url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium hover:underline truncate">{att.name}</a>
                                        <p className="text-xs text-muted-foreground">
                                            Subido el {new Date(att.uploadedAt).toLocaleDateString()}
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


export default function ProjectFiles({ project, onFileUpload, onFileDelete }: ProjectFilesProps) {

    if (!project.parts || project.parts.length === 0) {
        return (
            <Card>
                <CardContent className="p-6">
                    <Alert>
                        <AlertTitle>No hay partes en este proyecto</AlertTitle>
                        <AlertDescription>
                            Para poder adjuntar archivos, primero debes crear al menos un parte para el proyecto en la pestaña "Departamento".
                        </AlertDescription>
                    </Alert>
                </CardContent>
            </Card>
        );
    }
    
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {project.parts.map(part => (
                <PartFileDropzone key={part.id} part={part} onFileUpload={onFileUpload} onFileDelete={onFileDelete} />
            ))}
        </div>
    );
}
