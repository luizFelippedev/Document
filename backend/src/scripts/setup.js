#!/usr/bin/env node

/**
 * Script to set up project directories and initial configuration
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Colors for console output
const colors = {
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

const log = (message, color = 'reset') => {
  console.log(`${colors[color]}${message}${colors.reset}`);
};

// Create required directories
const dirs = [
  'uploads',
  'uploads/projects',
  'uploads/certificates',
  'uploads/certificates/images',
  'uploads/certificates/files',
  'uploads/users',
  'uploads/temp',
  'logs',
  'src/templates/emails',
  'dist',
  'coverage',
  'docs',
  '__tests__'
];

log('🚀 Setting up Portfolio Backend Project...', 'blue');
log('');

// Step 1: Create directories
log('📁 Creating required directories...', 'yellow');
dirs.forEach(dir => {
  const fullPath = path.join(process.cwd(), dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
    log(`✓ Created ${dir}`, 'green');
  } else {
    log(`✓ ${dir} already exists`, 'green');
  }
});

// Step 2: Check for .env file
log('');
log('🔧 Checking environment configuration...', 'yellow');
const envPath = path.join(process.cwd(), '.env');
const envExamplePath = path.join(process.cwd(), '.env.example');

if (!fs.existsSync(envPath)) {
  if (fs.existsSync(envExamplePath)) {
    try {
      fs.copyFileSync(envExamplePath, envPath);
      log('✓ Created .env file from .env.example', 'green');
      log('⚠️  Please update the .env file with your configuration values', 'yellow');
    } catch (error) {
      log('❌ Could not copy .env.example to .env', 'red');
      log('⚠️  Please create .env file manually', 'yellow');
    }
  } else {
    log('⚠️  No .env or .env.example file found', 'yellow');
    log('⚠️  Please create .env file with required configuration', 'yellow');
  }
} else {
  log('✓ .env file exists', 'green');
}

// Step 3: Create basic configuration files if they don't exist
log('');
log('📝 Creating configuration files...', 'yellow');

// TypeScript config
const tsConfigPath = path.join(process.cwd(), 'tsconfig.json');
if (!fs.existsSync(tsConfigPath)) {
  const tsConfig = {
    compilerOptions: {
      target: 'ES2020',
      module: 'commonjs',
      lib: ['ES2020'],
      outDir: './dist',
      rootDir: './src',
      strict: true,
      esModuleInterop: true,
      skipLibCheck: true,
      forceConsistentCasingInFileNames: true,
      resolveJsonModule: true,
      declaration: true,
      declarationMap: true,
      sourceMap: true,
      removeComments: true,
      noImplicitAny: true,
      strictNullChecks: true,
      strictFunctionTypes: true,
      noImplicitReturns: true,
      noFallthroughCasesInSwitch: true,
      moduleResolution: 'node',
      allowSyntheticDefaultImports: true,
      experimentalDecorators: true,
      emitDecoratorMetadata: true,
      baseUrl: '.',
      paths: {
        '@/*': ['src/*'],
        '@/config/*': ['src/config/*'],
        '@/api/*': ['src/api/*'],
        '@/utils/*': ['src/utils/*']
      }
    },
    include: ['src/**/*'],
    exclude: ['node_modules', '**/*.test.ts', '**/*.spec.ts', 'dist']
  };
  
  fs.writeFileSync(tsConfigPath, JSON.stringify(tsConfig, null, 2));
  log('✓ Created tsconfig.json', 'green');
} else {
  log('✓ tsconfig.json already exists', 'green');
}

// Nodemon config
const nodemonConfigPath = path.join(process.cwd(), 'nodemon.json');
if (!fs.existsSync(nodemonConfigPath)) {
  const nodemonConfig = {
    watch: ['src'],
    ext: 'ts,json',
    ignore: ['src/**/*.spec.ts', 'src/**/*.test.ts'],
    exec: 'ts-node src/index.ts',
    env: {
      NODE_ENV: 'development'
    }
  };
  
  fs.writeFileSync(nodemonConfigPath, JSON.stringify(nodemonConfig, null, 2));
  log('✓ Created nodemon.json', 'green');
} else {
  log('✓ nodemon.json already exists', 'green');
}

