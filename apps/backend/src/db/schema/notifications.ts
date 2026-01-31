import {
    pgTable,
    text,
    timestamp,
    boolean,
    uuid,
    varchar,
    index,
} from 'drizzle-orm/pg-core';
import { users } from './auth.js';

export const notifications = pgTable('notifications', {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id')
        .notNull()
        .references(() => users.id, { onDelete: 'cascade' }),
    type: varchar('type', { length: 20 }).notNull(), // info, success, warning, error, system
    title: varchar('title', { length: 100 }).notNull(),
    message: text('message').notNull(),
    isRead: boolean('is_read').default(false).notNull(),
    link: varchar('link', { length: 255 }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
    userIdIdx: index('notifications_user_id_idx').on(table.userId),
}));

export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
