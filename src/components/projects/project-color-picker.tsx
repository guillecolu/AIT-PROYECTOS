
'use client';

import { useState, useEffect } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Palette, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Project } from '@/lib/types';
import { Label } from '../ui/label';

interface ProjectColorPickerProps {
    project: Project;
    onColorChange: (color: string) => void;
    triggerButtonSize?: 'icon' | 'default';
    triggerClassName?: string;
}

export default function ProjectColorPicker({ project, onColorChange, triggerButtonSize = 'icon', triggerClassName }: ProjectColorPickerProps) {
    const [color, setColor] = useState(project.color || '#D51A1A'); // Default to primary if no color
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        setColor(project.color || '#D51A1A');
    }, [project.color]);
    
    const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newColor = e.target.value;
        setColor(newColor);
        onColorChange(newColor);
    }

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
                <div className="flex flex-col gap-4">
                    <Label>Elige un color para el proyecto</Label>
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <input 
                                type="color"
                                value={color}
                                onChange={handleColorChange}
                                className="w-10 h-10 p-0 border-none rounded-md cursor-pointer appearance-none"
                                style={{backgroundColor: 'transparent'}}
                            />
                             <div className="absolute inset-0 -z-10 rounded-md" style={{backgroundColor: color}}></div>
                        </div>
                        <Input
                            type="text"
                            value={color}
                            onChange={handleColorChange}
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
