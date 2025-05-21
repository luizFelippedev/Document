// frontend/src/app/(dashboard)/projects/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { Alert } from '@/components/ui/Alert';
import { Modal, ConfirmModal } from '@/components/ui/Modal';
import { Tabs } from '@/components/ui/Tabs';
import { ROUTES } from '@/config/routes';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Edit,
  Trash2,
  ExternalLink,
  Calendar,
  Clock,
  Tag,
  GitBranch,
  Github,
  FileText,
  MessageSquare,
  Share2,
} from 'lucide-react';

// Mock data - would be replaced with API call
const getProjectById = (id: string) => {
  const mockProjects = [
    {
      id: '1',
      title: 'E-commerce Dashboard',
      description:
        'A modern dashboard for e-commerce analytics and management with real-time sales tracking, inventory management, and customer insights. Built with a focus on performance and usability.',
      status: 'completed',
      category: 'Web Development',
      technologies: [
        'React',
        'Node.js',
        'MongoDB',
        'Express',
        'Redux',
        'TailwindCSS',
      ],
      startDate: '2025-01-15',
      endDate: '2025-04-20',
      thumbnailUrl: '/projects/ecommerce-thumb.jpg',
      images: [
        '/projects/ecommerce-1.jpg',
        '/projects/ecommerce-2.jpg',
        '/projects/ecommerce-3.jpg',
      ],
      demoUrl: 'https://example.com/demo',
      repoUrl: 'https://github.com/username/ecommerce-dashboard',
      featured: true,
      client: 'RetailTech Inc.',
      team: ['John Doe', 'Jane Smith', 'Alex Johnson'],
      longDescription: `
        <p>This e-commerce dashboard project was developed to provide merchants with a comprehensive solution for managing their online stores. The dashboard includes modules for:</p>
        
        <ul>
          <li>Sales analytics with customizable date ranges</li>
          <li>Inventory management with low-stock alerts</li>
          <li>Customer management and segmentation</li>
          <li>Order processing and tracking</li>
          <li>Marketing campaign analytics</li>
        </ul>
        
        <p>The frontend was built with React and Redux for state management, with TailwindCSS for styling. The backend API uses Node.js and Express, with MongoDB as the database.</p>
        
        <p>One of the key challenges was implementing real-time updates for sales and inventory data. This was solved using WebSockets to push updates to the client.</p>
        
        <p>The project was completed over a 3-month period and has been successfully deployed for multiple clients in the retail sector.</p>
      `,
      achievements: [
        'Increased sales tracking efficiency by 40%',
        'Reduced inventory management time by 25%',
        'Improved customer insight accuracy by 35%',
      ],
      challenges: [
        'Implementing real-time data synchronization',
        'Optimizing database queries for large datasets',
        'Designing an intuitive UI for complex data visualization',
      ],
      comments: [
        {
          id: '1',
          user: {
            id: '101',
            name: 'David Wilson',
            avatar: '/avatars/david.jpg',
          },
          text: 'Great work on this project! The UI is very clean and intuitive.',
          timestamp: '2025-04-25T14:32:00Z',
        },
        {
          id: '2',
          user: {
            id: '102',
            name: 'Sarah Chen',
            avatar: '/avatars/sarah.jpg',
          },
          text: 'I really like the real-time updates feature. It makes the dashboard feel very responsive.',
          timestamp: '2025-04-26T09:15:00Z',
        },
      ],
    },
    {
      id: '2',
      title: 'Mobile Fitness App',
      description:
        'An iOS/Android app for tracking workouts and nutrition with personalized fitness plans and progress tracking.',
      status: 'in-progress',
      category: 'Mobile Development',
      technologies: ['React Native', 'Firebase', 'Redux', 'TypeScript'],
      startDate: '2025-03-01',
      endDate: null,
      thumbnailUrl: '/projects/fitness-thumb.jpg',
      images: ['/projects/fitness-1.jpg', '/projects/fitness-2.jpg'],
      demoUrl: null,
      repoUrl: 'https://github.com/username/fitness-app',
      featured: false,
      client: 'FitLife Tech',
      team: ['Jane Smith', 'Mike Johnson'],
      longDescription: `
        <p>The FitLife mobile app is designed to help users track their fitness journey and maintain healthy habits. Key features include:</p>
        
        <ul>
          <li>Personalized workout plans based on user goals</li>
          <li>Nutrition tracking and meal suggestions</li>
          <li>Progress tracking with visual charts</li>
          <li>Social features for workout sharing and challenges</li>
          <li>Integration with wearable fitness devices</li>
        </ul>
        
        <p>The app is built using React Native for cross-platform compatibility, with Firebase for backend services including authentication, database, and cloud functions.</p>
        
        <p>This project is currently in the development phase, with core features already implemented and testing in progress.</p>
      `,
      achievements: [
        'Successfully integrated with multiple fitness wearable APIs',
        'Implemented efficient offline data synchronization',
        'Developed custom animation system for workout demonstrations',
      ],
      challenges: [
        'Cross-platform consistency in UI/UX',
        'Battery optimization for background tracking',
        'Privacy-compliant health data storage',
      ],
      comments: [
        {
          id: '1',
          user: {
            id: '103',
            name: 'Tom Reynolds',
            avatar: '/avatars/tom.jpg',
          },
          text: 'Looking forward to the final release. The beta version is already impressive!',
          timestamp: '2025-05-10T16:45:00Z',
        },
      ],
    },
    // Additional mock projects would be here
  ];

  return mockProjects.find((project) => project.id === id) || null;
};

