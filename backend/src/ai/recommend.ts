import { Types } from 'mongoose';
import Project from '../api/models/project.model';
import User from '../api/models/user.model';
import { generateEmbedding } from '../lib/openai';
import { cacheGet, cacheSet } from '../config/redis';

export interface ProjectRecommendation {
  project: any;
  score: number;
  reason: string;
}

export const getProjectRecommendations = async (
  userId: Types.ObjectId,
  limit: number = 10
): Promise<ProjectRecommendation[]> => {
  try {
    const cacheKey = `recommendations:${userId}`;
    const cached = await cacheGet<ProjectRecommendation[]>(cacheKey);
    
    if (cached) return cached;

    const user = await User.findById(userId).select('skills');
    const userProjects = await Project.find({ owner: userId }).select('category tags');
    
    // Gerar embedding baseado no perfil do usuário
    const userProfile = `${user?.skills.join(' ')} ${userProjects.map(p => `${p.category} ${p.tags.join(' ')}`).join(' ')}`;
    const userEmbedding = await generateEmbedding(userProfile);
    
    // Buscar projetos públicos
    const publicProjects = await Project.find({
      visibility: 'public',
      owner: { $ne: userId }
    }).populate('owner', 'firstName lastName');
    
    const recommendations: ProjectRecommendation[] = [];
    
    for (const project of publicProjects) {
      const projectProfile = `${project.category} ${project.tags.join(' ')} ${project.description}`;
      const projectEmbedding = await generateEmbedding(projectProfile);
      
      const score = calculateSimilarity(userEmbedding, projectEmbedding);
      
      if (score > 0.7) {
        recommendations.push({
          project,
          score,
          reason: generateRecommendationReason(user?.skills || [], project)
        });
      }
    }
    
    const sortedRecommendations = recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
    
    await cacheSet(cacheKey, sortedRecommendations, 3600);
    
    return sortedRecommendations;
  } catch (error) {
    throw error;
  }
};

const calculateSimilarity = (embedding1: number[], embedding2: number[]): number => {
  // Implementar cálculo de similaridade cosseno
  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;
  
  for (let i = 0; i < embedding1.length; i++) {
    dotProduct += embedding1[i] * embedding2[i];
    norm1 += embedding1[i] * embedding1[i];
    norm2 += embedding2[i] * embedding2[i];
  }
  
  return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
};

const generateRecommendationReason = (userSkills: string[], project: any): string => {
  const matchingSkills = userSkills.filter(skill => 
    project.tags.some((tag: string) => tag.toLowerCase().includes(skill.toLowerCase()))
  );
  
  if (matchingSkills.length > 0) {
    return `Matches your skills: ${matchingSkills.join(', ')}`;
  }
  
  return `Similar to your interests in ${project.category}`;
};