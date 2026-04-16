import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { Brain, LayoutDashboard, Upload, BookOpen, BarChart2, LogOut } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { useAuth } from "../lib/AuthContext";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const { profile, logout } = useAuth();

  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
    { icon: Upload, label: "Upload & Learn", path: "/upload" },
    { icon: BookOpen, label: "My Content", path: "/library" },
    { icon: BarChart2, label: "Analytics", path: "/analytics" },
  ];

  return (
    <div className="flex min-h-screen bg-transparent text-text">
      {/* Sidebar */}
      <aside className="w-[240px] bg-sidebar border-r border-border flex flex-col fixed h-full z-20">
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 bg-linear-to-br from-accent to-purple-500 rounded-lg flex items-center justify-center">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight text-text">NeuroLoop AI</span>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-all group text-sm",
                location.pathname === item.path
                  ? "bg-accent/10 text-accent"
                  : "text-text-muted hover:text-text hover:bg-white/5"
              )}
            >
              <item.icon className={cn("w-5 h-5", location.pathname === item.path ? "text-accent" : "text-text-muted group-hover:text-text")} />
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="p-4 space-y-4">
          <div className="pt-4 border-t border-border">
            <div className="flex items-center gap-3 px-2 mb-4">
              <img src={profile?.photoURL || `https://ui-avatars.com/api/?name=${profile?.displayName}`} alt="Avatar" className="w-8 h-8 rounded-full border border-border" />
              <div className="overflow-hidden">
                <p className="text-sm font-bold truncate text-text">{profile?.displayName || "Architect"}</p>
                <p className="text-xs text-text-muted truncate">Level {profile?.level || 1}</p>
              </div>
            </div>
            <button 
              onClick={logout}
              className="flex items-center gap-3 px-4 py-2 w-full text-text-muted hover:text-text hover:bg-white/5 rounded-lg transition-all text-sm"
            >
              <LogOut className="w-4 h-4" />
              <span className="font-medium">Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 p-8 relative">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
