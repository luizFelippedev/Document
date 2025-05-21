// frontend/src/components/projects/ProjectGallery.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { projectService } from "@/services/project.service";
import { useNotification } from "@/hooks/useNotification";
import { ROUTES } from "@/config/routes";
import { Project } from "@/types/project";
import {
  ArrowLeft,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Globe,
  GitHub,
  Share2,
  AlertCircle,
  Calendar,
  CheckCircle,
  Clock,
} from "lucide-react";
import { cn } from "@/utils/cn";
import { formatDate } from "@/utils/date";

interface ProjectGalleryProps {
  id: string;
}

export const ProjectGallery: React.FC<ProjectGalleryProps> = ({ id }) => {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [showImagesModal, setShowImagesModal] = useState(false);

  const router = useRouter();
  const { showToast } = useNotification();

  // Fetch project data
  useEffect(() => {
    const fetchProject = async () => {
      try {
        setLoading(true);
        const data = await projectService.getProject(id);
        setProject(data);
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to load project");
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [id]);

  // Handle project deletion
  const handleDelete = async () => {
    try {
      await projectService.deleteProject(id);
      showToast("success", "Project deleted successfully");
      router.push(ROUTES.DASHBOARD.PROJECTS);
    } catch (err: any) {
      showToast(
        "error",
        err.response?.data?.message || "Failed to delete project",
      );
    }
    setShowDeleteModal(false);
  };

  // Navigation between gallery images
  const goToPreviousImage = () => {
    setActiveImageIndex((prev) =>
      prev === 0 ? (project?.images?.length || 1) - 1 : prev - 1,
    );
  };

  const goToNextImage = () => {
    setActiveImageIndex((prev) =>
      prev === (project?.images?.length || 1) - 1 ? 0 : prev + 1,
    );
  };

  // Select a specific image
  const selectImage = (index: number) => {
    setActiveImageIndex(index);
  };

  // Share project
  const shareProject = () => {
    const url = window.location.href;

    // Use navigator.share if available (mobile devices)
    if (navigator.share) {
      navigator
        .share({
          title: project?.title || "Check out my project",
          text:
            project?.description?.substring(0, 100) ||
            "Take a look at my project",
          url,
        })
        .catch((err) => {
          console.error("Error sharing:", err);
        });
    } else {
      // Fallback to copying the URL to clipboard
      navigator.clipboard
        .writeText(url)
        .then(() => {
          showToast("success", "Link copied to clipboard");
        })
        .catch((err) => {
          showToast("error", "Failed to copy link");
        });
    }
  };

  // Get all gallery images (thumbnail + project images)
  const getAllImages = () => {
    const images = [];

    if (project?.thumbnail) {
      images.push(project.thumbnail);
    }

    if (project?.images && project.images.length > 0) {
      images.push(...project.images);
    }

    return images;
  };

  const allImages = getAllImages();

  // Render the project details
  const renderProjectContent = () => {
    if (loading) {
      return (
        <Card className="p-8 flex justify-center">
          <div className="flex flex-col items-center">
            <div className="h-12 w-12 rounded-full border-4 border-t-blue-500 border-b-blue-500 border-l-transparent border-r-transparent animate-spin"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">
              Loading project details...
            </p>
          </div>
        </Card>
      );
    }

    if (error || !project) {
      return (
        <Card className="p-8">
          <div className="flex flex-col items-center">
            <div className="rounded-full bg-red-100 dark:bg-red-900 p-3 w-16 h-16 flex items-center justify-center mb-4">
              <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Project Not Found
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8 text-center max-w-md">
              {error ||
                "We couldn't find the project you're looking for. It may have been deleted or you may not have permission to view it."}
            </p>
            <Button
              onClick={() => router.push(ROUTES.DASHBOARD.PROJECTS)}
              leftIcon={<ArrowLeft size={16} />}
            >
              Back to Projects
            </Button>
          </div>
        </Card>
      );
    }

    return (
      <>
        {/* Gallery Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
          {/* Main Image */}
          <div className="lg:col-span-8">
            <Card className="overflow-hidden">
              <div
                className="aspect-video w-full bg-gray-100 dark:bg-gray-800 overflow-hidden cursor-pointer relative group"
                onClick={() => setShowImagesModal(true)}
              >
                {allImages.length > 0 ? (
                  <img
                    src={allImages[activeImageIndex]}
                    alt={project.title}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500">
                    <div className="text-center">
                      <div className="text-4xl mb-2">🖼️</div>
                      <p>No images available</p>
                    </div>
                  </div>
                )}

                {/* Navigation buttons */}
                {allImages.length > 1 && (
                  <>
                    <button
                      className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        goToPreviousImage();
                      }}
                    >
                      <ChevronLeft size={20} />
                    </button>

                    <button
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        goToNextImage();
                      }}
                    >
                      <ChevronRight size={20} />
                    </button>

                    <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="bg-black/50 rounded-full px-3 py-1.5 text-white text-xs">
                        {activeImageIndex + 1} / {allImages.length}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Thumbnail Gallery */}
              {allImages.length > 1 && (
                <div className="p-2 border-t border-gray-200 dark:border-gray-700 overflow-x-auto">
                  <div className="flex space-x-2">
                    {allImages.map((image, index) => (
                      <div
                        key={index}
                        className={cn(
                          "h-16 w-16 flex-shrink-0 rounded overflow-hidden cursor-pointer",
                          activeImageIndex === index &&
                            "ring-2 ring-blue-500 dark:ring-blue-400",
                        )}
                        onClick={() => selectImage(index)}
                      >
                        <img
                          src={image}
                          alt={`Thumbnail ${index + 1}`}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          </div>

          {/* Project Info */}
          <div className="lg:col-span-4">
            <Card className="h-full flex flex-col">
              <div className="p-6 flex-1">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center">
                    {project.completed ? (
                      <span className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs font-medium px-2.5 py-0.5 rounded-full flex items-center">
                        <CheckCircle size={12} className="mr-1" />
                        Completed
                      </span>
                    ) : (
                      <span className="bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 text-xs font-medium px-2.5 py-0.5 rounded-full flex items-center">
                        <Clock size={12} className="mr-1" />
                        In Progress
                      </span>
                    )}
                  </div>

                  <div className="flex space-x-1">
                    <button
                      className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
                      onClick={shareProject}
                      title="Share Project"
                    >
                      <Share2 size={18} />
                    </button>

                    <button
                      className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
                      onClick={() =>
                        router.push(`${ROUTES.DASHBOARD.PROJECTS}/edit/${id}`)
                      }
                      title="Edit Project"
                    >
                      <Edit size={18} />
                    </button>

                    <button
                      className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
                      onClick={() => setShowDeleteModal(true)}
                      title="Delete Project"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {project.title}
                </h1>

                {project.category && (
                  <div className="mb-4">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      {project.category
                        .replace(/-/g, " ")
                        .replace(/\b\w/g, (l) => l.toUpperCase())}
                    </span>
                  </div>
                )}

                <div className="space-y-4">
                  {/* Timeline */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                      Timeline
                    </h3>
                    <div className="flex items-center">
                      <Calendar
                        size={16}
                        className="text-gray-500 dark:text-gray-400 mr-2"
                      />
                      {project.startDate ? (
                        <div className="text-sm">
                          {formatDate(project.startDate)}
                          {project.endDate && project.completed ? (
                            <> to {formatDate(project.endDate)}</>
                          ) : (
                            <> to Present</>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          No timeline specified
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Skills */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                      Skills
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {project.skills.map((skill) => (
                        <Badge
                          key={skill}
                          text={skill}
                          variant="primary"
                          size="sm"
                        />
                      ))}
                    </div>
                  </div>

                  {/* Links */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                      Links
                    </h3>
                    <div className="flex flex-col space-y-2">
                      {project.demoUrl && (
                        <a
                          href={project.demoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          <Globe size={16} className="mr-2" />
                          View Demo
                        </a>
                      )}

                      {project.repoUrl && (
                        <a
                          href={project.repoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          <GitHub size={16} className="mr-2" />
                          View Source Code
                        </a>
                      )}

                      {!project.demoUrl && !project.repoUrl && (
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          No links available
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 dark:border-gray-700">
                <Button
                  variant="outline"
                  fullWidth
                  leftIcon={<ArrowLeft size={16} />}
                  onClick={() => router.push(ROUTES.DASHBOARD.PROJECTS)}
                >
                  Back to Projects
                </Button>
              </div>
            </Card>
          </div>
        </div>

        {/* Project Description */}
        <Card className="mb-8">
          <div className="p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Project Description
            </h2>

            <div
              className="prose dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: project.description }}
            />
          </div>
        </Card>

        {/* Related projects section could go here */}
      </>
    );
  };

  return (
    <MainLayout>
      {renderProjectContent()}

      {/* Delete confirmation modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Project"
      >
        <div className="p-6">
          <div className="flex flex-col items-center text-center mb-4">
            <div className="rounded-full bg-red-100 dark:bg-red-900 p-3 w-16 h-16 flex items-center justify-center mb-4">
              <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Delete Project?
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Are you sure you want to delete this project? This action cannot
              be undone.
            </p>
          </div>

          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              Delete
            </Button>
          </div>
        </div>
      </Modal>

      {/* Images fullscreen modal */}
      <Modal
        isOpen={showImagesModal}
        onClose={() => setShowImagesModal(false)}
        size="xl"
      >
        <div className="relative">
          {/* Image container */}
          <div className="h-[80vh] flex items-center justify-center bg-black">
            {allImages.length > 0 ? (
              <img
                src={allImages[activeImageIndex]}
                alt={`Project image ${activeImageIndex + 1}`}
                className="max-h-full max-w-full object-contain"
              />
            ) : (
              <div className="flex items-center justify-center text-white">
                No images available
              </div>
            )}

            {/* Navigation buttons */}
            {allImages.length > 1 && (
              <>
                <button
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full"
                  onClick={goToPreviousImage}
                >
                  <ChevronLeft size={24} />
                </button>

                <button
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full"
                  onClick={goToNextImage}
                >
                  <ChevronRight size={24} />
                </button>
              </>
            )}

            {/* Image counter */}
            {allImages.length > 1 && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                <div className="bg-black/70 rounded-full px-4 py-2 text-white text-sm">
                  {activeImageIndex + 1} / {allImages.length}
                </div>
              </div>
            )}
          </div>

          {/* Thumbnails */}
          {allImages.length > 1 && (
            <div className="absolute bottom-0 left-0 right-0 bg-black/80 p-2 overflow-x-auto">
              <div className="flex space-x-2 justify-center">
                {allImages.map((image, index) => (
                  <div
                    key={index}
                    className={cn(
                      "h-16 w-16 flex-shrink-0 rounded overflow-hidden cursor-pointer transition-opacity",
                      activeImageIndex === index
                        ? "opacity-100 ring-2 ring-blue-500"
                        : "opacity-60 hover:opacity-100",
                    )}
                    onClick={() => selectImage(index)}
                  >
                    <img
                      src={image}
                      alt={`Thumbnail ${index + 1}`}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Modal>
    </MainLayout>
  );
};
