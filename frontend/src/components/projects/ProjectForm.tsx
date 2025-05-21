// frontend/src/components/projects/ProjectForm.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Switch } from "@/components/ui/Switch";
import { Badge } from "@/components/ui/Badge";
import { SKILLS } from "@/config/constants";
import { projectService } from "@/services/project.service";
import { useNotification } from "@/hooks/useNotification";
import { ROUTES } from "@/config/routes";
import { Project, ProjectFormData } from "@/types/project";
import { Editor } from "@/components/ui/Editor";
import {
  Trash2,
  ChevronLeft,
  ChevronRight,
  Upload,
  X,
  GitHub,
  Globe,
  AlertCircle,
  Clock,
  CheckCircle,
  Save,
  ArrowLeft,
  Eye,
  Calendar,
  Link as LinkIcon,
} from "lucide-react";
import { cn } from "@/utils/cn";
import { FileUploader } from "@/components/ui/FileUploader";
import { format } from "date-fns";

const MAX_IMAGES = 5;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FILE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

// Schema for form validation
const projectSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(100, "Title cannot exceed 100 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  skills: z.array(z.string()).min(1, "Select at least one skill"),
  demoUrl: z.string().url("Enter a valid URL").or(z.literal("")).optional(),
  repoUrl: z.string().url("Enter a valid URL").or(z.literal("")).optional(),
  completed: z.boolean().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  isPublic: z.boolean().optional(),
  category: z.string().optional(),
});

type ProjectFormValues = z.infer<typeof projectSchema>;

interface ProjectFormProps {
  id?: string;
  initialData?: Project;
}

