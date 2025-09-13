'use client';

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { History } from 'lucide-react';
import type { Signature, User } from '@/lib/types';
import { useEffect, useState } from 'react';

function ClientSideDate({ dateString, format = 'PPpp' }: { dateString: string, format?: string }){
    const [formattedDate, setFormattedDate] = useState('');

    useEffect(() => {
        if (dateString) {
            const { format: formatDate, es } = require('date-fns');
            setFormattedDate(formatDate(new Date(dateString), format, { locale: es }));
        } else {
            setFormattedDate('');
        }
    }, [dateString, format]);

    return <span >{formattedDate}</span>;
};

export default function SignatureHistory({ history, users }: { history: Signature[], users: User[] }) {
    const getUserName = (id?: string) => users.find(u => u.id === id)?.name || 'Desconocido';
    const signatureCount = history?.length || 0;

    if (signatureCount === 0) {
        return null;
    }

    return (
        <div className="flex items-center gap-1">
            <Popover>
                <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                        <History className="h-4 w-4 text-muted-foreground" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                    <div className="grid gap-4">
                    <div className="space-y-2">
                        <h4 className="font-medium leading-none">Historial de Firmas ({signatureCount})</h4>
                        <p className="text-sm text-muted-foreground">
                        Registro de todas las veces que esta tarea ha sido marcada como finalizada.
                        </p>
                    </div>
                    <div className="grid gap-2">
                    {history.map((sig, index) => (
                        <div key={index} className="grid grid-cols-[auto_1fr] items-center gap-x-4">
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">{index + 1}.</span>
                            </div>
                            <div className="text-sm">
                                <p className='font-semibold'>{getUserName(sig.userId)}</p>
                                <p className="text-xs text-muted-foreground italic">"{sig.workDescription}"</p>
                                <div className="text-xs text-muted-foreground">
                                    <ClientSideDate dateString={sig.date} format="PPpp" />
                                </div>
                            </div>
                        </div>
                    ))}
                    </div>
                    </div>
                </PopoverContent>
            </Popover>
            <div className="text-xs font-bold text-muted-foreground">
                ({signatureCount})
            </div>
        </div>
    );
}
