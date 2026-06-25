// Data-access boundary for the bot.
//
// The handler depends only on the `UserRepository` interface, so it can run
// against Postgres in production (SupabaseUserRepository) or fully in memory in
// tests and the smoke script (InMemoryUserRepository) — no database required to
// prove the core loop works.

export type UserStatus = 'new' | 'onboarding' | 'trialing' | 'active' | 'cancelled';

export interface UserRecord {
  id: string;
  telegram_id: number;
  status: UserStatus;
  trial_ends_at: string | null;
  preferences: Record<string, unknown>;
  created_at: string;
}

export interface UserPatch {
  status?: UserStatus;
  trial_ends_at?: string | null;
  preferences?: Record<string, unknown>;
}

export interface UserRepository {
  findByTelegramId(telegramId: number): Promise<UserRecord | null>;
  createUser(telegramId: number): Promise<UserRecord>;
  updateUser(telegramId: number, patch: UserPatch): Promise<void>;
  recordEvent(
    userId: string | null,
    type: string,
    payload?: Record<string, unknown>,
  ): Promise<void>;
}

export interface RecordedEvent {
  userId: string | null;
  type: string;
  payload: Record<string, unknown>;
}

/** In-memory repository for tests and the smoke script. */
export class InMemoryUserRepository implements UserRepository {
  private readonly users = new Map<number, UserRecord>();
  /** Exposed so tests can assert on the funnel that was written. */
  readonly events: RecordedEvent[] = [];

  findByTelegramId(telegramId: number): Promise<UserRecord | null> {
    return Promise.resolve(this.users.get(telegramId) ?? null);
  }

  createUser(telegramId: number): Promise<UserRecord> {
    const user: UserRecord = {
      id: crypto.randomUUID(),
      telegram_id: telegramId,
      status: 'new',
      trial_ends_at: null,
      preferences: {},
      created_at: new Date().toISOString(),
    };
    this.users.set(telegramId, user);
    return Promise.resolve(user);
  }

  updateUser(telegramId: number, patch: UserPatch): Promise<void> {
    const existing = this.users.get(telegramId);
    if (!existing) return Promise.resolve();
    this.users.set(telegramId, {
      ...existing,
      ...(patch.status !== undefined ? { status: patch.status } : {}),
      ...(patch.trial_ends_at !== undefined ? { trial_ends_at: patch.trial_ends_at } : {}),
      ...(patch.preferences !== undefined ? { preferences: patch.preferences } : {}),
    });
    return Promise.resolve();
  }

  recordEvent(
    userId: string | null,
    type: string,
    payload: Record<string, unknown> = {},
  ): Promise<void> {
    this.events.push({ userId, type, payload });
    return Promise.resolve();
  }
}
