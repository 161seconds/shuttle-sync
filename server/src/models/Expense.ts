import mongoose, { Document, Schema, Model } from 'mongoose';

export enum ExpenseCategory {
    RENT = 'Mặt bằng',
    UTILITIES = 'Điện Nước',
    STAFF = 'Nhân sự',
    MAINTENANCE = 'Bảo trì',
    MARKETING = 'Marketing',
    OTHER = 'Khác'
}

export interface IExpenseDocument extends Document {
    venueId: mongoose.Types.ObjectId;
    amount: number;
    category: ExpenseCategory | string;
    date: Date;
    description: string;
    createdAt: Date;
    updatedAt: Date;
}

interface IExpenseModel extends Model<IExpenseDocument> {}

const expenseSchema = new Schema<IExpenseDocument>(
    {
        venueId: {
            type: Schema.Types.ObjectId,
            ref: 'Venue',
            required: true,
            index: true
        },
        amount: {
            type: Number,
            required: true,
            min: 0
        },
        category: {
            type: String,
            enum: Object.values(ExpenseCategory),
            required: true
        },
        date: {
            type: Date,
            required: true,
            index: true
        },
        description: {
            type: String,
            trim: true,
            default: ''
        }
    },
    {
        timestamps: true
    }
);

// Index to optimize querying expenses by venue and date range
expenseSchema.index({ venueId: 1, date: -1 });

export const Expense = (mongoose.models.Expense as IExpenseModel) || mongoose.model<IExpenseDocument, IExpenseModel>('Expense', expenseSchema);
