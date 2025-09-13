import AppSidebar from "@/components/layout/sidebar";
import AppHeader from "@/components/layout/header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
      <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <div className="fixed inset-0 -z-10">
          <div 
              className="absolute inset-0 bg-cover bg-center opacity-5"
              style={{ backgroundImage: "url('/images/FONDO.png')" }}
          ></div>
      </div>
      <div className="relative z-20 flex min-h-screen w-full flex-col">
        <AppSidebar />
        <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
          <AppHeader />
          <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
              {children}
          </main>
        </div>
      </div>
      </div>
  );
}
