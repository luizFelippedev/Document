// frontend/src/hooks/useProjects.ts
"use client";

import { useState, useCallback } from "react";
import { Project, ProjectFilter } from "@/types/project";
import { projectService } from "@/services/project.service";
import { useNotification } from "./useNotification";

export const useProjects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useNotification();

  // Get all projects
  const getProjects = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await projectService.getProjects();
      setProjects(data);

      return data;
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to fetch projects");
      showToast("error", "Failed to fetch projects");
      return [];
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // Get project by ID
  const getProject = useCallback(
    async (id: string) => {
      try {
        setLoading(true);
        setError(null);

        const data = await projectService.getProject(id);
        return data;
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to fetch project");
        showToast("error", "Failed to fetch project details");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [showToast],
  );

  // Create project
  const createProject = useCallback(
    async (projectData: FormData) => {
      try {
        setLoading(true);
        setError(null);

        const data = await projectService.createProject(projectData);
        setProjects((prev) => [data, ...prev]);

        showToast("success", "Project created successfully");
        return data;
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to create project");
        showToast("error", "Failed to create project");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [showToast],
  );

  // Update project
  const updateProject = useCallback(
    async (id: string, projectData: FormData) => {
      try {
        setLoading(true);
        setError(null);

        const data = await projectService.updateProject(id, projectData);

        setProjects((prev) =>
          prev.map((proj) => (proj.id === id ? data : proj)),
        );

        showToast("success", "Project updated successfully");
        return data;
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to update project");
        showToast("error", "Failed to update project");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [showToast],
  );

  // Delete project
  const deleteProject = useCallback(
    async (id: string) => {
      try {
        setLoading(true);
        setError(null);

        await projectService.deleteProject(id);
        setProjects((prev) => prev.filter((proj) => proj.id !== id));

        showToast("success", "Project deleted successfully");
        return true;
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to delete project");
        showToast("error", "Failed to delete project");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [showToast],
  );

  // Filter projects
  const filterProjects = useCallback(
    async (filters: ProjectFilter) => {
      try {
        setLoading(true);
        setError(null);

        let filteredProjs = [...projects];

        // Apply local filtering
        if (filters.search) {
          const searchTerm = filters.search.toLowerCase();
          filteredProjs = filteredProjs.filter(
            (proj) =>
              proj.title.toLowerCase().includes(searchTerm) ||
              proj.description.toLowerCase().includes(searchTerm) ||
              proj.skills.some((skill) =>
                skill.toLowerCase().includes(searchTerm),
              ),
          );
        }

        if (filters.skills && filters.skills.length > 0) {
          filteredProjs = filteredProjs.filter((proj) =>
            filters.skills!.some((skill) => proj.skills.includes(skill)),
          );
        }

        if (filters.completed !== undefined) {
          filteredProjs = filteredProjs.filter(
            (proj) => proj.completed === filters.completed,
          );
        }

        if (filters.category) {
          filteredProjs = filteredProjs.filter(
            (proj) => proj.category === filters.category,
          );
        }

        // Sort results
        if (filters.sortBy) {
          switch (filters.sortBy) {
            case "newest":
              filteredProjs.sort(
                (a, b) =>
                  new Date(b.createdAt).getTime() -
                  new Date(a.createdAt).getTime(),
              );
              break;
            case "oldest":
              filteredProjs.sort(
                (a, b) =>
                  new Date(a.createdAt).getTime() -
                  new Date(b.createdAt).getTime(),
              );
              break;
            case "a-z":
              filteredProjs.sort((a, b) => a.title.localeCompare(b.title));
              break;
            case "z-a":
              filteredProjs.sort((a, b) => b.title.localeCompare(a.title));
              break;
          }
        }

        return filteredProjs;
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to filter projects");
        showToast("error", "Failed to filter projects");
        return [];
      } finally {
        setLoading(false);
      }
    },
    [projects, showToast],
  );

  return {
    projects,
    loading,
    error,
    getProjects,
    getProject,
    createProject,
    updateProject,
    deleteProject,
    filterProjects,
  };
};
