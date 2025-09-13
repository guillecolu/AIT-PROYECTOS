
'use client';

import Link from "next/link";
import {
  Archive,
  Menu,
  Users,
  LayoutDashboard,
  Calendar,
  GanttChartSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import MeetingModal from "@/components/meeting-modal";
import Image from "next/image";

const navLinks = [
    { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/dashboard/people", icon: Users, label: "Personas" },
    { href: "/dashboard/archive", icon: Archive, label: "Proyectos Archivados" },
];

const MobileNav = () => (
    <Sheet>
        <SheetTrigger asChild>
            <Button size="icon" variant="outline" className="sm:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Abrir Menú</span>
            </Button>
        </SheetTrigger>
        <SheetContent side="left" className="sm:max-w-xs">
            <nav className="grid gap-6 text-lg font-medium">
                <Link
                    href="/dashboard"
                    className="group flex h-10 shrink-0 items-center justify-center gap-2 rounded-full text-lg font-semibold text-primary-foreground md:text-base"
                >
                    <Image
                        src="/images/LOGO.png"
                        alt="AIT Logo"
                        width={120}
                        height={40}
                        style={{ objectFit: 'contain' }}
                    />
                    <span className="sr-only">AIT</span>
                </Link>
                {navLinks.map(({ href, icon: Icon, label }) => (
                     <Link
                        key={href}
                        href={href}
                        className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
                    >
                        <Icon className="h-5 w-5" />
                        {label}
                    </Link>
                ))}
            </nav>
        </SheetContent>
    </Sheet>
);


export default function AppHeader() {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
        <div className="grid grid-cols-3 items-center w-full">
            <div className="flex justify-start">
                 <MobileNav />
            </div>
            <div className="flex justify-center">
                <div className="hidden sm:block">
                     <Link href="/dashboard">
                        <Image
                            src="/images/LOGO.png"
                            alt="AIT Logo"
                            width={120}
                            height={40}
                            style={{ objectFit: 'contain' }}
                        />
                     </Link>
                </div>
            </div>
            <div className="flex justify-end items-center gap-2">
                <MeetingModal />
          </div>
        </div>
    </header>
  );
}
