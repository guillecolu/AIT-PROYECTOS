'use client';

import { useState, useEffect } from 'react';
import { Input } from './input';
import { Button } from './button';
import { Check, Edit, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EditableFieldProps {
  initialValue: string;
  onSave: (newValue: string) => void;
  label: string;
  className?: string;
  inputClassName?: string;
  buttonSize?: 'sm' | 'default' | 'lg' | 'icon';
  onEditingChange?: (isEditing: boolean) => void;
}

export default function EditableField({
  initialValue,
  onSave,
  label,
  className,
  inputClassName,
  buttonSize = "icon",
  onEditingChange
}: EditableFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(initialValue);
  
  useEffect(() => {
    onEditingChange?.(isEditing);
  }, [isEditing, onEditingChange]);


  const handleSave = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation(); // Prevent card click
    if (value.trim()) {
      onSave(value);
      setIsEditing(false);
    }
  };

  const handleCancel = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation(); // Prevent card click
    setValue(initialValue);
    setIsEditing(false);
  };
  
  const handleEditClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation(); // Prevent card click
    setIsEditing(true);
  }

  if (isEditing) {
    return (
      <div className="flex items-center gap-2">
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          aria-label={label}
          className={cn('h-9', inputClassName)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                if (value.trim()) {
                    onSave(value);
                    setIsEditing(false);
                }
            }
            if (e.key === 'Escape') handleCancel(e as any);
          }}
          onClick={(e) => e.stopPropagation()} // Prevent card click
          autoFocus
        />
        <Button size="icon" className="h-9 w-9" onClick={handleSave}>
          <Check className="h-4 w-4" />
        </Button>
        <Button size="icon" variant="ghost" className="h-9 w-9" onClick={handleCancel}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 group">
      <span className={className}>{initialValue}</span>
      <Button
        size={buttonSize}
        variant="ghost"
        className="opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={handleEditClick}
      >
        <Edit className="h-4 w-4" />
      </Button>
    </div>
  );
}
