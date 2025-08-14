
'use client';

import { useState, useEffect } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Palette, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Project } from '@/lib/types';
import { Label } from '../ui/label';
import { HexColorPicker } from 'react-colorful';
import { useDebounce } from '@/hooks/use-debounce';


interface ProjectColorPickerProps {
    project: Project;
    onColorChange: (color: string) => void;
    triggerButtonSize?: 'icon' | 'default';
    triggerClassName?: string;
}

export default function ProjectColorPicker({ project, onColorChange, triggerButtonSize = 'icon', triggerClassName }: ProjectColorPickerProps) {
    const [color, setColor] = useState(project.color || '#D51A1A');
    const [isOpen, setIsOpen] = useState(false);
    const debouncedColor = useDebounce(color, 200);

    useEffect(() => {
        setColor(project.color || '#D51A1A');
    }, [project.color, isOpen]);

    useEffect(() => {
        if (debouncedColor !== project.color) {
            onColorChange(debouncedColor);
        }
    }, [debouncedColor, onColorChange, project.color]);
    
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
                    <Label>Elige un color para el proyecto</Label>
                    
                    <HexColorPicker color={color} onChange={setColor} />

                    <div className="flex items-center gap-2 w-full pt-2">
                        <div className="w-8 h-8 rounded-md border" style={{backgroundColor: color}}></div>
                        <Input
                            type="text"
                            value={color}
                            onChange={(e) => setColor(e.target.value)}
                            className="flex-1 h-10"
                            />
                        <Button variant="ghost" size="icon" onClick={clearColor}>
                            <X className="h-4 w-4 text-muted-foreground" />
                            <span className="sr-only">Quitar color</span>
                        </Button>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
};
