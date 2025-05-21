// frontend/src/app/(dashboard)/certificates/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Spinner } from "@/components/ui/Spinner";
import { Badge } from "@/components/ui/Badge";
import { Table } from "@/components/ui/Table";
import { ROUTES } from "@/config/routes";
import { motion } from "framer-motion";
import {
  Plus,
  Search,
  Filter,
  Award,
  FileCheck,
  Calendar,
  ExternalLink,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Download,
} from "lucide-react";

// Mock data - would be replaced with API calls
const mockCertificates = [
  {
    id: "1",
    title: "AWS Certified Solutions Architect",
    issuer: "Amazon Web Services",
    issueDate: "2025-02-15",
    expiryDate: "2028-02-15",
    credentialId: "AWS-CSA-12345",
    credentialUrl: "https://aws.amazon.com/verification",
    skills: ["Cloud Architecture", "AWS Services", "Infrastructure Design"],
    description: "Certification for designing distributed systems on AWS",
    verified: true,
    thumbnailUrl: "/certificates/aws-cert.jpg",
  },
  {
    id: "2",
    title: "Professional Scrum Master I",
    issuer: "Scrum.org",
    issueDate: "2024-11-10",
    expiryDate: null,
    credentialId: "PSM-I-87654",
    credentialUrl: "https://scrum.org/verification",
    skills: ["Agile Methodologies", "Scrum Framework", "Team Management"],
    description: "Professional certification for Scrum Masters",
    verified: true,
    thumbnailUrl: "/certificates/scrum-cert.jpg",
  },
  {
    id: "3",
    title: "Google Professional Data Engineer",
    issuer: "Google Cloud",
    issueDate: "2025-01-20",
    expiryDate: "2027-01-20",
    credentialId: "GCP-PDE-56789",
    credentialUrl: "https://cloud.google.com/certification/verification",
    skills: ["Data Processing", "Machine Learning", "Data Analytics", "GCP"],
    description:
      "Certification for designing and building data processing systems on Google Cloud",
    verified: true,
    thumbnailUrl: "/certificates/gcp-cert.jpg",
  },
  {
    id: "4",
    title: "Certified Kubernetes Administrator",
    issuer: "Cloud Native Computing Foundation",
    issueDate: "2024-09-05",
    expiryDate: "2027-09-05",
    credentialId: "CKA-98765",
    credentialUrl: "https://www.cncf.io/certification/verification",
    skills: ["Kubernetes", "Container Orchestration", "Cloud Native"],
    description: "Certification for Kubernetes administration and operations",
    verified: false,
    thumbnailUrl: "/certificates/k8s-cert.jpg",
  },
  {
    id: "5",
    title: "Certified Ethical Hacker",
    issuer: "EC-Council",
    issueDate: "2025-03-12",
    expiryDate: "2028-03-12",
    credentialId: "CEH-54321",
    credentialUrl: "https://cert.eccouncil.org/verify",
    skills: ["Security", "Penetration Testing", "Vulnerability Assessment"],
    description: "Certification for ethical hacking and security testing",
    verified: true,
    thumbnailUrl: "/certificates/ceh-cert.jpg",
  },
];