export const ProjectForm = ({ id, initialData }: ProjectFormProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string>("");
  const [projectImages, setProjectImages] = useState<File[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
  const [isEditorTouched, setIsEditorTouched] = useState(false);

  const router = useRouter();
  const { showToast } = useNotification();

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors, isDirty, isSubmitted },
    reset,
  } = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      title: "",
      description: "",
      skills: [],
      demoUrl: "",
      repoUrl: "",
      completed: false,
      startDate: "",
      endDate: "",
      isPublic: true,
      category: "",
    },
  });

  const description = watch("description");
  const skills = watch("skills");
  const completed = watch("completed");
  const startDate = watch("startDate");
  const endDate = watch("endDate");

  // Initialize form with existing data if editing
  useEffect(() => {
    if (initialData) {
      reset({
        title: initialData.title,
        description: initialData.description,
        skills: initialData.skills,
        demoUrl: initialData.demoUrl || "",
        repoUrl: initialData.repoUrl || "",
        completed: initialData.completed,
        startDate: initialData.startDate || "",
        endDate: initialData.endDate || "",
        isPublic: initialData.isPublic !== false, // default to true
        category: initialData.category || "",
      });

      if (initialData.thumbnail) {
        setThumbnailPreview(initialData.thumbnail);
      }

      if (initialData.images && initialData.images.length > 0) {
        setImagePreviewUrls(initialData.images);
      }
    }
  }, [initialData, reset]);

  // Handle description changes from the editor
  const handleEditorChange = (value: string) => {
    setValue("description", value, { shouldDirty: true });
    setIsEditorTouched(true);
  };

  // Handle thumbnail upload
  const handleThumbnailUpload = (files: File[]) => {
    if (files.length > 0) {
      const file = files[0];

      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        showToast(
          "error",
          "Please upload an image file (JPEG, PNG, WebP, or GIF)",
        );
        return;
      }

      if (file.size > MAX_FILE_SIZE) {
        showToast("error", "File size exceeds 5MB limit");
        return;
      }

      setThumbnailFile(file);

      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setThumbnailPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle project images upload
  const handleImagesUpload = (files: File[]) => {
    if (files.length > 0) {
      // Check if adding these files would exceed the limit
      if (projectImages.length + files.length > MAX_IMAGES) {
        showToast("error", `You can upload a maximum of ${MAX_IMAGES} images`);
        return;
      }

      // Filter valid files
      const validFiles = files.filter((file) => {
        if (!ALLOWED_FILE_TYPES.includes(file.type)) {
          showToast(
            "error",
            "Please upload image files only (JPEG, PNG, WebP, or GIF)",
          );
          return false;
        }

        if (file.size > MAX_FILE_SIZE) {
          showToast("error", "File size exceeds 5MB limit");
          return false;
        }

        return true;
      });

      if (validFiles.length === 0) return;

      // Add new files to state
      setProjectImages((prev) => [...prev, ...validFiles]);

      // Create preview URLs for new files
      const newPreviews = validFiles.map((file) => {
        const reader = new FileReader();
        return new Promise<string>((resolve) => {
          reader.onloadend = () => {
            resolve(reader.result as string);
          };
          reader.readAsDataURL(file);
        });
      });

      Promise.all(newPreviews).then((previews) => {
        setImagePreviewUrls((prev) => [...prev, ...previews]);
      });
    }
  };

  // Remove thumbnail
  const removeThumbnail = () => {
    setThumbnailFile(null);
    setThumbnailPreview("");
  };

  // Remove project image
  const removeProjectImage = (index: number) => {
    // If the image is a URL (existing image)
    if (index < imagePreviewUrls.length) {
      setImagePreviewUrls((prev) => prev.filter((_, i) => i !== index));
    }

    // If the image is a File (new image)
    if (index < projectImages.length) {
      setProjectImages((prev) => prev.filter((_, i) => i !== index));
    }
  };

  // Toggle skill selection
  const toggleSkill = (skill: string) => {
    const currentSkills = watch("skills") || [];

    if (currentSkills.includes(skill)) {
      setValue(
        "skills",
        currentSkills.filter((s) => s !== skill),
        { shouldDirty: true },
      );
    } else {
      setValue("skills", [...currentSkills, skill], { shouldDirty: true });
    }
  };

  // Handle form submission
  const onSubmit = async (data: ProjectFormValues) => {
    try {
      setIsSubmitting(true);

      // Prepare form data for API
      const formData = new FormData();
      formData.append("title", data.title);
      formData.append("description", data.description);
      formData.append("skills", JSON.stringify(data.skills));
      formData.append("completed", String(data.completed));

      if (data.demoUrl) formData.append("demoUrl", data.demoUrl);
      if (data.repoUrl) formData.append("repoUrl", data.repoUrl);
      if (data.startDate) formData.append("startDate", data.startDate);
      if (data.endDate) formData.append("endDate", data.endDate);
      formData.append("isPublic", String(data.isPublic));
      if (data.category) formData.append("category", data.category);

      // Add thumbnail if changed
      if (thumbnailFile) {
        formData.append("thumbnail", thumbnailFile);
      }

      // Add project images if changed
      projectImages.forEach((image) => {
        formData.append("images", image);
      });

      // Keep track of deleted images
      if (initialData?.images) {
        const deletedImages = initialData.images.filter(
          (url) => !imagePreviewUrls.includes(url),
        );
        if (deletedImages.length > 0) {
          formData.append("deletedImages", JSON.stringify(deletedImages));
        }
      }

      // Send request to API
      if (id) {
        // Update existing project
        await projectService.updateProject(id, formData);
        showToast("success", "Project updated successfully");
      } else {
        // Create new project
        await projectService.createProject(formData);
        showToast("success", "Project created successfully");
      }

      // Redirect to projects page
      router.push(ROUTES.DASHBOARD.PROJECTS);
    } catch (error: any) {
      showToast(
        "error",
        error.response?.data?.message ||
          "An error occurred while saving the project",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Navigation between form steps
  const goToNextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
      window.scrollTo(0, 0);
    }
  };

  const goToPreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo(0, 0);
    }
  };

  // Check if current step is valid
  const isCurrentStepValid = () => {
    if (currentStep === 1) {
      // Basic info validation
      return (
        !errors.title &&
        !!watch("title") &&
        !errors.description &&
        !!watch("description") &&
        description.length >= 10
      );
    }

    if (currentStep === 2) {
      // Details validation
      return (
        !errors.skills &&
        watch("skills").length > 0 &&
        !errors.demoUrl &&
        !errors.repoUrl
      );
    }

    return true;
  };

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="flex items-center mb-6">
        <button
          type="button"
          onClick={() => router.push(ROUTES.DASHBOARD.PROJECTS)}
          className="mr-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {id ? "Edit Project" : "Create New Project"}
        </h1>
      </div>

      <Card className="mb-6">
        <div className="p-1">
          {/* Stepper */}
          <div className="flex mb-6">
            <div
              className={`flex-1 p-3 text-center ${
                currentStep === 1
                  ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 font-medium"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              <div className="flex items-center justify-center">
                <span
                  className={`flex items-center justify-center h-6 w-6 rounded-full ${
                    currentStep > 1
                      ? "bg-blue-600 text-white"
                      : currentStep === 1
                        ? "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 border border-blue-600 dark:border-blue-400"
                        : "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                  } text-sm mr-2`}
                >
                  {currentStep > 1 ? <CheckCircle size={14} /> : "1"}
                </span>
                Basic Info
              </div>
            </div>

            <div
              className={`flex-1 p-3 text-center ${
                currentStep === 2
                  ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 font-medium"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              <div className="flex items-center justify-center">
                <span
                  className={`flex items-center justify-center h-6 w-6 rounded-full ${
                    currentStep > 2
                      ? "bg-blue-600 text-white"
                      : currentStep === 2
                        ? "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 border border-blue-600 dark:border-blue-400"
                        : "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                  } text-sm mr-2`}
                >
                  {currentStep > 2 ? <CheckCircle size={14} /> : "2"}
                </span>
                Details
              </div>
            </div>

            <div
              className={`flex-1 p-3 text-center ${
                currentStep === 3
                  ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 font-medium"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              <div className="flex items-center justify-center">
                <span
                  className={`flex items-center justify-center h-6 w-6 rounded-full ${
                    currentStep === 3
                      ? "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 border border-blue-600 dark:border-blue-400"
                      : "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                  } text-sm mr-2`}
                >
                  3
                </span>
                Media
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)}>
            {/* Step 1: Basic Project Information */}
            {currentStep === 1 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="p-6"
              >
                <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white">
                  Basic Project Information
                </h2>

                <div className="space-y-6">
                  <div>
                    <label
                      htmlFor="title"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                      Project Title *
                    </label>
                    <Input
                      id="title"
                      placeholder="Enter project title"
                      error={errors.title?.message}
                      {...register("title")}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="description"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                      Project Description *
                    </label>
                    <Controller
                      name="description"
                      control={control}
                      render={({ field }) => (
                        <Editor
                          value={field.value}
                          onChange={handleEditorChange}
                          placeholder="Describe your project in detail..."
                          minHeight="300px"
                          error={errors.description?.message}
                        />
                      )}
                    />
                    {description.length > 0 && description.length < 10 && (
                      <p className="mt-1 text-sm text-amber-600 dark:text-amber-400 flex items-center">
                        <AlertCircle size={14} className="mr-1" />
                        Description should be at least 10 characters
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="category"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                      Category
                    </label>
                    <Select
                      id="category"
                      value={watch("category")}
                      onChange={(value) =>
                        setValue("category", value, { shouldDirty: true })
                      }
                      options={[
                        { value: "web-development", label: "Web Development" },
                        {
                          value: "mobile-development",
                          label: "Mobile Development",
                        },
                        { value: "ui-ux-design", label: "UI/UX Design" },
                        { value: "data-science", label: "Data Science" },
                        {
                          value: "machine-learning",
                          label: "Machine Learning",
                        },
                        { value: "blockchain", label: "Blockchain" },
                        {
                          value: "game-development",
                          label: "Game Development",
                        },
                        { value: "other", label: "Other" },
                      ]}
                      placeholder="Select a category"
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row sm:space-x-6 space-y-4 sm:space-y-0">
                    <div className="w-full sm:w-1/2">
                      <label
                        htmlFor="startDate"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                      >
                        Start Date
                      </label>
                      <Input
                        id="startDate"
                        type="date"
                        {...register("startDate")}
                      />
                    </div>

                    <div className="w-full sm:w-1/2">
                      <label
                        htmlFor="endDate"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                      >
                        End Date
                      </label>
                      <Input
                        id="endDate"
                        type="date"
                        {...register("endDate")}
                        disabled={!completed}
                      />
                      {startDate &&
                        endDate &&
                        new Date(endDate) < new Date(startDate) && (
                          <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center">
                            <AlertCircle size={14} className="mr-1" />
                            End date cannot be before start date
                          </p>
                        )}
                    </div>
                  </div>

                  <Switch
                    id="completed"
                    checked={completed}
                    onChange={(checked) =>
                      setValue("completed", checked, { shouldDirty: true })
                    }
                    label="Project is completed"
                    description={
                      completed
                        ? "Mark this project as completed and share your results"
                        : "Leave unchecked if the project is still in progress"
                    }
                  />
                </div>

                <div className="mt-8 flex justify-end">
                  <Button
                    type="button"
                    onClick={goToNextStep}
                    disabled={!isCurrentStepValid()}
                    rightIcon={<ChevronRight size={16} />}
                  >
                    Next Step
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Step 2: Project Details */}
            {currentStep === 2 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="p-6"
              >
                <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white">
                  Project Details
                </h2>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Skills Used *
                    </label>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {SKILLS.map((skill) => (
                        <Badge
                          key={skill}
                          text={skill}
                          variant={
                            skills?.includes(skill) ? "primary" : "outline"
                          }
                          size="lg"
                          className="cursor-pointer"
                          onClick={() => toggleSkill(skill)}
                        />
                      ))}
                    </div>
                    {errors.skills && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center">
                        <AlertCircle size={14} className="mr-1" />
                        {errors.skills?.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="demoUrl"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                      Demo URL
                    </label>
                    <Input
                      id="demoUrl"
                      placeholder="https://example.com"
                      error={errors.demoUrl?.message}
                      leftElement={<Globe size={18} />}
                      {...register("demoUrl")}
                    />
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Link to a live demo of your project (if available)
                    </p>
                  </div>

                  <div>
                    <label
                      htmlFor="repoUrl"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                      Repository URL
                    </label>
                    <Input
                      id="repoUrl"
                      placeholder="https://github.com/username/repo"
                      error={errors.repoUrl?.message}
                      leftElement={<GitHub size={18} />}
                      {...register("repoUrl")}
                    />
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Link to your project's code repository
                    </p>
                  </div>

                  <Switch
                    id="isPublic"
                    checked={watch("isPublic")}
                    onChange={(checked) =>
                      setValue("isPublic", checked, { shouldDirty: true })
                    }
                    label="Project is public"
                    description="Make this project visible to everyone. Uncheck to keep it private to you and your team."
                  />
                </div>

                <div className="mt-8 flex justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={goToPreviousStep}
                    leftIcon={<ChevronLeft size={16} />}
                  >
                    Previous Step
                  </Button>

                  <Button
                    type="button"
                    onClick={goToNextStep}
                    disabled={!isCurrentStepValid()}
                    rightIcon={<ChevronRight size={16} />}
                  >
                    Next Step
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Step 3: Media & Review */}
            {currentStep === 3 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="p-6"
              >
                <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white">
                  Media & Finalize
                </h2>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Project Thumbnail
                    </label>

                    {thumbnailPreview ? (
                      <div className="relative mt-2 inline-block">
                        <img
                          src={thumbnailPreview}
                          alt="Thumbnail preview"
                          className="w-40 h-40 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                        />
                        <button
                          type="button"
                          onClick={removeThumbnail}
                          className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <FileUploader
                        onFilesSelected={handleThumbnailUpload}
                        multiple={false}
                        accept="image/*"
                        maxFiles={1}
                        className="w-full h-40"
                      >
                        <div className="flex flex-col items-center justify-center h-full">
                          <Upload className="h-8 w-8 text-gray-400 mb-2" />
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Drag and drop or click to upload
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                            PNG, JPG, WebP, GIF up to 5MB
                          </p>
                        </div>
                      </FileUploader>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Project Images ({imagePreviewUrls.length}/{MAX_IMAGES})
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-2">
                      {imagePreviewUrls.map((url, index) => (
                        <div key={index} className="relative">
                          <img
                            src={url}
                            alt={`Project image ${index + 1}`}
                            className="w-full h-40 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                          />
                          <button
                            type="button"
                            onClick={() => removeProjectImage(index)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}

                      {imagePreviewUrls.length < MAX_IMAGES && (
                        <FileUploader
                          onFilesSelected={handleImagesUpload}
                          multiple={true}
                          accept="image/*"
                          maxFiles={MAX_IMAGES - imagePreviewUrls.length}
                          className="w-full h-40"
                        >
                          <div className="flex flex-col items-center justify-center h-full border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg hover:border-gray-400 dark:hover:border-gray-600 transition-colors">
                            <Upload className="h-8 w-8 text-gray-400 mb-2" />
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Add more images
                            </p>
                          </div>
                        </FileUploader>
                      )}
                    </div>
                  </div>

                  <div className="mt-8 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                      Project Summary
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
                      <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          Title
                        </p>
                        <p className="text-base text-gray-900 dark:text-white">
                          {watch("title")}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          Category
                        </p>
                        <p className="text-base text-gray-900 dark:text-white">
                          {watch("category")
                            ? watch("category")
                                .replace("-", " ")
                                .replace(/\b\w/g, (char) => char.toUpperCase())
                            : "Not specified"}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          Status
                        </p>
                        <p className="text-base text-gray-900 dark:text-white flex items-center">
                          {watch("completed") ? (
                            <>
                              <CheckCircle
                                size={16}
                                className="text-green-500 mr-1"
                              />
                              Completed
                            </>
                          ) : (
                            <>
                              <Clock
                                size={16}
                                className="text-amber-500 mr-1"
                              />
                              In Progress
                            </>
                          )}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          Visibility
                        </p>
                        <p className="text-base text-gray-900 dark:text-white">
                          {watch("isPublic") ? "Public" : "Private"}
                        </p>
                      </div>

                      {watch("startDate") && (
                        <div>
                          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            Start Date
                          </p>
                          <p className="text-base text-gray-900 dark:text-white flex items-center">
                            <Calendar size={16} className="mr-2" />
                            {format(
                              new Date(watch("startDate")),
                              "MMMM d, yyyy",
                            )}
                          </p>
                        </div>
                      )}

                      {watch("endDate") && watch("completed") && (
                        <div>
                          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            End Date
                          </p>
                          <p className="text-base text-gray-900 dark:text-white flex items-center">
                            <Calendar size={16} className="mr-2" />
                            {format(new Date(watch("endDate")), "MMMM d, yyyy")}
                          </p>
                        </div>
                      )}

                      {watch("demoUrl") && (
                        <div>
                          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            Demo URL
                          </p>
                          <a
                            href={watch("demoUrl")}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-base text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 flex items-center"
                          >
                            <Globe size={16} className="mr-2" />
                            View Demo
                          </a>
                        </div>
                      )}

                      {watch("repoUrl") && (
                        <div>
                          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            Repository
                          </p>
                          <a
                            href={watch("repoUrl")}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-base text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 flex items-center"
                          >
                            <GitHub size={16} className="mr-2" />
                            View Repository
                          </a>
                        </div>
                      )}
                    </div>

                    <div className="mt-4">
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Skills
                      </p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {watch("skills")?.map((skill) => (
                          <Badge
                            key={skill}
                            text={skill}
                            variant="primary"
                            size="md"
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={goToPreviousStep}
                    leftIcon={<ChevronLeft size={16} />}
                  >
                    Previous Step
                  </Button>

                  <div className="flex space-x-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.push(ROUTES.DASHBOARD.PROJECTS)}
                    >
                      Cancel
                    </Button>

                    <Button
                      type="submit"
                      loading={isSubmitting}
                      loadingText="Saving..."
                      leftIcon={<Save size={16} />}
                    >
                      {id ? "Update Project" : "Create Project"}
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </form>
        </div>
      </Card>
    </div>
  );
};
