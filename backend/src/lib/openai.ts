import OpenAI from 'openai';
import logger from '../config/logger';

// Create OpenAI client instance
let openaiClient: OpenAI | null = null;

/**
 * Initialize the OpenAI client
 */
export const initOpenAI = (): OpenAI => {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      const error = new Error('OpenAI API key is not defined in environment variables');
      logger.error(error.message);
      throw error;
    }
    
    // Configure the OpenAI client
    openaiClient = new OpenAI({
      apiKey,
      timeout: 60000, // 1 minute timeout
      maxRetries: 3
    });
    
    logger.info('OpenAI client initialized');
  }
  
  return openaiClient;
};

/**
 * Get the OpenAI client, initializing it if necessary
 */
export const getOpenAIClient = (): OpenAI => {
  if (!openaiClient) {
    return initOpenAI();
  }
  return openaiClient;
};

/**
 * Generate a chat completion using the OpenAI API
 * @param messages Array of message objects for the conversation
 * @param model OpenAI model to use
 * @param temperature Controls randomness (0-2)
 * @param maxTokens Maximum tokens in the response
 */
export const generateChatCompletion = async (
  messages: OpenAI.Chat.ChatCompletionMessageParam[],
  model: string = 'gpt-4o',
  temperature: number = 0.7,
  maxTokens?: number
): Promise<string> => {
  try {
    const client = getOpenAIClient();
    
    // Make the API call
    const response = await client.chat.completions.create({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
    });
    
    // Get the response text
    const responseText = response.choices[0]?.message?.content || '';
    
    // Log tokens for billing and monitoring
    const promptTokens = response.usage?.prompt_tokens || 0;
    const completionTokens = response.usage?.completion_tokens || 0;
    const totalTokens = response.usage?.total_tokens || 0;
    
    logger.debug(`OpenAI token usage: prompt=${promptTokens}, completion=${completionTokens}, total=${totalTokens}`);
    
    return responseText;
  } catch (error: any) {
    logger.error(`OpenAI API error: ${error.message}`);
    
    // Check for specific error types and handle them
    if (error.status === 429) {
      throw new Error('OpenAI rate limit exceeded. Please try again later.');
    }
    
    throw error;
  }
};

/**
 * Generate an embedding for a text using the OpenAI API
 * @param text Text to generate embedding for
 * @param model OpenAI model to use
 */
export const generateEmbedding = async (
  text: string,
  model: string = 'text-embedding-3-small'
): Promise<number[]> => {
  try {
    const client = getOpenAIClient();
    
    // Make the API call
    const response = await client.embeddings.create({
      model,
      input: text,
      encoding_format: 'float',
    });
    
    // Get the embedding
    const embedding = response.data[0]?.embedding || [];
    
    // Log tokens for billing and monitoring
    const promptTokens = response.usage?.prompt_tokens || 0;
    const totalTokens = response.usage?.total_tokens || 0;
    
    logger.debug(`OpenAI embedding token usage: prompt=${promptTokens}, total=${totalTokens}`);
    
    return embedding;
  } catch (error: any) {
    logger.error(`OpenAI embedding API error: ${error.message}`);
    throw error;
  }
};

/**
 * Generate an image using DALL-E through the OpenAI API
 * @param prompt Text prompt for the image
 * @param size Image size (e.g., '1024x1024')
 * @param quality Image quality ('standard' or 'hd')
 * @param style Style of the image ('vivid' or 'natural')
 */
export const generateImage = async (
  prompt: string,
  size: '1024x1024' | '1024x1792' | '1792x1024' = '1024x1024',
  quality: 'standard' | 'hd' = 'standard',
  style: 'vivid' | 'natural' = 'vivid'
): Promise<string> => {
  try {
    const client = getOpenAIClient();
    
    // Make the API call
    const response = await client.images.generate({
      model: 'dall-e-3',
      prompt,
      n: 1,
      size,
      quality,
      style,
    });
    
    // Get the image URL
    const imageUrl = response.data && response.data[0]?.url;
    
    if (!imageUrl) {
      throw new Error('No image URL returned from OpenAI API');
    }
    
    return imageUrl;
  } catch (error: any) {
    logger.error(`OpenAI image generation API error: ${error.message}`);
    throw error;
  }
};

/**
 * Moderate content using OpenAI's moderation API
 * @param text Text to moderate
 */
export const moderateContent = async (
  text: string
): Promise<{flagged: boolean, categories: any}> => {
  try {
    const client = getOpenAIClient();
    
    // Make the API call
    const response = await client.moderations.create({
      input: text,
    });
    
    // Get the moderation results
    const result = response.results[0];
    
    return {
      flagged: result.flagged,
      categories: result.categories,
    };
  } catch (error: any) {
    logger.error(`OpenAI moderation API error: ${error.message}`);
    throw error;
  }
};

export default {
  initOpenAI,
  getOpenAIClient,
  generateChatCompletion,
  generateEmbedding,
  generateImage,
  moderateContent,
};