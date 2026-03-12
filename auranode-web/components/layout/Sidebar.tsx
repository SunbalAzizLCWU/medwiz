"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Upload,
  FileText,
  ClipboardList,
  Settings,
  LogOut,
  Menu,
  X,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  roles?: string[];
}

const navItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: <LayoutDashboard className="w-4 h-4" />,
  },
  {
    label: "Upload Report",
    href: "/dashboard/upload",
    icon: <Upload className="w-4 h-4" />,
    roles: ["clinic_worker", "clinic_admin"],
  },
  {
    label: "Reports",
    href: "/dashboard",
    icon: <FileText className="w-4 h-4" />,
  },
  {
    label: "My Queue",
    href: "/doctor",
    icon: <ClipboardList className="w-4 h-4" />,
    roles: ["doctor"],
  },
  {
    label: "Admin Panel",
    href: "/admin",
    icon: <Settings className="w-4 h-4" />,
    roles: ["clinic_admin", "superadmin"],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const visibleItems = navItems.filter(
    (item) => !item.roles || (user?.role && item.roles.includes(user.role))
  );

  const roleBadgeColor: Record<string, string> = {
    clinic_admin: "bg-blue-500/20 text-blue-300",
    clinic_worker: "bg-slate-600/40 text-slate-300",
    doctor: "bg-emerald-500/20 text-emerald-300",
    superadmin: "bg-purple-500/20 text-purple-300",
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-950">
      {/* Logo */}
      <div className="p-5 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/30">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-white tracking-tight">
              AuraNode
            </p>
            <p className="text-[10px] text-slate-500 leading-none mt-0.5">
              Medical Intelligence
            </p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {visibleItems.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);
          return (
            // prefetch={false} stops Next.js from eagerly downloading every
            // page's server payload when the sidebar is rendered, which was
            // the primary cause of network congestion and perceived latency.
            <Link
              key={`${item.label}-${item.href}`}
              href={item.href}
              prefetch={false}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150",
                isActive
                  ? "bg-blue-600/20 text-blue-400 shadow-[inset_0_0_0_1px_rgba(59,130,246,0.3)]"
                  : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
              )}
            >
              <span
                className={cn(
                  "transition-all duration-150",
                  isActive && "drop-shadow-[0_0_6px_rgba(96,165,250,0.8)]"
                )}
              >
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className="p-4 border-t border-white/10">
        {user && (
          <div className="mb-3 px-1">
            <p className="text-sm font-medium text-slate-200 truncate">
              {user.full_name}
            </p>
            <span
              className={cn(
                "inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium",
                roleBadgeColor[user.role] ?? "bg-slate-600/40 text-slate-300"
              )}
            >
              {user.role.replace(/_/g, " ")}
            </span>
          </div>
        )}
        <button
          onClick={signOut}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 font-medium transition-all duration-150"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <button
        className="fixed top-4 left-4 z-50 p-2 bg-slate-900 rounded-lg shadow-md border border-white/10 md:hidden"
        onClick={() => setMobileOpen(true)}
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5 text-slate-300" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 shadow-2xl transition-transform md:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <button
          className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-white/10"
          onClick={() => setMobileOpen(false)}
          aria-label="Close menu"
        >
          <X className="w-5 h-5 text-slate-400" />
        </button>
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-60 shrink-0">
        {sidebarContent}
      </aside>
    </>
  );
}
