import { Types } from 'mongoose';
import { generateChatCompletion } from '../lib/openai';
import Project from '../api/models/project.model';
import User from '../api/models/user.model';
import logger from '../config/logger';

export interface ProjectIdea {
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: string;
  technologies: string[];
  category: string;
}

export const generateProjectIdeas = async (
  userId: Types.ObjectId,
  preferences?: {
    category?: string;
    difficulty?: string;
    technologies?: string[];
  }
): Promise<ProjectIdea[]> => {
  try {
    const user = await User.findById(userId).select('skills');
    
    const prompt = `Generate 5 unique project ideas based on:
    - User skills: ${user?.skills.join(', ') || 'general programming'}
    - Preferred category: ${preferences?.category || 'any'}
    - Difficulty: ${preferences?.difficulty || 'any'}
    - Technologies: ${preferences?.technologies?.join(', ') || 'any'}
    
    Return as JSON array with: title, description, difficulty, estimatedTime, technologies, category`;

    const response = await generateChatCompletion([
      { role: 'system', content: 'You are a project idea generator for developers.' },
      { role: 'user', content: prompt }
    ]);

    return JSON.parse(response);
  } catch (error) {
    logger.error(`Error generating project ideas: ${error}`);
    throw error;
  }
};