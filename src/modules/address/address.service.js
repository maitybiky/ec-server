import { addressRepository } from './address.repository.js';
import { ApiError } from '../../shared/utils/ApiError.js';

export const addressService = {
  list(userId) {
    return addressRepository.findByUser(userId);
  },

  create(userId, fields) {
    return addressRepository.upsertForUser(userId, fields);
  },

  async remove(userId, addressId) {
    const deleted = await addressRepository.deleteByUser(userId, addressId);
    if (!deleted) throw ApiError.notFound('Address not found');
  },
};
