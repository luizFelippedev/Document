// app/(dashboard)/dashboard/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { RecentProjects } from '@/components/dashboard/RecentProjects';
import { ActivityChart } from '@/components/dashboard/ActivityChart';
import { WelcomeMessage } from '@/components/dashboard/WelcomeMessage';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';
import { Card } from '@/components/ui/Card';
import { Tabs } from '@/components/ui/Tabs';
import { Spinner } from '@/components/ui/Spinner';
import { useAuth } from '@/hooks/useAuth';
import { TrendingProjects } from '@/components/dashboard/TrendingProjects';
import { TrendingCertificates } from '@/components/dashboard/TrendingCertificates';
import { UserProgress } from '@/components/dashboard/UserProgress';
import { Calendar } from 'lucide-react';

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Simulate loading data
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'projects', label: 'Projects' },
    { id: 'certificates', label: 'Certificates' },
    { id: 'analytics', label: 'Analytics' },
  ];

  // Mock data for activity chart
  const activityData = [
    { date: '2025-05-01', count: 5 },
    { date: '2025-05-02', count: 8 },
    { date: '2025-05-03', count: 12 },
    { date: '2025-05-04', count: 7 },
    { date: '2025-05-05', count: 11 },
    { date: '2025-05-06', count: 15 },
    { date: '2025-05-07', count: 9 },
    { date: '2025-05-08', count: 14 },
    { date: '2025-05-09', count: 18 },
    { date: '2025-05-10', count: 16 },
    { date: '2025-05-11', count: 20 },
    { date: '2025-05-12', count: 13 },
    { date: '2025-05-13', count: 17 },
    { date: '2025-05-14', count: 21 },
  ];

  if (loading) {
    return (
      <MainLayout>
        <div className="flex h-96 items-center justify-center">
          <Spinner size="large" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="dashboard-container space-y-6">
        <WelcomeMessage user={user} />

        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

        {activeTab === 'overview' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="animate-fadeIn">
                <StatCard
                  title="Total Projects"
                  value="24"
                  icon={
                    <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-400">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                        />
                      </svg>
                    </div>
                  }
                  trend="+12% from last month"
                  trendDirection="up"
                />
              </div>

              <div className="animate-fadeIn animation-delay-100">
                <StatCard
                  title="Certificates"
                  value="8"
                  icon={
                    <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center text-green-600 dark:text-green-400">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                        />
                      </svg>
                    </div>
                  }
                  trend="+3 new certificates"
                  trendDirection="up"
                />
              </div>

              <div className="animate-fadeIn animation-delay-200">
                <StatCard
                  title="Skills"
                  value="12"
                  icon={
                    <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center text-purple-600 dark:text-purple-400">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                        />
                      </svg>
                    </div>
                  }
                  trend="+5 skills improved"
                  trendDirection="up"
                />
              </div>

              <div className="animate-fadeIn animation-delay-300">
                <StatCard
                  title="Completion Rate"
                  value="87%"
                  icon={
                    <div className="h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center text-amber-600 dark:text-amber-400">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                  }
                  trend="+12% from last month"
                  trendDirection="up"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 animate-fadeIn animation-delay-400">
                <Card title="Activity Overview">
                  <ActivityChart data={activityData} />
                </Card>
              </div>

              <div className="animate-fadeIn animation-delay-500">
                <Card title="Upcoming Events">
                  <div className="space-y-4">
                    {[1, 2, 3].map((_, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                      >
                        <div className="bg-blue-100 dark:bg-blue-900 rounded-full p-2 text-blue-600 dark:text-blue-300">
                          <Calendar size={16} />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            Project Deadline
                          </h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Frontend Development
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                            Tomorrow, 2:00 PM
                          </p>
                        </div>
                      </div>
                    ))}
                    <button className="w-full text-sm text-blue-600 dark:text-blue-400 hover:underline mt-2">
                      View all events
                    </button>
                  </div>
                </Card>
              </div>
            </div>

            <div className="animate-fadeIn animation-delay-600">
              <RecentProjects />
            </div>

            <div className="animate-fadeIn animation-delay-700">
              <UserProgress />
            </div>
          </>
        )}

        {activeTab === 'projects' && <TrendingProjects />}

        {activeTab === 'certificates' && <TrendingCertificates />}

        {activeTab === 'analytics' && (
          <div className="grid grid-cols-1 gap-6">
            <Card title="Performance Analytics">
              <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                <p className="text-gray-500 dark:text-gray-400">
                  Detailed analytics coming soon
                </p>
              </div>
            </Card>
          </div>
        )}
      </div>

      <NotificationCenter />
    </MainLayout>
  );
}