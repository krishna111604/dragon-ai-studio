import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Film, LayoutDashboard, Sparkles, Settings, User, LogOut, Users, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const navItems = [
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/tools", label: "Toolkit", icon: Wrench },
  { path: "/collaboration", label: "Collaboration", icon: Users },
  { path: "/insights", label: "Insights", icon: Sparkles },
  { path: "/profile", label: "Settings", icon: Settings },
];

interface AppSidebarProps {
  className?: string;
}

export function AppSidebar({ className }: AppSidebarProps) {
  const location = useLocation();
  const { signOut, user } = useAuth();

  return (
    <aside className={cn(
      "w-64 bg-sidebar border-r border-sidebar-border flex flex-col h-screen sticky top-0",
      className
    )}>
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border">
        <Link to="/dashboard" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-gold flex items-center justify-center shadow-gold">
            <Film className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <span className="font-display text-xl text-gradient-gold tracking-wider block">DRAGON AI</span>
            <span className="text-xs text-sidebar-foreground/60">Filmmaking Companion</span>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <p className="text-xs uppercase tracking-wider text-sidebar-foreground/50 mb-3 px-3">Menu</p>
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || 
              (item.path === "/dashboard" && location.pathname.startsWith("/project"));
            
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all",
                    isActive 
                      ? "bg-sidebar-accent text-sidebar-primary" 
                      : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User section */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-sidebar-accent flex items-center justify-center">
            <User className="w-4 h-4 text-sidebar-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate">
              {user?.email?.split('@')[0]}
            </p>
            <p className="text-xs text-sidebar-foreground/50 truncate">{user?.email}</p>
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={signOut}
          className="w-full mt-2 justify-start text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign out
        </Button>
      </div>
    </aside>
  );
}
