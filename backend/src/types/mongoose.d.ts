import { Schema, Types } from 'mongoose';

// Extendendo o tipo ObjectId do Mongoose para incluir o método equals
declare module 'mongoose' {
  interface ObjectId {
    equals(val: any): boolean;
  }
  
  namespace Schema {
    namespace Types {
      interface ObjectId {
        equals(val: any): boolean;
      }
    }
  }
}

// Estender Array para incluir os métodos específicos do Mongoose para subdocumentos
declare global {
  interface Array<T> {
    id(id: string): T | null;
    pull(id: string): Array<T>;
  }
}

// Estender o Session para incluir propriedades personalizadas
declare module 'express-session' {
  interface SessionData {
    tempTOTPSecret?: string;
    twoFactorVerified?: boolean;
  }
}

// Definições de tipos para bibliotecas externas
declare module 'swagger-jsdoc';
declare module 'handlebars';
declare module 'uuid';

// Definições para OpenAI
declare namespace OpenAI {
  namespace Chat {
    interface ChatCompletionMessageParam {
      role: string;
      content: string;
      name?: string;
    }
  }
}