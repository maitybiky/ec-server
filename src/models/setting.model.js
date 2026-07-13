import mongoose from 'mongoose';

/** Generic key/value app settings (e.g. homepage content). */
const settingSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    value: { type: mongoose.Schema.Types.Mixed, required: true },
  },
  { timestamps: true },
);

export const Setting = mongoose.model('Setting', settingSchema);
