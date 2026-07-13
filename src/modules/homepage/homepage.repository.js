import { Setting } from '../../models/setting.model.js';

export const homepageRepository = {
  async get() {
    const doc = await Setting.findOne({ key: 'homepage' });
    return doc?.value ?? null;
  },

  async set(value) {
    const doc = await Setting.findOneAndUpdate(
      { key: 'homepage' },
      { value },
      { new: true, upsert: true },
    );
    return doc.value;
  },
};
