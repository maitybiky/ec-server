import mongoose from 'mongoose';

/**
 * Order items and discount breakdown are SNAPSHOTS taken at placement time.
 * They are never recalculated from live product/discount config, so later
 * admin changes do not alter historical orders.
 */
const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
    categoryName: { type: String, required: true },
    lineTotal: { type: Number, required: true },
  },
  { _id: false },
);

const appliedRuleSchema = new mongoose.Schema(
  {
    ruleId: { type: mongoose.Schema.Types.ObjectId },
    type: { type: String, required: true },
    name: { type: String, required: true },
    percent: { type: Number, required: true },
  },
  { _id: false },
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    items: { type: [orderItemSchema], required: true },
    discount: {
      subtotal: { type: Number, required: true },
      appliedRules: [appliedRuleSchema],
      totalPercent: { type: Number, required: true },
      capPercent: { type: Number, default: null },
      appliedPercent: { type: Number, required: true },
      discountAmount: { type: Number, required: true },
      payable: { type: Number, required: true },
    },
    status: {
      type: String,
      enum: ['placed', 'completed', 'cancelled'],
      default: 'placed',
      index: true,
    },
    payment: {
      provider: { type: String, required: true },
      status: { type: String, enum: ['paid', 'failed'], required: true },
      transactionId: { type: String },
      paidAt: { type: Date },
    },
    shippingAddress: {
      fullName: { type: String, required: true },
      phone: { type: String, required: true },
      line1: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      postalCode: { type: String, required: true },
    },
  },
  { timestamps: true },
);

export const Order = mongoose.model('Order', orderSchema);
