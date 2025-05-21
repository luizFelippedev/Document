// frontend/src/components/dashboard/RecentProjects.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Project } from '@/types/project';
import { projectService } from '@/services/project.service';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { ROUTES } from '@/config/routes';
import { Eye, Calendar, ArrowRight, Briefcase } from 'lucide-react';
import { formatDate } from '@/utils/date';

export const RecentProjects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        const data = await projectService.getProjects();

        // Sort by created date (newest first) and take only the first 3
        const sortedProjects = data
          .sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
          )
          .slice(0, 3);

        setProjects(sortedProjects);
      } catch (error) {
        console.error('Error fetching projects:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  const handleViewProject = (id: string) => {
    router.push(`${ROUTES.DASHBOARD.PROJECTS}/${id}`);
  };

  const handleViewAll = () => {
    router.push(ROUTES.DASHBOARD.PROJECTS);
  };

  if (loading) {
    return (
      <Card title="Recent Projects">
        <div className="flex justify-center py-12">
          <Spinner size="large" />
        </div>
      </Card>
    );
  }

  if (projects.length === 0) {
    return (
      <Card
        title="Recent Projects"
        headerRight={
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`${ROUTES.DASHBOARD.PROJECTS}/new`)}
          >
            Add Project
          </Button>
        }
      >
        <div className="py-12 text-center">
          <div className="mx-auto w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
            <Briefcase size={24} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No projects yet
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
            Start showcasing your work by creating your first project. Track
            your progress, share your accomplishments, and build your portfolio.
          </p>
          <Button
            onClick={() => router.push(`${ROUTES.DASHBOARD.PROJECTS}/new`)}
          >
            Create Your First Project
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card
      title="Recent Projects"
      headerRight={
        <Button
          variant="outline"
          size="sm"
          onClick={handleViewAll}
          rightIcon={<ArrowRight size={16} />}
        >
          View All
        </Button>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {projects.map((project, index) => (
          <motion.div
            key={project.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <div className="relative h-full flex flex-col rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden hover:shadow-md transition-shadow">
              {/* Project Image */}
              <div className="h-40 bg-gray-100 dark:bg-gray-700 overflow-hidden">
                {project.thumbnail ? (
                  <img
                    src={project.thumbnail}
                    alt={project.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Briefcase
                      size={36}
                      className="text-gray-400 dark:text-gray-500"
                    />
                  </div>
                )}

                {/* Status badge */}
                <div className="absolute top-2 right-2">
                  <Badge
                    text={project.completed ? 'Completed' : 'In Progress'}
                    variant={project.completed ? 'success' : 'warning'}
                    size="sm"
                  />
                </div>
              </div>

              {/* Project Info */}
              <div className="p-4 flex-1 flex flex-col">
                <h3 className="font-medium text-gray-900 dark:text-white mb-1 line-clamp-1">
                  {project.title}
                </h3>

                <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mb-2">
                  <Calendar size={12} className="mr-1" />
                  {formatDate(project.createdAt)}
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
                  {project.description.replace(/<[^>]*>/g, '')}
                </p>

                <div className="mt-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    fullWidth
                    leftIcon={<Eye size={14} />}
                    onClick={() => handleViewProject(project.id)}
                  >
                    View Project
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </Card>
  );
};
