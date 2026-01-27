import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { UserSidebar } from "@/components/UserSidebar";
import { NotificationBell } from "@/components/NotificationBell";
import { AIChatWidget } from "@/components/ai/AIChatWidget";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import { usePresence } from "@/hooks/usePresence";

interface UserLayoutProps {
  children: React.ReactNode;
}

export const UserLayout = ({ children }: UserLayoutProps) => {
  // Track user presence
  usePresence();
  
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <UserSidebar />
        <main className="flex-1 flex flex-col">
          <header className="h-16 border-b border-border bg-card flex items-center justify-between px-4 sticky top-0 z-10">
            <div className="flex items-center">
              <SidebarTrigger className="text-foreground" />
              <h1 className="text-xl font-bold text-primary ml-4">Dashboard</h1>
            </div>
            <div className="flex items-center gap-2">
              <AIChatWidget 
                trigger={
                  <Button variant="ghost" size="icon" className="relative">
                    <MessageCircle className="h-5 w-5" />
                  </Button>
                }
              />
              <NotificationBell />
            </div>
          </header>
          <div className="flex-1 p-6 overflow-auto">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};
