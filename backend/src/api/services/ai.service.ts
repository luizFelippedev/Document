import { Types } from 'mongoose';
import { 
  generateChatCompletion, 
  generateEmbedding, 
  generateImage,
  moderateContent
} from '../../lib/openai';
import Project from '../models/project.model';
import User from '../models/user.model';
import logger from '../../config/logger';
import fs from 'fs';
import path from 'path';
import { cacheGet, cacheSet } from '../../config/redis';

/**
 * Generate a project description based on user input
 * @param prompt User prompt
 * @param userId User ID
 * @returns Generated project description
 */
export const generateProjectDescription = async (
  prompt: string,
  userId: Types.ObjectId
): Promise<string> => {
  try {
    // Check content moderation
    const moderationResult = await moderateContent(prompt);
    if (moderationResult.flagged) {
      throw new Error('Your prompt contains inappropriate content.');
    }
    
    // Get user's past projects for context
    const userProjects = await Project.find({ owner: userId })
      .sort({ createdAt: -1 })
      .limit(3)
      .select('name description category tags')
      .lean();
    
    // Prepare system message with context
    let systemMessage = `You are an expert project description writer. 
Your task is to create a clear, professional, and comprehensive project description based on the user's prompt.
The description should be well-structured, engaging, and between 250-500 words.`;
    
    if (userProjects.length > 0) {
      systemMessage += `\n\nHere are some examples of the user's previous projects for context:\n`;
      userProjects.forEach((project, index) => {
        systemMessage += `Project ${index + 1}: ${project.name}\nDescription: ${project.description}\nCategory: ${project.category}\nTags: ${project.tags.join(', ')}\n\n`;
      });
    }
    
    // Prepare messages for the API call
    const messages = [
      { role: 'system' as const, content: systemMessage },
      { role: 'user' as const, content: `Generate a professional project description based on this idea: ${prompt}` }
    ];
    
    // Generate completion
    const description = await generateChatCompletion(messages, 'gpt-4o');
    
    return description;
  } catch (error) {
    logger.error(`Error generating project description: ${error}`);
    throw error;
  }
};

/**
 * Analyze a project and provide feedback
 * @param projectId Project ID
 * @returns Analysis results
 */
export const analyzeProject = async (
  projectId: Types.ObjectId
): Promise<{
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  overallScore: number;
  detailedAnalysis: string;
}> => {
  try {
    // Get project details
    const project = await Project.findById(projectId)
      .populate('owner', 'firstName lastName')
      .populate('collaborators', 'firstName lastName');
    
    if (!project) {
      throw new Error('Project not found');
    }
    
    // Build project data for analysis
    const projectData = {
      name: project.name,
      description: project.description,
      category: project.category,
      tags: project.tags,
      filesCount: project.files.length,
      fileTypes: [...new Set(project.files.map(file => file.type))],
      hasImages: project.files.some(file => file.type.startsWith('image/')),
      hasDocs: project.files.some(file => 
        file.type.includes('document') || 
        file.type.includes('pdf') || 
        file.type.includes('text/')
      ),
      collaboratorsCount: project.collaborators.length,
      status: project.status,
      visibility: project.visibility,
      aiGenerated: project.aiGenerated,
      metricsViews: project.metrics.views,
      metricsLikes: project.metrics.likes,
      metricsDownloads: project.metrics.downloads,
      metricsShares: project.metrics.shares,
    };
    
    // Check cache first
    const cacheKey = `project_analysis:${projectId}`;
    const cachedAnalysis = await cacheGet<{
      strengths: string[];
      weaknesses: string[];
      suggestions: string[];
      overallScore: number;
      detailedAnalysis: string;
    }>(cacheKey);
    
    if (cachedAnalysis) {
      return cachedAnalysis;
    }
    
    // Prepare system message
    const systemMessage = `You are an expert project analyst and consultant. 
Your task is to analyze the provided project details and give constructive feedback.
Focus on both strengths and areas for improvement. Be specific, actionable, and professional.`;
    
    // Prepare messages for the API call
    const messages = [
      { role: 'system' as const, content: systemMessage },
      { role: 'user' as const, content: `Please analyze this project and provide feedback:
${JSON.stringify(projectData, null, 2)}

Respond with a JSON object that has the following format:
{
  "strengths": [list of 3-5 strengths],
  "weaknesses": [list of 3-5 areas for improvement],
  "suggestions": [list of 3-5 specific suggestions],
  "overallScore": a number between 1-10,
  "detailedAnalysis": "A paragraph with detailed analysis"
}` }
    ];
    
    // Generate completion
    const analysisText = await generateChatCompletion(messages, 'gpt-4o');
    
    // Parse JSON response
    let analysis;
    try {
      analysis = JSON.parse(analysisText);
    } catch (error) {
      logger.error(`Error parsing AI response: ${error}`);
      throw new Error('Failed to parse AI analysis');
    }
    
    // Validate required fields
    if (!analysis.strengths || !analysis.weaknesses || !analysis.suggestions || 
        !analysis.overallScore || !analysis.detailedAnalysis) {
      throw new Error('Incomplete analysis response');
    }
    
    // Cache the result for 1 day
    await cacheSet(cacheKey, analysis, 86400);
    
    return analysis;
  } catch (error) {
    logger.error(`Error analyzing project: ${error}`);
    throw error;
  }
};

