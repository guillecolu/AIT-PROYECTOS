
'use client';

import * as React from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import {
  FileText,
  Hammer,
  Settings,
  Shield,
  Truck,
  Wrench,
  Anchor,
  Bone,
  Bug,
  ClipboardList,
  Flame,
  type LucideIcon,
} from 'lucide-react';
import type { Task } from '@/lib/types';
import { cn } from '@/lib/utils';
import { ScrollArea } from '../ui/scroll-area';

interface TaskIconPickerProps {
  task: Task;
  onTaskUpdate: (task: Task) => void;
  className?: string;
}

const iconMap: { [key: string]: LucideIcon } = {
  'file-text': FileText,
  hammer: Hammer,
  settings: Settings,
  shield: Shield,
  truck: Truck,
  wrench: Wrench,
  anchor: Anchor,
  bone: Bone,
  bug: Bug,
  'clipboard-list': ClipboardList,
  flame: Flame,
};

const iconList = Object.keys(iconMap);

export default function TaskIconPicker({ task, onTaskUpdate, className }: TaskIconPickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const handleIconSelect = (iconName: string) => {
    const updatedTask = { ...task, icon: iconName };
    onTaskUpdate(updatedTask);
    setIsOpen(false);
  };

  const CurrentIcon = task.icon && iconMap[task.icon] ? iconMap[task.icon] : ClipboardList;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn('h-7 w-7 text-muted-foreground hover:text-foreground', className)}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsOpen(true);
          }}
        >
          <CurrentIcon className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-0">
        <ScrollArea className="h-48">
            <div className="p-2 grid grid-cols-4 gap-2">
            {iconList.map((iconName) => {
                const IconComponent = iconMap[iconName];
                return (
                <Button
                    key={iconName}
                    variant="outline"
                    size="icon"
                    className={cn(
                    'h-8 w-8',
                    task.icon === iconName && 'bg-accent text-accent-foreground'
                    )}
                    onClick={(e) => {
                        e.stopPropagation();
                        handleIconSelect(iconName);
                    }}
                >
                    <IconComponent className="h-4 w-4" />
                </Button>
                );
            })}
            </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
