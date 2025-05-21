// frontend/src/components/projects/ProjectList.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useProjects } from '@/hooks/useProjects';
import { ProjectCard } from './ProjectCard';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { Pagination } from '@/components/ui/Pagination';
import { SKILLS } from '@/config/constants';
import { Modal } from '@/components/ui/Modal';
import { ROUTES } from '@/config/routes';
import { Switch } from '@/components/ui/Switch';
import {
  Plus,
  Search,
  Filter,
  GridIcon,
  List,
  SortAsc,
  SortDesc,
  AlertCircle,
} from 'lucide-react';
import { Project } from '@/types/project';
import { formatDate } from '@/utils/date';

export const ProjectList = () => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'a-z' | 'z-a'>(
    'newest',
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);
  const [completedOnly, setCompletedOnly] = useState(false);

  const { projects, loading, getProjects } = useProjects();
  const router = useRouter();

  const itemsPerPage = 9;

  useEffect(() => {
    getProjects();
  }, [getProjects]);

  const handleCreateNew = () => {
    router.push(`${ROUTES.DASHBOARD.PROJECTS}/new`);
  };

  const handleEdit = (id: string) => {
    router.push(`${ROUTES.DASHBOARD.PROJECTS}/edit/${id}`);
  };

  const handleView = (id: string) => {
    router.push(`${ROUTES.DASHBOARD.PROJECTS}/${id}`);
  };

  const handleDelete = (id: string) => {
    setProjectToDelete(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (projectToDelete) {
      try {
        // Implementation would call projectService.deleteProject(projectToDelete)
        // For now, refresh the list
        await getProjects();
      } catch (error) {
        console.error('Error deleting project:', error);
      } finally {
        setShowDeleteModal(false);
        setProjectToDelete(null);
      }
    }
  };

  const toggleSkill = (skill: string) => {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(selectedSkills.filter((s) => s !== skill));
    } else {
      setSelectedSkills([...selectedSkills, skill]);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Perform search operation
    // Reset to page 1 when search changes
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedSkills([]);
    setSortBy('newest');
    setCompletedOnly(false);
  };

  const filteredProjects = useMemo(() => {
    let filtered = [...projects];

    // Filter by search query
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (project) =>
          project.title.toLowerCase().includes(lowerQuery) ||
          project.description.toLowerCase().includes(lowerQuery),
      );
    }

    // Filter by skills
    if (selectedSkills.length > 0) {
      filtered = filtered.filter((project) =>
        selectedSkills.every((skill) => project.skills.includes(skill)),
      );
    }

    // Filter by completion status
    if (completedOnly) {
      filtered = filtered.filter((project) => project.completed);
    }

    // Sort
    switch (sortBy) {
      case 'newest':
        filtered.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
        break;
      case 'oldest':
        filtered.sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        );
        break;
      case 'a-z':
        filtered.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'z-a':
        filtered.sort((a, b) => b.title.localeCompare(a.title));
        break;
    }

    return filtered;
  }, [projects, searchQuery, selectedSkills, sortBy, completedOnly]);

  const paginatedProjects = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredProjects.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredProjects, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredProjects.length / itemsPerPage);

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

  const fadeInVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.3 } },
  };

  return (
    <MainLayout>
      <div className="projects-container space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Projects
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Manage and organize your portfolio projects
            </p>
          </div>
          <Button onClick={handleCreateNew} className="flex items-center">
            <Plus size={16} className="mr-2" />
            New Project
          </Button>
        </div>

        <Card>
          <div className="p-4">
            <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between mb-6">
              <form onSubmit={handleSearch} className="w-full md:w-1/2">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Search size={16} className="text-gray-400" />
                  </div>
                  <Input
                    type="search"
                    placeholder="Search projects..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-full"
                  />
                </div>
              </form>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setFiltersVisible(!filtersVisible)}
                  className="flex items-center px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  <Filter size={16} className="mr-2" />
                  Filters
                </button>
                <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-md p-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 rounded ${
                      viewMode === 'grid'
                        ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400'
                        : 'text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    <GridIcon size={16} />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-1.5 rounded ${
                      viewMode === 'list'
                        ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400'
                        : 'text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    <List size={16} />
                  </button>
                </div>
              </div>
            </div>

            <AnimatePresence>
              {filtersVisible && (
                <motion.div
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  variants={fadeInVariants}
                  className="mb-6 bg-gray-50 dark:bg-gray-800 p-4 rounded-md border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex flex-col md:flex-row md:items-start gap-4">
                    <div className="flex-1 space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Filter by Skills
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {SKILLS.map((skill) => (
                            <button
                              key={skill}
                              onClick={() => toggleSkill(skill)}
                              className={`px-3 py-1.5 text-xs rounded-full transition-colors ${
                                selectedSkills.includes(skill)
                                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
                                  : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                              }`}
                            >
                              {skill}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={completedOnly}
                          onChange={() => setCompletedOnly(!completedOnly)}
                          id="completed-switch"
                        />
                        <label
                          htmlFor="completed-switch"
                          className="text-sm text-gray-700 dark:text-gray-300"
                        >
                          Show completed projects only
                        </label>
                      </div>
                    </div>

                    <div className="md:w-64">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Sort By
                      </label>
                      <Select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as unknown)}
                        options={[
                          { value: 'newest', label: 'Newest First' },
                          { value: 'oldest', label: 'Oldest First' },
                          { value: 'a-z', label: 'A-Z' },
                          { value: 'z-a', label: 'Z-A' },
                        ]}
                      />

                      <div className="mt-6">
                        <Button
                          variant="outline"
                          onClick={clearFilters}
                          className="w-full"
                        >
                          Clear Filters
                        </Button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {loading ? (
              <div className="flex justify-center py-12">
                <Spinner size="large" />
              </div>
            ) : filteredProjects.length === 0 ? (
              <div className="text-center py-12">
                <div className="flex justify-center mb-4">
                  <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-full">
                    <AlertCircle
                      size={24}
                      className="text-gray-500 dark:text-gray-400"
                    />
                  </div>
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                  No projects found
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  {searchQuery || selectedSkills.length > 0 || completedOnly
                    ? 'Try adjusting your search or filters'
                    : 'Get started by creating your first project'}
                </p>
                {searchQuery || selectedSkills.length > 0 || completedOnly ? (
                  <Button variant="outline" onClick={clearFilters}>
                    Clear All Filters
                  </Button>
                ) : (
                  <Button onClick={handleCreateNew}>
                    <Plus size={16} className="mr-2" />
                    Create Project
                  </Button>
                )}
              </div>
            ) : (
              <>
                {viewMode === 'grid' ? (
                  <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                  >
                    {paginatedProjects.map((project) => (
                      <motion.div key={project.id} variants={itemVariants}>
                        <ProjectCard
                          project={project}
                          onView={() => handleView(project.id)}
                          onEdit={() => handleEdit(project.id)}
                          onDelete={() => handleDelete(project.id)}
                        />
                      </motion.div>
                    ))}
                  </motion.div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs text-gray-700 dark:text-gray-300 uppercase bg-gray-50 dark:bg-gray-800">
                        <tr>
                          <th scope="col" className="px-6 py-3">
                            Project
                          </th>
                          <th scope="col" className="px-6 py-3">
                            Skills
                          </th>
                          <th scope="col" className="px-6 py-3">
                            Status
                          </th>
                          <th scope="col" className="px-6 py-3">
                            Created
                          </th>
                          <th scope="col" className="px-6 py-3">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedProjects.map((project) => (
                          <motion.tr
                            key={project.id}
                            variants={itemVariants}
                            className="bg-white dark:bg-gray-700 border-b border-gray-200 dark:border-gray-700"
                          >
                            <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                              <div className="flex items-center">
                                {project.thumbnail ? (
                                  <img
                                    src={project.thumbnail}
                                    alt={project.title}
                                    className="w-10 h-10 object-cover rounded mr-3"
                                  />
                                ) : (
                                  <div className="w-10 h-10 bg-gray-200 dark:bg-gray-600 rounded flex items-center justify-center mr-3">
                                    <Briefcase
                                      size={16}
                                      className="text-gray-500 dark:text-gray-400"
                                    />
                                  </div>
                                )}
                                <span>{project.title}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex flex-wrap gap-1">
                                {project.skills.slice(0, 3).map((skill) => (
                                  <Badge
                                    key={skill}
                                    text={skill}
                                    color="blue"
                                  />
                                ))}
                                {project.skills.length > 3 && (
                                  <Badge
                                    text={`+${project.skills.length - 3}`}
                                    color="gray"
                                  />
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`px-2 py-1 text-xs rounded-full ${
                                  project.completed
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                }`}
                              >
                                {project.completed
                                  ? 'Completed'
                                  : 'In Progress'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                              {formatDate(project.createdAt)}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleView(project.id)}
                                  className="text-blue-600 dark:text-blue-400 hover:underline"
                                >
                                  View
                                </button>
                                <button
                                  onClick={() => handleEdit(project.id)}
                                  className="text-green-600 dark:text-green-400 hover:underline"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDelete(project.id)}
                                  className="text-red-600 dark:text-red-400 hover:underline"
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {totalPages > 1 && (
                  <div className="mt-6 flex justify-center">
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={setCurrentPage}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </Card>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Project"
      >
        <div className="p-6">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-red-100 dark:bg-red-900 rounded-full">
              <AlertCircle
                size={24}
                className="text-red-600 dark:text-red-400"
              />
            </div>
          </div>
          <h3 className="text-lg font-medium text-center text-gray-900 dark:text-white mb-2">
            Are you sure you want to delete this project?
          </h3>
          <p className="text-center text-gray-500 dark:text-gray-400 mb-6">
            This action cannot be undone. All data associated with this project
            will be permanently removed.
          </p>
          <div className="flex justify-center space-x-3">
            <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </MainLayout>
  );
};
