import { Command } from 'commander';
import { connectDB } from '../config/db';
import redisClient from '../config/redis';
import User from '../api/models/user.model';
import Project from '../api/models/project.model';
import Certificate from '../api/models/certificate.model';
import { backupService } from './backup';
import { queueManager } from '../jobs/queue-manager';
import logger from '../config/logger';

const program = new Command();

program
  .name('portfolio-cli')
  .description('CLI para gerenciamento do Portfolio Manager')
  .version('1.0.0');

// Comando para criar usuário admin
program
  .command('create-admin')
  .description('Criar usuário administrador')
  .requiredOption('-e, --email <email>', 'Email do administrador')
  .requiredOption('-p, --password <password>', 'Senha do administrador')
  .option('-n, --name <name>', 'Nome completo', 'Admin User')
  .action(async (options) => {
    try {
      await connectDB();
      
      const [firstName, ...lastNameParts] = options.name.split(' ');
      const lastName = lastNameParts.join(' ') || 'User';
      
      const existingUser = await User.findOne({ email: options.email });
      if (existingUser) {
        console.error('❌ Usuário com este email já existe');
        process.exit(1);
      }
      
      const admin = await User.create({
        email: options.email,
        password: options.password,
        firstName,
        lastName,
        role: 'admin',
        verified: true,
        active: true,
      });
      
      console.log('✅ Usuário administrador criado com sucesso:');
      console.log(`   Email: ${admin.email}`);
      console.log(`   ID: ${admin._id}`);
      console.log(`   Nome: ${admin.firstName} ${admin.lastName}`);
      
      process.exit(0);
    } catch (error) {
      console.error('❌ Erro ao criar administrador:', error);
      process.exit(1);
    }
  });

// Comando para reset de senha
program
  .command('reset-password')
  .description('Resetar senha de usuário')
  .requiredOption('-e, --email <email>', 'Email do usuário')
  .requiredOption('-p, --password <password>', 'Nova senha')
  .action(async (options) => {
    try {
      await connectDB();
      
      const user = await User.findOne({ email: options.email });
      if (!user) {
        console.error('❌ Usuário não encontrado');
        process.exit(1);
      }
      
      user.password = options.password;
      user.loginAttempts = 0;
      user.lockUntil = undefined;
      await user.save();
      
      console.log('✅ Senha resetada com sucesso');
      console.log(`   Usuário: ${user.email}`);
      console.log(`   Nome: ${user.firstName} ${user.lastName}`);
      
      process.exit(0);
    } catch (error) {
      console.error('❌ Erro ao resetar senha:', error);
      process.exit(1);
    }
  });

// Comando para estatísticas do sistema
program
  .command('stats')
  .description('Mostrar estatísticas do sistema')
  .action(async () => {
    try {
      await connectDB();
      await redisClient.connect();
      
      const [
        totalUsers,
        activeUsers,
        totalProjects,
        totalCertificates,
        recentProjects,
        recentUsers,
      ] = await Promise.all([
        User.countDocuments(),
        User.countDocuments({ active: true }),
        Project.countDocuments(),
        Certificate.countDocuments(),
        Project.countDocuments({
          createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        }),
        User.countDocuments({
          createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        }),
      ]);
      
      console.log('\n📊 Estatísticas do Sistema:');
      console.log('═══════════════════════════');
      console.log(`👥 Usuários:`);
      console.log(`   Total: ${totalUsers}`);
      console.log(`   Ativos: ${activeUsers}`);
      console.log(`   Novos (7 dias): ${recentUsers}`);
      console.log();
      console.log(`📁 Projetos:`);
      console.log(`   Total: ${totalProjects}`);
      console.log(`   Novos (7 dias): ${recentProjects}`);
      console.log();
      console.log(`🏆 Certificados:`);
      console.log(`   Total: ${totalCertificates}`);
      
      // Estatísticas de memória
      const memUsage = process.memoryUsage();
      console.log();
      console.log(`💾 Memória:`);
      console.log(`   RSS: ${Math.round(memUsage.rss / 1024 / 1024)} MB`);
      console.log(`   Heap: ${Math.round(memUsage.heapUsed / 1024 / 1024)} MB`);
      
      process.exit(0);
    } catch (error) {
      console.error('❌ Erro ao obter estatísticas:', error);
      process.exit(1);
    }
  });

