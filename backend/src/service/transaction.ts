// src/service/transaction.ts
import { TRANSACTIONS, PLACES } from '../data/mock_data.js';

export const getAll = () => {
  return TRANSACTIONS;
};

export const getById = (id: number) => {
  throw new Error('Not implemented yet!');
};

export const create = ({ amount, date, placeId, user }: any) => {
  throw new Error('Not implemented yet!');
};

export const updateById = (
  id: number,
  { amount, date, placeId, user }: any,
) => {
  throw new Error('Not implemented yet!');
};

export const deleteById = (id: number) => {
  throw new Error('Not implemented yet!');
};