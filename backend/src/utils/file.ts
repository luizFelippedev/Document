import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';
import queueImageProcessing from '../jobs';

// Verificar se diretório existe
export const ensureDirectoryExists = (directory: string): void => {
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }
};

// Gerar nome de arquivo único
export const generateUniqueFilename = (originalFilename: string): string => {
  const extension = path.extname(originalFilename);
  return `${uuidv4()}${extension}`;
};

// Salvar arquivo
export const saveFile = (
  buffer: Buffer,
  directory: string,
  filename: string
): string => {
  ensureDirectoryExists(directory);
  const filePath = path.join(directory, filename);
  fs.writeFileSync(filePath, buffer);
  return filePath;
};

// Redimensionar imagem
export const resizeImage = async (
  inputPath: string,
  outputPath: string,
  width: number,
  height: number,
  options: { quality?: number; fit?: keyof sharp.FitEnum } = {}
): Promise<string> => {
  await sharp(inputPath)
    .resize({
      width,
      height,
      fit: options.fit || 'cover',
      position: 'centre',
    })
    .jpeg({ quality: options.quality || 80 })
    .toFile(outputPath);

  return outputPath;
};

// Processar imagem e criar thumbnails
export const processImage = async (
  file: Express.Multer.File,
  directory: string
): Promise<{ original: string; thumbnail: string }> => {
  const filename = generateUniqueFilename(file.originalname);
  const originalPath = path.join(directory, filename);
  const thumbnailPath = path.join(directory, `thumb-${filename}`);

  // Salvar arquivo original
  fs.writeFileSync(originalPath, file.buffer);

  // Enfileirar processamento da imagem
  queueImageProcessing.getImageProcessingQueue().add({
    originalPath,
    thumbnailPath,
    width: 300,
    height: 300,
  });

  // Retornar caminhos relativos (para uso em URLs)
  return {
    original: path.relative(path.join(__dirname, '../..'), originalPath),
    thumbnail: path.relative(path.join(__dirname, '../..'), thumbnailPath),
  };
};

// Excluir arquivo
export const deleteFile = (filePath: string): boolean => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`Erro ao excluir arquivo: ${error}`);
    return false;
  }
};