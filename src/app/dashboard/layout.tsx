import AppSidebar from "@/components/layout/sidebar";
import AppHeader from "@/components/layout/header";
import { DataProvider } from "@/hooks/use-data";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DataProvider>
      <div className="flex min-h-screen w-full bg-muted/40">
        <AppSidebar />
        <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14 w-full">
          <AppHeader />
          <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
              {children}
          </main>
        </div>
      </div>
    </DataProvider>
  );
}
