// backend/create-admin.js - Script simples para criar admin
require('dotenv').config();
const mongoose = require('mongoose');

// Schema simples do usuário
const userSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: { type: String, unique: true },
  password: String,
  role: { type: String, default: 'user' },
  verified: { type: Boolean, default: false },
  active: { type: Boolean, default: true },
  company: String,
  position: String,
  bio: String,
  skills: [String],
}, { timestamps: true });

// Hash da senha antes de salvar
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  const bcrypt = require('bcryptjs');
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

const User = mongoose.model('User', userSchema);

async function createAdmin() {
  try {
    console.log('🔗 Conectando ao MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado ao MongoDB');
    
    // Verificar se já existe um admin
    const existingAdmin = await User.findOne({ email: 'admin@example.com' });
    
    if (existingAdmin) {
      console.log('✅ Admin já existe: admin@example.com');
      console.log('🔑 Use a senha: Admin@123');
      process.exit(0);
    }
    
    // Criar admin
    console.log('👤 Criando usuário administrador...');
    const admin = await User.create({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@example.com',
      password: 'Admin@123',
      role: 'admin',
      verified: true,
      active: true,
      company: 'Sistema',
      position: 'Administrador',
      bio: 'Usuário administrador do sistema',
      skills: ['Administração', 'Gestão'],
    });
    
    console.log('✅ Admin criado com sucesso!');
    console.log('📧 Email: admin@example.com');
    console.log('🔑 Senha: Admin@123');
    console.log('⚠️  MUDE A SENHA APÓS O PRIMEIRO LOGIN!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

createAdmin();