import mongoose, { Schema, Document } from 'mongoose';
import type { User } from '../../../../shared/types.js';

export interface IUserModel extends Omit<User, '_id'>, Document { }
const UserSchema: Schema = new Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['user', 'admin'], default: 'user' }
}, { timestamps: true });

export const UserModel = mongoose.model<IUserModel>('User', UserSchema);