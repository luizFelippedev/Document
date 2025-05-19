# Project Management & Certification Platform API

A comprehensive RESTful API backend for a project management and certification platform. This system allows users to create and manage projects, issue verifiable certificates, and collaborate with team members.

## 🌟 Features

- **User Management**
  - Authentication with JWT and refresh tokens
  - Two-factor authentication (2FA)
  - Email verification
  - Password reset
  - Role-based access control

- **Project Management**
  - Create, read, update, delete projects
  - Add collaborators to projects
  - Upload and manage project files
  - Track project metrics (views, likes, downloads, shares)
  - Project visibility controls
  - Search and filter projects

- **Certificate Management**
  - Issue verifiable certificates
  - Certificate verification via QR codes
  - Certificate templates
  - Skills validation
  - Bulk issuance

- **AI Features**
  - Generate project descriptions
  - Analyze projects and provide feedback
  - Generate project ideas based on user skills
  - Generate project thumbnails
  - Find similar projects

- **Real-time Communication**
  - Notifications system
  - Project chat
  - WebSocket integration

- **Background Processing**
  - Email sending
  - Image processing
  - System maintenance tasks

## 🚀 Tech Stack

- **Node.js** - JavaScript runtime
- **Express** - Web framework
- **TypeScript** - Type safety
- **MongoDB** - Database
- **Redis** - Caching and queues
- **Socket.IO** - WebSockets
- **Bull** - Background job processing
- **OpenAI** - AI integration
- **JWT** - Authentication
- **Multer** - File uploads
- **Sharp** - Image processing
- **Nodemailer** - Email sending
- **Jest** - Testing
- **Swagger** - API documentation
- **Docker** - Containerization

## 📋 Prerequisites

- Node.js (v16 or higher)
- MongoDB
- Redis
- OpenAI API key (for AI features)

## 🛠️ Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/project-management-api.git
   cd project-management-api
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   Copy the `.env.example` file to `.env` and update the values:

   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Build the application**

   ```bash
   npm run build
   ```

## 🏃‍♂️ Running the Application

### Development Mode

```bash
npm run dev
```

### Production Mode

```bash
npm run build
npm start
```

### Using Docker

```bash
# Development
docker-compose up

# Production
docker build -t project-api .
docker run -p 5000:5000 project-api
```

## 🌱 Seed Data (Development)

To populate the database with sample data for development:

```bash
npm run seed
```

This will create:
- Test users with different roles
- Sample projects
- Sample certificates
- Sample notifications

After seeding, you can login with:
- Admin: admin@example.com / Admin123!
- Manager: manager@example.com / Manager123!
- User: user@example.com / User123!

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm test -- --coverage

# Run tests in watch mode
npm run test:watch
```

## 📚 API Documentation

The API documentation is available via Swagger UI at:

```
http://localhost:5000/api-docs
```

## 🔑 Authentication

The API uses JWT (JSON Web Tokens) for authentication. To access protected endpoints:

1. Obtain a token by logging in via `/api/auth/login`
2. Include the token in the Authorization header of your requests:
   ```
   Authorization: Bearer your_token_here
   ```

## 🌐 WebSocket Events

The application uses Socket.IO for real-time communication. Main events:

- **Notifications**
  - `notifications:get` - Request notifications
  - `notifications:list` - Receive notifications list
  - `notifications:new` - New notification received
  - `notifications:markRead` - Mark notification as read
  - `notifications:allRead` - Mark all notifications as read

- **Chat**
  - `chat:direct-message` - Send a direct message
  - `chat:project-message` - Send a message to project chat
  - `chat:message` - Receive a message
  - `chat:history` - Get chat history
  - `chat:join-project` - Join a project chat
  - `chat:leave-project` - Leave a project chat

## 📁 Project Structure

```
backend/
├── src/                   # Source code
│   ├── api/               # API components
│   │   ├── controllers/   # Route controllers
│   │   ├── middleware/    # Express middleware
│   │   ├── models/        # Database models
│   │   ├── routes/        # API routes
│   │   ├── validators/    # Input validation
│   │   └── services/      # Business logic
│   ├── config/            # Configuration
│   ├── core/              # Core utilities
│   ├── utils/             # Helper utilities
│   ├── lib/               # External libraries
│   ├── ai/                # AI functionality
│   ├── websockets/        # WebSocket handlers
│   ├── jobs/              # Background jobs
│   ├── docs/              # API documentation
│   ├── templates/         # Email templates
│   └── index.ts           # Application entry point
├── tests/                 # Test files
├── uploads/               # Uploaded files
├── logs/                  # Log files
├── scripts/               # Utility scripts
└── dist/                  # Compiled code
```

## 🔒 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request