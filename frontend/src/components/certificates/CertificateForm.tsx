// frontend/src/components/certificates/CertificateForm.tsx
"use client";

import React, { useState, useEffect } from "react";
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
import { certificateService } from "@/services/certificate.service";
import { useNotification } from "@/hooks/useNotification";
import { ROUTES } from "@/config/routes";
import { Certificate, CertificateFormData } from "@/types/certificate";
import { Editor } from "@/components/ui/Editor";
import { FileUploader } from "@/components/ui/FileUploader";
import {
  ArrowLeft,
  Save,
  AlertCircle,
  Calendar,
  Award,
  Link as LinkIcon,
  Building,
  FileCheck,
  Tag,
} from "lucide-react";
import { cn } from "@/utils/cn";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FILE_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
];

// Schema for form validation
const certificateSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(100, "Title cannot exceed 100 characters"),
  issuer: z.string().min(1, "Issuer is required"),
  issueDate: z.string().min(1, "Issue date is required"),
  expiryDate: z.string().optional(),
  credentialId: z.string().optional(),
  credentialUrl: z
    .string()
    .url("Enter a valid URL")
    .or(z.literal(""))
    .optional(),
  description: z.string().optional(),
  skills: z.array(z.string()).min(1, "Select at least one skill"),
  isPublic: z.boolean().optional(),
  category: z.string().optional(),
});

type CertificateFormValues = z.infer<typeof certificateSchema>;

interface CertificateFormProps {
  id?: string;
  initialData?: Certificate;
}

