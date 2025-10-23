/**
 * Inventory-related validation schemas
 */

import { z } from 'zod';

export const movementTypeSchema = z.enum(['receipt', 'transfer', 'return', 'writeoff', 'count']);

// Stock Movement Document
export const createMovementDocumentSchema = z.object({
  type: movementTypeSchema,
  storeId: z.string().uuid(),
  documentNumber: z.string().optional(),
  notes: z.string().max(1000).optional(),
  items: z.array(
    z.object({
      variantId: z.string().uuid(),
      quantity: z.number().positive(),
      costPrice: z.number().positive().optional(),
    })
  ).min(1),
});

// Stock Transfer
export const createStockTransferSchema = z.object({
  fromStoreId: z.string().uuid(),
  toStoreId: z.string().uuid(),
  documentNumber: z.string().optional(),
  notes: z.string().max(1000).optional(),
  items: z.array(
    z.object({
      variantId: z.string().uuid(),
      quantity: z.number().positive(),
    })
  ).min(1),
}).refine((data) => data.fromStoreId !== data.toStoreId, {
  message: 'Source and destination stores must be different',
  path: ['toStoreId'],
});

// Inventory Count
export const createInventoryCountSchema = z.object({
  storeId: z.string().uuid(),
  documentNumber: z.string().optional(),
  notes: z.string().max(1000).optional(),
  items: z.array(
    z.object({
      variantId: z.string().uuid(),
      expectedQuantity: z.number().min(0),
      actualQuantity: z.number().min(0),
    })
  ).min(1),
});

// Stock Level Query
export const stockLevelQuerySchema = z.object({
  storeId: z.string().uuid().optional(),
  variantId: z.string().uuid().optional(),
  categoryId: z.string().uuid().optional(),
  lowStock: z.boolean().optional(),
});
