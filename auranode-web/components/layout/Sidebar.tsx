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
    clinic_admin: "bg-brand-100 text-brand-700",
    clinic_worker: "bg-slate-100 text-slate-600",
    doctor: "bg-green-100 text-green-700",
    superadmin: "bg-purple-100 text-purple-700",
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="p-5 border-b border-surface-border">
        <p className="text-xl font-bold text-brand-700 tracking-tight">
          AuraNode
        </p>
        <p className="text-xs text-slate-400 mt-0.5">Medical Intelligence</p>
      </div>

      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {visibleItems.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={`${item.label}-${item.href}`}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-brand-600 text-white"
                  : "text-slate-600 hover:bg-brand-50 hover:text-brand-700"
              )}
            >
              {item.icon}
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-surface-border">
        {user && (
          <div className="mb-3">
            <p className="text-sm font-medium text-slate-800 truncate">
              {user.full_name}
            </p>
            <span
              className={cn(
                "inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium",
                roleBadgeColor[user.role] ?? "bg-slate-100 text-slate-600"
              )}
            >
              {user.role.replace(/_/g, " ")}
            </span>
          </div>
        )}
        <button
          onClick={signOut}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 font-medium transition-colors"
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
        className="fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md border border-surface-border md:hidden"
        onClick={() => setMobileOpen(true)}
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5 text-slate-700" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl transition-transform md:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <button
          className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-slate-100"
          onClick={() => setMobileOpen(false)}
          aria-label="Close menu"
        >
          <X className="w-5 h-5 text-slate-500" />
        </button>
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-60 bg-white border-r border-surface-border shrink-0">
        {sidebarContent}
      </aside>
    </>
  );
}
