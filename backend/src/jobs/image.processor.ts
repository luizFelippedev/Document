import { Job } from 'bull';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import logger from '../config/logger';
import { getImageProcessingQueue } from './index';
import { generateImage } from '../lib/openai';

// Image job data types
type ResizeImageJobData = {
  type: 'resize';
  inputPath: string;
  outputPath?: string;
  width?: number;
  height?: number;
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp' | 'avif';
};

type OptimizeImageJobData = {
  type: 'optimize';
  inputPath: string;
  outputPath?: string;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp' | 'avif';
};

type GenerateAIImageJobData = {
  type: 'generate-ai';
  prompt: string;
  outputPath: string;
  size?: '1024x1024' | '1024x1792' | '1792x1024';
  quality?: 'standard' | 'hd';
  style?: 'vivid' | 'natural';
  userId?: string;
  projectId?: string;
};

type WatermarkImageJobData = {
  type: 'watermark';
  inputPath: string;
  outputPath?: string;
  watermarkText: string;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
  opacity?: number;
  fontSize?: number;
};

type CreateThumbnailJobData = {
  type: 'thumbnail';
  inputPath: string;
  outputPath?: string;
  width?: number;
  height?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
};

type BatchProcessImagesJobData = {
  type: 'batch';
  inputPaths: string[];
  outputDir: string;
  operations: Array<{
    type: 'resize' | 'optimize' | 'watermark' | 'thumbnail';
    [key: string]: any;
  }>;
};

// Union type of all job data types
type ImageJobData =
  | ResizeImageJobData
  | OptimizeImageJobData
  | GenerateAIImageJobData
  | WatermarkImageJobData
  | CreateThumbnailJobData
  | BatchProcessImagesJobData;

/**
 * Process an image job
 * @param job Bull job object
 * @returns Result of processing
 */
export const processJob = async (job: Job<ImageJobData>): Promise<any> => {
  try {
    const { data } = job;
    
    // Update job progress
    await job.progress(10);
    
    let result;
    
    switch (data.type) {
      case 'resize':
        result = await resizeImage(data);
        break;
      case 'optimize':
        result = await optimizeImage(data);
        break;
      case 'generate-ai':
        result = await generateAIImage(data);
        break;
      case 'watermark':
        result = await watermarkImage(data);
        break;
      case 'thumbnail':
        result = await createThumbnail(data);
        break;
      case 'batch':
        result = await batchProcessImages(data);
        break;
      default:
        throw new Error(`Unknown image job type: ${(data as any).type}`);
    }
    
    // Update job progress
    await job.progress(100);
    
    return {
      success: true,
      result,
    };
  } catch (error) {
    logger.error(`Error processing image job: ${error}`);
    throw error;
  }
};

/**
 * Resize an image
 * @param data Resize job data
 * @returns Path to the resized image
 */
const resizeImage = async (data: ResizeImageJobData): Promise<string> => {
  try {
    const { inputPath, width, height, fit, quality, format } = data;
    
    // Determine output path
    const outputPath = data.outputPath || getOutputPath(inputPath, 'resized', format);
    
    // Ensure output directory exists
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Resize image
    let image = sharp(inputPath).resize({
      width,
      height,
      fit: fit || 'cover',
    });
    
    // Apply format if specified
    if (format) {
      image = image.toFormat(format, { quality: quality || 80 });
    }
    
    // Save image
    await image.toFile(outputPath);
    
    return outputPath;
  } catch (error) {
    logger.error(`Error resizing image: ${error}`);
    throw error;
  }
};

/**
 * Optimize an image
 * @param data Optimize job data
 * @returns Path to the optimized image
 */
const optimizeImage = async (data: OptimizeImageJobData): Promise<string> => {
  try {
    const { inputPath, quality, format } = data;
    
    // Determine output path
    const outputPath = data.outputPath || getOutputPath(inputPath, 'optimized', format);
    
    // Ensure output directory exists
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Get metadata
    const metadata = await sharp(inputPath).metadata();
    
    // Optimize image
    let image = sharp(inputPath);
    
    // Determine format
    const outputFormat = format || metadata.format;
    
    if (outputFormat === 'jpeg' || outputFormat === 'png' || outputFormat === 'webp' || outputFormat === 'avif') {
      image = image.toFormat(outputFormat, { quality: quality || 80 });
    }
    
    // Save image
    await image.toFile(outputPath);
    
    return outputPath;
  } catch (error) {
    logger.error(`Error optimizing image: ${error}`);
    throw error;
  }
};

/**
 * Generate an AI image
 * @param data Generate AI image job data
 * @returns Path to the generated image
 */