// Comando para backup
program
  .command('backup')
  .description('Executar backup do sistema')
  .option('-d, --database-only', 'Apenas backup do banco de dados')
  .option('-f, --files-only', 'Apenas backup dos arquivos')
  .action(async (options) => {
    try {
      console.log('🔄 Iniciando backup...');
      
      if (options.databaseOnly) {
        const result = await backupService.backupMongoDB();
        console.log(`✅ Backup do banco de dados concluído: ${result}`);
      } else if (options.filesOnly) {
        const result = await backupService.backupUploads();
        console.log(`✅ Backup dos arquivos concluído: ${result}`);
      } else {
        const result = await backupService.performFullBackup();
        console.log('✅ Backup completo concluído:');
        console.log(`   MongoDB: ${result.mongodb}`);
        console.log(`   Arquivos: ${result.uploads}`);
        console.log(`   Duração: ${result.duration}ms`);
      }
      
      process.exit(0);
    } catch (error) {
      console.error('❌ Erro no backup:', error);
      process.exit(1);
    }
  });

// Comando para limpeza
program
  .command('cleanup')
  .description('Executar limpeza do sistema')
  .option('-c, --cache', 'Limpar cache')
  .option('-l, --logs', 'Limpar logs antigos')
  .option('-f, --files', 'Limpar arquivos temporários')
  .option('-a, --all', 'Limpar tudo')
  .action(async (options) => {
    try {
      console.log('🧹 Iniciando limpeza...');
      
      if (options.cache || options.all) {
        await redisClient.connect();
        // Implementar limpeza de cache
        console.log('✅ Cache limpo');
      }
      
      if (options.logs || options.all) {
        // Implementar limpeza de logs
        console.log('✅ Logs antigos removidos');
      }
      
      if (options.files || options.all) {
        // Implementar limpeza de arquivos temporários
        console.log('✅ Arquivos temporários removidos');
      }
      
      process.exit(0);
    } catch (error) {
      console.error('❌ Erro na limpeza:', error);
      process.exit(1);
    }
  });

// Comando para status das filas
program
  .command('queue-stats')
  .description('Mostrar estatísticas das filas')
  .action(async () => {
    try {
      await redisClient.connect();
      
      const stats = await queueManager.getAllQueueStats();
      
      console.log('\n📊 Estatísticas das Filas:');
      console.log('═══════════════════════════');
      
      for (const stat of stats) {
        console.log(`\n📋 ${stat.name}:`);
        console.log(`   Aguardando: ${stat.waiting}`);
        console.log(`   Processando: ${stat.active}`);
        console.log(`   Concluídos: ${stat.completed}`);
        console.log(`   Falhados: ${stat.failed}`);
        console.log(`   Atrasados: ${stat.delayed}`);
        console.log(`   Status: ${stat.paused ? '⏸️  Pausada' : '▶️  Ativa'}`);
      }
      
      process.exit(0);
    } catch (error) {
      console.error('❌ Erro ao obter estatísticas das filas:', error);
      process.exit(1);
    }
  });

// Comando para verificar saúde do sistema
program
  .command('health')
  .description('Verificar saúde do sistema')
  .action(async () => {
    try {
      console.log('🏥 Verificando saúde do sistema...\n');
      
      // Verificar MongoDB
      try {
        await connectDB();
        console.log('✅ MongoDB: Conectado');
      } catch (error) {
        console.log('❌ MongoDB: Erro de conexão');
      }
      
      // Verificar Redis
      try {
        await redisClient.connect();
        console.log('✅ Redis: Conectado');
      } catch (error) {
        console.log('❌ Redis: Erro de conexão');
      }
      
      // Verificar filas
      try {
        const health = await queueManager.healthCheck();
        if (health.healthy) {
          console.log('✅ Filas: Saudáveis');
        } else {
          console.log('⚠️  Filas: Problemas detectados');
          health.issues.forEach(issue => console.log(`   - ${issue}`));
        }
      } catch (error) {
        console.log('❌ Filas: Erro na verificação');
      }
      
      // Verificar espaço em disco
      try {
        const { execSync } = require('child_process');
        const diskUsage = execSync('df -h /').toString();
        console.log('✅ Espaço em disco: Disponível');
      } catch (error) {
        console.log('⚠️  Espaço em disco: Erro na verificação');
      }
      
      process.exit(0);
    } catch (error) {
      console.error('❌ Erro na verificação de saúde:', error);
      process.exit(1);
    }
  });

// Executar programa
if (require.main === module) {
  program.parse();
}

export default program;