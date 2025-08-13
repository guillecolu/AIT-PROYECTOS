

'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { useData } from '@/hooks/use-data';
import { useToast } from '@/hooks/use-toast';
import { Image as ImageIcon, Loader2 } from 'lucide-react';
import Image from 'next/image';

export default function LogoManager() {
  const { appConfig, saveAppConfig, uploadFile } = useData();
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(appConfig.logoUrl);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    if (!selectedFile) {
      toast({
        variant: 'destructive',
        title: 'Ningún archivo seleccionado',
        description: 'Por favor, elige un archivo de imagen para el logo.',
      });
      return;
    }

    setIsLoading(true);
    try {
      const logoUrl = await uploadFile(selectedFile, `uploads/app/logo/${selectedFile.name}`);
      await saveAppConfig({ logoUrl });
      toast({
        title: '¡Logo guardado!',
        description: 'El nuevo logo de la aplicación se ha guardado correctamente.',
      });
      setIsOpen(false);
    } catch (error) {
      console.error('Error al guardar el logo:', error);
      toast({
        variant: 'destructive',
        title: 'Error al guardar',
        description: 'No se pudo subir o guardar el nuevo logo.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <button className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50">
          <ImageIcon className="h-4 w-4" />
          Cambiar Logo
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Gestionar Logo de la Aplicación</DialogTitle>
          <DialogDescription>
            Sube un nuevo logo para la aplicación. Este logo aparecerá en el inicio de sesión y en la cabecera.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
            <div className="flex items-center justify-center p-4 border-2 border-dashed rounded-md h-32">
                {preview ? (
                    <Image src={preview} alt="Vista previa del logo" width={150} height={100} style={{ objectFit: 'contain' }} />
                ) : (
                    <span className="text-muted-foreground">Vista previa</span>
                )}
            </div>
            <Input type="file" accept="image/*" onChange={handleFileChange} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isLoading}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isLoading || !selectedFile}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {isLoading ? 'Guardando...' : 'Guardar Logo'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
