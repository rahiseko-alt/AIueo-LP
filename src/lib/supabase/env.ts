type SupabasePublicConfig = {
  url: string;
  publishableKey: string;
};

function readPublicConfig(): SupabasePublicConfig | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    return null;
  }

  return { url, publishableKey };
}

export function isSupabaseConfigured() {
  return readPublicConfig() !== null;
}

export function getSupabasePublicConfig(): SupabasePublicConfig {
  const config = readPublicConfig();

  if (!config) {
    throw new Error(
      'Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.',
    );
  }

  return config;
}
