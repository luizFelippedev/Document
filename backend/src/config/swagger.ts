import swaggerJsDoc from 'swagger-jsdoc';
import dotenv from 'dotenv';

dotenv.config();

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Portfolio API',
      version: '1.0.0',
      description: 'API para portfólio avançado com projetos FiveM',
      contact: {
        name: 'Suporte',
        email: 'suporte@portfolio.com',
      },
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 5000}`,
        description: 'Servidor de desenvolvimento',
      },
      {
        url: process.env.PRODUCTION_API_URL || 'https://api.seuportfolio.com',
        description: 'Servidor de produção',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/api/routes/*.ts'],
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);

export default swaggerDocs;