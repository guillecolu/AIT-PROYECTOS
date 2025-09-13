
'use client';

import { useState, useEffect } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Palette, Save, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Project } from '@/lib/types';
import { HexColorPicker } from 'react-colorful';
import { Label } from '../ui/label';

interface ProjectColorPickerProps {
    project: Project;
    onColorChange: (color: string) => void;
    triggerButtonSize?: 'icon' | 'default';
    triggerClassName?: string;
}

export default function ProjectColorPicker({ project, onColorChange, triggerButtonSize = 'icon', triggerClassName }: ProjectColorPickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [draftColor, setDraftColor] = useState(project.color || '');

    useEffect(() => {
        // This effect ensures that if the picker is closed, or if the project color prop changes from outside,
        // the draft color is updated to reflect the source of truth (project.color).
        if (!isOpen) {
             setDraftColor(project.color || '');
        }
    }, [project.color, isOpen]);
    
    const handleSave = () => {
        onColorChange(draftColor);
        setIsOpen(false);
    };

    const clearColor = (e: React.MouseEvent) => {
        e.stopPropagation();
        onColorChange('');
        setIsOpen(false);
    }

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" size={triggerButtonSize} className={cn(triggerClassName)}>
                    <Palette className="h-4 w-4" />
                    <span className="sr-only">Cambiar color</span>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-4" onClick={(e) => e.stopPropagation()}>
                <div className="flex flex-col gap-4 items-center">
                    <div className="flex justify-between items-center w-full">
                        <Label>Elige un color para el proyecto</Label>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={clearColor}>
                            <X className="h-4 w-4 text-muted-foreground" />
                            <span className="sr-only">Quitar color</span>
                        </Button>
                    </div>
                    
                    <HexColorPicker color={draftColor} onChange={setDraftColor} />

                    <Input 
                        type="text" 
                        value={draftColor}
                        onChange={(e) => setDraftColor(e.target.value)}
                        className="w-full"
                    />

                    <Button onClick={handleSave} className="w-full mt-2">
                        <Save className="mr-2 h-4 w-4" />
                        Guardar Color
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    );
};
