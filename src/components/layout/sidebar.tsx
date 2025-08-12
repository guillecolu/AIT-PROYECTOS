import Link from "next/link";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider
} from "@/components/ui/tooltip";
import { LayoutDashboard, Users, Archive } from "lucide-react";
import Image from "next/image";
import { useData } from "@/hooks/use-data";

export default function AppSidebar() {
  const { appConfig } = useData();

  return (
    <aside className="fixed inset-y-0 left-0 z-10 hidden w-14 flex-col border-r bg-background sm:flex">
      <TooltipProvider>
      <nav className="flex flex-col items-center gap-4 px-2 sm:py-5">
        <Link
          href="/dashboard"
          className="group flex h-9 w-9 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:h-8 md:w-8 md:text-base"
        >
          {appConfig.logoUrl ? (
            <Image
              src={appConfig.logoUrl}
              alt="AIT Logo"
              width={32}
              height={32}
              className="rounded-full object-contain"
            />
           ) : (
            <span className="font-bold text-xs">AIT</span>
           )}
          <span className="sr-only">AIT</span>
        </Link>
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              href="/dashboard"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground hover:bg-accent md:h-8 md:w-8"
            >
              <LayoutDashboard className="h-5 w-5" />
              <span className="sr-only">Inicio</span>
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right">Inicio</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              href="/dashboard/people"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground hover:bg-accent md:h-8 md:w-8"
            >
              <Users className="h-5 w-5" />
              <span className="sr-only">Personas</span>
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right">Personas</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              href="/dashboard/archive"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground hover:bg-accent md:h-8 md:w-8"
            >
              <Archive className="h-5 w-5" />
              <span className="sr-only">Proyectos Archivados</span>
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right">Proyectos Archivados</TooltipContent>
        </Tooltip>
      </nav>
      </TooltipProvider>
    </aside>
  );
}
