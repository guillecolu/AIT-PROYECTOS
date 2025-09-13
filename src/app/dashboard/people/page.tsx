import TeamTasksClient from '@/components/engineers/team-tasks-client';
import { Loader2 } from 'lucide-react';
import { Suspense } from 'react';

export default function PeoplePage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center p-20"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>}>
            <TeamTasksClient />
        </Suspense>
    );
}
