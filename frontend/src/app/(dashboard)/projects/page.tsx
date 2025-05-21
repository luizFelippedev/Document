// frontend/src/app/(dashboard)/projects/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { Badge } from '@/components/ui/Badge';
import { Dropdown } from '@/components/ui/Dropdown';
import { Table } from '@/components/ui/Table';
import { ROUTES } from '@/config/routes';
import { motion } from 'framer-motion';
import {
  Plus,
  Search,
  Filter,
  ChevronDown,
  ExternalLink,
  Edit,
  Trash2,
  Eye,
  MoreHorizontal,
  Tag,
  Calendar,
} from 'lucide-react';

// Mock data - would be replaced with API calls
const mockProjects = [
  {
    id: '1',
    title: 'E-commerce Dashboard',
    description: 'A modern dashboard for e-commerce analytics and management',
    status: 'completed',
    category: 'Web Development',
    technologies: ['React', 'Node.js', 'MongoDB'],
    startDate: '2025-01-15',
    endDate: '2025-04-20',
    thumbnailUrl: '/projects/ecommerce-thumb.jpg',
    demoUrl: 'https://example.com/demo',
    repoUrl: 'https://github.com/username/ecommerce-dashboard',
    featured: true,
  },
  {
    id: '2',
    title: 'Mobile Fitness App',
    description: 'An iOS/Android app for tracking workouts and nutrition',
    status: 'in-progress',
    category: 'Mobile Development',
    technologies: ['React Native', 'Firebase'],
    startDate: '2025-03-01',
    endDate: null,
    thumbnailUrl: '/projects/fitness-thumb.jpg',
    demoUrl: null,
    repoUrl: 'https://github.com/username/fitness-app',
    featured: false,
  },
  {
    id: '3',
    title: 'AI Image Generator',
    description: 'A machine learning project for generating realistic images',
    status: 'planning',
    category: 'AI/ML',
    technologies: ['Python', 'TensorFlow', 'Flask'],
    startDate: '2025-05-10',
    endDate: null,
    thumbnailUrl: null,
    demoUrl: null,
    repoUrl: 'https://github.com/username/ai-image-generator',
    featured: false,
  },
  {
    id: '4',
    title: 'Portfolio Website',
    description: 'Personal portfolio to showcase projects and experience',
    status: 'completed',
    category: 'Web Development',
    technologies: ['Next.js', 'TailwindCSS'],
    startDate: '2025-02-05',
    endDate: '2025-03-15',
    thumbnailUrl: '/projects/portfolio-thumb.jpg',
    demoUrl: 'https://myportfolio.dev',
    repoUrl: 'https://github.com/username/portfolio',
    featured: true,
  },
  {
    id: '5',
    title: 'Blockchain Wallet',
    description: 'A secure cryptocurrency wallet with multi-chain support',
    status: 'in-progress',
    category: 'Blockchain',
    technologies: ['Solidity', 'Web3.js', 'React'],
    startDate: '2025-04-01',
    endDate: null,
    thumbnailUrl: '/projects/blockchain-thumb.jpg',
    demoUrl: 'https://wallet-demo.example.com',
    repoUrl: 'https://github.com/username/blockchain-wallet',
    featured: false,
  },
];

