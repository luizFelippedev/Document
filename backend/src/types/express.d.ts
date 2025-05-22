// src/types/express.d.ts
import { Types } from 'mongoose';

declare global {
  namespace Express {
    interface Request {
      user?: {
        _id: Types.ObjectId;
        email: string;
        role: string;
        name: string;
        // Add other user properties as needed
      };
    }
  }
}