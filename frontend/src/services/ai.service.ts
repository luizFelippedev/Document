// src/services/ai.service.ts
import { api } from "@/lib/axios";

interface AIPromptParams {
  prompt: string;
  maxTokens?: number;
  temperature?: number;
  options?: Record<string, any>;
}

interface AIImageParams {
  prompt: string;
  n?: number;
  size?: "256x256" | "512x512" | "1024x1024";
  responseFormat?: "url" | "b64_json";
}

interface AIRecommendationParams {
  projectId?: string;
  certificateId?: string;
  skillIds?: string[];
  userId?: string;
}

export const aiService = {
  /**
   * Generate text using AI
   */
  async generateText({
    prompt,
    maxTokens = 500,
    temperature = 0.7,
    options = {},
  }: AIPromptParams) {
    const response = await api.post("/ai/text", {
      prompt,
      maxTokens,
      temperature,
      ...options,
    });
    return response.data;
  },

  /**
   * Generate an image using AI
   */
  async generateImage({
    prompt,
    n = 1,
    size = "512x512",
    responseFormat = "url",
  }: AIImageParams) {
    const response = await api.post("/ai/image", {
      prompt,
      n,
      size,
      response_format: responseFormat,
    });
    return response.data;
  },

  /**
   * Get AI suggestions for project description improvement
   */
  async improveProjectDescription(
    projectId: string,
    currentDescription: string,
  ) {
    const response = await api.post(`/ai/improve-project/${projectId}`, {
      description: currentDescription,
    });
    return response.data;
  },

  /**
   * Get AI-generated recommendations based on user profile
   */
  async getRecommendations(params: AIRecommendationParams) {
    const response = await api.post("/ai/recommendations", params);
    return response.data;
  },

  /**
   * Get AI-suggested skills based on project or certificate
   */
  async suggestSkills(text: string) {
    const response = await api.post("/ai/suggest-skills", { text });
    return response.data.skills;
  },

  /**
   * Check content for sensitive or inappropriate information
   */
  async moderateContent(content: string) {
    const response = await api.post("/ai/moderate", { content });
    return response.data;
  },

  /**
   * Generate a portfolio summary from user's projects and certificates
   */
  async generatePortfolioSummary(userId?: string) {
    const response = await api.post("/ai/portfolio-summary", { userId });
    return response.data;
  },

  /**
   * Generate SEO metadata for portfolio
   */
  async generateSEOMetadata(text: string) {
    const response = await api.post("/ai/seo", { text });
    return response.data;
  },

  /**
   * Get AI feedback on a project
   */
  async getProjectFeedback(projectId: string) {
    const response = await api.post(`/ai/project-feedback/${projectId}`);
    return response.data;
  },
};