export default function ProjectsPage() {
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredProjects, setFilteredProjects] = useState(mockProjects);
  const [currentView, setCurrentView] = useState<'grid' | 'table'>('grid');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

  // Simulate loading data
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // Filter projects based on search query and filters
  useEffect(() => {
    let result = mockProjects;

    // Apply search query filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (project) =>
          project.title.toLowerCase().includes(query) ||
          project.description.toLowerCase().includes(query) ||
          project.technologies.some((tech) =>
            tech.toLowerCase().includes(query),
          ),
      );
    }

    // Apply status filter
    if (statusFilter) {
      result = result.filter((project) => project.status === statusFilter);
    }

    // Apply category filter
    if (categoryFilter) {
      result = result.filter((project) => project.category === categoryFilter);
    }

    setFilteredProjects(result);
  }, [searchQuery, statusFilter, categoryFilter]);

  // Column definitions for table view
  const columns = [
    {
      id: 'title',
      header: 'Project',
      cell: (row: unknown) => (
        <div className="flex items-center">
          {row.thumbnailUrl ? (
            <img
              src={row.thumbnailUrl}
              alt={row.title}
              className="w-10 h-10 rounded object-cover mr-3"
            />
          ) : (
            <div className="w-10 h-10 rounded bg-gray-200 dark:bg-gray-700 flex items-center justify-center mr-3">
              <Tag size={18} className="text-gray-500 dark:text-gray-400" />
            </div>
          )}
          <div>
            <div className="font-medium text-gray-900 dark:text-white">
              {row.title}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {row.category}
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      cell: (row: unknown) => {
        const statusMap: Record<string, { color: string; label: string }> = {
          completed: { color: 'success', label: 'Completed' },
          'in-progress': { color: 'warning', label: 'In Progress' },
          planning: { color: 'info', label: 'Planning' },
        };

        const status = statusMap[row.status] || {
          color: 'default',
          label: row.status,
        };

        return (
          <Badge
            text={status.label}
            variant={status.color as unknown}
            size="sm"
          />
        );
      },
    },
    {
      id: 'technologies',
      header: 'Technologies',
      cell: (row: unknown) => (
        <div className="flex flex-wrap gap-1">
          {row.technologies.slice(0, 2).map((tech: string, i: number) => (
            <Badge key={i} text={tech} variant="outline" size="sm" />
          ))}
          {row.technologies.length > 2 && (
            <Badge
              text={`+${row.technologies.length - 2}`}
              variant="secondary"
              size="sm"
            />
          )}
        </div>
      ),
    },
    {
      id: 'dates',
      header: 'Timeline',
      cell: (row: unknown) => (
        <div className="text-sm">
          <div className="flex items-center text-gray-500 dark:text-gray-400">
            <Calendar size={14} className="mr-1" />
            {new Date(row.startDate).toLocaleDateString()}
          </div>
          {row.endDate && (
            <div className="text-gray-500 dark:text-gray-400 text-xs mt-1">
              to {new Date(row.endDate).toLocaleDateString()}
            </div>
          )}
        </div>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: (row: unknown) => {
        const menuItems = [
          {
            label: 'View Details',
            onClick: () => {
              // Navigate to project details
              console.log('View details', row.id);
            },
            icon: <Eye size={16} />,
          },
          {
            label: 'Edit Project',
            onClick: () => {
              // Navigate to edit project
              console.log('Edit project', row.id);
            },
            icon: <Edit size={16} />,
          },
          {
            label: 'Delete Project',
            onClick: () => {
              // Show delete confirmation
              console.log('Delete project', row.id);
            },
            icon: <Trash2 size={16} />,
            className: 'text-red-600 dark:text-red-400',
          },
        ];

        return (
          <div className="flex items-center justify-end space-x-2">
            {row.demoUrl && (
              <a
                href={row.demoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
              >
                <ExternalLink size={18} />
              </a>
            )}
            <Dropdown
              trigger={
                <button className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                  <MoreHorizontal size={18} />
                </button>
              }
              items={menuItems}
              align="right"
            />
          </div>
        );
      },
    },
  ];

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  // Status options for filtering
  const statusOptions = [
    { label: 'All Status', value: '' },
    { label: 'Completed', value: 'completed' },
    { label: 'In Progress', value: 'in-progress' },
    { label: 'Planning', value: 'planning' },
  ];

  // Category options for filtering
  const categoryOptions = [
    { label: 'All Categories', value: '' },
    { label: 'Web Development', value: 'Web Development' },
    { label: 'Mobile Development', value: 'Mobile Development' },
    { label: 'AI/ML', value: 'AI/ML' },
    { label: 'Blockchain', value: 'Blockchain' },
  ];

  if (loading) {
    return (
      <MainLayout>
        <div className="flex h-96 items-center justify-center">
          <Spinner size="large" label="Loading projects..." />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Projects
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manage and showcase your development projects
            </p>
          </div>

          <Link href={ROUTES.DASHBOARD.PROJECTS.NEW}>
            <Button leftIcon={<Plus size={16} />}>Add New Project</Button>
          </Link>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              type="search"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftElement={<Search size={18} className="text-gray-400" />}
              clearable
              onClear={() => setSearchQuery('')}
            />
          </div>

          <div className="flex gap-2">
            <select
              value={statusFilter || ''}
              onChange={(e) => setStatusFilter(e.target.value || null)}
              className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md text-sm"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <select
              value={categoryFilter || ''}
              onChange={(e) => setCategoryFilter(e.target.value || null)}
              className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md text-sm"
            >
              {categoryOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <div className="flex border border-gray-300 dark:border-gray-600 rounded-md overflow-hidden">
              <button
                className={`px-3 py-2 ${currentView === 'grid' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'}`}
                onClick={() => setCurrentView('grid')}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                  />
                </svg>
              </button>
              <button
                className={`px-3 py-2 ${currentView === 'table' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'}`}
                onClick={() => setCurrentView('table')}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 10h16M4 14h16M4 18h16"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Grid View */}
        {currentView === 'grid' && (
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {filteredProjects.length === 0 ? (
              <div className="col-span-full">
                <Card className="p-12 text-center">
                  <div className="mx-auto w-24 h-24 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-12 w-12 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
                    No projects found
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Try adjusting your search or filter to find what you're
                    looking for.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchQuery('');
                      setStatusFilter(null);
                      setCategoryFilter(null);
                    }}
                  >
                    Clear filters
                  </Button>
                </Card>
              </div>
            ) : (
              filteredProjects.map((project) => (
                <motion.div key={project.id} variants={itemVariants}>
                  <Card hoverable clickEffect>
                    <div className="relative aspect-video mb-4 bg-gray-200 dark:bg-gray-700 rounded-t-lg overflow-hidden">
                      {project.thumbnailUrl ? (
                        <img
                          src={project.thumbnailUrl}
                          alt={project.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Tag
                            size={32}
                            className="text-gray-400 dark:text-gray-500"
                          />
                        </div>
                      )}
                      <div className="absolute top-2 right-2 flex space-x-2">
                        <Badge
                          text={
                            project.status === 'completed'
                              ? 'Completed'
                              : project.status === 'in-progress'
                                ? 'In Progress'
                                : 'Planning'
                          }
                          variant={
                            project.status === 'completed'
                              ? 'success'
                              : project.status === 'in-progress'
                                ? 'warning'
                                : 'info'
                          }
                          size="sm"
                        />
                        {project.featured && (
                          <Badge text="Featured" variant="primary" size="sm" />
                        )}
                      </div>
                    </div>

                    <div className="px-4 pb-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        <Link
                          href={`${ROUTES.DASHBOARD.PROJECTS.ROOT}/${project.id}`}
                          className="hover:text-blue-600 dark:hover:text-blue-400"
                        >
                          {project.title}
                        </Link>
                      </h3>

                      <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
                        {project.description}
                      </p>

                      <div className="flex flex-wrap gap-1 mb-4">
                        {project.technologies.map((tech, i) => (
                          <Badge
                            key={i}
                            text={tech}
                            variant="outline"
                            size="sm"
                          />
                        ))}
                      </div>

                      <div className="flex items-center justify-between mt-2 text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center">
                          <Calendar size={14} className="mr-1" />
                          {new Date(project.startDate).toLocaleDateString()}
                        </div>

                        <div className="flex items-center space-x-2">
                          {project.demoUrl && (
                            <a
                              href={project.demoUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                            >
                              <ExternalLink size={18} />
                            </a>
                          )}

                          <Dropdown
                            trigger={
                              <button className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                                <MoreHorizontal size={18} />
                              </button>
                            }
                            items={[
                              {
                                label: 'View Details',
                                onClick: () => {
                                  // Navigate to project details
                                },
                                icon: <Eye size={16} />,
                              },
                              {
                                label: 'Edit Project',
                                onClick: () => {
                                  // Navigate to edit project
                                },
                                icon: <Edit size={16} />,
                              },
                              {
                                label: 'Delete Project',
                                onClick: () => {
                                  // Show delete confirmation
                                },
                                icon: <Trash2 size={16} />,
                                className: 'text-red-600 dark:text-red-400',
                              },
                            ]}
                            align="right"
                          />
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))
            )}
          </motion.div>
        )}

        {/* Table View */}
        {currentView === 'table' && (
          <Table
            data={filteredProjects}
            columns={columns}
            striped
            hoverable
            pagination
            itemsPerPage={10}
            emptyState={
              <div className="text-center py-12">
                <div className="mx-auto w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-8 w-8 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
                  No projects found
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Try adjusting your search or filter to find what you're
                  looking for.
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter(null);
                    setCategoryFilter(null);
                  }}
                >
                  Clear filters
                </Button>
              </div>
            }
          />
        )}
      </div>
    </MainLayout>
  );
}
