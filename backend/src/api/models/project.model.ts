import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IProjectFile {
  name: string;
  path: string;
  size: number;
  type: string;
  uploadedAt: Date;
  description?: string;
}

export interface IProjectMetrics {
  views: number;
  likes: number;
  downloads: number;
  shares: number;
  comments: number;
}

export interface IProject extends Document {
  name: string;
  description: string;
  title?: string; // Para compatibilidade com análise AI
  content?: string; // Conteúdo adicional
  technologies: string[]; // Lista de tecnologias
  isFiveM: boolean; // Flag para projetos FiveM
  owner: Schema.Types.ObjectId;
  collaborators: Schema.Types.ObjectId[];
  status: 'draft' | 'in-progress' | 'review' | 'completed' | 'archived' | 'cancelled';
  startDate?: Date;
  endDate?: Date;
  tags: string[];
  category: string;
  visibility: 'public' | 'private' | 'team';
  files: IProjectFile[];
  thumbnail?: string;
  aiGenerated: boolean;
  aiPrompt?: string;
  metrics: IProjectMetrics;
  lastUpdatedBy: Schema.Types.ObjectId;
  featured: boolean; // Projeto em destaque
  repository?: string; // Link do repositório
  liveDemo?: string; // Link da demo
  createdAt: Date;
  updatedAt: Date;
  
  // Métodos
  isUserAssociated(userId: Schema.Types.ObjectId): boolean;
  addCollaborator(userId: Schema.Types.ObjectId): Promise<void>;
  removeCollaborator(userId: Schema.Types.ObjectId): Promise<void>;
  incrementMetric(metric: keyof IProjectMetrics): Promise<void>;
  canUserAccess(userId: Schema.Types.ObjectId, userRole: string): boolean;
}

interface IProjectModel extends Model<IProject> {
  findPublicProjects(): Promise<IProject[]>;
  findByTechnology(tech: string): Promise<IProject[]>;
  findFeatured(): Promise<IProject[]>;
}

