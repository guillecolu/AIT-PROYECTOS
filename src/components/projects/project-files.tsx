

'use client';

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import type { Project, Part, Attachment } from '@/lib/types';
import { UploadCloud, File as FileIcon, Trash2, Link as LinkIcon, Loader2, FolderSearch, CheckCircle } from 'lucide-react';
import { Progress } from '../ui/progress';

interface ProjectFilesProps {
    project: Project;
    selectedPart: Part | null;
    onFileUpload: (partId: string, file: File) => Promise<void>;
    onFileDelete: (partId: string, attachmentId: string) => Promise<void>;
}

const PartFileDropzone = ({ part, onFileUpload, onFileDelete }: { part: Part; onFileUpload: (partId: string, file: File) => Promise<void>; onFileDelete: (partId: string, attachmentId: string) => Promise<void> }) => {
    const [isUploading, setIsUploading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
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

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFiles(e.dataTransfer.files);
            e.dataTransfer.clearData();
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            handleFiles(e.target.files);
        }
    };
    
    const handleFiles = (files: FileList) => {
        const file = files[0];
        if (!file) return;

        // Validaciones
        const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
        if (!allowedTypes.includes(file.type)) {
            toast({ variant: 'destructive', title: 'Tipo de archivo no permitido', description: 'Solo se permiten archivos PDF, PNG, JPG, DOCX, XLSX.' });
            return;
        }
        if (file.size > 20 * 1024 * 1024) { // 20MB
            toast({ variant: 'destructive', title: 'Archivo demasiado grande', description: 'El tamaño máximo permitido es de 20MB.' });
            return;
        }

        uploadFile(file);
    };

    const uploadFile = async (file: File) => {
        setIsUploading(true);
        setUploadProgress(0);
        try {
            await onFileUpload(part.id, file);
            toast({ title: 'Archivo subido', description: `"${file.name}" se ha guardado en el proyecto.` });
        } catch (error: any) {
            console.error("Upload error:", error);
            toast({ variant: 'destructive', title: 'Error al subir', description: error.message || 'No se pudo subir el archivo.' });
        } finally {
            setIsUploading(false);
        }
    };

    const handleDelete = async (attachmentId: string) => {
         await onFileDelete(part.id, attachmentId);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>{part.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div 
                    className={cn(
                        "relative flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg cursor-pointer transition-colors",
                        isDragging ? "border-primary bg-primary/10" : "border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/50"
                    )}
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        onChange={handleFileSelect}
                        disabled={isUploading}
                    />
                    {isUploading ? (
                        <div className="text-center">
                            <Loader2 className="mx-auto h-10 w-10 text-primary animate-spin mb-2" />
                            <p className="font-medium">Subiendo...</p>
                            <Progress value={uploadProgress} className="w-40 mt-2" />
                        </div>
                    ) : (
                        <div className="text-center text-muted-foreground">
                            <UploadCloud className="mx-auto h-10 w-10 mb-2" />
                            <p className="font-medium">Arrastra y suelta archivos aquí</p>
                            <p className="text-sm">o haz clic para seleccionar (Máx 20MB)</p>
                        </div>
                    )}
                </div>

                {part.attachments && part.attachments.length > 0 && (
                    <div className="space-y-2">
                        <h4 className="font-medium text-sm">Archivos Guardados</h4>
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


export default function ProjectFiles({ project, selectedPart, onFileUpload, onFileDelete }: ProjectFilesProps) {

    if (!selectedPart) {
        return (
            <Card>
                <CardContent className="p-6">
                     <div className="text-center py-16 text-muted-foreground flex flex-col items-center gap-4">
                        <FolderSearch className="h-12 w-12" />
                        <p className="font-semibold text-lg">Selecciona un parte</p>
                        <p className="text-sm">Elige un parte de la hoja de ruta para ver o subir sus archivos.</p>
                    </div>
                </CardContent>
            </Card>
        );
    }
    
    return (
        <div>
             <PartFileDropzone part={selectedPart} onFileUpload={onFileUpload} onFileDelete={onFileDelete} />
        </div>
    );
}