export default function ProjectDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const [project, setProject] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const router = useRouter();

  // Fetch project details
  useEffect(() => {
    const loadProject = async () => {
      try {
        // In a real app, this would be an API call
        const projectData = getProjectById(params.id);

        if (!projectData) {
          setError('Project not found');
        } else {
          setProject(projectData);
        }
      } catch (err) {
        setError('Failed to load project details');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    // Simulate API call
    setTimeout(loadProject, 1000);
  }, [params.id]);

  // Handle project deletion
  const handleDeleteProject = () => {
    // In a real app, this would make an API call to delete the project
    setDeleteModalOpen(false);

    // Simulate successful deletion
    setTimeout(() => {
      router.push(ROUTES.DASHBOARD.PROJECTS.ROOT);
    }, 500);
  };

  // Animation variants
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: 'easeOut',
      },
    },
  };

  // Tab configuration
  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'details', label: 'Technical Details' },
    { id: 'gallery', label: 'Gallery' },
    { id: 'discussion', label: 'Discussion' },
  ];

  // Conditional loading and error states
  if (loading) {
    return (
      <MainLayout>
        <div className="flex h-96 items-center justify-center">
          <Spinner size="large" label="Loading project details..." />
        </div>
      </MainLayout>
    );
  }

  if (error || !project) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <Link
              href={ROUTES.DASHBOARD.PROJECTS.ROOT}
              className="flex items-center text-blue-600 dark:text-blue-400 hover:underline"
            >
              <ArrowLeft size={16} className="mr-2" />
              Back to Projects
            </Link>
          </div>

          <Alert
            type="error"
            title="Error"
            message={error || 'Project not found'}
            action={{
              label: 'Go back to projects',
              onClick: () => router.push(ROUTES.DASHBOARD.PROJECTS.ROOT),
            }}
          />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header with navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <Link
              href={ROUTES.DASHBOARD.PROJECTS.ROOT}
              className="flex items-center text-blue-600 dark:text-blue-400 hover:underline mb-2"
            >
              <ArrowLeft size={16} className="mr-2" />
              Back to Projects
            </Link>

            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {project.title}
            </h1>
            <div className="flex flex-wrap items-center gap-2 mt-2">
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
              />

              <Badge text={project.category} variant="secondary" />

              {project.featured && <Badge text="Featured" variant="primary" />}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              leftIcon={<Edit size={16} />}
              onClick={() =>
                router.push(`${ROUTES.DASHBOARD.PROJECTS.EDIT}/${project.id}`)
              }
            >
              Edit Project
            </Button>

            <Button
              variant="danger"
              leftIcon={<Trash2 size={16} />}
              onClick={() => setDeleteModalOpen(true)}
            >
              Delete
            </Button>
          </div>
        </div>

        {/* Project tabs */}
        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

        {/* Tab content */}
        <div className="space-y-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <motion.div
              variants={fadeIn}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            >
              {/* Main content */}
              <div className="lg:col-span-2 space-y-6">
                {/* Project thumbnail */}
                <Card>
                  <div className="aspect-video relative rounded-lg overflow-hidden">
                    {project.thumbnailUrl ? (
                      <img
                        src={project.thumbnailUrl}
                        alt={project.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-700">
                        <FileText
                          size={48}
                          className="text-gray-400 dark:text-gray-500"
                        />
                      </div>
                    )}
                  </div>
                </Card>

                {/* Project description */}
                <Card title="Description">
                  <div
                    className="prose dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{
                      __html: project.longDescription,
                    }}
                  />
                </Card>

                {/* Achievements and challenges */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card title="Achievements">
                    <ul className="space-y-2">
                      {project.achievements.map(
                        (achievement: string, index: number) => (
                          <li key={index} className="flex items-start">
                            <span className="text-green-500 mr-2">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </span>
                            <span>{achievement}</span>
                          </li>
                        ),
                      )}
                    </ul>
                  </Card>

                  <Card title="Challenges">
                    <ul className="space-y-2">
                      {project.challenges.map(
                        (challenge: string, index: number) => (
                          <li key={index} className="flex items-start">
                            <span className="text-amber-500 mr-2">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </span>
                            <span>{challenge}</span>
                          </li>
                        ),
                      )}
                    </ul>
                  </Card>
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Project info */}
                <Card title="Project Information">
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Client
                      </h4>
                      <p className="mt-1">{project.client || 'N/A'}</p>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Timeline
                      </h4>
                      <div className="flex items-center mt-1">
                        <Calendar size={16} className="mr-2 text-gray-400" />
                        <span>
                          {new Date(project.startDate).toLocaleDateString()}
                        </span>
                        {project.endDate && (
                          <>
                            <span className="mx-2">-</span>
                            <span>
                              {new Date(project.endDate).toLocaleDateString()}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Team
                      </h4>
                      <div className="mt-1">
                        {project.team && project.team.length > 0 ? (
                          <ul className="space-y-1">
                            {project.team.map(
                              (member: string, index: number) => (
                                <li key={index}>{member}</li>
                              ),
                            )}
                          </ul>
                        ) : (
                          <p>No team members specified</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Technologies
                      </h4>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {project.technologies.map(
                          (tech: string, index: number) => (
                            <Badge
                              key={index}
                              text={tech}
                              variant="outline"
                              size="sm"
                            />
                          ),
                        )}
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Project links */}
                <Card title="Project Links">
                  <div className="space-y-3">
                    {project.demoUrl && (
                      <a
                        href={project.demoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        <ExternalLink size={16} className="mr-2" />
                        Live Demo
                      </a>
                    )}

                    {project.repoUrl && (
                      <a
                        href={project.repoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        <Github size={16} className="mr-2" />
                        Repository
                      </a>
                    )}

                    <button
                      className="flex items-center text-blue-600 dark:text-blue-400 hover:underline"
                      onClick={() => {
                        // In a real app, this would copy a shareable link
                        navigator.clipboard.writeText(window.location.href);
                        // Would show a toast notification
                      }}
                    >
                      <Share2 size={16} className="mr-2" />
                      Share Project
                    </button>
                  </div>
                </Card>
              </div>
            </motion.div>
          )}

          {/* Technical Details Tab */}
          {activeTab === 'details' && (
            <motion.div
              variants={fadeIn}
              initial="hidden"
              animate="visible"
              className="space-y-6"
            >
              <Card title="Technical Overview">
                <div className="prose dark:prose-invert max-w-none">
                  <p>
                    This project was built using the following technologies and
                    methodologies:
                  </p>

                  <h3>Frontend</h3>
                  <ul>
                    {project.technologies
                      .filter((tech: string) =>
                        [
                          'React',
                          'React Native',
                          'Redux',
                          'TailwindCSS',
                          'TypeScript',
                        ].includes(tech),
                      )
                      .map((tech: string, index: number) => (
                        <li key={index}>{tech}</li>
                      ))}
                  </ul>

                  <h3>Backend</h3>
                  <ul>
                    {project.technologies
                      .filter((tech: string) =>
                        ['Node.js', 'Express', 'MongoDB', 'Firebase'].includes(
                          tech,
                        ),
                      )
                      .map((tech: string, index: number) => (
                        <li key={index}>{tech}</li>
                      ))}
                  </ul>

                  <h3>Development Process</h3>
                  <p>
                    The project followed an Agile development methodology with
                    two-week sprints. Key features were developed in priority
                    order based on user feedback and business requirements.
                  </p>

                  <h3>Deployment</h3>
                  <p>
                    The application is deployed using a CI/CD pipeline with
                    automated testing and deployment. Infrastructure is managed
                    using infrastructure as code principles.
                  </p>
                </div>
              </Card>

              <Card title="Architecture Diagram">
                <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                  <p className="text-gray-500 dark:text-gray-400">
                    Architecture diagram will be displayed here
                  </p>
                </div>
              </Card>
            </motion.div>
          )}

          {/* Gallery Tab */}
          {activeTab === 'gallery' && (
            <motion.div variants={fadeIn} initial="hidden" animate="visible">
              <Card title="Project Gallery">
                {project.images && project.images.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {project.images.map((image: string, index: number) => (
                      <div
                        key={index}
                        className="aspect-video bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden cursor-pointer transition-transform hover:scale-105"
                        onClick={() => setSelectedImage(image)}
                      >
                        <img
                          src={image}
                          alt={`${project.title} screenshot ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                ) : (
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
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
                      No images available
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      No screenshots or images have been added to this project
                      yet.
                    </p>
                  </div>
                )}
              </Card>

              {/* Image preview modal */}
              <Modal
                isOpen={!!selectedImage}
                onClose={() => setSelectedImage(null)}
                size="xl"
                showCloseButton
              >
                <div className="p-2">
                  {selectedImage && (
                    <img
                      src={selectedImage}
                      alt="Project screenshot"
                      className="w-full h-auto rounded"
                    />
                  )}
                </div>
              </Modal>
            </motion.div>
          )}

          {/* Discussion Tab */}
          {activeTab === 'discussion' && (
            <motion.div
              variants={fadeIn}
              initial="hidden"
              animate="visible"
              className="space-y-6"
            >
              <Card title="Comments & Feedback">
                {project.comments && project.comments.length > 0 ? (
                  <div className="space-y-4">
                    {project.comments.map((comment: unknown) => (
                      <div
                        key={comment.id}
                        className="flex gap-4 p-4 rounded-lg bg-gray-50 dark:bg-gray-800"
                      >
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 rounded-full overflow-hidden">
                            {comment.user.avatar ? (
                              <img
                                src={comment.user.avatar}
                                alt={comment.user.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                                <span className="text-gray-500 dark:text-gray-400">
                                  {comment.user.name.charAt(0)}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-gray-900 dark:text-white">
                              {comment.user.name}
                            </span>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              {new Date(comment.timestamp).toLocaleString()}
                            </span>
                          </div>

                          <p className="text-gray-700 dark:text-gray-300">
                            {comment.text}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="mx-auto w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                      <MessageSquare size={24} className="text-gray-400" />
                    </div>
                    <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
                      No comments yet
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      Be the first to leave a comment on this project.
                    </p>
                  </div>
                )}

                {/* Comment form */}
                <div className="mt-6 border-t pt-4 dark:border-gray-700">
                  <h3 className="text-lg font-medium mb-3">Add a Comment</h3>
                  <textarea
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                    rows={4}
                    placeholder="Share your thoughts or feedback..."
                  ></textarea>
                  <div className="mt-3 flex justify-end">
                    <Button>Post Comment</Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}
        </div>
      </div>

      {/* Delete confirmation modal */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Project"
        message="Are you sure you want to delete this project? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDeleteProject}
        confirmVariant="danger"
      />
    </MainLayout>
  );
}
