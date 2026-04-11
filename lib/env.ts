function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    if (process.env.NODE_ENV === "development") {
      console.warn(`[env] Missing ${name} — some features will be unavailable`);
      return "";
    }
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = new Proxy(
  {} as {
    NEXT_PUBLIC_SUPABASE_URL: string;
    NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
    SUPABASE_SERVICE_ROLE_KEY: string;
  },
  {
    get(_, key: string) {
      return requireEnv(key);
    },
  }
);