export const CertificateForm = ({ id, initialData }: CertificateFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [certificateFile, setCertificateFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string>("");
  const [neverExpires, setNeverExpires] = useState(true);

  const router = useRouter();
  const { showToast } = useNotification();

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm<CertificateFormValues>({
    resolver: zodResolver(certificateSchema),
    defaultValues: {
      title: "",
      issuer: "",
      issueDate: "",
      expiryDate: "",
      credentialId: "",
      credentialUrl: "",
      description: "",
      skills: [],
      isPublic: true,
      category: "",
    },
  });

  const skills = watch("skills");
  const expiryDate = watch("expiryDate");

  // Initialize form with existing data if editing
  useEffect(() => {
    if (initialData) {
      reset({
        title: initialData.title,
        issuer: initialData.issuer,
        issueDate: initialData.issueDate,
        expiryDate: initialData.expiryDate || "",
        credentialId: initialData.credentialId || "",
        credentialUrl: initialData.credentialUrl || "",
        description: initialData.description || "",
        skills: initialData.skills,
        isPublic: initialData.isPublic !== false, // default to true
        category: initialData.category || "",
      });

      // If no expiry date is set, assume it never expires
      setNeverExpires(!initialData.expiryDate);

      if (initialData.fileUrl) {
        setFilePreviewUrl(initialData.fileUrl);
      }
    }
  }, [initialData, reset]);

  // Handle description changes from the editor
  const handleEditorChange = (value: string) => {
    setValue("description", value, { shouldDirty: true });
  };

  // Handle certificate file upload
  const handleFileUpload = (files: File[]) => {
    if (files.length > 0) {
      const file = files[0];

      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        showToast(
          "error",
          "Please upload a PDF or image file (JPEG, PNG, WebP)",
        );
        return;
      }

      if (file.size > MAX_FILE_SIZE) {
        showToast("error", "File size exceeds 5MB limit");
        return;
      }

      setCertificateFile(file);

      // Create preview URL for images
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setFilePreviewUrl(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        // For PDFs, just set a placeholder
        setFilePreviewUrl("pdf");
      }
    }
  };

  // Remove certificate file
  const removeFile = () => {
    setCertificateFile(null);
    setFilePreviewUrl("");
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

  // Toggle "Never Expires" switch
  const toggleNeverExpires = (checked: boolean) => {
    setNeverExpires(checked);

    if (checked) {
      setValue("expiryDate", "", { shouldDirty: true });
    }
  };

  // Handle form submission
  const onSubmit = async (data: CertificateFormValues) => {
    try {
      setIsSubmitting(true);

      // Prepare form data for API
      const formData = new FormData();
      formData.append("title", data.title);
      formData.append("issuer", data.issuer);
      formData.append("issueDate", data.issueDate);

      if (!neverExpires && data.expiryDate) {
        formData.append("expiryDate", data.expiryDate);
      }

      if (data.credentialId) formData.append("credentialId", data.credentialId);
      if (data.credentialUrl)
        formData.append("credentialUrl", data.credentialUrl);
      if (data.description) formData.append("description", data.description);

      formData.append("skills", JSON.stringify(data.skills));
      formData.append("isPublic", String(data.isPublic));
      if (data.category) formData.append("category", data.category);

      // Add certificate file if changed
      if (certificateFile) {
        formData.append("file", certificateFile);
      }

      // Send request to API
      if (id) {
        // Update existing certificate
        await certificateService.updateCertificate(id, formData);
        showToast("success", "Certificate updated successfully");
      } else {
        // Create new certificate
        await certificateService.createCertificate(formData);
        showToast("success", "Certificate created successfully");
      }

      // Redirect to certificates page
      router.push(ROUTES.DASHBOARD.CERTIFICATES);
    } catch (error: any) {
      showToast(
        "error",
        error.response?.data?.message ||
          "An error occurred while saving the certificate",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="flex items-center mb-6">
        <button
          type="button"
          onClick={() => router.push(ROUTES.DASHBOARD.CERTIFICATES)}
          className="mr-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {id ? "Edit Certificate" : "Add New Certificate"}
        </h1>
      </div>

      <Card className="mb-6">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="p-6 space-y-6">
            {/* Certificate Details Section */}
            <div>
              <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white flex items-center">
                <Award className="mr-2 text-blue-500" size={20} />
                Certificate Details
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label
                    htmlFor="title"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Certificate Title *
                  </label>
                  <Input
                    id="title"
                    placeholder="e.g. AWS Certified Solutions Architect"
                    error={errors.title?.message}
                    {...register("title")}
                    leftElement={<Award size={18} />}
                  />
                </div>

                <div>
                  <label
                    htmlFor="issuer"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Issuing Organization *
                  </label>
                  <Input
                    id="issuer"
                    placeholder="e.g. Amazon Web Services"
                    error={errors.issuer?.message}
                    {...register("issuer")}
                    leftElement={<Building size={18} />}
                  />
                </div>

                <div>
                  <label
                    htmlFor="issueDate"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Issue Date *
                  </label>
                  <Input
                    id="issueDate"
                    type="date"
                    {...register("issueDate")}
                    error={errors.issueDate?.message}
                    leftElement={<Calendar size={18} />}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label
                      htmlFor="expiryDate"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Expiry Date
                    </label>
                    <Switch
                      checked={neverExpires}
                      onChange={toggleNeverExpires}
                      label="Never Expires"
                      size="sm"
                    />
                  </div>
                  <Input
                    id="expiryDate"
                    type="date"
                    {...register("expiryDate")}
                    disabled={neverExpires}
                    leftElement={<Calendar size={18} />}
                  />
                </div>

                <div>
                  <label
                    htmlFor="credentialId"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Credential ID
                  </label>
                  <Input
                    id="credentialId"
                    placeholder="e.g. ABC123XYZ"
                    {...register("credentialId")}
                    leftElement={<FileCheck size={18} />}
                  />
                </div>

                <div>
                  <label
                    htmlFor="credentialUrl"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Credential URL
                  </label>
                  <Input
                    id="credentialUrl"
                    placeholder="https://example.com/verify/ABC123XYZ"
                    {...register("credentialUrl")}
                    error={errors.credentialUrl?.message}
                    leftElement={<LinkIcon size={18} />}
                  />
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
                      { value: "it-certification", label: "IT Certification" },
                      {
                        value: "professional-license",
                        label: "Professional License",
                      },
                      {
                        value: "course-completion",
                        label: "Course Completion",
                      },
                      { value: "academic-degree", label: "Academic Degree" },
                      { value: "award", label: "Award" },
                      { value: "other", label: "Other" },
                    ]}
                    placeholder="Select a category"
                    leftElement={<Tag size={18} />}
                  />
                </div>

                <div className="col-span-1 md:col-span-2">
                  <Switch
                    id="isPublic"
                    checked={watch("isPublic")}
                    onChange={(checked) =>
                      setValue("isPublic", checked, { shouldDirty: true })
                    }
                    label="Certificate is public"
                    description="Make this certificate visible to everyone. Uncheck to keep it private to you and your team."
                  />
                </div>
              </div>
            </div>

            {/* Skills Section */}
            <div>
              <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white flex items-center">
                <Tag className="mr-2 text-blue-500" size={20} />
                Skills
              </h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Skills Demonstrated by this Certificate *
                </label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {SKILLS.map((skill) => (
                    <Badge
                      key={skill}
                      text={skill}
                      variant={skills?.includes(skill) ? "primary" : "outline"}
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
            </div>

            {/* Description Section */}
            <div>
              <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white flex items-center">
                <FileCheck className="mr-2 text-blue-500" size={20} />
                Description
              </h2>

              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Certificate Description
                </label>
                <Controller
                  name="description"
                  control={control}
                  render={({ field }) => (
                    <Editor
                      value={field.value}
                      onChange={handleEditorChange}
                      placeholder="Describe what this certificate represents, what you learned, etc."
                      minHeight="200px"
                    />
                  )}
                />
              </div>
            </div>

            {/* Certificate File Section */}
            <div>
              <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white flex items-center">
                <Award className="mr-2 text-blue-500" size={20} />
                Certificate File
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Upload Certificate
                  </label>

                  {filePreviewUrl ? (
                    <div className="mb-4">
                      {filePreviewUrl === "pdf" ? (
                        <div className="flex items-center space-x-2 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800">
                          <div className="w-10 h-12 bg-red-100 dark:bg-red-900 rounded flex items-center justify-center">
                            <svg
                              className="w-6 h-6 text-red-600 dark:text-red-400"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                              />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              Certificate PDF
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              PDF Document
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={removeFile}
                            className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                          >
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          </button>
                        </div>
                      ) : (
                        <div className="relative inline-block">
                          <img
                            src={filePreviewUrl}
                            alt="Certificate preview"
                            className="w-full max-h-60 object-contain border border-gray-200 dark:border-gray-700 rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={removeFile}
                            className="absolute top-2 right-2 p-1 rounded-full bg-red-600 text-white hover:bg-red-700"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <FileUploader
                      onFilesSelected={handleFileUpload}
                      multiple={false}
                      accept={ALLOWED_FILE_TYPES.join(",")}
                      maxFiles={1}
                      className="w-full h-40"
                    >
                      <div className="flex flex-col items-center justify-center h-full">
                        <svg
                          className="h-10 w-10 text-gray-400 mb-2"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
                          />
                        </svg>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Drag and drop or click to upload
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                          PDF, JPEG, PNG, WebP up to 5MB
                        </p>
                      </div>
                    </FileUploader>
                  )}

                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    Upload your certificate to display it in your portfolio.
                  </p>
                </div>

                <div className="flex flex-col justify-center">
                  <div className="p-4 border border-blue-200 dark:border-blue-800 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                    <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">
                      Tips for Certificate Verification
                    </h3>
                    <ul className="text-xs text-blue-700 dark:text-blue-400 space-y-1">
                      <li className="flex items-start">
                        <span className="mr-1.5 mt-0.5">•</span>
                        <span>
                          Include the credential ID if available to make
                          verification easier
                        </span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-1.5 mt-0.5">•</span>
                        <span>
                          Add the verification URL where others can validate the
                          certificate
                        </span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-1.5 mt-0.5">•</span>
                        <span>
                          Upload a clear, legible copy of your certificate
                        </span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-1.5 mt-0.5">•</span>
                        <span>
                          Ensure expiration date is accurate to maintain
                          credibility
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(ROUTES.DASHBOARD.CERTIFICATES)}
              >
                Cancel
              </Button>

              <Button
                type="submit"
                loading={isSubmitting}
                loadingText="Saving..."
                leftIcon={<Save size={16} />}
              >
                {id ? "Update Certificate" : "Add Certificate"}
              </Button>
            </div>
          </div>
        </form>
      </Card>
    </div>
  );
};
