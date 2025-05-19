import mongoose, { Document, Schema } from 'mongoose';

export interface IProject extends Document {
  isFiveM: any;
  technologies: never[];
  content: any;
  title: any;
  name: string;
  description: string;
  owner: Schema.Types.ObjectId;
  collaborators: Schema.Types.ObjectId[];
  status: 'draft' | 'in-progress' | 'review' | 'completed' | 'archived';
  startDate?: Date;
  endDate?: Date;
  tags: string[];
  category: string;
  visibility: 'public' | 'private' | 'team';
  files: {
    name: string;
    path: string;
    size: number;
    type: string;
    uploadedAt: Date;
  }[];
  thumbnail?: string;
  aiGenerated: boolean;
  aiPrompt?: string;
  metrics: {
    views: number;
    likes: number;
    downloads: number;
    shares: number;
  };
  lastUpdatedBy: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema = new Schema<IProject>(
  {
    name: {
      type: String,
      required: [true, 'Project name is required'],
      trim: true,
      maxlength: [100, 'Project name cannot exceed 100 characters'],
    },
    description: {
      type: String,
      required: [true, 'Project description is required'],
      maxlength: [5000, 'Description cannot exceed 5000 characters'],
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Project owner is required'],
    },
    collaborators: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    status: {
      type: String,
      enum: ['draft', 'in-progress', 'review', 'completed', 'archived'],
      default: 'draft',
    },
    startDate: {
      type: Date,
    },
    endDate: {
      type: Date,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    category: {
      type: String,
      required: [true, 'Project category is required'],
    },
    visibility: {
      type: String,
      enum: ['public', 'private', 'team'],
      default: 'private',
    },
    files: [
      {
        name: {
          type: String,
          required: true,
        },
        path: {
          type: String,
          required: true,
        },
        size: {
          type: Number,
          required: true,
        },
        type: {
          type: String,
          required: true,
        },
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    thumbnail: {
      type: String,
    },
    aiGenerated: {
      type: Boolean,
      default: false,
    },
    aiPrompt: {
      type: String,
    },
    metrics: {
      views: {
        type: Number,
        default: 0,
      },
      likes: {
        type: Number,
        default: 0,
      },
      downloads: {
        type: Number,
        default: 0,
      },
      shares: {
        type: Number,
        default: 0,
      },
    },
    lastUpdatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes for efficient querying
ProjectSchema.index({ name: 'text', description: 'text' });
ProjectSchema.index({ owner: 1 });
ProjectSchema.index({ collaborators: 1 });
ProjectSchema.index({ status: 1 });
ProjectSchema.index({ category: 1 });
ProjectSchema.index({ tags: 1 });
ProjectSchema.index({ visibility: 1 });
ProjectSchema.index({ createdAt: -1 });

// Virtual for getting the duration of the project in days
ProjectSchema.virtual('duration').get(function () {
  if (!this.startDate || !this.endDate) return null;
  
  const start = new Date(this.startDate);
  const end = new Date(this.endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Method to check if user is owner or collaborator
ProjectSchema.methods.isUserAssociated = function (userId: Schema.Types.ObjectId): boolean {
  const userIdStr = userId.toString();
  return (
    this.owner.toString() === userIdStr ||
    this.collaborators.some((collaboratorId: Schema.Types.ObjectId) => 
      collaboratorId.toString() === userIdStr
    )
  );
};

// Method to add a collaborator
ProjectSchema.methods.addCollaborator = async function (userId: Schema.Types.ObjectId): Promise<void> {
  const userIdStr = userId.toString();
  const exists = this.collaborators.some(
    (collaboratorId: Schema.Types.ObjectId) => collaboratorId.toString() === userIdStr
  );
  
  if (!exists) {
    this.collaborators.push(userId);
    await this.save();
  }
};

// Method to remove a collaborator
ProjectSchema.methods.removeCollaborator = async function (userId: Schema.Types.ObjectId): Promise<void> {
  const userIdStr = userId.toString();
  this.collaborators = this.collaborators.filter(
    (collaboratorId: Schema.Types.ObjectId) => collaboratorId.toString() !== userIdStr
  );
  await this.save();
};

// Pre-save hook to ensure lastUpdatedBy is set
ProjectSchema.pre<IProject>('save', function (next) {
  if (this.isNew && !this.lastUpdatedBy) {
    this.lastUpdatedBy = this.owner;
  }
  next();
});

const Project = mongoose.model<IProject>('Project', ProjectSchema);

export default Project;