const generateAIImage = async (data: GenerateAIImageJobData): Promise<string> => {
  try {
    const { prompt, outputPath, size, quality, style, userId, projectId } = data;
    
    // Ensure output directory exists
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Generate image
    const imageUrl = await generateImage(
      prompt,
      size || '1024x1024',
      quality || 'standard',
      style || 'vivid'
    );
    
    // Download the image
    const response = await fetch(imageUrl);
    const buffer = await response.arrayBuffer();
    
    // Save the image
    fs.writeFileSync(outputPath, Buffer.from(buffer));
    
    // Log the generation
    logger.info(`AI Image generated successfully: ${outputPath}`);
    logger.info(`Prompt: ${prompt}`);
    if (userId) logger.info(`User ID: ${userId}`);
    if (projectId) logger.info(`Project ID: ${projectId}`);
    
    return outputPath;
  } catch (error) {
    logger.error(`Error generating AI image: ${error}`);
    throw error;
  }
};

/**
 * Add watermark to an image
 * @param data Watermark job data
 * @returns Path to the watermarked image
 */
const watermarkImage = async (data: WatermarkImageJobData): Promise<string> => {
  try {
    const { inputPath, watermarkText, position, opacity, fontSize } = data;
    
    // Determine output path
    const outputPath = data.outputPath || getOutputPath(inputPath, 'watermarked');
    
    // Ensure output directory exists
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Get image dimensions
    const metadata = await sharp(inputPath).metadata();
    const width = metadata.width;
    const height = metadata.height;
    
    if (!width || !height) {
      throw new Error('Unable to determine image dimensions');
    }
    
    // Create SVG watermark
    const svgText = createWatermarkSvg(
      watermarkText,
      width,
      height,
      position || 'bottom-right',
      opacity || 0.5,
      fontSize || 24
    );
    
    // Apply watermark
    await sharp(inputPath)
      .composite([
        {
          input: Buffer.from(svgText),
          gravity: 'center',
        },
      ])
      .toFile(outputPath);
    
    return outputPath;
  } catch (error) {
    logger.error(`Error applying watermark: ${error}`);
    throw error;
  }
};

/**
 * Create a thumbnail
 * @param data Thumbnail job data
 * @returns Path to the thumbnail
 */
const createThumbnail = async (data: CreateThumbnailJobData): Promise<string> => {
  try {
    const { inputPath, width, height, quality, format } = data;
    
    // Determine output path
    const outputPath = data.outputPath || getOutputPath(inputPath, 'thumbnail', format);
    
    // Ensure output directory exists
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Create thumbnail
    let image = sharp(inputPath)
      .resize({
        width: width || 200,
        height: height || 200,
        fit: 'cover',
      });
    
    // Apply format if specified
    if (format) {
      image = image.toFormat(format, { quality: quality || 80 });
    }
    
    // Save thumbnail
    await image.toFile(outputPath);
    
    return outputPath;
  } catch (error) {
    logger.error(`Error creating thumbnail: ${error}`);
    throw error;
  }
};

/**
 * Batch process multiple images
 * @param data Batch job data
 * @returns Paths to processed images
 */
const batchProcessImages = async (data: BatchProcessImagesJobData): Promise<string[]> => {
  try {
    const { inputPaths, outputDir, operations } = data;
    
    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const results: string[] = [];
    
    // Process each image
    for (let i = 0; i < inputPaths.length; i++) {
      const inputPath = inputPaths[i];
      const fileName = path.basename(inputPath);
      
      // Apply each operation sequentially
      let currentPath = inputPath;
      
      for (const operation of operations) {
        const outputPath = path.join(outputDir, `${i}_${operation.type}_${fileName}`);
        
        switch (operation.type) {
          case 'resize':
            currentPath = await resizeImage({
              type: 'resize',
              inputPath: currentPath,
              outputPath,
              width: operation.width,
              height: operation.height,
              fit: operation.fit,
              quality: operation.quality,
              format: operation.format,
            });
            break;
          case 'optimize':
            currentPath = await optimizeImage({
              type: 'optimize',
              inputPath: currentPath,
              outputPath,
              quality: operation.quality,
              format: operation.format,
            });
            break;
          case 'watermark':
            currentPath = await watermarkImage({
              type: 'watermark',
              inputPath: currentPath,
              outputPath,
              watermarkText: operation.watermarkText,
              position: operation.position,
              opacity: operation.opacity,
              fontSize: operation.fontSize,
            });
            break;
          case 'thumbnail':
            currentPath = await createThumbnail({
              type: 'thumbnail',
              inputPath: currentPath,
              outputPath,
              width: operation.width,
              height: operation.height,
              quality: operation.quality,
              format: operation.format,
            });
            break;
        }
      }
      
      results.push(currentPath);
    }
    
    return results;
  } catch (error) {
    logger.error(`Error batch processing images: ${error}`);
    throw error;
  }
};

/**
 * Create SVG watermark text
 * @param text Watermark text
 * @param imageWidth Image width
 * @param imageHeight Image height
 * @param position Watermark position
 * @param opacity Watermark opacity
 * @param fontSize Watermark font size
 * @returns SVG watermark
 */
