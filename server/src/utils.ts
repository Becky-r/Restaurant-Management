import prisma from './lib/prisma';

/**
 * Generates a sequential order number like #0001, #0002, etc.
 * Shared utility to avoid duplication across route files.
 */
export const generateOrderNumber = async (): Promise<string> => {
  const count = await prisma.order.count();
  return `#${(count + 1).toString().padStart(4, '0')}`;
};
