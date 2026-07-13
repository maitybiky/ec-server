import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    price: { type: Number, required: true, min: 0 },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
      index: true,
    },
    images: [
      {
        key: { type: String, required: true },
        url: { type: String, required: true },
      },
    ],
    stock: { type: Number, required: true, min: 0, default: 0 },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
      index: true,
    },
  },
  { timestamps: true },
);

productSchema.index({ name: 'text', description: 'text' });

export const Product = mongoose.model('Product', productSchema);
