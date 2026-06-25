// Production UserRepository backed by Supabase Postgres (service-role client).
// Kept in its own module so tests and the smoke script never need to import the
// supabase-js dependency.

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { requireEnv } from './env.ts';
import type { UserPatch, UserRecord, UserRepository, UserStatus } from './repository.ts';

function serviceRoleClient(): SupabaseClient {
  return createClient(requireEnv('SUPABASE_URL'), requireEnv('SUPABASE_SERVICE_ROLE_KEY'), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

interface UsersRow {
  id: string;
  telegram_id: number;
  status: string;
  trial_ends_at: string | null;
  preferences: Record<string, unknown> | null;
  created_at: string;
}

function toUserRecord(row: UsersRow): UserRecord {
  return {
    id: row.id,
    telegram_id: row.telegram_id,
    status: row.status as UserStatus,
    trial_ends_at: row.trial_ends_at,
    preferences: row.preferences ?? {},
    created_at: row.created_at,
  };
}

export class SupabaseUserRepository implements UserRepository {
  private readonly client: SupabaseClient;

  constructor(client: SupabaseClient = serviceRoleClient()) {
    this.client = client;
  }

  async findByTelegramId(telegramId: number): Promise<UserRecord | null> {
    const { data, error } = await this.client
      .from('users')
      .select('id, telegram_id, status, trial_ends_at, preferences, created_at')
      .eq('telegram_id', telegramId)
      .maybeSingle();
    if (error) throw new Error(`findByTelegramId failed: ${error.message}`);
    return data ? toUserRecord(data as UsersRow) : null;
  }

  async createUser(telegramId: number): Promise<UserRecord> {
    const { data, error } = await this.client
      .from('users')
      .insert({ telegram_id: telegramId, status: 'new' })
      .select('id, telegram_id, status, trial_ends_at, preferences, created_at')
      .single();
    if (error) throw new Error(`createUser failed: ${error.message}`);
    return toUserRecord(data as UsersRow);
  }

  async updateUser(telegramId: number, patch: UserPatch): Promise<void> {
    const { error } = await this.client.from('users').update(patch).eq('telegram_id', telegramId);
    if (error) throw new Error(`updateUser failed: ${error.message}`);
  }

  async recordEvent(
    userId: string | null,
    type: string,
    payload: Record<string, unknown> = {},
  ): Promise<void> {
    const { error } = await this.client.from('events').insert({ user_id: userId, type, payload });
    // The funnel log is best-effort — a failed insert must not break the reply.
    if (error) console.warn('repository: recordEvent failed', { type, message: error.message });
  }
}
