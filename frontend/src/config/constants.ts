// frontend/src/config/constants.ts
export const APP_NAME = "DevFolio";
export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

// Skills for projects and certificates
export const SKILLS = [
  "JavaScript",
  "TypeScript",
  "React",
  "Next.js",
  "Node.js",
  "Express",
  "MongoDB",
  "PostgreSQL",
  "GraphQL",
  "AWS",
  "Docker",
  "Kubernetes",
  "CI/CD",
  "HTML/CSS",
  "Tailwind CSS",
  "Vue.js",
  "Angular",
  "Python",
  "Django",
  "Flask",
  "Ruby",
  "Rails",
  "Java",
  "Spring Boot",
  "PHP",
  "Laravel",
  "Swift",
  "Kotlin",
  "Flutter",
  "React Native",
  "Machine Learning",
  "Data Science",
  "Blockchain",
  "DevOps",
  "UI/UX Design",
  "Product Management",
  "Testing/QA",
];

// Application settings
export const SETTINGS = {
  darkMode: true,
  animations: true,
  analyticsEnabled: true,
  maxUploadSize: 5 * 1024 * 1024, // 5MB
  allowedFileTypes: [
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/pdf",
  ],
  projectsPerPage: 9,
  certificatesPerPage: 9,
};

// Date formats
export const DATE_FORMATS = {
  default: "MMMM d, yyyy",
  short: "MMM d, yyyy",
  iso: "yyyy-MM-dd",
  withTime: "MMMM d, yyyy h:mm a",
};

// Notification settings
export const NOTIFICATION_SETTINGS = {
  maxStored: 50,
  defaultDuration: 3000,
  errorDuration: 5000,
};
