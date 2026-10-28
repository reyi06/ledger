import { z } from 'zod';

/**
 * Shared scalar types. These are the only place where the wire format of
 * dates and identifiers is defined, so every layer agrees on them.
 */

/** A calendar day in `YYYY-MM-DD` form. Timezone-free on purpose. */
export const DateOnlySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected a date in YYYY-MM-DD format');
export type DateOnly = z.infer<typeof DateOnlySchema>;

/** A month bucket in `YYYY-MM` form, used to group transactions. */
export const MonthKeySchema = z.string().regex(/^\d{4}-\d{2}$/, 'Expected a month in YYYY-MM format');
export type MonthKey = z.infer<typeof MonthKeySchema>;

/** An ISO-8601 timestamp, used for record bookkeeping. */
export const TimestampSchema = z.string().min(1);
export type Timestamp = z.infer<typeof TimestampSchema>;

/** A non-empty identifier. */
export const IdSchema = z.string().min(1);
export type Id = z.infer<typeof IdSchema>;
