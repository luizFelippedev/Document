// frontend/src/app/(dashboard)/profile/settings/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Spinner } from "@/components/ui/Spinner";
import { Alert } from "@/components/ui/Alert";
import { Tabs } from "@/components/ui/Tabs";
import { Editor } from "@/components/ui/Editor";
import { Switch } from "@/components/ui/Switch";
import { ROUTES } from "@/config/routes";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Globe,
  Github,
  Twitter,
  Linkedin,
  Camera,
  Upload,
  Lock,
  Shield,
  BellRing,
  Clock,
  LogOut,
  Trash2,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

// Mock user data - would come from your auth context or API
const mockUserData = {
  id: "1",
  fullName: "Alex Johnson",
  email: "alex.johnson@example.com",
  phone: "+1 (555) 123-4567",
  role: "Full Stack Developer",
  company: "TechInnovate Solutions",
  location: "San Francisco, CA",
  website: "https://alexjohnson.dev",
  bio: "Passionate full-stack developer with 7+ years of experience building web and mobile applications. Specialized in React, Node.js, and cloud architecture. Open source contributor and continuous learner.",
  avatarUrl: "/avatars/alex.jpg",
  coverImageUrl: "/covers/dev-cover.jpg",
  joinedDate: "2024-06-15",
  socialLinks: {
    github: "https://github.com/alexjohnson",
    twitter: "https://twitter.com/alexjohnson",
    linkedin: "https://linkedin.com/in/alexjohnson",
  },
};

