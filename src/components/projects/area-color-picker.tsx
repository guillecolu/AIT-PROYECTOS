
'use client';

import { useState, useEffect } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Palette, X, Save } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AreaColor } from '@/lib/types';
import { Label } from '../ui/label';

interface AreaColorPickerProps {
    areaName: string;
    currentColor: AreaColor;
    onSave: (colorData: AreaColor) => Promise<void>;
}

export default function AreaColorPicker({ areaName, currentColor, onSave }: AreaColorPickerProps) {
    const [bgColor, setBgColor] = useState(currentColor.bgColor);
    const [textColor, setTextColor] = useState(currentColor.textColor);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        setBgColor(currentColor.bgColor);
        setTextColor(currentColor.textColor);
    }, [currentColor]);
    
    const handleSave = (e: React.MouseEvent) => {
        e.stopPropagation();
        const newColorData: AreaColor = {
            ...currentColor,
            bgColor,
            textColor,
        };
        onSave(newColorData);
        setIsOpen(false);
    }

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                 <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 opacity-0 group-hover:opacity-100"
                    onClick={(e) => { e.stopPropagation(); setIsOpen(true); }}
                    style={{ color: currentColor.textColor }}
                >
                    <Palette className="h-4 w-4" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-4" onClick={(e) => e.stopPropagation()}>
                <div className="flex flex-col gap-4">
                    <Label>Editar colores para: <span className="font-bold">{areaName}</span></Label>
                    
                    <div className="grid grid-cols-[auto_1fr] items-center gap-x-2 gap-y-3">
                        <Label htmlFor="bg-color" className="text-right">Fondo</Label>
                        <Input id="bg-color" type="text" value={bgColor} onChange={(e) => setBgColor(e.target.value)} />

                        <Label htmlFor="text-color" className="text-right">Texto</Label>
                        <Input id="text-color" type="text" value={textColor} onChange={(e) => setTextColor(e.target.value)} />
                    </div>
                    
                    <div className="mt-2 p-4 rounded-md" style={{ backgroundColor: bgColor, color: textColor }}>
                        Texto de ejemplo
                    </div>

                    <Button onClick={handleSave}>
                        <Save className="mr-2 h-4 w-4" />
                        Guardar Cambios
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    );
};
