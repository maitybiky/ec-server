import { Address } from '../../models/address.model.js';

export const addressRepository = {
  findByUser(userId) {
    return Address.find({ user: userId }).sort({ updatedAt: -1 });
  },

  findOneByUser(userId, addressId) {
    return Address.findOne({ _id: addressId, user: userId });
  },

  create(data) {
    return Address.create(data);
  },

  /** Create only if an identical address doesn't already exist for the user. */
  async upsertForUser(userId, fields) {
    const existing = await Address.findOne({ user: userId, ...fields });
    if (existing) {
      existing.updatedAt = new Date();
      await existing.save();
      return existing;
    }
    return Address.create({ user: userId, ...fields });
  },

  deleteByUser(userId, addressId) {
    return Address.findOneAndDelete({ _id: addressId, user: userId });
  },
};
