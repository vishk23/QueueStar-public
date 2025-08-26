import { pgTable, uuid, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { blends } from './blends';
import { users } from './users';

export const participantStatusEnum = pgEnum('participant_status', ['pending', 'accepted', 'declined']);

export const blendParticipants = pgTable('blend_participants', {
  id: uuid('id').defaultRandom().primaryKey(),
  blendId: uuid('blend_id').references(() => blends.id).notNull(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  status: participantStatusEnum('status').default('pending').notNull(),
  joinedAt: timestamp('joined_at'),
});