/**
 * Generate project ideas based on user skills and interests
 * @param userId User ID
 * @param category Optional category focus
 * @returns List of project ideas
 */
export const generateProjectIdeas = async (
  userId: Types.ObjectId,
  category?: string
): Promise<{ title: string; description: string; difficulty: 'beginner' | 'intermediate' | 'advanced' }[]> => {
  try {
    // Get user details for personalization
    const user = await User.findById(userId).select('firstName lastName skills');
    
    if (!user) {
      throw new Error('User not found');
    }
    
    // Prepare system message
    const systemMessage = `You are a creative project ideas generator.
Your task is to generate innovative, practical, and engaging project ideas tailored to the user's skills and interests.
Each idea should be original and provide value.`;
    
    // Prepare messages for the API call
    const messages = [
      { role: 'system' as const, content: systemMessage },
      { role: 'user' as const, content: `Generate 5 project ideas for me based on my profile:
- Name: ${user.firstName} ${user.lastName}
- Skills: ${user.skills.join(', ') || 'Various skills'}
${category ? `- Focus on this category: ${category}` : ''}

Respond with a JSON array of project ideas, each with this format:
{
  "title": "Project title",
  "description": "Brief but comprehensive project description (3-5 sentences)",
  "difficulty": "beginner" | "intermediate" | "advanced"
}` }
    ];
    
    // Generate completion
    const ideasText = await generateChatCompletion(messages, 'gpt-4o');
    
    // Parse JSON response
    let ideas;
    try {
      ideas = JSON.parse(ideasText);
    } catch (error) {
      logger.error(`Error parsing AI response: ${error}`);
      throw new Error('Failed to parse AI project ideas');
    }
    
    // Validate response is an array
    if (!Array.isArray(ideas)) {
      throw new Error('Invalid response format for project ideas');
    }
    
    return ideas;
  } catch (error) {
    logger.error(`Error generating project ideas: ${error}`);
    throw error;
  }
};

/**
 * Generate a project thumbnail image
 * @param projectId Project ID
 * @param prompt Custom prompt (optional)
 * @returns Path to the generated image
 */
export const generateProjectThumbnail = async (
  projectId: Types.ObjectId,
  prompt?: string
): Promise<string> => {
  try {
    // Get project details
    const project = await Project.findById(projectId);
    
    if (!project) {
      throw new Error('Project not found');
    }
    
    // Create prompt if not provided
    const imagePrompt = prompt || 
      `Create a professional thumbnail image for a project called "${project.name}" in the category "${project.category}". 
The image should be clean, modern, and visually appealing. Include elements related to: ${project.tags.join(', ')}.`;
    
    // Moderate content
    const moderationResult = await moderateContent(imagePrompt);
    if (moderationResult.flagged) {
      throw new Error('Your prompt contains inappropriate content.');
    }
    
    // Generate the image
    const imageUrl = await generateImage(imagePrompt, '1024x1024', 'hd', 'natural');
    
    // Download the image
    const response = await fetch(imageUrl);
    const buffer = await response.arrayBuffer();
    
    // Create directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), 'uploads', 'projects', project.owner.toString());
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    // Save the image with a unique filename
    const timestamp = Date.now();
    const filename = `thumbnail-${timestamp}.png`;
    const filePath = path.join(uploadDir, filename);
    
    fs.writeFileSync(filePath, Buffer.from(buffer));
    
    // Create relative path for database storage
    const relativePath = `uploads/projects/${project.owner.toString()}/${filename}`.replace(/\\/g, '/');
    
    // Update project with the new thumbnail
    project.thumbnail = relativePath;
    await project.save();
    
    return relativePath;
  } catch (error) {
    logger.error(`Error generating project thumbnail: ${error}`);
    throw error;
  }
};

