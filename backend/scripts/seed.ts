// backend/scripts/seed.ts - CORRIGIDO
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { faker } from '@faker-js/faker';

// Load environment variables
dotenv.config();

// ✅ IMPORTS CORRIGIDOS
import User from '../src/api/models/user.model';
import Project from '../src/api/models/project.model';
import Certificate from '../src/api/models/certificate.model';
import Notification from '../src/api/models/notification.model';

// Create necessary directories
const createDirectories = () => {
  const directories = [
    'uploads',
    'uploads/projects',
    'uploads/certificates',
    'uploads/certificates/images',
    'uploads/certificates/files',
    'uploads/users',
    'logs',
  ];

  directories.forEach(dir => {
    const dirPath = path.join(process.cwd(), dir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      console.log(`Created directory: ${dirPath}`);
    }
  });
};

// Connect to MongoDB
const connectDB = async (): Promise<void> => {
  try {
    const mongoURI = process.env.MONGODB_URI;
    
    if (!mongoURI) {
      console.error('MONGODB_URI environment variable is not defined');
      process.exit(1);
    }

    await mongoose.connect(mongoURI);
    console.log('MongoDB connected');
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error}`);
    process.exit(1);
  }
};

// Clear database
const clearDatabase = async (): Promise<void> => {
  if (process.env.NODE_ENV === 'production') {
    console.error('Cannot run seed script in production environment');
    process.exit(1);
  }
  
  try {
    await mongoose.connection.dropDatabase();
    console.log('Database cleared');
  } catch (error) {
    console.error(`Error clearing database: ${error}`);
    process.exit(1);
  }
};

// Define user interface
interface IUserSeed {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: string;
  verified: boolean;
  active: boolean;
  skills: string[];
  company: string;
  position: string;
  bio: string;
}

// Define project interface
interface IProjectSeed {
  name: string;
  description: string;
  owner: mongoose.Types.ObjectId;
  collaborators: mongoose.Types.ObjectId[];
  status: string;
  startDate: Date;
  endDate?: Date | null;
  tags: string[];
  category: string;
  visibility: string;
  aiGenerated: boolean;
  aiPrompt?: string;
  metrics: {
    views: number;
    likes: number;
    downloads: number;
    shares: number;
  };
  lastUpdatedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// Define certificate interface
interface ICertificateSeed {
  title: string;
  description: string;
  recipient: mongoose.Types.ObjectId;
  issuer: mongoose.Types.ObjectId;
  project?: mongoose.Types.ObjectId;
  issueDate: Date;
  expiryDate?: Date;
  certificateNumber: string;
  status: string;
  skillsValidated: string[];
  verificationCode: string;
  verificationUrl: string;
  createdAt: Date;
  updatedAt: Date;
}

// Define notification interface
interface INotificationSeed {
  recipient: mongoose.Types.ObjectId;
  sender?: mongoose.Types.ObjectId;
  type: string;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  readAt?: Date;
  entity?: {
    type: string;
    id: mongoose.Types.ObjectId;
  };
  priority: string;
  createdAt: Date;
  updatedAt: Date;
}

// Seed users
const seedUsers = async (): Promise<mongoose.Types.ObjectId[]> => {
  try {
    // Create admin user
    const hashedPasswordAdmin = await bcrypt.hash('Admin123!', 12);
    const admin = await User.create({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@example.com',
      password: hashedPasswordAdmin,
      role: 'admin',
      verified: true,
      active: true,
      skills: ['project management', 'leadership', 'strategy'],
      company: 'Admin Co',
      position: 'Administrator',
      bio: 'System administrator with full access to all features.',
    });
    
    // Create manager user
    const hashedPasswordManager = await bcrypt.hash('Manager123!', 12);
    const manager = await User.create({
      firstName: 'Manager',
      lastName: 'User',
      email: 'manager@example.com',
      password: hashedPasswordManager,
      role: 'manager',
      verified: true,
      active: true,
      skills: ['team management', 'planning', 'certification'],
      company: 'Manager Co',
      position: 'Project Manager',
      bio: 'Project manager who can issue certificates and manage teams.',
    });
    
    // Create regular user
    const hashedPasswordUser = await bcrypt.hash('User123!', 12);
    const regularUser = await User.create({
      firstName: 'Regular',
      lastName: 'User',
      email: 'user@example.com',
      password: hashedPasswordUser,
      role: 'user',
      verified: true,
      active: true,
      skills: ['development', 'design', 'testing'],
      company: 'User Co',
      position: 'Developer',
      bio: 'Regular user with standard permissions.',
    });
    
    // Create additional random users
    const userIds = [admin._id, manager._id, regularUser._id];
    const randomUsers: IUserSeed[] = [];
    
    for (let i = 0; i < 10; i++) {
      const firstName = faker.person.firstName();
      const lastName = faker.person.lastName();
      const hashedPassword = await bcrypt.hash('Password123!', 12);
      
      const user: IUserSeed = {
        firstName,
        lastName,
        email: faker.internet.email({ firstName, lastName }).toLowerCase(),
        password: hashedPassword,
        role: 'user',
        verified: faker.datatype.boolean(0.8), // 80% are verified
        active: true,
        skills: Array.from({ length: faker.number.int({ min: 1, max: 5 }) }, () => 
          faker.word.sample()
        ),
        company: faker.company.name(),
        position: faker.person.jobTitle(),
        bio: faker.lorem.paragraph(),
      };
      
      randomUsers.push(user);
    }
    
    if (randomUsers.length > 0) {
      const createdUsers = await User.insertMany(randomUsers);
      userIds.push(...createdUsers.map(user => user._id));
    }
    
    console.log(`Seeded ${userIds.length} users`);
    return userIds;
  } catch (error: any) {
    console.error(`Error seeding users: ${error}`);
    process.exit(1);
  }
};

// Seed projects
const seedProjects = async (userIds: mongoose.Types.ObjectId[]): Promise<mongoose.Types.ObjectId[]> => {
  try {
    const projectIds: mongoose.Types.ObjectId[] = [];
    const projects: IProjectSeed[] = [];
    
    const categories = [
      'Web Development', 
      'Mobile App', 
      'Data Science', 
      'UI/UX Design',
      'DevOps', 
      'Blockchain', 
      'AI/ML', 
      'IoT',
      'Game Development',
      'Cloud Computing'
    ];
    
    const statuses = ['draft', 'in-progress', 'review', 'completed', 'archived'];
    const visibilities = ['public', 'private', 'team'];
    
    // Create 20 random projects
    for (let i = 0; i < 20; i++) {
      const ownerId = userIds[faker.number.int({ min: 0, max: userIds.length - 1 })];
      
      // Get 0-3 random collaborators (excluding owner)
      const collaboratorCount = faker.number.int({ min: 0, max: 3 });
      const collaborators: mongoose.Types.ObjectId[] = [];
      
      for (let j = 0; j < collaboratorCount; j++) {
        const randomUserId = userIds[faker.number.int({ min: 0, max: userIds.length - 1 })];
        
        // Ensure collaborator isn't the owner and isn't already a collaborator
        if (!randomUserId.equals(ownerId) && !collaborators.some(id => id.equals(randomUserId))) {
          collaborators.push(randomUserId);
        }
      }
      
      const startDate = faker.date.past({ years: 1 });
      let endDate: Date | null = null;
      
      // 70% of projects have an end date
      if (faker.datatype.boolean(0.7)) {
        endDate = faker.date.between({ from: startDate, to: faker.date.future({ years: 1, refDate: startDate }) });
      }
      
      const project: IProjectSeed = {
        name: faker.lorem.words({ min: 2, max: 5 }),
        description: faker.lorem.paragraphs({ min: 1, max: 3 }),
        owner: ownerId,
        collaborators,
        status: faker.helpers.arrayElement(statuses),
        startDate,
        endDate,
        tags: Array.from({ length: faker.number.int({ min: 1, max: 5 }) }, () => 
          faker.lorem.word()
        ),
        category: faker.helpers.arrayElement(categories),
        visibility: faker.helpers.arrayElement(visibilities),
        aiGenerated: faker.datatype.boolean(0.3), // 30% are AI generated
        aiPrompt: faker.datatype.boolean(0.3) ? faker.lorem.sentence() : undefined,
        metrics: {
          views: faker.number.int({ min: 0, max: 1000 }),
          likes: faker.number.int({ min: 0, max: 200 }),
          downloads: faker.number.int({ min: 0, max: 500 }),
          shares: faker.number.int({ min: 0, max: 100 }),
        },
        lastUpdatedBy: faker.datatype.boolean(0.8) ? ownerId : 
          (collaborators.length > 0 ? 
            collaborators[faker.number.int({ min: 0, max: collaborators.length - 1 })] : 
            ownerId
          ),
        createdAt: startDate,
        updatedAt: faker.date.between({ from: startDate, to: new Date() }),
      };
      
      projects.push(project);
    }
    
    if (projects.length > 0) {
      const createdProjects = await Project.insertMany(projects);
      projectIds.push(...createdProjects.map(project => project._id));
    }
    
    console.log(`Seeded ${projectIds.length} projects`);
    return projectIds;
  } catch (error: any) {
    console.error(`Error seeding projects: ${error}`);
    process.exit(1);
  }
};

// Seed certificates
const seedCertificates = async (
  userIds: mongoose.Types.ObjectId[],
  projectIds: mongoose.Types.ObjectId[]
): Promise<mongoose.Types.ObjectId[]> => {
  try {
    const certificateIds: mongoose.Types.ObjectId[] = [];
    const certificates: ICertificateSeed[] = [];
    
    // Get manager and admin users
    const managementUsers = await User.find({ 
      role: { $in: ['admin', 'manager'] }, 
      _id: { $in: userIds } 
    }).select('_id');
    
    if (managementUsers.length === 0) {
      console.log('No managers or admins found for issuing certificates');
      return [];
    }
    
    const issuerIds = managementUsers.map(user => user._id);
    
    // Create 15 random certificates
    for (let i = 0; i < 15; i++) {
      // Randomly select an issuer
      const issuerId = issuerIds[faker.number.int({ min: 0, max: issuerIds.length - 1 })];
      
      // Randomly select a recipient (excluding issuers)
      const recipients = userIds.filter(id => 
        !issuerIds.some(issuerId => issuerId.equals(id))
      );
      
      if (recipients.length === 0) {
        continue;
      }
      
      const recipientId = recipients[faker.number.int({ min: 0, max: recipients.length - 1 })];
      
      // Randomly associate with a project (optional)
      let projectId: mongoose.Types.ObjectId | undefined = undefined;
      if (faker.datatype.boolean(0.6)) { // 60% are associated with a project
        projectId = projectIds[faker.number.int({ min: 0, max: projectIds.length - 1 })];
      }
      
      // Generate certificate
      const issueDate = faker.date.past({ years: 1 });
      let expiryDate: Date | undefined = undefined;
      
      // 50% of certificates have an expiry date
      if (faker.datatype.boolean(0.5)) {
        expiryDate = faker.date.future({ years: 2, refDate: issueDate });
      }
      
      // Random verification code and URL
      const verificationCode = faker.string.alphanumeric(16);
      const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify/${verificationCode}`;
      
      // Random certificate number
      const timestamp = faker.date.recent().getTime().toString().substring(4);
      const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      const certificateNumber = `CERT-${timestamp}-${random}`;
      
      const certificate: ICertificateSeed = {
        title: `${faker.word.adjective()} ${faker.word.noun()} Certificate`,
        description: faker.lorem.paragraph(),
        recipient: recipientId,
        issuer: issuerId,
        project: projectId,
        issueDate,
        expiryDate,
        certificateNumber,
        status: faker.helpers.arrayElement(['draft', 'issued', 'revoked', 'expired']),
        skillsValidated: Array.from({ length: faker.number.int({ min: 1, max: 3 }) }, () => 
          faker.word.sample()
        ),
        verificationCode,
        verificationUrl,
        createdAt: issueDate,
        updatedAt: faker.date.between({ from: issueDate, to: new Date() }),
      };
      
      certificates.push(certificate);
    }
    
    if (certificates.length > 0) {
      const createdCertificates = await Certificate.insertMany(certificates);
      certificateIds.push(...createdCertificates.map(cert => cert._id));
    }
    
    console.log(`Seeded ${certificateIds.length} certificates`);
    return certificateIds;
  } catch (error: any) {
    console.error(`Error seeding certificates: ${error}`);
    process.exit(1);
  }
};