export default function ProfileSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("profile");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>({});
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const { user } = useAuth();

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  // Fetch user data
  useEffect(() => {
    // Simulate API call
    const fetchUserData = async () => {
      try {
        // In a real app, this would fetch from your API
        setUserData(mockUserData);
        setFormData(mockUserData);
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    };

    setTimeout(fetchUserData, 1000);
  }, []);

  // Handle form input changes
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle social link changes
  const handleSocialChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      socialLinks: {
        ...prev.socialLinks,
        [name]: value,
      },
    }));
  };

  // Handle bio changes from rich text editor
  const handleBioChange = (value: string) => {
    setFormData((prev) => ({ ...prev, bio: value }));
  };

  // Handle avatar upload
  const handleAvatarClick = () => {
    avatarInputRef.current?.click();
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);

      // Create a preview URL
      const reader = new FileReader();
      reader.onload = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle cover image upload
  const handleCoverClick = () => {
    coverInputRef.current?.click();
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setCoverFile(file);

      // Create a preview URL
      const reader = new FileReader();
      reader.onload = () => {
        setCoverPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // In a real app, this would be an API call to update user data
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Update local user data with form data
      setUserData(formData);

      // Show success message
      setSuccessMessage("Profile updated successfully");

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (error) {
      console.error("Error updating profile:", error);
    } finally {
      setSaving(false);
    }
  };

  // Animation variants
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut",
      },
    },
  };

  // Tab configuration
  const tabs = [
    { id: "profile", label: "Profile" },
    { id: "account", label: "Account" },
    { id: "security", label: "Security & Privacy" },
    { id: "notifications", label: "Notifications" },
    { id: "danger", label: "Danger Zone" },
  ];

  if (loading) {
    return (
      <MainLayout>
        <div className="flex h-96 items-center justify-center">
          <Spinner size="large" label="Loading profile settings..." />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header with navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <Link
              href={ROUTES.DASHBOARD.PROFILE.ROOT}
              className="flex items-center text-blue-600 dark:text-blue-400 hover:underline mb-2"
            >
              <ArrowLeft size={16} className="mr-2" />
              Back to Profile
            </Link>

            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Account Settings
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manage your profile information and preferences
            </p>
          </div>
        </div>

        {/* Success message */}
        {successMessage && (
          <Alert
            type="success"
            title="Success"
            message={successMessage}
            dismissible
            onDismiss={() => setSuccessMessage(null)}
          />
        )}

        {/* Settings tabs */}
        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

        {/* Tab content */}
        <div className="space-y-6">
          {/* Profile Settings Tab */}
          {activeTab === "profile" && (
            <motion.div variants={fadeIn} initial="hidden" animate="visible">
              <form onSubmit={handleSubmit}>
                <Card title="Profile Information">
                  <div className="space-y-6">
                    {/* Profile Images */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                        Profile Images
                      </h3>

                      <div className="flex flex-col md:flex-row gap-6">
                        {/* Avatar */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Profile Photo
                          </label>
                          <div className="relative">
                            <div
                              className="w-32 h-32 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 cursor-pointer group"
                              onClick={handleAvatarClick}
                            >
                              {avatarPreview || formData.avatarUrl ? (
                                <img
                                  src={avatarPreview || formData.avatarUrl}
                                  alt="Avatar"
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <User size={40} className="text-gray-400" />
                                </div>
                              )}
                              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Camera size={20} className="text-white" />
                              </div>
                            </div>
                            <input
                              ref={avatarInputRef}
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handleAvatarChange}
                            />
                          </div>
                          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                            Click to upload a new profile photo
                          </p>
                        </div>

                        {/* Cover image */}
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Cover Image
                          </label>
                          <div className="relative">
                            <div
                              className="h-32 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700 cursor-pointer group"
                              onClick={handleCoverClick}
                            >
                              {coverPreview || formData.coverImageUrl ? (
                                <img
                                  src={coverPreview || formData.coverImageUrl}
                                  alt="Cover"
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Upload size={32} className="text-gray-400" />
                                </div>
                              )}
                              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Camera size={20} className="text-white" />
                              </div>
                            </div>
                            <input
                              ref={coverInputRef}
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handleCoverChange}
                            />
                          </div>
                          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                            Recommended size: 1500 x 500px
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Basic Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label
                          htmlFor="fullName"
                          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                        >
                          Full Name *
                        </label>
                        <Input
                          id="fullName"
                          name="fullName"
                          value={formData.fullName || ""}
                          onChange={handleChange}
                          required
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="email"
                          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                        >
                          Email Address *
                        </label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={formData.email || ""}
                          onChange={handleChange}
                          leftElement={<Mail size={16} />}
                          required
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="phone"
                          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                        >
                          Phone Number
                        </label>
                        <Input
                          id="phone"
                          name="phone"
                          value={formData.phone || ""}
                          onChange={handleChange}
                          leftElement={<Phone size={16} />}
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="location"
                          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                        >
                          Location
                        </label>
                        <Input
                          id="location"
                          name="location"
                          value={formData.location || ""}
                          onChange={handleChange}
                          leftElement={<MapPin size={16} />}
                          placeholder="City, Country"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="role"
                          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                        >
                          Job Title
                        </label>
                        <Input
                          id="role"
                          name="role"
                          value={formData.role || ""}
                          onChange={handleChange}
                          leftElement={<Briefcase size={16} />}
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="company"
                          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                        >
                          Company
                        </label>
                        <Input
                          id="company"
                          name="company"
                          value={formData.company || ""}
                          onChange={handleChange}
                        />
                      </div>
                    </div>

                    {/* About */}
                    <div>
                      <label
                        htmlFor="bio"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                      >
                        Bio
                      </label>
                      <div className="mt-1">
                        <Editor
                          value={formData.bio || ""}
                          onChange={handleBioChange}
                          minHeight="150px"
                          placeholder="Write something about yourself..."
                        />
                      </div>
                    </div>

                    {/* Website */}
                    <div>
                      <label
                        htmlFor="website"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                      >
                        Website
                      </label>
                      <Input
                        id="website"
                        name="website"
                        type="url"
                        value={formData.website || ""}
                        onChange={handleChange}
                        leftElement={<Globe size={16} />}
                        placeholder="https://yourwebsite.com"
                      />
                    </div>
                  </div>
                </Card>

                <Card title="Social Profiles" className="mt-6">
                  <div className="space-y-6">
                    <div>
                      <label
                        htmlFor="github"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                      >
                        GitHub
                      </label>
                      <Input
                        id="github"
                        name="github"
                        value={formData.socialLinks?.github || ""}
                        onChange={handleSocialChange}
                        leftElement={<Github size={16} />}
                        placeholder="https://github.com/username"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="twitter"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                      >
                        Twitter
                      </label>
                      <Input
                        id="twitter"
                        name="twitter"
                        value={formData.socialLinks?.twitter || ""}
                        onChange={handleSocialChange}
                        leftElement={<Twitter size={16} />}
                        placeholder="https://twitter.com/username"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="linkedin"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                      >
                        LinkedIn
                      </label>
                      <Input
                        id="linkedin"
                        name="linkedin"
                        value={formData.socialLinks?.linkedin || ""}
                        onChange={handleSocialChange}
                        leftElement={<Linkedin size={16} />}
                        placeholder="https://linkedin.com/in/username"
                      />
                    </div>
                  </div>
                </Card>

                <div className="mt-6 flex justify-end">
                  <Button
                    type="submit"
                    loading={saving}
                    loadingText="Saving..."
                  >
                    Save Changes
                  </Button>
                </div>
              </form>
            </motion.div>
          )}

          {/* Account Settings Tab */}
          {activeTab === "account" && (
            <motion.div
              variants={fadeIn}
              initial="hidden"
              animate="visible"
              className="space-y-6"
            >
              <Card title="Account Preferences">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-base font-medium text-gray-900 dark:text-white">
                        Dark Mode
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Toggle between light and dark theme
                      </p>
                    </div>
                    <Switch checked={true} onChange={() => {}} />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-base font-medium text-gray-900 dark:text-white">
                        Time Zone
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Current: (UTC-08:00) Pacific Time
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      Change
                    </Button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-base font-medium text-gray-900 dark:text-white">
                        Language
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Current: English (US)
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      Change
                    </Button>
                  </div>
                </div>
              </Card>

              <Card title="Connected Accounts">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mr-3">
                        <Github
                          size={20}
                          className="text-gray-700 dark:text-gray-300"
                        />
                      </div>
                      <div>
                        <h4 className="text-base font-medium text-gray-900 dark:text-white">
                          GitHub
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Connected as @alexjohnson
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      Disconnect
                    </Button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mr-3">
                        <Linkedin
                          size={20}
                          className="text-gray-700 dark:text-gray-300"
                        />
                      </div>
                      <div>
                        <h4 className="text-base font-medium text-gray-900 dark:text-white">
                          LinkedIn
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Not connected
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      Connect
                    </Button>
                  </div>
                </div>
              </Card>

              <Card title="Sessions">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mr-3 text-green-600 dark:text-green-400">
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
                            d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                      <div>
                        <h4 className="text-base font-medium text-gray-900 dark:text-white">
                          Current Session
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          San Francisco, CA, USA · Chrome on macOS
                        </p>
                      </div>
                    </div>
                    <Badge text="Active Now" variant="success" size="sm" />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mr-3 text-gray-500 dark:text-gray-400">
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
                            d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                      <div>
                        <h4 className="text-base font-medium text-gray-900 dark:text-white">
                          Mobile Device
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          San Francisco, CA, USA · App on iOS
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      Sign Out
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}

          {/* Security Settings Tab */}
          {activeTab === "security" && (
            <motion.div
              variants={fadeIn}
              initial="hidden"
              animate="visible"
              className="space-y-6"
            >
              <Card title="Change Password">
                <form className="space-y-4">
                  <div>
                    <label
                      htmlFor="current-password"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      Current Password
                    </label>
                    <Input
                      id="current-password"
                      type="password"
                      leftElement={<Lock size={16} />}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="new-password"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      New Password
                    </label>
                    <Input
                      id="new-password"
                      type="password"
                      leftElement={<Lock size={16} />}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="confirm-password"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      Confirm New Password
                    </label>
                    <Input
                      id="confirm-password"
                      type="password"
                      leftElement={<Lock size={16} />}
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button>Update Password</Button>
                  </div>
                </form>
              </Card>

              <Card title="Two-Factor Authentication">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-base font-medium text-gray-900 dark:text-white">
                        Authenticator App
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Use an authenticator app to generate one-time codes
                      </p>
                    </div>
                    <Button variant="outline">Enable</Button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-base font-medium text-gray-900 dark:text-white">
                        SMS Authentication
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Use your phone to receive authentication codes
                      </p>
                    </div>
                    <Switch checked={false} onChange={() => {}} />
                  </div>
                </div>
              </Card>

              <Card title="Privacy Settings">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-base font-medium text-gray-900 dark:text-white">
                        Public Profile
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Allow your profile to be visible to others
                      </p>
                    </div>
                    <Switch checked={true} onChange={() => {}} />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-base font-medium text-gray-900 dark:text-white">
                        Show Email Address
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Display your email address on your public profile
                      </p>
                    </div>
                    <Switch checked={false} onChange={() => {}} />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-base font-medium text-gray-900 dark:text-white">
                        Activity Visibility
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Allow others to see your activity and contributions
                      </p>
                    </div>
                    <Switch checked={true} onChange={() => {}} />
                  </div>
                </div>
              </Card>
            </motion.div>
          )}

          {/* Notifications Settings Tab */}
          {activeTab === "notifications" && (
            <motion.div
              variants={fadeIn}
              initial="hidden"
              animate="visible"
              className="space-y-6"
            >
              <Card title="Email Notifications">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-base font-medium text-gray-900 dark:text-white">
                        Project Updates
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Receive emails about your project activity
                      </p>
                    </div>
                    <Switch checked={true} onChange={() => {}} />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-base font-medium text-gray-900 dark:text-white">
                        Certificate Notifications
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Get notified when certificates are about to expire
                      </p>
                    </div>
                    <Switch checked={true} onChange={() => {}} />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-base font-medium text-gray-900 dark:text-white">
                        System Announcements
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Important updates about the platform
                      </p>
                    </div>
                    <Switch checked={true} onChange={() => {}} />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-base font-medium text-gray-900 dark:text-white">
                        Marketing Emails
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Receive newsletters and promotional content
                      </p>
                    </div>
                    <Switch checked={false} onChange={() => {}} />
                  </div>
                </div>
              </Card>

              <Card title="In-App Notifications">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-base font-medium text-gray-900 dark:text-white">
                        Comments and Mentions
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Get notified when someone mentions you
                      </p>
                    </div>
                    <Switch checked={true} onChange={() => {}} />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-base font-medium text-gray-900 dark:text-white">
                        Project Reminders
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Get reminders about upcoming deadlines
                      </p>
                    </div>
                    <Switch checked={true} onChange={() => {}} />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-base font-medium text-gray-900 dark:text-white">
                        System Notifications
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Updates about the platform and new features
                      </p>
                    </div>
                    <Switch checked={true} onChange={() => {}} />
                  </div>
                </div>
              </Card>

              <Card title="Notification Schedule">
                <div className="space-y-6">
                  <div>
                    <h4 className="text-base font-medium text-gray-900 dark:text-white mb-4">
                      Quiet Hours
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      During these hours, notifications will be silenced unless
                      they're critical
                    </p>

                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Enable Quiet Hours
                        </h5>
                      </div>
                      <Switch checked={false} onChange={() => {}} />
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          From
                        </label>
                        <Input type="time" value="22:00" disabled />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          To
                        </label>
                        <Input type="time" value="07:00" disabled />
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}

          {/* Danger Zone Tab */}
          {activeTab === "danger" && (
            <motion.div
              variants={fadeIn}
              initial="hidden"
              animate="visible"
              className="space-y-6"
            >
              <Card
                title="Account Actions"
                className="border-red-200 dark:border-red-800"
              >
                <div className="space-y-8">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      Sign Out From All Devices
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      This will sign you out of all sessions across all devices.
                      You'll need to sign in again on each device.
                    </p>
                    <Button variant="outline" leftIcon={<LogOut size={16} />}>
                      Sign Out Everywhere
                    </Button>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      Export Your Data
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      Download a copy of your data including projects,
                      certificates, and account information.
                    </p>
                    <Button variant="outline" leftIcon={<Download size={16} />}>
                      Export Data
                    </Button>
                  </div>

                  <div className="pb-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      Deactivate Account
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      Temporarily disable your account. You can reactivate it
                      anytime by signing in.
                    </p>
                    <Button variant="warning">Deactivate Account</Button>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-red-600 dark:text-red-500 mb-2">
                      Delete Account
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      <strong>Warning:</strong> This action is permanent and
                      cannot be undone. All your data, projects, and
                      certificates will be deleted.
                    </p>
                    <Button variant="danger" leftIcon={<Trash2 size={16} />}>
                      Delete Account
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
