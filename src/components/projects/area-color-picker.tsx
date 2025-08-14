
'use client';

import { useState, useEffect } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Palette, Save } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AreaColor } from '@/lib/types';
import { Label } from '../ui/label';
import { defaultAreaColors } from '@/lib/colors';
import { ScrollArea } from '../ui/scroll-area';
import { useData } from '@/hooks/use-data';

interface AreaColorPickerProps {
    areaName: string;
    onSave: (colorData: AreaColor) => Promise<void>;
}

export default function AreaColorPicker({ areaName, onSave }: AreaColorPickerProps) {
    const { areaColors } = useData();
    const currentColor = areaColors?.find(c => c.name === areaName) || areaColors?.find(c => c.name === 'default');

    const [bgColor, setBgColor] = useState(currentColor?.bgColor || '');
    const [textColor, setTextColor] = useState(currentColor?.textColor || '');
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        if (isOpen) {
            const current = areaColors?.find(c => c.name === areaName) || areaColors?.find(c => c.name === 'default');
            if (current) {
                setBgColor(current.bgColor);
                setTextColor(current.textColor);
            }
        }
    }, [areaName, isOpen, areaColors]);
    
    if (!currentColor) {
        return null; // Should not happen if areaColors is loaded
    }

    const handleSave = (e: React.MouseEvent) => {
        e.stopPropagation();
        const newColorData: AreaColor = {
            ...currentColor,
            name: areaName, // Ensure we are saving for the correct area
            bgColor,
            textColor,
        };
        onSave(newColorData);
        setIsOpen(false);
    }
    
    const handlePaletteSelect = (color: AreaColor) => {
        setBgColor(color.bgColor);
        setTextColor(color.textColor);
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
            <PopoverContent className="w-96 p-4" onClick={(e) => e.stopPropagation()}>
                <div className="flex flex-col gap-4">
                    <Label className="text-base">Editar colores para: <span className="font-bold">{areaName}</span></Label>
                    
                    <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Elegir de la paleta</Label>
                        <ScrollArea className="h-32 pr-3">
                            <div className="grid grid-cols-6 gap-2">
                                {defaultAreaColors.filter(c => c.name !== 'default').map(color => (
                                    <button
                                        key={color.name}
                                        className={cn(
                                            "h-10 w-10 rounded-md border flex items-center justify-center text-xs transition-transform hover:scale-110",
                                            (color.bgColor === bgColor && color.textColor === textColor) && "ring-2 ring-ring ring-offset-2"
                                        )}
                                        style={{ backgroundColor: color.bgColor, color: color.textColor }}
                                        onClick={() => handlePaletteSelect(color)}
                                        title={color.name}
                                    >
                                        Aa
                                    </button>
                                ))}
                            </div>
                        </ScrollArea>
                    </div>


                    <div className="mt-2 p-4 rounded-md text-center" style={{ backgroundColor: bgColor, color: textColor }}>
                        Texto de ejemplo
                    </div>
                    
                    <div className="space-y-2">
                         <Label className="text-xs text-muted-foreground">Personalizar</Label>
                        <div className="grid grid-cols-[auto_1fr] items-center gap-x-2 gap-y-3">
                            <Label htmlFor="bg-color" className="text-right">Fondo</Label>
                            <Input id="bg-color" type="text" value={bgColor} onChange={(e) => setBgColor(e.target.value)} />

                            <Label htmlFor="text-color" className="text-right">Texto</Label>
                            <Input id="text-color" type="text" value={textColor} onChange={(e) => setTextColor(e.target.value)} />
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