// Docker ignore
const dockerIgnorePath = path.join(process.cwd(), '.dockerignore');
if (!fs.existsSync(dockerIgnorePath)) {
  const dockerIgnore = `node_modules
npm-debug.log
dist
coverage
.nyc_output
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
logs
*.log
.DS_Store
.vscode
.idea
*.swp
*.swo
*~
.git
.gitignore
README.md
Dockerfile
.dockerignore
docker-compose.yml`;
  
  fs.writeFileSync(dockerIgnorePath, dockerIgnore);
  log('✓ Created .dockerignore', 'green');
} else {
  log('✓ .dockerignore already exists', 'green');
}

// Git ignore
const gitIgnorePath = path.join(process.cwd(), '.gitignore');
if (!fs.existsSync(gitIgnorePath)) {
  const gitIgnore = `# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/
.nyc_output

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Build output
dist/
build/

# Logs
logs
*.log

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Dependency directories
node_modules/
jspm_packages/

# TypeScript cache
*.tsbuildinfo

# Optional npm cache directory
.npm

# Optional eslint cache
.eslintcache

# Optional REPL history
.node_repl_history

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity

# dotenv environment variables file
.env

# parcel-bundler cache (https://parceljs.org/)
.cache
.parcel-cache

# next.js build output
.next

# nuxt.js build output
.nuxt

# vuepress build output
.vuepress/dist

# Serverless directories
.serverless

# FuseBox cache
.fusebox/

# DynamoDB Local files
.dynamodb/

# TernJS port file
.tern-port

# Stores VSCode versions used for testing VSCode extensions
.vscode-test

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# IDE files
.vscode/
.idea/
*.swp
*.swo
*~

# Uploads
uploads/
!uploads/.gitkeep

# Temporary files
temp/
tmp/`;
  
  fs.writeFileSync(gitIgnorePath, gitIgnore);
  log('✓ Created .gitignore', 'green');
} else {
  log('✓ .gitignore already exists', 'green');
}

// Step 4: Create .gitkeep files for empty directories
log('');
log('📄 Creating .gitkeep files...', 'yellow');
const gitKeepDirs = [
  'uploads',
  'logs',
  'uploads/projects',
  'uploads/certificates',
  'uploads/users'
];

gitKeepDirs.forEach(dir => {
  const gitKeepPath = path.join(process.cwd(), dir, '.gitkeep');
  if (!fs.existsSync(gitKeepPath)) {
    fs.writeFileSync(gitKeepPath, '');
    log(`✓ Created .gitkeep in ${dir}`, 'green');
  }
});

// Step 5: Check dependencies
log('');
log('📦 Checking dependencies...', 'yellow');
const packageJsonPath = path.join(process.cwd(), 'package.json');
if (fs.existsSync(packageJsonPath)) {
  log('✓ package.json exists', 'green');
  
  const nodeModulesPath = path.join(process.cwd(), 'node_modules');
  if (!fs.existsSync(nodeModulesPath)) {
    log('⚠️  node_modules not found, running npm install...', 'yellow');
    try {
      execSync('npm install', { stdio: 'inherit' });
      log('✓ Dependencies installed', 'green');
    } catch (error) {
      log('❌ Failed to install dependencies', 'red');
      log('Please run: npm install', 'yellow');
    }
  } else {
    log('✓ node_modules exists', 'green');
  }
} else {
  log('❌ package.json not found', 'red');
  log('Please create package.json file', 'yellow');
}

// Step 6: Final instructions
log('');
log('🎉 Setup completed successfully!', 'green');
log('');
log('Next steps:', 'bold');
log('1. Update your .env file with the correct configuration values', 'yellow');
log('2. Make sure MongoDB and Redis are running', 'yellow');
log('3. Run "npm run seed" to populate the database with sample data', 'yellow');
log('4. Run "npm run dev" to start the development server', 'yellow');
log('');
log('Available commands:', 'bold');
log('  npm run dev     - Start development server', 'blue');
log('  npm run build   - Build for production', 'blue');
log('  npm run start   - Start production server', 'blue');
log('  npm run test    - Run tests', 'blue');
log('  npm run seed    - Seed database with sample data', 'blue');
log('  npm run lint    - Run ESLint', 'blue');
log('  npm run format  - Format code with Prettier', 'blue');
log('');
log('Happy coding! 🚀', 'green');