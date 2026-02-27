import { Outlet } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";
import { NotificationBell } from "./NotificationBell";

export function AppLayout() {
  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="border-b bg-background px-6 py-3 flex items-center justify-end">
          <NotificationBell />
        </header>
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
