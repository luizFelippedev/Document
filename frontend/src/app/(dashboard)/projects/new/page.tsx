// frontend/src/app/(dashboard)/projects/new/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Editor } from '@/components/ui/Editor';
import { FileUploader } from '@/components/ui/FileUploader';
import { Stepper } from '@/components/ui/Stepper';
import { Alert } from '@/components/ui/Alert';
import { ROUTES } from '@/config/routes';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Calendar,
  Link as LinkIcon,
  Github,
  Tag,
  File,
} from 'lucide-react';

export default function NewProjectPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    status: 'planning',
    startDate: '',
    endDate: '',
    technologies: [] as string[],
    thumbnailUrl: null as string | null,
    repoUrl: '',
    demoUrl: '',
    longDescription: '',
    featuredImages: [] as { url: string; caption: string }[],
    team: [] as string[],
    client: '',
    featured: false,
  });
  const [newTech, setNewTech] = useState('');
  const [newTeamMember, setNewTeamMember] = useState('');
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [featuredFiles, setFeaturedFiles] = useState<File[]>([]);

  // Handle form input changes
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value, type } = e.target as HTMLInputElement;

    if (type === 'checkbox') {
      setFormData({
        ...formData,
        [name]: (e.target as HTMLInputElement).checked,
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  // Handle rich text changes
  const handleEditorChange = (value: string) => {
    setFormData({
      ...formData,
      longDescription: value,
    });
  };

  // Add a new technology
  const handleAddTechnology = () => {
    if (newTech.trim() && !formData.technologies.includes(newTech.trim())) {
      setFormData({
        ...formData,
        technologies: [...formData.technologies, newTech.trim()],
      });
      setNewTech('');
    }
  };

  // Remove a technology
  const handleRemoveTechnology = (tech: string) => {
    setFormData({
      ...formData,
      technologies: formData.technologies.filter((t) => t !== tech),
    });
  };

  // Add a new team member
  const handleAddTeamMember = () => {
    if (newTeamMember.trim() && !formData.team.includes(newTeamMember.trim())) {
      setFormData({
        ...formData,
        team: [...formData.team, newTeamMember.trim()],
      });
      setNewTeamMember('');
    }
  };

  // Remove a team member
  const handleRemoveTeamMember = (member: string) => {
    setFormData({
      ...formData,
      team: formData.team.filter((m) => m !== member),
    });
  };

  // Handle thumbnail upload
  const handleThumbnailUpload = (files: File[]) => {
    if (files.length > 0) {
      setThumbnailFile(files[0]);

      // In a real app, you would upload the file to your server/storage
      // For demo purposes, we'll create a fake URL
      const fakeUrl = URL.createObjectURL(files[0]);
      setFormData({
        ...formData,
        thumbnailUrl: fakeUrl,
      });
    }
  };

  // Handle featured images upload
  const handleFeaturedImagesUpload = (files: File[]) => {
    setFeaturedFiles((prevFiles) => [...prevFiles, ...files]);

    // In a real app, you would upload the files to your server/storage
    // For demo purposes, we'll create fake URLs
    const newImages = files.map((file) => ({
      url: URL.createObjectURL(file),
      caption: '',
    }));

    setFormData({
      ...formData,
      featuredImages: [...formData.featuredImages, ...newImages],
    });
  };

  // Update image caption
  const handleCaptionChange = (index: number, caption: string) => {
    const updatedImages = [...formData.featuredImages];
    updatedImages[index].caption = caption;

    setFormData({
      ...formData,
      featuredImages: updatedImages,
    });
  };

  // Remove a featured image
  const handleRemoveImage = (index: number) => {
    const updatedImages = [...formData.featuredImages];
    updatedImages.splice(index, 1);

    const updatedFiles = [...featuredFiles];
    updatedFiles.splice(index, 1);

    setFormData({
      ...formData,
      featuredImages: updatedImages,
    });
    setFeaturedFiles(updatedFiles);
  };

  // Handle form submission
  const handleSubmit = async () => {
    setLoading(true);

    try {
      // In a real app, this would be an API call to create the project
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Redirect to the projects list or the new project page
      router.push(ROUTES.DASHBOARD.PROJECTS.ROOT);
    } catch (error) {
      console.error('Error creating project:', error);
    } finally {
      setLoading(false);
    }
  };

  // Go to the next step
  const goToNextStep = () => {
    setCurrentStep((step) => step + 1);
    window.scrollTo(0, 0);
  };

  // Go to the previous step
  const goToPrevStep = () => {
    setCurrentStep((step) => step - 1);
    window.scrollTo(0, 0);
  };

  // Steps for the stepper
  const steps = [
    { id: 1, label: 'Basic Info' },
    { id: 2, label: 'Details' },
    { id: 3, label: 'Media' },
    { id: 4, label: 'Review' },
  ];

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

  // Category options
  const categoryOptions = [
    { value: '', label: 'Select a category' },
    { value: 'Web Development', label: 'Web Development' },
    { value: 'Mobile Development', label: 'Mobile Development' },
    { value: 'UI/UX Design', label: 'UI/UX Design' },
    { value: 'Game Development', label: 'Game Development' },
    { value: 'Data Science', label: 'Data Science' },
    { value: 'AI/ML', label: 'AI/ML' },
    { value: 'DevOps', label: 'DevOps' },
    { value: 'Blockchain', label: 'Blockchain' },
  ];

  // Status options
  const statusOptions = [
    { value: 'planning', label: 'Planning' },
    { value: 'in-progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
  ];

  // Placeholder for popular technologies
  const popularTechnologies = [
    'React',
    'Angular',
    'Vue.js',
    'Node.js',
    'Express',
    'Django',
    'Flask',
    'Laravel',
    'Spring Boot',
    'Next.js',
    'React Native',
    'Flutter',
    'Swift',
    'Kotlin',
    'TypeScript',
    'JavaScript',
    'Python',
    'Java',
    'C#',
    'PHP',
    'Ruby',
    'Go',
  ];

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto space-y-6">
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

            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Create New Project
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Add a new project to your portfolio
            </p>
          </div>
        </div>

        {/* Stepper */}
        <Stepper
          steps={steps}
          currentStep={currentStep}
          onChange={setCurrentStep}
          allowBackSteps
        />

        {/* Step 1: Basic Information */}
        {currentStep === 1 && (
          <motion.div variants={fadeIn} initial="hidden" animate="visible">
            <Card title="Basic Information">
              <div className="space-y-6">
                <div>
                  <label
                    htmlFor="title"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Project Title *
                  </label>
                  <Input
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="Enter project title"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="description"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Short Description *
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Brief description of your project (max 200 characters)"
                    className="w-full px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    rows={3}
                    maxLength={200}
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {formData.description.length}/200 characters
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label
                      htmlFor="category"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      Category *
                    </label>
                    <select
                      id="category"
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      className="w-full px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      required
                    >
                      {categoryOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="status"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      Status *
                    </label>
                    <select
                      id="status"
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      className="w-full px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      required
                    >
                      {statusOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label
                      htmlFor="startDate"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      Start Date *
                    </label>
                    <Input
                      id="startDate"
                      name="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={handleChange}
                      leftElement={<Calendar size={16} />}
                      required
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="endDate"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      End Date {formData.status === 'completed' && '*'}
                    </label>
                    <Input
                      id="endDate"
                      name="endDate"
                      type="date"
                      value={formData.endDate}
                      onChange={handleChange}
                      leftElement={<Calendar size={16} />}
                      required={formData.status === 'completed'}
                    />
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    id="featured"
                    name="featured"
                    type="checkbox"
                    checked={formData.featured}
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label
                    htmlFor="featured"
                    className="ml-2 block text-sm text-gray-700 dark:text-gray-300"
                  >
                    Feature this project on your profile
                  </label>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <Button
                  onClick={goToNextStep}
                  disabled={
                    !formData.title ||
                    !formData.description ||
                    !formData.category ||
                    !formData.startDate ||
                    (formData.status === 'completed' && !formData.endDate)
                  }
                >
                  Continue
                </Button>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Step 2: Project Details */}
        {currentStep === 2 && (
          <motion.div variants={fadeIn} initial="hidden" animate="visible">
            <Card title="Project Details">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Technologies Used *
                  </label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {formData.technologies.map((tech) => (
                      <div
                        key={tech}
                        className="flex items-center bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full px-3 py-1 text-sm"
                      >
                        <span>{tech}</span>
                        <button
                          type="button"
                          className="ml-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                          onClick={() => handleRemoveTechnology(tech)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                    {formData.technologies.length === 0 && (
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        No technologies added yet
                      </span>
                    )}
                  </div>

                  <div className="flex">
                    <Input
                      value={newTech}
                      onChange={(e) => setNewTech(e.target.value)}
                      placeholder="Add a technology"
                      className="flex-1"
                      leftElement={<Tag size={16} />}
                      onKeyDown={(e) =>
                        e.key === 'Enter' && handleAddTechnology()
                      }
                    />
                    <Button
                      className="ml-2"
                      onClick={handleAddTechnology}
                      disabled={!newTech.trim()}
                      leftIcon={<Plus size={16} />}
                    >
                      Add
                    </Button>
                  </div>

                  <div className="mt-3">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      Popular technologies:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {popularTechnologies.slice(0, 10).map((tech) => (
                        <button
                          key={tech}
                          type="button"
                          className={`text-xs px-2 py-1 rounded-full ${
                            formData.technologies.includes(tech)
                              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                          }`}
                          onClick={() => {
                            if (!formData.technologies.includes(tech)) {
                              setFormData({
                                ...formData,
                                technologies: [...formData.technologies, tech],
                              });
                            }
                          }}
                          disabled={formData.technologies.includes(tech)}
                        >
                          {tech}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Team Members
                  </label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {formData.team.map((member) => (
                      <div
                        key={member}
                        className="flex items-center bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300 rounded-full px-3 py-1 text-sm"
                      >
                        <span>{member}</span>
                        <button
                          type="button"
                          className="ml-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300"
                          onClick={() => handleRemoveTeamMember(member)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                    {formData.team.length === 0 && (
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        No team members added yet
                      </span>
                    )}
                  </div>

                  <div className="flex">
                    <Input
                      value={newTeamMember}
                      onChange={(e) => setNewTeamMember(e.target.value)}
                      placeholder="Add a team member"
                      className="flex-1"
                      onKeyDown={(e) =>
                        e.key === 'Enter' && handleAddTeamMember()
                      }
                    />
                    <Button
                      className="ml-2"
                      onClick={handleAddTeamMember}
                      disabled={!newTeamMember.trim()}
                      leftIcon={<Plus size={16} />}
                    >
                      Add
                    </Button>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="client"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Client / Company
                  </label>
                  <Input
                    id="client"
                    name="client"
                    value={formData.client}
                    onChange={handleChange}
                    placeholder="Client or company name (optional)"
                  />
                </div>

                <div>
                  <label
                    htmlFor="repoUrl"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Repository URL
                  </label>
                  <Input
                    id="repoUrl"
                    name="repoUrl"
                    type="url"
                    value={formData.repoUrl}
                    onChange={handleChange}
                    placeholder="https://github.com/username/repo"
                    leftElement={<Github size={16} />}
                  />
                </div>

                <div>
                  <label
                    htmlFor="demoUrl"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Demo URL
                  </label>
                  <Input
                    id="demoUrl"
                    name="demoUrl"
                    type="url"
                    value={formData.demoUrl}
                    onChange={handleChange}
                    placeholder="https://demo-url.com"
                    leftElement={<LinkIcon size={16} />}
                  />
                </div>

                <div>
                  <label
                    htmlFor="longDescription"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Detailed Description *
                  </label>
                  <Editor
                    value={formData.longDescription}
                    onChange={handleEditorChange}
                    minHeight="200px"
                    placeholder="Provide a detailed description of your project, including its features, challenges, and achievements..."
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-between">
                <Button variant="outline" onClick={goToPrevStep}>
                  Back
                </Button>

                <Button
                  onClick={goToNextStep}
                  disabled={
                    formData.technologies.length === 0 ||
                    !formData.longDescription
                  }
                >
                  Continue
                </Button>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Step 3: Media */}
        {currentStep === 3 && (
          <motion.div variants={fadeIn} initial="hidden" animate="visible">
            <Card title="Project Media">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Project Thumbnail *
                  </label>
                  <FileUploader
                    onFilesSelected={handleThumbnailUpload}
                    accept="image/*"
                    maxSize={5 * 1024 * 1024} // 5MB
                    maxFiles={1}
                    showPreviews
                    height="150px"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Recommended size: 1200 x 630px. Maximum file size: 5MB.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Project Gallery
                  </label>
                  <FileUploader
                    onFilesSelected={handleFeaturedImagesUpload}
                    accept="image/*"
                    maxSize={5 * 1024 * 1024} // 5MB
                    multiple
                    maxFiles={10}
                    showPreviews={false}
                    height="150px"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Add up to 10 images to showcase your project. Maximum file
                    size: 5MB per image.
                  </p>

                  {/* Image previews */}
                  {formData.featuredImages.length > 0 && (
                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {formData.featuredImages.map((image, index) => (
                        <div
                          key={index}
                          className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
                        >
                          <div className="aspect-video bg-gray-100 dark:bg-gray-800">
                            <img
                              src={image.url}
                              alt={`Gallery image ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="p-3">
                            <Input
                              placeholder={`Caption for image ${index + 1}`}
                              value={image.caption}
                              onChange={(e) =>
                                handleCaptionChange(index, e.target.value)
                              }
                              className="mb-2"
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRemoveImage(index)}
                              leftIcon={<Trash2 size={14} />}
                            >
                              Remove
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 flex justify-between">
                <Button variant="outline" onClick={goToPrevStep}>
                  Back
                </Button>

                <Button
                  onClick={goToNextStep}
                  disabled={!formData.thumbnailUrl}
                >
                  Review Project
                </Button>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Step 4: Review */}
        {currentStep === 4 && (
          <motion.div
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            className="space-y-6"
          >
            <Alert
              type="info"
              title="Review Your Project"
              message="Please review all the information before submitting your project."
            />

            <Card title="Project Summary">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    {formData.title}
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Description
                      </p>
                      <p className="text-gray-700 dark:text-gray-300">
                        {formData.description}
                      </p>
                    </div>

                    <div className="flex space-x-4">
                      <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          Category
                        </p>
                        <p className="text-gray-700 dark:text-gray-300">
                          {formData.category}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          Status
                        </p>
                        <p className="text-gray-700 dark:text-gray-300">
                          {formData.status === 'in-progress'
                            ? 'In Progress'
                            : formData.status === 'completed'
                              ? 'Completed'
                              : 'Planning'}
                        </p>
                      </div>
                    </div>

                    <div className="flex space-x-4">
                      <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          Start Date
                        </p>
                        <p className="text-gray-700 dark:text-gray-300">
                          {formData.startDate}
                        </p>
                      </div>

                      {formData.endDate && (
                        <div>
                          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            End Date
                          </p>
                          <p className="text-gray-700 dark:text-gray-300">
                            {formData.endDate}
                          </p>
                        </div>
                      )}
                    </div>

                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Technologies
                      </p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {formData.technologies.map((tech) => (
                          <span
                            key={tech}
                            className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full px-3 py-1 text-xs"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>

                    {formData.team.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          Team
                        </p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {formData.team.map((member) => (
                            <span
                              key={member}
                              className="bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300 rounded-full px-3 py-1 text-xs"
                            >
                              {member}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {formData.client && (
                      <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          Client
                        </p>
                        <p className="text-gray-700 dark:text-gray-300">
                          {formData.client}
                        </p>
                      </div>
                    )}

                    <div className="flex flex-col space-y-2">
                      {formData.repoUrl && (
                        <a
                          href={formData.repoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 dark:text-blue-400 flex items-center"
                        >
                          <Github size={16} className="mr-2" />
                          Repository
                        </a>
                      )}

                      {formData.demoUrl && (
                        <a
                          href={formData.demoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 dark:text-blue-400 flex items-center"
                        >
                          <LinkIcon size={16} className="mr-2" />
                          Live Demo
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  {formData.thumbnailUrl && (
                    <div className="aspect-video bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden mb-4">
                      <img
                        src={formData.thumbnailUrl}
                        alt="Project thumbnail"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  {formData.featuredImages.length > 0 && (
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Gallery: {formData.featuredImages.length} image
                      {formData.featuredImages.length !== 1 ? 's' : ''}
                    </p>
                  )}

                  {formData.featured && (
                    <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 rounded-lg flex items-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 mr-2"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      This project will be featured on your profile
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-6">
                <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">
                  Detailed Description
                </h4>
                <div className="prose dark:prose-invert max-w-none">
                  <div
                    dangerouslySetInnerHTML={{
                      __html: formData.longDescription,
                    }}
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-between">
                <Button variant="outline" onClick={goToPrevStep}>
                  Back
                </Button>

                <Button
                  loading={loading}
                  loadingText="Creating Project..."
                  onClick={handleSubmit}
                >
                  Create Project
                </Button>
              </div>
            </Card>
          </motion.div>
        )}
      </div>
    </MainLayout>
  );
}
