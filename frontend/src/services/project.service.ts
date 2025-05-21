// src/services/project.service.ts
import { api } from "@/lib/axios";
import { Project, ProjectFilter } from "@/types/project";
import { socketEvents, socketService } from "@/lib/socket";

export const projectService = {
  /**
   * Get all projects
   */
  async getProjects(
    page = 1,
    limit = 10,
    filter?: ProjectFilter,
    userId?: string,
  ) {
    // Create params
    const params: Record<string, any> = { page, limit }; // Padronizado para usar 'limit'

    // Add filter parameters
    if (filter) {
      if (filter.search) params.search = filter.search;
      if (filter.skills) params.skills = filter.skills.join(",");
      if (filter.completed !== undefined) params.completed = filter.completed;
      if (filter.category) params.category = filter.category;
      if (filter.sortBy) params.sortBy = filter.sortBy;
    }

    // Add userId if provided
    if (userId) params.userId = userId;

    const response = await api.get("/projects", { params });
    return response.data.projects;
  },

  /**
   * Get a specific project by ID
   */
  async getProject(id: string) {
    const response = await api.get(`/projects/${id}`);
    return response.data.project;
  },

  /**
   * Create a new project
   */
  async createProject(projectData: FormData) {
    const response = await api.post("/projects", projectData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    // Emit socket event for real-time updates
    socketService.emit(socketEvents.projects.created, response.data.project);

    return response.data.project;
  },

  /**
   * Update an existing project
   */
  async updateProject(id: string, projectData: FormData) {
    const response = await api.put(`/projects/${id}`, projectData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    // Emit socket event for real-time updates
    socketService.emit(socketEvents.projects.updated, response.data.project);

    return response.data.project;
  },

  /**
   * Delete a project
   */
  async deleteProject(id: string) {
    const response = await api.delete(`/projects/${id}`);

    // Emit socket event for real-time updates
    socketService.emit(socketEvents.projects.deleted, { id });

    return response.data;
  },

  /**
   * Get featured projects for homepage
   */
  async getFeaturedProjects() {
    const response = await api.get("/projects/featured");
    return response.data.projects;
  },

  /**
   * Upload project image
   */
  async uploadProjectImage(projectId: string, imageFile: File) {
    const formData = new FormData();
    formData.append("image", imageFile);

    const response = await api.post(`/projects/${projectId}/images`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  /**
   * Delete project image
   */
  async deleteProjectImage(projectId: string, imageId: string) {
    const response = await api.delete(
      `/projects/${projectId}/images/${imageId}`,
    );
    return response.data;
  },

  /**
   * Search projects
   */
  async searchProjects(query: string) {
    const response = await api.get("/projects/search", {
      params: { query },
    });
    return response.data.projects;
  },

  /**
   * Filter projects by skills
   */
  async filterProjectsBySkills(skills: string[]) {
    const response = await api.get("/projects/filter", {
      params: { skills: skills.join(",") },
    });
    return response.data.projects;
  },
};
