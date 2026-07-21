import { createRestClient } from './restTransport';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error('Missing required platform configuration.');
}

export const supabaseRest = createRestClient(supabaseUrl, supabasePublishableKey);
export const supabaseFunctionsUrl = `${supabaseUrl.replace(/\/$/, '')}/functions/v1`;
export const isSupabaseConfigured = () => true;