/**
 * Find similar projects based on description and tags
 * @param projectId Project ID
 * @returns List of similar projects
 */
export const findSimilarProjects = async (
  projectId: Types.ObjectId
): Promise<any[]> => {
  try {
    // Get the source project
    const project = await Project.findById(projectId);
    
    if (!project) {
      throw new Error('Project not found');
    }
    
    // Check cache first
    const cacheKey = `similar_projects:${projectId}`;
    const cachedProjects = await cacheGet<any[]>(cacheKey);
    
    if (cachedProjects) {
      return cachedProjects;
    }
    
    // Generate embedding for project description and tags
    const contentToEmbed = `${project.name} ${project.description} ${project.tags.join(' ')}`;
    const embedding = await generateEmbedding(contentToEmbed) as number[];
    
    // Store the embedding in cache for reuse
    await cacheSet(`project_embedding:${projectId}`, embedding, 86400 * 7); // 7 days
    
    // Find public projects to compare with (excluding the source project)
    const publicProjects = await Project.find({ 
      _id: { $ne: projectId },
      visibility: 'public'
    })
    .select('_id name description category tags thumbnail metrics owner createdAt')
    .populate('owner', 'firstName lastName')
    .limit(50)
    .lean();
    
    if (publicProjects.length === 0) {
      return [];
    }
    
    // For each project, generate embedding and calculate similarity
    const projectsWithSimilarity = await Promise.all(publicProjects.map(async (proj) => {
      try {
        // Try to get embedding from cache first
        const cachedEmbedding = await cacheGet(`project_embedding:${proj._id}`);
        
        let projectEmbedding;
        if (cachedEmbedding) {
          projectEmbedding = cachedEmbedding as number[];
        } else {
          // Generate new embedding
          const projContentToEmbed = `${proj.name} ${proj.description} ${proj.tags.join(' ')}`;
          projectEmbedding = await generateEmbedding(projContentToEmbed);
          
          // Cache embedding
          await cacheSet(`project_embedding:${proj._id}`, projectEmbedding, 86400 * 7);
        }
        
        // Calculate cosine similarity
        const similarity = calculateCosineSimilarity(embedding, projectEmbedding);
        
        return {
          ...proj,
          similarity
        };
      } catch (error) {
        logger.error(`Error processing project ${proj._id}: ${error}`);
        return {
          ...proj,
          similarity: 0
        };
      }
    }));
    
    // Sort by similarity
    const similarProjects = projectsWithSimilarity
      .filter(proj => proj.similarity > 0.7) // Only keep projects with good similarity
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 10);
    
    // Cache the result for 1 day
    await cacheSet(cacheKey, similarProjects, 86400);
    
    return similarProjects;
  } catch (error) {
    logger.error(`Error finding similar projects: ${error}`);
    throw error;
  }
};

/**
 * Calculate cosine similarity between two vectors
 * @param vec1 First vector
 * @param vec2 Second vector
 * @returns Similarity score (0-1)
 */
const calculateCosineSimilarity = (vec1: number[], vec2: number[]): number => {
  if (vec1.length !== vec2.length) {
    throw new Error('Vectors must be of the same length');
  }
  
  let dotProduct = 0;
  let mag1 = 0;
  let mag2 = 0;
  
  for (let i = 0; i < vec1.length; i++) {
    dotProduct += vec1[i] * vec2[i];
    mag1 += vec1[i] * vec1[i];
    mag2 += vec2[i] * vec2[i];
  }
  
  mag1 = Math.sqrt(mag1);
  mag2 = Math.sqrt(mag2);
  
  if (mag1 === 0 || mag2 === 0) return 0;
  
  return dotProduct / (mag1 * mag2);
};

export default {
  generateProjectDescription,
  analyzeProject,
  generateProjectIdeas,
  generateProjectThumbnail,
  findSimilarProjects,
};