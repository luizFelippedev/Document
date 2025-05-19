// src/ai/analyze.ts
import { IProject } from '../api/models/project.model';
import openai from '../lib/openai';

interface ProjectAnalysis {
  strengths: string[];
  suggestions: string[];
  marketPotential: string;
  skillsHighlighted: string[];
  technicalFeedback: string;
}

function extractList(text: string): string[] {
  return text
    .split('\n')
    .filter(line => line.match(/^\d+\.|^\-/))
    .map(line => line.replace(/^\d+\.|\-\s+/, '').trim())
    .filter(Boolean);
}

function parseAnalysis(text: string): ProjectAnalysis {
  const getSection = (label: string): string =>
    text.match(new RegExp(`(?<=${label}:)([\\s\\S]*?)(?=\\n\\n|\\n[A-Z]|$)`, 'i'))?.[0]?.trim() || '';

  const strengths = extractList(getSection('strengths?'));
  const suggestions = extractList(getSection('suggestions?|improvements?'));
  const marketPotential = getSection('market potential');
  const skillsRaw = getSection('skills highlighted');
  const technicalFeedback = getSection('technical feedback');

  const skillsHighlighted = skillsRaw
    .split(',')
    .map(skill => skill.trim())
    .filter(Boolean);

  return {
    strengths,
    suggestions,
    marketPotential,
    skillsHighlighted,
    technicalFeedback
  };
}

export const analyzeProject = async (project: IProject): Promise<ProjectAnalysis> => {
  try {
    const prompt = `
      Analyze the following project and provide professional feedback:

      Title: ${project.title}
      Description: ${project.description}
      ${project.content ? `Content: ${project.content}` : ''}
      Technologies: ${(project.technologies || []).join(', ')}
      Category: ${project.category}
      ${project.isFiveM ? 'This is a FiveM project.' : ''}

      Please provide:
      1. 3-5 key strengths of this project
      2. 3-5 improvement suggestions
      3. Brief market potential assessment
      4. Key skills highlighted by this project
      5. Technical feedback on the technology choices

      Format your answer clearly using section titles.
    `;

    const messages: Array<{ role: "system" | "user"; content: string }> = [
      {
        role: "system",
        content:
          "You are an expert portfolio analyzer and career advisor specialized in tech projects. Provide detailed, constructive and professional feedback on the project."
      },
      {
        role: "user",
        content: prompt
      }
    ];

    const response = await openai.generateChatCompletion(
      messages,
      "gpt-4-turbo",
      0.7,
      1000
    );

    const analysisText = response || '';
    return parseAnalysis(analysisText);
  } catch (error) {
    console.error('[analyzeProject] AI Error:', error instanceof Error ? error.message : error);
    throw new Error('Failed to analyze project with AI');
  }
};