// Seed notifications
const seedNotifications = async (
  userIds: mongoose.Types.ObjectId[],
  projectIds: mongoose.Types.ObjectId[],
  certificateIds: mongoose.Types.ObjectId[]
): Promise<void> => {
  try {
    const notifications: INotificationSeed[] = [];
    
    // Create 50 random notifications
    for (let i = 0; i < 50; i++) {
      // Get random recipient
      const recipientId = userIds[faker.number.int({ min: 0, max: userIds.length - 1 })];
      
      // Get random sender (possibly same as recipient for system notifications)
      const senderId = faker.datatype.boolean(0.2) ? // 20% are system notifications with no sender
        undefined : 
        userIds[faker.number.int({ min: 0, max: userIds.length - 1 })];
      
      // Random notification type with appropriate weights
      const type = faker.helpers.weightedArrayElement([
        { value: 'info', weight: 10 },
        { value: 'success', weight: 5 },
        { value: 'warning', weight: 3 },
        { value: 'error', weight: 1 },
        { value: 'system', weight: 3 },
      ]);
      
      // Random entity (project or certificate)
      let entity: { type: string; id: mongoose.Types.ObjectId } | undefined = undefined;
      
      if (faker.datatype.boolean(0.7)) { // 70% have an entity
        if (faker.datatype.boolean(0.7) && projectIds.length > 0) { // 70% are projects
          entity = {
            type: 'project',
            id: projectIds[faker.number.int({ min: 0, max: projectIds.length - 1 })],
          };
        } else if (certificateIds.length > 0) {
          entity = {
            type: 'certificate',
            id: certificateIds[faker.number.int({ min: 0, max: certificateIds.length - 1 })],
          };
        }
      }
      
      // Random link
      let link: string | undefined = undefined;
      if (entity) {
        link = `/${entity.type}s/${entity.id}`;
      }
      
      // Random read status with appropriate weights
      const read = faker.helpers.weightedArrayElement([
        { value: true, weight: 6 },
        { value: false, weight: 4 },
      ]);
      
      // Random readAt (only if read is true)
      const createdAt = faker.date.recent({ days: 30 });
      let readAt: Date | undefined = undefined;
      
      if (read) {
        readAt = faker.date.between({ from: createdAt, to: new Date() });
      }
      
      const notification: INotificationSeed = {
        recipient: recipientId,
        sender: senderId,
        type,
        title: faker.lorem.sentence(3),
        message: faker.lorem.sentence(),
        link,
        read,
        readAt,
        entity,
        priority: faker.helpers.arrayElement(['low', 'medium', 'high']),
        createdAt,
        updatedAt: faker.date.between({ from: createdAt, to: new Date() }),
      };
      
      notifications.push(notification);
    }
    
    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }
    
    console.log(`Seeded ${notifications.length} notifications`);
  } catch (error: any) {
    console.error(`Error seeding notifications: ${error}`);
    process.exit(1);
  }
};

// Main seed function
const seedDatabase = async (): Promise<void> => {
  try {
    // Create directories
    createDirectories();
    
    // Connect to database
    await connectDB();
    
    // Clear database
    await clearDatabase();
    
    // Seed data
    const userIds = await seedUsers();
    const projectIds = await seedProjects(userIds);
    const certificateIds = await seedCertificates(userIds, projectIds);
    await seedNotifications(userIds, projectIds, certificateIds);
    
    console.log('Database seeded successfully!');
    console.log('\nYou can now log in with the following accounts:');
    console.log('- Admin: admin@example.com / Admin123!');
    console.log('- Manager: manager@example.com / Manager123!');
    console.log('- User: user@example.com / User123!');
    
    // Disconnect from database
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    
    process.exit(0);
  } catch (error) {
    console.error(`Error seeding database: ${error}`);
    process.exit(1);
  }
};

// Run seed function
seedDatabase();