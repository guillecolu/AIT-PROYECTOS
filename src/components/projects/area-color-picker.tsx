
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Palette, Save, Droplet } from 'lucide-react';
import type { AreaColor } from '@/lib/types';
import { Label } from '../ui/label';
import { useData } from '@/hooks/use-data';
import { HexColorPicker } from 'react-colorful';
import { useDebounce } from '@/hooks/use-debounce';

interface AreaColorPickerProps {
    areaName: string;
}

export default function AreaColorPicker({ areaName }: AreaColorPickerProps) {
    const { areaColors, saveAreaColor } = useData();
    
    const [bgColor, setBgColor] = useState('#ffffff');
    const [textColor, setTextColor] = useState('#000000');
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        if (isOpen && areaColors) {
            const current = areaColors.find(c => c.name === areaName) || areaColors.find(c => c.name === 'default');
            if (current) {
                setBgColor(current.bgColor);
                setTextColor(current.textColor);
            }
        }
    }, [areaName, isOpen, areaColors]);

    const handleSave = useCallback(() => {
        const current = areaColors?.find(c => c.name === areaName) || areaColors?.find(c => c.name === 'default');
        if (!current) return;

        const newColorData: AreaColor = {
            ...current,
            name: areaName,
            bgColor,
            textColor,
        };
        saveAreaColor(newColorData);
        setIsOpen(false);
    }, [areaName, bgColor, textColor, areaColors, saveAreaColor]);

    const DebouncedColorPicker = ({ color, setColor }: { color: string, setColor: (color: string) => void }) => {
        const [pickerColor, setPickerColor] = useState(color);
        const debouncedColor = useDebounce(pickerColor, 200);

        useEffect(() => {
            setColor(debouncedColor);
        }, [debouncedColor, setColor]);

        return <HexColorPicker color={pickerColor} onChange={setPickerColor} />;
    }

    if (!areaColors) return null;
    const current = areaColors.find(c => c.name === areaName) || areaColors.find(c => c.name === 'default');
    if (!current) return null;

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 opacity-0 group-hover:opacity-100"
                    onClick={(e) => { e.stopPropagation(); setIsOpen(true); }}
                    style={{ color: current.textColor }}
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
                            <DebouncedColorPicker color={bgColor} setColor={setBgColor} />
                            <Input type="text" value={bgColor} onChange={(e) => setBgColor(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                             <Label className="text-sm">Color de Texto</Label>
                             <DebouncedColorPicker color={textColor} setColor={setTextColor} />
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
