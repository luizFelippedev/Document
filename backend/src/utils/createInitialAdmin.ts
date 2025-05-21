// src/utils/createInitialAdmin.ts
import User from '../api/models/user.model';

export const createInitialAdmin = async (): Promise<void> => {
  try {
    console.log('Verificando existência de usuário admin...');
    const userCount = await User.countDocuments();
    console.log(`Encontrados ${userCount} usuários no banco de dados`);
    
    if (userCount === 0) {
      console.log('Criando usuário admin padrão...');
      
      const adminData = {
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@example.com',
        password: 'Admin@123', 
        role: 'admin',
        verified: true,
        company: 'Sistema',
        position: 'Administrador',
        bio: 'Usuário administrador padrão',
        skills: ['Admin'],
        active: true
      };
      
      const admin = await User.create(adminData);
      console.log(`Usuário admin criado com sucesso: ${admin.email}`);
      console.log('IMPORTANTE: Use admin@example.com / Admin@123 para login');
    } else {
      console.log('Usuários já existem, pulando criação de admin');
    }
  } catch (error) {
    console.error(`ERRO ao criar usuário admin: ${error}`);
  }
};