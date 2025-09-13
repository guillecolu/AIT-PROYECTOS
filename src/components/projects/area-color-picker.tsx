
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Palette, Save, Droplet } from 'lucide-react';
import type { AreaColor } from '@/lib/types';
import { Label } from '../ui/label';
import { useData } from '@/hooks/use-data';
import { HexColorPicker } from 'react-colorful';

interface AreaColorPickerProps {
    areaName: string;
}

export default function AreaColorPicker({ areaName }: AreaColorPickerProps) {
    const { areaColors, saveAreaColor } = useData();
    
    const currentColors = useMemo(() => {
        if (!areaColors) return null;
        return areaColors.find(c => c.name === areaName) || areaColors.find(c => c.name === 'default');
    }, [areaColors, areaName]);
    
    const [bgColor, setBgColor] = useState(currentColors?.bgColor || '#ffffff');
    const [textColor, setTextColor] = useState(currentColors?.textColor || '#000000');
    const [isOpen, setIsOpen] = useState(false);
    
    useEffect(() => {
        if (currentColors && !isOpen) {
            setBgColor(currentColors.bgColor);
            setTextColor(currentColors.textColor);
        }
    }, [currentColors, isOpen]);

    const handleSave = useCallback(() => {
        if (!currentColors) return;

        const newColorData: AreaColor = {
            ...currentColors,
            name: areaName,
            bgColor: bgColor,
            textColor: textColor,
        };
        saveAreaColor(newColorData);
        setIsOpen(false);
    }, [areaName, bgColor, textColor, currentColors, saveAreaColor]);

    if (!currentColors) return null;

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 opacity-0 group-hover:opacity-100"
                    onClick={(e) => { e.stopPropagation(); setIsOpen(true); }}
                    style={{ color: currentColors.textColor }}
                >
                    <Palette className="h-4 w-4" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-4" onClick={(e) => e.stopPropagation()}>
                <div className="flex flex-col gap-4">
                    <Label className="text-base">Editar colores para: <span className="font-bold">{areaName}</span></Label>
                    
                    <div className="mt-2 p-4 rounded-md text-center border" style={{ backgroundColor: bgColor, color: textColor }}>
                        Texto de ejemplo
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-sm">Color de Fondo</Label>
                            <HexColorPicker color={bgColor} onChange={setBgColor} />
                            <Input type="text" value={bgColor} onChange={(e) => setBgColor(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                             <Label className="text-sm">Color de Texto</Label>
                             <HexColorPicker color={textColor} onChange={setTextColor} />
                             <Input type="text" value={textColor} onChange={(e) => setTextColor(e.target.value)} />
                        </div>
                    </div>

                    <Button onClick={handleSave} className="w-full mt-2">
                        <Save className="mr-2 h-4 w-4" />
                        Guardar Cambios
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    );
};
