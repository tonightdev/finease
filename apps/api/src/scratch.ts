import { Expiry } from '@repo/types';

const r: Expiry = {
  id: '1',
  userId: '1',
  name: 'test',
  type: 'other',
  expiryDate: '2021-01-01',
  renewalAmount: 0,
  createdAt: '2021-01-01',
};

console.log(r.deletedAt);
