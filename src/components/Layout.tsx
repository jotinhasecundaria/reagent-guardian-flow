import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Button } from "@/components/ui/button";
import { Bell, Settings, User } from "lucide-react";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
            <div className="flex h-16 items-center justify-between mx-2 md:mx-6 my-2">
              <div className="flex items-center gap-2">
                <SidebarTrigger />
                <div>
                  <h2 className="text-md md:text-lg font-semibold text-foreground">Sistema de Controle de Reagentes</h2>
                  <p className="text-xs md:text-sm text-muted-foreground">Gestão inteligente com QR codes</p>
                </div>
              </div>
              
              <div className="flex items-center gap-0 md:gap-2 hidden md:inline">
                <Button variant="ghost" size="icon">
                  <Bell className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon">
                  <Settings className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon">
                  <User className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 p-6 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}