// frontend/src/components/projects/ProjectCard.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Project } from "@/types/project";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { SkillBadge } from "@/components/ui/SkillBadge";
import { Dropdown } from "@/components/ui/Dropdown";
import { formatDate } from "@/utils/date";
import {
  Eye,
  Edit,
  Trash,
  ExternalLink,
  Github,
  MoreVertical,
  Calendar,
  CheckCircle,
} from "lucide-react";

interface ProjectCardProps {
  project: Project;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export const ProjectCard = ({
  project,
  onView,
  onEdit,
  onDelete,
}: ProjectCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  const menuItems = [
    { label: "View Details", onClick: onView, icon: <Eye size={16} /> },
    { label: "Edit Project", onClick: onEdit, icon: <Edit size={16} /> },
    { label: "Delete Project", onClick: onDelete, icon: <Trash size={16} /> },
  ];

  if (project.demoUrl) {
    menuItems.splice(1, 0, {
      label: "Open Demo",
      onClick: () => window.open(project.demoUrl, "_blank"),
      icon: <ExternalLink size={16} />,
    });
  }

  if (project.repoUrl) {
    menuItems.splice(1, 0, {
      label: "View Code",
      onClick: () => window.open(project.repoUrl, "_blank"),
      icon: <Github size={16} />,
    });
  }

  return (
    <motion.div
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      <Card>
        <div className="relative h-full flex flex-col">
          {/* Card Header */}
          <div className="relative">
            <div className="h-48 overflow-hidden rounded-t-lg">
              {project.thumbnail ? (
                <img
                  src={project.thumbnail}
                  alt={project.title}
                  className="w-full h-full object-cover transition-transform duration-500"
                  style={{
                    transform: isHovered ? "scale(1.05)" : "scale(1)",
                  }}
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900 dark:to-indigo-900 flex items-center justify-center">
                  <div className="text-4xl text-blue-500 dark:text-blue-400 font-bold">
                    {project.title?.charAt(0) || "P"}
                  </div>
                </div>
              )}
            </div>

            <div className="absolute top-2 right-2">
              <Dropdown
                trigger={
                  <button className="p-1.5 bg-white/80 dark:bg-gray-800/80 rounded-full text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800">
                    <MoreVertical size={16} />
                  </button>
                }
                items={menuItems}
                isOpen={menuOpen}
                setIsOpen={setMenuOpen}
              />
            </div>

            {project.completed && (
              <div className="absolute top-2 left-2">
                <div className="bg-green-500/90 text-white text-xs font-medium px-2 py-1 rounded-md flex items-center">
                  <CheckCircle size={12} className="mr-1" />
                  Completed
                </div>
              </div>
            )}
          </div>

          {/* Card Body */}
          <div className="p-4 flex-1 flex flex-col">
            <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-1 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              <div className="cursor-pointer" onClick={onView}>
                {project.title}
              </div>
            </h3>

            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 flex-1">
              {truncateText(project.description, 100)}
            </p>

            <div className="mb-4">
              <div className="flex flex-wrap gap-1.5">
                {project.skills.slice(0, 5).map((skill) => (
                  <Badge key={skill} text={skill} color="blue" />
                ))}
                {project.skills.length > 5 && (
                  <Badge text={`+${project.skills.length - 5}`} color="gray" />
                )}
              </div>
            </div>

            <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center mb-4">
              <Calendar size={14} className="mr-1" />
              Created on {formatDate(project.createdAt)}
            </div>

            <div className="mt-auto flex space-x-2">
              <Button
                variant="primary"
                className="flex-1 flex items-center justify-center"
                onClick={onView}
              >
                <Eye size={16} className="mr-2" />
                View
              </Button>
              <Button
                variant="outline"
                className="flex-1 flex items-center justify-center"
                onClick={onEdit}
              >
                <Edit size={16} className="mr-2" />
                Edit
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};
