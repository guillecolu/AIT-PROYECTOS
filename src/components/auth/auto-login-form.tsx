
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export default function AutoLoginForm() {
    return (
        <Card className="w-full max-w-sm">
            <CardHeader className="text-center">
                <CardTitle className="text-2xl font-bold">Iniciando Sesión</CardTitle>
                <CardDescription>Accediendo al panel de control...</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex justify-center items-center p-8">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                </div>
            </CardContent>
        </Card>
    );
}
