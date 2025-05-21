export const Sidebar = ({ isAdmin = false }) => {
  return (
    <aside className="sidebar">
      <ul>{isAdmin ? <li>Admin Menu</li> : <li>User Menu</li>}</ul>
    </aside>
  );
};
// frontend/src/components/layout/Sidebar.tsx
("use client");

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { ROUTES } from "@/config/routes";
import { motion } from "framer-motion";
import {
  Home,
  Briefcase,
  Award,
  User,
  Settings,
  Users,
  BarChart,
  Shield,
  HelpCircle,
  FileText,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

interface SidebarProps {
  isAdmin?: boolean;
}

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  children?: NavItem[];
}

export const Sidebar = ({ isAdmin = false }: SidebarProps) => {
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const { user } = useAuth();
  const pathname = usePathname();

  const toggleExpand = (label: string) => {
    if (expandedItems.includes(label)) {
      setExpandedItems(expandedItems.filter((item) => item !== label));
    } else {
      setExpandedItems([...expandedItems, label]);
    }
  };

  const isActive = (path: string) => {
    if (path === ROUTES.DASHBOARD.ROOT) {
      return pathname === path;
    }
    return pathname.startsWith(path);
  };

  const userNavItems: NavItem[] = [
    {
      label: "Dashboard",
      path: ROUTES.DASHBOARD.ROOT,
      icon: <Home size={18} />,
    },
    {
      label: "Projects",
      path: ROUTES.DASHBOARD.PROJECTS,
      icon: <Briefcase size={18} />,
      children: [
        {
          label: "All Projects",
          path: ROUTES.DASHBOARD.PROJECTS,
          icon: <ChevronRight size={16} />,
        },
        {
          label: "New Project",
          path: `${ROUTES.DASHBOARD.PROJECTS}/new`,
          icon: <ChevronRight size={16} />,
        },
      ],
    },
    {
      label: "Certificates",
      path: ROUTES.DASHBOARD.CERTIFICATES,
      icon: <Award size={18} />,
      children: [
        {
          label: "All Certificates",
          path: ROUTES.DASHBOARD.CERTIFICATES,
          icon: <ChevronRight size={16} />,
        },
        {
          label: "New Certificate",
          path: `${ROUTES.DASHBOARD.CERTIFICATES}/new`,
          icon: <ChevronRight size={16} />,
        },
      ],
    },
    {
      label: "Profile",
      path: ROUTES.DASHBOARD.PROFILE,
      icon: <User size={18} />,
    },
    {
      label: "Settings",
      path: ROUTES.DASHBOARD.SETTINGS,
      icon: <Settings size={18} />,
    },
  ];

  const adminNavItems: NavItem[] = [
    {
      label: "Admin Dashboard",
      path: ROUTES.DASHBOARD.ADMIN.ROOT,
      icon: <BarChart size={18} />,
    },
    {
      label: "User Management",
      path: ROUTES.DASHBOARD.ADMIN.USERS,
      icon: <Users size={18} />,
    },
    {
      label: "Project Management",
      path: ROUTES.DASHBOARD.ADMIN.PROJECTS,
      icon: <Briefcase size={18} />,
    },
    {
      label: "Certificate Management",
      path: ROUTES.DASHBOARD.ADMIN.CERTIFICATES,
      icon: <Award size={18} />,
    },
  ];

  const renderNavItems = (items: NavItem[]) => {
    return items.map((item) => (
      <div key={item.label} className="mb-1">
        {item.children ? (
          <div>
            <button
              onClick={() => toggleExpand(item.label)}
              className={`w-full flex items-center justify-between px-4 py-2 rounded-md text-sm transition-colors ${
                isActive(item.path)
                  ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200"
                  : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
              }`}
            >
              <div className="flex items-center">
                <span className="mr-3">{item.icon}</span>
                <span>{item.label}</span>
              </div>
              {expandedItems.includes(item.label) ? (
                <ChevronDown size={16} />
              ) : (
                <ChevronRight size={16} />
              )}
            </button>
            {expandedItems.includes(item.label) && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="pl-8 mt-1 space-y-1"
              >
                {item.children.map((child) => (
                  <Link
                    key={child.path}
                    href={child.path}
                    className={`flex items-center px-4 py-2 rounded-md text-sm transition-colors ${
                      isActive(child.path)
                        ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200"
                        : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
                    }`}
                  >
                    <span className="mr-3">{child.icon}</span>
                    <span>{child.label}</span>
                  </Link>
                ))}
              </motion.div>
            )}
          </div>
        ) : (
          <Link
            href={item.path}
            className={`flex items-center px-4 py-2 rounded-md text-sm transition-colors ${
              isActive(item.path)
                ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200"
                : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
            }`}
          >
            <span className="mr-3">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        )}
      </div>
    ));
  };

  return (
    <aside className="h-full flex flex-col bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 shadow-sm overflow-y-auto">
      {/* User profile section */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold">
            {user?.name?.charAt(0) || "U"}
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {user?.name || "User"}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {isAdmin ? "Administrator" : "User"}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <div className="mb-6">
          <p className="px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
            Main Navigation
          </p>
          {renderNavItems(userNavItems)}
        </div>

        {isAdmin && (
          <div className="mb-6">
            <p className="px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              Admin Panel
            </p>
            {renderNavItems(adminNavItems)}
          </div>
        )}

        <div className="mb-6">
          <p className="px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
            Support
          </p>
          <Link
            href="/documentation"
            className="flex items-center px-4 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            <span className="mr-3">
              <FileText size={18} />
            </span>
            <span>Documentation</span>
          </Link>
          <Link
            href="/help"
            className="flex items-center px-4 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            <span className="mr-3">
              <HelpCircle size={18} />
            </span>
            <span>Help Center</span>
          </Link>
        </div>
      </nav>

      {/* Pro upgrade banner */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="p-4 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-lg text-white">
          <div className="flex items-center mb-2">
            <Shield size={20} />
            <span className="ml-2 font-semibold">Upgrade to Pro</span>
          </div>
          <p className="text-xs text-blue-100 mb-3">
            Get additional features and premium support.
          </p>
          <button className="w-full py-1.5 px-3 bg-white rounded-md text-blue-600 text-sm font-medium hover:bg-blue-50">
            Upgrade Now
          </button>
        </div>
      </div>
    </aside>
  );
};
