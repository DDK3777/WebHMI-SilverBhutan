import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase =
  supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

export async function getCurrentSession() {
  if (!supabase) {
    return { session: null, error: null, skipped: true };
  }

  const {
    data: { session },
    error
  } = await supabase.auth.getSession();

  return { session, error, skipped: false };
}

export async function signInWithPassword(email, password) {
  if (!supabase) {
    return { data: null, error: new Error('Supabase is not configured.') };
  }

  return supabase.auth.signInWithPassword({
    email,
    password
  });
}

export async function signOutUser() {
  if (!supabase) {
    return { error: null, skipped: true };
  }

  return supabase.auth.signOut();
}

export function onAuthStateChange(callback) {
  if (!supabase) {
    return {
      data: {
        subscription: {
          unsubscribe() {}
        }
      }
    };
  }

  return supabase.auth.onAuthStateChange(callback);
}

export async function fetchAppUserProfile(userId) {
  if (!supabase || !userId) {
    return { data: null, error: null, skipped: true };
  }

  const { data, error } = await supabase
    .from('app_users')
    .select('*')
    .eq('user_id', userId)
    .single();

  return { data, error, skipped: false };
}

export async function insertTrendRow(row) {
  if (!supabase) {
    return { error: null, skipped: true };
  }

  const { error } = await supabase.from('hmi_trends').insert(row);
  return { error, skipped: false };
}

export async function fetchTrendRows(limit = 10) {
  if (!supabase) {
    return { data: [], error: null, skipped: true };
  }

  const { data, error } = await supabase
    .from('hmi_trends')
    .select('*')
    .order('timestamp', { ascending: false })
    .limit(limit);

  return { data: data ?? [], error, skipped: false };
}

export async function fetchTrendSeries(columnName, limit = 30) {
  if (!supabase) {
    return { data: [], error: null, skipped: true };
  }

  const { data, error } = await supabase
    .from('hmi_trends')
    .select(`timestamp, ${columnName}`)
    .order('timestamp', { ascending: false })
    .limit(limit);

  return { data: data ?? [], error, skipped: false };
}