const ProjectFileSchema = new Schema<IProjectFile>({
  name: {
    type: String,
    required: [true, 'Nome do arquivo é obrigatório'],
    trim: true,
    maxlength: [255, 'Nome do arquivo muito longo']
  },
  path: {
    type: String,
    required: [true, 'Caminho do arquivo é obrigatório'],
  },
  size: {
    type: Number,
    required: [true, 'Tamanho do arquivo é obrigatório'],
    min: [0, 'Tamanho inválido'],
    max: [100 * 1024 * 1024, 'Arquivo muito grande (max 100MB)']
  },
  type: {
    type: String,
    required: [true, 'Tipo do arquivo é obrigatório'],
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
  description: {
    type: String,
    maxlength: [200, 'Descrição muito longa']
  }
});

const ProjectMetricsSchema = new Schema<IProjectMetrics>({
  views: { type: Number, default: 0, min: 0 },
  likes: { type: Number, default: 0, min: 0 },
  downloads: { type: Number, default: 0, min: 0 },
  shares: { type: Number, default: 0, min: 0 },
  comments: { type: Number, default: 0, min: 0 },
});

const ProjectSchema = new Schema<IProject>(
  {
    name: {
      type: String,
      required: [true, 'Nome do projeto é obrigatório'],
      trim: true,
      minlength: [3, 'Nome deve ter pelo menos 3 caracteres'],
      maxlength: [100, 'Nome não pode exceder 100 caracteres'],
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Descrição é obrigatória'],
      minlength: [10, 'Descrição deve ter pelo menos 10 caracteres'],
      maxlength: [5000, 'Descrição não pode exceder 5000 caracteres'],
    },
    title: {
      type: String,
      trim: true,
      maxlength: [200, 'Título não pode exceder 200 caracteres'],
    },
    content: {
      type: String,
      maxlength: [20000, 'Conteúdo não pode exceder 20000 caracteres'],
    },
    technologies: [{
      type: String,
      trim: true,
      maxlength: [50, 'Nome da tecnologia muito longo'],
      validate: {
        validator: function(tech: string) {
          return /^[a-zA-Z0-9\s\-\.#\+]+$/.test(tech);
        },
        message: 'Tecnologia contém caracteres inválidos'
      }
    }],
    isFiveM: {
      type: Boolean,
      default: false,
      index: true,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Proprietário é obrigatório'],
      index: true,
    },
    collaborators: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
    }],
    status: {
      type: String,
      enum: {
        values: ['draft', 'in-progress', 'review', 'completed', 'archived', 'cancelled'],
        message: 'Status inválido'
      },
      default: 'draft',
      index: true,
    },
    startDate: {
      type: Date,
      validate: {
        validator: function(date: Date) {
          return !date || date <= new Date();
        },
        message: 'Data de início não pode ser no futuro'
      }
    },
    endDate: {
      type: Date,
      validate: {
        validator: function(this: IProject, date: Date) {
          return !date || !this.startDate || date >= this.startDate;
        },
        message: 'Data de fim deve ser posterior à data de início'
      }
    },
    tags: [{
      type: String,
      trim: true,
      maxlength: [30, 'Tag muito longa'],
      lowercase: true,
    }],
    category: {
      type: String,
      required: [true, 'Categoria é obrigatória'],
      trim: true,
      maxlength: [50, 'Categoria muito longa'],
      index: true,
    },
    visibility: {
      type: String,
      enum: {
        values: ['public', 'private', 'team'],
        message: 'Visibilidade inválida'
      },
      default: 'private',
      index: true,
    },
    files: [ProjectFileSchema],
    thumbnail: {
      type: String,
      validate: {
        validator: function(v: string) {
          if (!v) return true;
          return /^(uploads\/|https?:\/\/)/.test(v);
        },
        message: 'Thumbnail deve ser um caminho válido'
      }
    },
    aiGenerated: {
      type: Boolean,
      default: false,
    },
    aiPrompt: {
      type: String,
      maxlength: [1000, 'Prompt AI muito longo'],
    },
    metrics: {
      type: ProjectMetricsSchema,
      default: () => ({ views: 0, likes: 0, downloads: 0, shares: 0, comments: 0 })
    },
    lastUpdatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    featured: {
      type: Boolean,
      default: false,
      index: true,
    },
    repository: {
      type: String,
      validate: {
        validator: function(url: string) {
          if (!url) return true;
          return /^https?:\/\/.+/.test(url);
        },
        message: 'URL do repositório inválida'
      }
    },
    liveDemo: {
      type: String,
      validate: {
        validator: function(url: string) {
          if (!url) return true;
          return /^https?:\/\/.+/.test(url);
        },
        message: 'URL da demo inválida'
      }
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Índices compostos
ProjectSchema.index({ name: 'text', description: 'text', tags: 'text' });
ProjectSchema.index({ owner: 1, status: 1 });
ProjectSchema.index({ visibility: 1, featured: 1 });
ProjectSchema.index({ category: 1, visibility: 1 });
ProjectSchema.index({ technologies: 1 });
ProjectSchema.index({ tags: 1 });
ProjectSchema.index({ createdAt: -1 });
ProjectSchema.index({ 'metrics.views': -1 });
ProjectSchema.index({ 'metrics.likes': -1 });

// Virtual para duração do projeto
ProjectSchema.virtual('duration').get(function () {
  if (!this.startDate || !this.endDate) return null;
  
  const start = new Date(this.startDate);
  const end = new Date(this.endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual para total de arquivos
ProjectSchema.virtual('fileCount').get(function () {
  return this.files.length;
});

// Virtual para tamanho total dos arquivos
ProjectSchema.virtual('totalSize').get(function () {
  return this.files.reduce((total, file) => total + file.size, 0);
});

// Middleware pre-save
ProjectSchema.pre<IProject>('save', function (next) {
  // Definir lastUpdatedBy se não foi definido
  if (this.isNew && !this.lastUpdatedBy) {
    this.lastUpdatedBy = this.owner;
  }
  
  // Limitar número de tags
  if (this.tags.length > 10) {
    this.tags = this.tags.slice(0, 10);
  }
  
  // Limitar número de tecnologias
  if (this.technologies.length > 15) {
    this.technologies = this.technologies.slice(0, 15);
  }
  
  // Remover duplicatas
  this.tags = [...new Set(this.tags)];
  this.technologies = [...new Set(this.technologies)];
  
  next();
});

// Verificar se usuário está associado ao projeto
ProjectSchema.methods.isUserAssociated = function (userId: Schema.Types.ObjectId): boolean {
  const userIdStr = userId.toString();
  return (
    this.owner.toString() === userIdStr ||
    this.collaborators.some((collaboratorId: Schema.Types.ObjectId) => 
      collaboratorId.toString() === userIdStr
    )
  );
};

// Adicionar colaborador
ProjectSchema.methods.addCollaborator = async function (userId: Schema.Types.ObjectId): Promise<void> {
  const userIdStr = userId.toString();
  const exists = this.collaborators.some(
    (collaboratorId: Schema.Types.ObjectId) => collaboratorId.toString() === userIdStr
  );
  
  if (!exists && this.owner.toString() !== userIdStr) {
    this.collaborators.push(userId);
    this.lastUpdatedBy = userId;
    await this.save();
  }
};

// Remover colaborador
ProjectSchema.methods.removeCollaborator = async function (userId: Schema.Types.ObjectId): Promise<void> {
  const userIdStr = userId.toString();
  const initialLength = this.collaborators.length;
  
  this.collaborators = this.collaborators.filter(
    (collaboratorId: Schema.Types.ObjectId) => collaboratorId.toString() !== userIdStr
  );
  
  if (this.collaborators.length !== initialLength) {
    await this.save();
  }
};

// Incrementar métrica
ProjectSchema.methods.incrementMetric = async function (metric: keyof IProjectMetrics): Promise<void> {
  if (this.metrics[metric] !== undefined) {
    this.metrics[metric] += 1;
    await this.save();
  }
};

// Verificar se usuário pode acessar
ProjectSchema.methods.canUserAccess = function (userId: Schema.Types.ObjectId, userRole: string): boolean {
  // Admin sempre tem acesso
  if (userRole === 'admin') return true;
  
  // Projetos públicos todos podem ver
  if (this.visibility === 'public') return true;
  
  // Proprietário e colaboradores sempre têm acesso
  if (this.isUserAssociated(userId)) return true;
  
  return false;
};

// Métodos estáticos
ProjectSchema.statics.findPublicProjects = function() {
  return this.find({ visibility: 'public' }).populate('owner', 'firstName lastName avatar');
};

ProjectSchema.statics.findByTechnology = function(tech: string) {
  return this.find({ technologies: { $in: [new RegExp(tech, 'i')] } });
};

ProjectSchema.statics.findFeatured = function() {
  return this.find({ featured: true, visibility: 'public' })
    .sort({ 'metrics.views': -1 })
    .limit(10);
};

const Project = mongoose.model<IProject, IProjectModel>('Project', ProjectSchema);

export default Project;