const createWatermarkSvg = (
  text: string,
  imageWidth: number,
  imageHeight: number,
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center',
  opacity: number,
  fontSize: number
): string => {
  // Determine position coordinates
  let x, y;
  
  switch (position) {
    case 'top-left':
      x = fontSize;
      y = fontSize + 10;
      break;
    case 'top-right':
      x = imageWidth - fontSize * text.length / 2;
      y = fontSize + 10;
      break;
    case 'bottom-left':
      x = fontSize;
      y = imageHeight - fontSize;
      break;
    case 'bottom-right':
      x = imageWidth - fontSize * text.length / 2;
      y = imageHeight - fontSize;
      break;
    case 'center':
      x = imageWidth / 2;
      y = imageHeight / 2;
      break;
  }
  
  // Create SVG
  return `<svg width="${imageWidth}" height="${imageHeight}">
    <text
      x="${x}"
      y="${y}"
      font-family="Arial"
      font-size="${fontSize}"
      fill="rgba(255, 255, 255, ${opacity})"
      text-anchor="${position === 'center' ? 'middle' : 'start'}"
    >
      ${text}
    </text>
  </svg>`;
};

/**
 * Generate output path for processed image
 * @param inputPath Original image path
 * @param suffix Suffix to add to filename
 * @param format Output format
 * @returns Output path
 */
const getOutputPath = (
  inputPath: string,
  suffix: string,
  format?: string
): string => {
  const dir = path.dirname(inputPath);
  const ext = format || path.extname(inputPath).slice(1);
  const filename = path.basename(inputPath, path.extname(inputPath));
  
  return path.join(dir, `${filename}-${suffix}.${ext}`);
};

/**
 * Add a resize image job to the queue
 * @param data Resize image job data
 * @returns Job ID
 */
export const addResizeImageJob = async (data: Omit<ResizeImageJobData, 'type'>): Promise<string> => {
  const queue = getImageProcessingQueue();
  const job = await queue.add(
    { ...data, type: 'resize' },
    {
      attempts: 3,
      backoff: { type: 'exponential', delay: 1000 },
      removeOnComplete: true,
    }
  );
  return job.id.toString();
};

/**
 * Add an optimize image job to the queue
 * @param data Optimize image job data
 * @returns Job ID
 */
export const addOptimizeImageJob = async (data: Omit<OptimizeImageJobData, 'type'>): Promise<string> => {
  const queue = getImageProcessingQueue();
  const job = await queue.add(
    { ...data, type: 'optimize' },
    {
      attempts: 3,
      backoff: { type: 'exponential', delay: 1000 },
      removeOnComplete: true,
    }
  );
  return job.id.toString();
};

/**
 * Add a generate AI image job to the queue
 * @param data Generate AI image job data
 * @returns Job ID
 */
export const addGenerateAIImageJob = async (data: Omit<GenerateAIImageJobData, 'type'>): Promise<string> => {
  const queue = getImageProcessingQueue();
  const job = await queue.add(
    { ...data, type: 'generate-ai' },
    {
      attempts: 3,
      backoff: { type: 'exponential', delay: 1000 },
      removeOnComplete: true,
    }
  );
  return job.id.toString();
};

/**
 * Add a watermark image job to the queue
 * @param data Watermark image job data
 * @returns Job ID
 */
export const addWatermarkImageJob = async (data: Omit<WatermarkImageJobData, 'type'>): Promise<string> => {
  const queue = getImageProcessingQueue();
  const job = await queue.add(
    { ...data, type: 'watermark' },
    {
      attempts: 3,
      backoff: { type: 'exponential', delay: 1000 },
      removeOnComplete: true,
    }
  );
  return job.id.toString();
};

/**
 * Add a create thumbnail job to the queue
 * @param data Create thumbnail job data
 * @returns Job ID
 */
export const addCreateThumbnailJob = async (data: Omit<CreateThumbnailJobData, 'type'>): Promise<string> => {
  const queue = getImageProcessingQueue();
  const job = await queue.add(
    { ...data, type: 'thumbnail' },
    {
      attempts: 3,
      backoff: { type: 'exponential', delay: 1000 },
      removeOnComplete: true,
    }
  );
  return job.id.toString();
};

/**
 * Add a batch process images job to the queue
 * @param data Batch process images job data
 * @returns Job ID
 */
export const addBatchProcessImagesJob = async (data: Omit<BatchProcessImagesJobData, 'type'>): Promise<string> => {
  const queue = getImageProcessingQueue();
  const job = await queue.add(
    { ...data, type: 'batch' },
    {
      attempts: 3,
      backoff: { type: 'exponential', delay: 1000 },
      removeOnComplete: true,
    }
  );
  return job.id.toString();
};

export default {
  processJob,
  addResizeImageJob,
  addOptimizeImageJob,
  addGenerateAIImageJob,
  addWatermarkImageJob,
  addCreateThumbnailJob,
  addBatchProcessImagesJob,
};