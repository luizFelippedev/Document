import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { createGzip } from 'zlib';
import { pipeline } from 'stream';
import logger from '../config/logger';
import { cacheSet } from '../config/redis';

const execAsync = promisify(exec);
const pipelineAsync = promisify(pipeline);

interface BackupConfig {
  mongoUri: string;
  backupPath: string;
  retentionDays: number;
  compressionLevel: number;
}

class BackupService {
  private config: BackupConfig;
  
  constructor(config: BackupConfig) {
    this.config = config;
    this.ensureBackupDirectory();
  }
  
  private ensureBackupDirectory(): void {
    if (!fs.existsSync(this.config.backupPath)) {
      fs.mkdirSync(this.config.backupPath, { recursive: true });
    }
  }
  
  // Backup do MongoDB
  async backupMongoDB(): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupName = `mongodb-backup-${timestamp}`;
    const backupDir = path.join(this.config.backupPath, backupName);
    
    try {
      logger.info(`Iniciando backup do MongoDB: ${backupName}`);
      
      // Executar mongodump
      const command = `mongodump --uri="${this.config.mongoUri}" --out="${backupDir}"`;
      await execAsync(command);
      
      // Comprimir backup
      const archivePath = await this.compressBackup(backupDir, `${backupName}.tar.gz`);
      
      // Remover diretório não comprimido
      await execAsync(`rm -rf "${backupDir}"`);
      
      logger.info(`Backup do MongoDB concluído: ${archivePath}`);
      return archivePath;
    } catch (error) {
      logger.error(`Erro no backup do MongoDB: ${error}`);
      throw error;
    }
  }
  
  // Backup dos arquivos de upload
  async backupUploads(): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupName = `uploads-backup-${timestamp}.tar.gz`;
    const backupPath = path.join(this.config.backupPath, backupName);
    const uploadsPath = path.join(process.cwd(), 'uploads');
    
    try {
      logger.info(`Iniciando backup dos uploads: ${backupName}`);
      
      if (!fs.existsSync(uploadsPath)) {
        logger.warn('Diretório de uploads não encontrado');
        return '';
      }
      
      // Criar arquivo tar comprimido
      const command = `tar -czf "${backupPath}" -C "${uploadsPath}" .`;
      await execAsync(command);
      
      logger.info(`Backup dos uploads concluído: ${backupPath}`);
      return backupPath;
    } catch (error) {
      logger.error(`Erro no backup dos uploads: ${error}`);
      throw error;
    }
  }
  
  // Comprimir backup
  private async compressBackup(sourceDir: string, archiveName: string): Promise<string> {
    const archivePath = path.join(this.config.backupPath, archiveName);
    
    const command = `tar -czf "${archivePath}" -C "${path.dirname(sourceDir)}" "${path.basename(sourceDir)}"`;
    await execAsync(command);
    
    return archivePath;
  }
  
  // Limpeza de backups antigos
  async cleanOldBackups(): Promise<void> {
    try {
      const files = fs.readdirSync(this.config.backupPath);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.config.retentionDays);
      
      for (const file of files) {
        const filePath = path.join(this.config.backupPath, file);
        const stats = fs.statSync(filePath);
        
        if (stats.mtime < cutoffDate) {
          fs.unlinkSync(filePath);
          logger.info(`Backup antigo removido: ${file}`);
        }
      }
    } catch (error) {
      logger.error(`Erro na limpeza de backups antigos: ${error}`);
    }
  }
  
  // Backup completo
  async performFullBackup(): Promise<{
    mongodb: string;
    uploads: string;
    timestamp: Date;
  }> {
    const startTime = Date.now();
    
    try {
      logger.info('Iniciando backup completo...');
      
      const [mongoBackup, uploadsBackup] = await Promise.all([
        this.backupMongoDB(),
        this.backupUploads(),
      ]);
      
      // Limpeza de backups antigos
      await this.cleanOldBackups();
      
      const duration = Date.now() - startTime;
      const result = {
        mongodb: mongoBackup,
        uploads: uploadsBackup,
        timestamp: new Date(),
        duration,
      };
      
      // Salvar status do backup no Redis
      await cacheSet('backup:last-status', result, 24 * 3600);
      
      logger.info(`Backup completo concluído em ${duration}ms`);
      return result;
    } catch (error) {
      logger.error(`Erro no backup completo: ${error}`);
      throw error;
    }
  }
  
  // Agendar backups automáticos
  scheduleBackups(): void {
    // Backup diário às 2:00 AM
    const scheduleBackup = () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(2, 0, 0, 0);
      
      const timeout = tomorrow.getTime() - now.getTime();
      
      setTimeout(async () => {
        try {
          await this.performFullBackup();
        } catch (error) {
          logger.error(`Erro no backup agendado: ${error}`);
        }
        
        // Agendar próximo backup
        scheduleBackup();
      }, timeout);
    };
    
    scheduleBackup();
    logger.info('Backup automático agendado para execução diária às 2:00 AM');
  }
  
  // Restaurar backup do MongoDB
  async restoreMongoDB(backupPath: string): Promise<void> {
    try {
      logger.info(`Iniciando restauração do MongoDB: ${backupPath}`);
      
      // Extrair backup
      const extractDir = path.join(this.config.backupPath, 'temp-restore');
      await execAsync(`tar -xzf "${backupPath}" -C "${path.dirname(extractDir)}"`);
      
      // Executar mongorestore
      const command = `mongorestore --uri="${this.config.mongoUri}" --drop "${extractDir}"`;
      await execAsync(command);
      
      // Limpar diretório temporário
      await execAsync(`rm -rf "${extractDir}"`);
      
      logger.info('Restauração do MongoDB concluída');
    } catch (error) {
      logger.error(`Erro na restauração do MongoDB: ${error}`);
      throw error;
    }
  }
}

// Configuração padrão
const defaultConfig: BackupConfig = {
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/portfolio',
  backupPath: path.join(process.cwd(), 'backups'),
  retentionDays: 30,
  compressionLevel: 6,
};

export const backupService = new BackupService(defaultConfig);

// Script para execução direta
if (require.main === module) {
  (async () => {
    try {
      await backupService.performFullBackup();
      process.exit(0);
    } catch (error) {
      console.error('Erro no backup:', error);
      process.exit(1);
    }
  })();
}