export default function CertificatesPage() {
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredCertificates, setFilteredCertificates] =
    useState(mockCertificates);
  const [currentView, setCurrentView] = useState<"grid" | "table">("grid");
  const [verificationFilter, setVerificationFilter] = useState<boolean | null>(
    null,
  );
  const [issuerFilter, setIssuerFilter] = useState<string | null>(null);

  // Simulate loading data
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // Filter certificates based on search query and filters
  useEffect(() => {
    let result = mockCertificates;

    // Apply search query filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (cert) =>
          cert.title.toLowerCase().includes(query) ||
          cert.issuer.toLowerCase().includes(query) ||
          cert.skills.some((skill) => skill.toLowerCase().includes(query)),
      );
    }

    // Apply verification filter
    if (verificationFilter !== null) {
      result = result.filter((cert) => cert.verified === verificationFilter);
    }

    // Apply issuer filter
    if (issuerFilter) {
      result = result.filter((cert) => cert.issuer === issuerFilter);
    }

    setFilteredCertificates(result);
  }, [searchQuery, verificationFilter, issuerFilter]);

  // Column definitions for table view
  const columns = [
    {
      id: "certificate",
      header: "Certificate",
      cell: (row: any) => (
        <div className="flex items-center">
          {row.thumbnailUrl ? (
            <img
              src={row.thumbnailUrl}
              alt={row.title}
              className="w-10 h-10 rounded object-cover mr-3"
            />
          ) : (
            <div className="w-10 h-10 rounded bg-gray-200 dark:bg-gray-700 flex items-center justify-center mr-3">
              <Award size={18} className="text-gray-500 dark:text-gray-400" />
            </div>
          )}
          <div>
            <div className="font-medium text-gray-900 dark:text-white">
              {row.title}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {row.issuer}
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "status",
      header: "Status",
      cell: (row: any) => (
        <Badge
          text={row.verified ? "Verified" : "Unverified"}
          variant={row.verified ? "success" : "warning"}
          size="sm"
          icon={row.verified ? <FileCheck size={14} /> : undefined}
        />
      ),
    },
    {
      id: "dates",
      header: "Issue Date",
      cell: (row: any) => (
        <div className="text-sm">
          <div className="flex items-center text-gray-700 dark:text-gray-300">
            <Calendar
              size={14}
              className="mr-1 text-gray-500 dark:text-gray-400"
            />
            {new Date(row.issueDate).toLocaleDateString()}
          </div>
          {row.expiryDate && (
            <div className="text-gray-500 dark:text-gray-400 text-xs mt-1">
              Expires: {new Date(row.expiryDate).toLocaleDateString()}
            </div>
          )}
        </div>
      ),
    },
    {
      id: "skills",
      header: "Skills",
      cell: (row: any) => (
        <div className="flex flex-wrap gap-1">
          {row.skills.slice(0, 2).map((skill: string, i: number) => (
            <Badge key={i} text={skill} variant="outline" size="sm" />
          ))}
          {row.skills.length > 2 && (
            <Badge
              text={`+${row.skills.length - 2}`}
              variant="secondary"
              size="sm"
            />
          )}
        </div>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: (row: any) => {
        const menuItems = [
          {
            label: "View Details",
            onClick: () => {
              // Navigate to certificate details
              console.log("View details", row.id);
            },
            icon: <Eye size={16} />,
          },
          {
            label: "Edit Certificate",
            onClick: () => {
              // Navigate to edit certificate
              console.log("Edit certificate", row.id);
            },
            icon: <Edit size={16} />,
          },
          {
            label: "Download Certificate",
            onClick: () => {
              // Download certificate
              console.log("Download certificate", row.id);
            },
            icon: <Download size={16} />,
          },
          {
            label: "Delete Certificate",
            onClick: () => {
              // Show delete confirmation
              console.log("Delete certificate", row.id);
            },
            icon: <Trash2 size={16} />,
            className: "text-red-600 dark:text-red-400",
          },
        ];

        return (
          <div className="flex items-center justify-end space-x-2">
            {row.credentialUrl && (
              <a
                href={row.credentialUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                title="Verify Certificate"
              >
                <ExternalLink size={18} />
              </a>
            )}
            <div className="relative">
              <button
                type="button"
                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <MoreHorizontal
                  size={18}
                  className="text-gray-500 dark:text-gray-400"
                />
              </button>
            </div>
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

  // Issuer options for filtering
  const issuerOptions = [
    { label: "All Issuers", value: "" },
    ...Array.from(new Set(mockCertificates.map((cert) => cert.issuer))).map(
      (issuer) => ({ label: issuer, value: issuer }),
    ),
  ];

  if (loading) {
    return (
      <MainLayout>
        <div className="flex h-96 items-center justify-center">
          <Spinner size="large" label="Loading certificates..." />
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
              Certificates
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manage and verify your professional certifications
            </p>
          </div>

          <Link href={ROUTES.DASHBOARD.CERTIFICATES.NEW}>
            <Button leftIcon={<Plus size={16} />}>Add New Certificate</Button>
          </Link>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              type="search"
              placeholder="Search certificates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftElement={<Search size={18} className="text-gray-400" />}
              clearable
              onClear={() => setSearchQuery("")}
            />
          </div>

          <div className="flex gap-2">
            <select
              value={
                verificationFilter === null
                  ? ""
                  : verificationFilter
                    ? "verified"
                    : "unverified"
              }
              onChange={(e) => {
                if (e.target.value === "") setVerificationFilter(null);
                else setVerificationFilter(e.target.value === "verified");
              }}
              className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md text-sm"
            >
              <option value="">All Status</option>
              <option value="verified">Verified</option>
              <option value="unverified">Unverified</option>
            </select>

            <select
              value={issuerFilter || ""}
              onChange={(e) => setIssuerFilter(e.target.value || null)}
              className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md text-sm"
            >
              {issuerOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <div className="flex border border-gray-300 dark:border-gray-600 rounded-md overflow-hidden">
              <button
                className={`px-3 py-2 ${currentView === "grid" ? "bg-blue-600 text-white" : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"}`}
                onClick={() => setCurrentView("grid")}
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
                className={`px-3 py-2 ${currentView === "table" ? "bg-blue-600 text-white" : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"}`}
                onClick={() => setCurrentView("table")}
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
        {currentView === "grid" && (
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {filteredCertificates.length === 0 ? (
              <div className="col-span-full">
                <Card className="p-12 text-center">
                  <div className="mx-auto w-24 h-24 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                    <Award size={36} className="text-gray-400" />
                  </div>
                  <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
                    No certificates found
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Try adjusting your search or filter to find what you're
                    looking for.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchQuery("");
                      setVerificationFilter(null);
                      setIssuerFilter(null);
                    }}
                  >
                    Clear filters
                  </Button>
                </Card>
              </div>
            ) : (
              filteredCertificates.map((certificate) => (
                <motion.div key={certificate.id} variants={itemVariants}>
                  <Card hoverable clickEffect>
                    <div className="relative aspect-video mb-4 bg-gray-200 dark:bg-gray-700 rounded-t-lg overflow-hidden">
                      {certificate.thumbnailUrl ? (
                        <img
                          src={certificate.thumbnailUrl}
                          alt={certificate.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Award
                            size={36}
                            className="text-gray-400 dark:text-gray-500"
                          />
                        </div>
                      )}
                      <div className="absolute top-2 right-2">
                        <Badge
                          text={
                            certificate.verified ? "Verified" : "Unverified"
                          }
                          variant={certificate.verified ? "success" : "warning"}
                          size="sm"
                          icon={
                            certificate.verified ? (
                              <FileCheck size={14} />
                            ) : undefined
                          }
                        />
                      </div>
                    </div>

                    <div className="px-4 pb-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                        <Link
                          href={`${ROUTES.DASHBOARD.CERTIFICATES.ROOT}/${certificate.id}`}
                          className="hover:text-blue-600 dark:hover:text-blue-400"
                        >
                          {certificate.title}
                        </Link>
                      </h3>

                      <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
                        {certificate.issuer}
                      </p>

                      <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                        <div className="flex items-center">
                          <Calendar size={14} className="mr-1" />
                          Issued:{" "}
                          {new Date(certificate.issueDate).toLocaleDateString()}
                        </div>
                        {certificate.expiryDate && (
                          <div className="mt-1">
                            Expires:{" "}
                            {new Date(
                              certificate.expiryDate,
                            ).toLocaleDateString()}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-1 mb-4">
                        {certificate.skills.map((skill, i) => (
                          <Badge
                            key={i}
                            text={skill}
                            variant="outline"
                            size="sm"
                          />
                        ))}
                      </div>

                      <div className="flex items-center justify-between mt-2">
                        <Link
                          href={`${ROUTES.DASHBOARD.CERTIFICATES.ROOT}/${certificate.id}`}
                        >
                          <Button variant="outline" size="sm">
                            View Details
                          </Button>
                        </Link>

                        {certificate.credentialUrl && (
                          <a
                            href={certificate.credentialUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                            title="Verify Certificate"
                          >
                            <ExternalLink size={18} />
                          </a>
                        )}
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))
            )}
          </motion.div>
        )}

        {/* Table View */}
        {currentView === "table" && (
          <Table
            data={filteredCertificates}
            columns={columns}
            striped
            hoverable
            pagination
            itemsPerPage={10}
            emptyState={
              <div className="text-center py-12">
                <div className="mx-auto w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                  <Award size={24} className="text-gray-400" />
                </div>
                <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
                  No certificates found
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Try adjusting your search or filter to find what you're
                  looking for.
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery("");
                    setVerificationFilter(null);
                    setIssuerFilter(null);
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
