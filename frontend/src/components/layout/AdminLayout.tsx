// frontend/src/components/layout/AdminLayout.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { ROUTES } from "@/config/routes";
import { Sidebar } from "./Sidebar";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { Spinner } from "@/components/ui/Spinner";
import { Alert } from "@/components/ui/Alert";
import { userService } from "@/services/user.service";
import { useMediaQuery } from "@/hooks/useMediaQuery";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export const AdminLayout = ({ children }: AdminLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);

  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isMobile = useMediaQuery("(max-width: 1024px)");

  // Check admin authorization
  useEffect(() => {
    const checkAuthorization = async () => {
      try {
        setLoading(true);

        if (!isAuthenticated) {
          router.push(ROUTES.AUTH.LOGIN);
          return;
        }

        if (user?.role !== "admin") {
          setError("You do not have permission to access this area");
          setTimeout(() => {
            router.push(ROUTES.DASHBOARD.ROOT);
          }, 3000);
          return;
        }

        // Fetch admin dashboard statistics
        const statistics = await userService.getStatistics();
        setStats(statistics);
      } catch (err: any) {
        setError(
          err.response?.data?.message || "Failed to load admin dashboard",
        );
      } finally {
        setLoading(false);
      }
    };

    checkAuthorization();
  }, [isAuthenticated, user, router]);

  // Close sidebar on mobile by default
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    } else {
      setSidebarOpen(true);
    }
  }, [isMobile]);

  // Close sidebar when route changes on mobile
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [pathname, isMobile]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center">
          <Spinner size="large" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            Loading admin dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <div className="max-w-md w-full">
          <Alert
            type="error"
            title="Access Denied"
            message={error}
            action={{
              label: "Back to Dashboard",
              onClick: () => router.push(ROUTES.DASHBOARD.ROOT),
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <Navbar toggleSidebar={toggleSidebar} sidebarOpen={sidebarOpen} />

      <div className="flex flex-1 overflow-hidden">
        <AnimatePresence>
          {sidebarOpen && (
            <>
              {/* Backdrop for mobile */}
              {isMobile && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.5 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
                  onClick={() => setSidebarOpen(false)}
                />
              )}

              {/* Sidebar */}
              <motion.div
                initial={{ x: isMobile ? -280 : 0, opacity: isMobile ? 0 : 1 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -280, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className={`fixed lg:relative z-30 h-full ${isMobile ? "w-[280px]" : "w-64"}`}
              >
                <Sidebar isAdmin={true} />
              </motion.div>
            </>
          )}
        </AnimatePresence>

        <main
          className={`flex-1 overflow-auto transition-all duration-300 ${
            sidebarOpen && !isMobile ? "ml-64" : ""
          }
        `}
        >
          <div className="container mx-auto px-4 py-6">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {children}
            </motion.div>
          </div>
          <Footer />
        </main>
      </div>
    </div>
  );
};
