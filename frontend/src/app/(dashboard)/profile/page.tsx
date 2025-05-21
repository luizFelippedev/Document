// frontend/src/app/(dashboard)/profile/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Spinner } from '@/components/ui/Spinner';
import { Tabs } from '@/components/ui/Tabs';
import { ROUTES } from '@/config/routes';
import { motion } from 'framer-motion';
import {
  Edit,
  MapPin,
  Mail,
  Globe,
  Briefcase,
  Calendar,
  Github,
  Twitter,
  Linkedin,
  ExternalLink,
  Phone,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

// Mock user data - would come from your auth context or API
const mockUserData = {
  id: '1',
  fullName: 'Alex Johnson',
  email: 'alex.johnson@example.com',
  phone: '+1 (555) 123-4567',
  role: 'Full Stack Developer',
  company: 'TechInnovate Solutions',
  location: 'San Francisco, CA',
  website: 'https://alexjohnson.dev',
  bio: 'Passionate full-stack developer with 7+ years of experience building web and mobile applications. Specialized in React, Node.js, and cloud architecture. Open source contributor and continuous learner.',
  avatarUrl: '/avatars/alex.jpg',
  coverImageUrl: '/covers/dev-cover.jpg',
  joinedDate: '2024-06-15',
  socialLinks: {
    github: 'https://github.com/alexjohnson',
    twitter: 'https://twitter.com/alexjohnson',
    linkedin: 'https://linkedin.com/in/alexjohnson',
  },
  skills: [
    { name: 'React', level: 95 },
    { name: 'Node.js', level: 90 },
    { name: 'TypeScript', level: 85 },
    { name: 'AWS', level: 80 },
    { name: 'GraphQL', level: 75 },
    { name: 'MongoDB', level: 85 },
    { name: 'Docker', level: 70 },
    { name: 'Python', level: 65 },
  ],
  education: [
    {
      institution: 'Stanford University',
      degree: 'M.S. Computer Science',
      date: '2015 - 2017',
      description:
        'Specialized in Artificial Intelligence and Machine Learning',
    },
    {
      institution: 'University of California, Berkeley',
      degree: 'B.S. Computer Science',
      date: '2011 - 2015',
      description: 'Minor in Mathematics',
    },
  ],
  experience: [
    {
      company: 'TechInnovate Solutions',
      role: 'Senior Full Stack Developer',
      date: '2020 - Present',
      description:
        'Lead developer for enterprise SaaS applications serving Fortune 500 clients. Architected and built scalable cloud solutions using React, Node.js, and AWS.',
    },
    {
      company: 'CodeFuture Inc.',
      role: 'Full Stack Developer',
      date: '2017 - 2020',
      description:
        'Developed and maintained web applications for fintech clients. Implemented CI/CD pipelines and containerized deployments.',
    },
    {
      company: 'StartupVision',
      role: 'Frontend Developer',
      date: '2015 - 2017',
      description:
        'Built responsive and accessible user interfaces for early-stage startups. Worked with React and Vue.js.',
    },
  ],
  projectStats: {
    total: 24,
    completed: 18,
    inProgress: 4,
    planning: 2,
  },
  certificateStats: {
    total: 8,
    verified: 6,
  },
};

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<unknown>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const { user } = useAuth();

  // Fetch user data
  useEffect(() => {
    // Simulate API call
    const fetchUserData = async () => {
      try {
        // In a real app, this would fetch from your API
        setUserData(mockUserData);
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };

    setTimeout(fetchUserData, 1000);
  }, []);

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
    { id: 'skills', label: 'Skills & Expertise' },
    { id: 'experience', label: 'Experience' },
    { id: 'education', label: 'Education' },
  ];

  if (loading) {
    return (
      <MainLayout>
        <div className="flex h-96 items-center justify-center">
          <Spinner size="large" label="Loading profile..." />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Profile Header */}
        <Card className="overflow-hidden p-0">
          {/* Cover Image */}
          <div className="relative h-48 bg-gradient-to-r from-blue-500 to-purple-600">
            {userData.coverImageUrl && (
              <img
                src={userData.coverImageUrl}
                alt="Cover"
                className="w-full h-full object-cover"
              />
            )}
            <div className="absolute top-4 right-4">
              <Link href={ROUTES.DASHBOARD.PROFILE.SETTINGS}>
                <Button
                  variant="outline"
                  className="bg-white/90"
                  leftIcon={<Edit size={16} />}
                >
                  Edit Profile
                </Button>
              </Link>
            </div>
          </div>

          {/* Profile Info */}
          <div className="relative px-6 pb-6">
            <div className="flex flex-col md:flex-row md:items-end -mt-12 md:-mt-16 mb-6">
              <Avatar
                src={userData.avatarUrl}
                alt={userData.fullName}
                size="2xl"
                className="border-4 border-white dark:border-gray-800"
              />

              <div className="mt-4 md:mt-0 md:ml-6 md:mb-2">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {userData.fullName}
                </h1>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  {userData.role && (
                    <span className="text-gray-600 dark:text-gray-400 flex items-center">
                      <Briefcase size={16} className="mr-1" />
                      {userData.role}
                    </span>
                  )}
                  {userData.company && (
                    <span className="text-gray-600 dark:text-gray-400">
                      at {userData.company}
                    </span>
                  )}
                  {userData.location && (
                    <span className="text-gray-600 dark:text-gray-400 flex items-center">
                      <MapPin size={16} className="mr-1" />
                      {userData.location}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                {userData.bio && (
                  <div className="mb-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      About
                    </h2>
                    <p className="text-gray-700 dark:text-gray-300">
                      {userData.bio}
                    </p>
                  </div>
                )}

                <div className="flex flex-wrap gap-4">
                  {userData.email && (
                    <a
                      href={`mailto:${userData.email}`}
                      className="flex items-center text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
                    >
                      <Mail size={18} className="mr-2" />
                      {userData.email}
                    </a>
                  )}

                  {userData.phone && (
                    <a
                      href={`tel:${userData.phone}`}
                      className="flex items-center text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
                    >
                      <Phone size={18} className="mr-2" />
                      {userData.phone}
                    </a>
                  )}

                  {userData.website && (
                    <a
                      href={userData.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
                    >
                      <Globe size={18} className="mr-2" />
                      Website
                      <ExternalLink size={14} className="ml-1" />
                    </a>
                  )}

                  {userData.joinedDate && (
                    <div className="flex items-center text-gray-700 dark:text-gray-300">
                      <Calendar size={18} className="mr-2" />
                      Joined{' '}
                      {new Date(userData.joinedDate).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Connect
                </h2>
                <div className="flex flex-wrap gap-3">
                  {userData.socialLinks?.github && (
                    <a
                      href={userData.socialLinks.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    >
                      <Github size={20} />
                    </a>
                  )}

                  {userData.socialLinks?.twitter && (
                    <a
                      href={userData.socialLinks.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    >
                      <Twitter size={20} />
                    </a>
                  )}

                  {userData.socialLinks?.linkedin && (
                    <a
                      href={userData.socialLinks.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    >
                      <Linkedin size={20} />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <div className="flex items-center">
              <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 mr-4">
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
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Total Projects
                </p>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {userData.projectStats?.total || 0}
                </h3>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {userData.projectStats?.completed || 0} completed ·{' '}
                  {userData.projectStats?.inProgress || 0} in progress
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center">
              <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400 mr-4">
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
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Certificates
                </p>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {userData.certificateStats?.total || 0}
                </h3>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {userData.certificateStats?.verified || 0} verified
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center">
              <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400 mr-4">
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
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Skills
                </p>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {userData.skills?.length || 0}
                </h3>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {userData.skills?.filter((s: unknown) => s.level >= 80)
                    .length || 0}{' '}
                  expert-level skills
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center">
              <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400 mr-4">
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
                    d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Experience
                </p>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {userData.experience?.length || 0}
                </h3>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {userData.experience?.[0]?.company || 'No current company'}
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Profile Tabs */}
        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

        {/* Tab Content */}
        <div className="space-y-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <motion.div
              variants={fadeIn}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
              {/* Skills Section */}
              <div className="md:col-span-2">
                <Card title="Top Skills">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {userData.skills
                      ?.slice(0, 6)
                      .map((skill: unknown, index: number) => (
                        <div key={index} className="space-y-1">
                          <div className="flex justify-between">
                            <span className="text-gray-700 dark:text-gray-300">
                              {skill.name}
                            </span>
                            <span className="text-gray-500 dark:text-gray-400">
                              {skill.level}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                              className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full"
                              style={{ width: `${skill.level}%` }}
                            ></div>
                          </div>
                        </div>
                      ))}
                  </div>

                  <div className="mt-4 text-center">
                    <button
                      className="text-blue-600 dark:text-blue-400 hover:underline"
                      onClick={() => setActiveTab('skills')}
                    >
                      View all skills
                    </button>
                  </div>
                </Card>

                {/* Experience Section */}
                <Card title="Experience" className="mt-6">
                  <div className="space-y-6">
                    {userData.experience
                      ?.slice(0, 2)
                      .map((exp: unknown, index: number) => (
                        <div key={index} className="flex">
                          <div className="flex-shrink-0 mr-4">
                            <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 dark:text-gray-400">
                              <Briefcase size={20} />
                            </div>
                          </div>
                          <div>
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                              {exp.role}
                            </h3>
                            <div className="text-gray-600 dark:text-gray-400 mb-2">
                              {exp.company} · {exp.date}
                            </div>
                            <p className="text-gray-700 dark:text-gray-300">
                              {exp.description}
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>

                  {userData.experience?.length > 2 && (
                    <div className="mt-4 text-center">
                      <button
                        className="text-blue-600 dark:text-blue-400 hover:underline"
                        onClick={() => setActiveTab('experience')}
                      >
                        View all experience
                      </button>
                    </div>
                  )}
                </Card>
              </div>

              {/* Education Section */}
              <div>
                <Card title="Education">
                  <div className="space-y-6">
                    {userData.education?.map((edu: unknown, index: number) => (
                      <div key={index} className="flex">
                        <div className="flex-shrink-0 mr-4">
                          <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 dark:text-gray-400">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path d="M12 14l9-5-9-5-9 5 9 5z" />
                              <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222"
                              />
                            </svg>
                          </div>
                        </div>
                        <div>
                          <h3 className="text-base font-medium text-gray-900 dark:text-white">
                            {edu.degree}
                          </h3>
                          <div className="text-gray-600 dark:text-gray-400 mb-1">
                            {edu.institution} · {edu.date}
                          </div>
                          {edu.description && (
                            <p className="text-sm text-gray-700 dark:text-gray-300">
                              {edu.description}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </motion.div>
          )}

          {/* Skills Tab */}
          {activeTab === 'skills' && (
            <motion.div variants={fadeIn} initial="hidden" animate="visible">
              <Card title="Skills & Expertise">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {userData.skills?.map((skill: unknown, index: number) => (
                    <div key={index} className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-gray-700 dark:text-gray-300">
                          {skill.name}
                        </span>
                        <span className="text-gray-500 dark:text-gray-400">
                          {skill.level}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                        <div
                          className={`h-2.5 rounded-full ${
                            skill.level >= 90
                              ? 'bg-green-600 dark:bg-green-500'
                              : skill.level >= 70
                                ? 'bg-blue-600 dark:bg-blue-500'
                                : 'bg-amber-500 dark:bg-amber-400'
                          }`}
                          style={{ width: `${skill.level}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>
          )}

          {/* Experience Tab */}
          {activeTab === 'experience' && (
            <motion.div variants={fadeIn} initial="hidden" animate="visible">
              <Card title="Professional Experience">
                <div className="relative border-l-2 border-gray-200 dark:border-gray-700 ml-6 pl-6 space-y-10">
                  {userData.experience?.map((exp: unknown, index: number) => (
                    <div key={index} className="relative">
                      {/* Timeline dot */}
                      <div className="absolute -left-10 mt-1.5">
                        <div className="w-6 h-6 rounded-full bg-blue-600 dark:bg-blue-500 flex items-center justify-center border-2 border-white dark:border-gray-800">
                          <Briefcase size={14} className="text-white" />
                        </div>
                      </div>

                      <div>
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-2">
                          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                            {exp.role}
                          </h3>
                          <Badge
                            text={exp.date}
                            variant="secondary"
                            size="sm"
                          />
                        </div>

                        <div className="text-gray-600 dark:text-gray-400 mb-2">
                          {exp.company}
                        </div>

                        <p className="text-gray-700 dark:text-gray-300">
                          {exp.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>
          )}

          {/* Education Tab */}
          {activeTab === 'education' && (
            <motion.div variants={fadeIn} initial="hidden" animate="visible">
              <Card title="Education">
                <div className="relative border-l-2 border-gray-200 dark:border-gray-700 ml-6 pl-6 space-y-10">
                  {userData.education?.map((edu: unknown, index: number) => (
                    <div key={index} className="relative">
                      {/* Timeline dot */}
                      <div className="absolute -left-10 mt-1.5">
                        <div className="w-6 h-6 rounded-full bg-purple-600 dark:bg-purple-500 flex items-center justify-center border-2 border-white dark:border-gray-800">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-3 w-3 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 14l9-5-9-5-9 5 9 5z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"
                            />
                          </svg>
                        </div>
                      </div>

                      <div>
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-2">
                          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                            {edu.degree}
                          </h3>
                          <Badge
                            text={edu.date}
                            variant="secondary"
                            size="sm"
                          />
                        </div>

                        <div className="text-gray-600 dark:text-gray-400 mb-2">
                          {edu.institution}
                        </div>

                        {edu.description && (
                          <p className="text-gray-700 dark:text-gray-300">
                            {edu.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
