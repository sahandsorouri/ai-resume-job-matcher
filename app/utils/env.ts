// API key detection for Cloudflare Pages with environment variables
export const getApiKeysFromMultipleSources = () => {
  // Check environment variables first (injected by Cloudflare Function)
  let firecrawlKey = null;
  let openaiKey = null;
  
  if (typeof window !== 'undefined') {
    const envVars = (window as any).__ENV__;
    if (envVars) {
      firecrawlKey = envVars.FIRECRAWL_API_KEY || null;
      openaiKey = envVars.OPENAI_API_KEY || null;
    }
  }
  
  // Fallback to localStorage if environment variables not available
  if (!firecrawlKey) {
    firecrawlKey = typeof window !== 'undefined' ? localStorage.getItem('firecrawl-api-key') : null;
  }
  if (!openaiKey) {
    openaiKey = typeof window !== 'undefined' ? localStorage.getItem('openai-api-key') : null;
  }
  
  return {
    firecrawlKey,
    openaiKey,
    bothConfigured: !!(firecrawlKey && openaiKey)
  };
};

// Legacy functions for compatibility
export const getEnvVar = (key: string): string | null => null;
export const getApiKeys = () => getApiKeysFromMultipleSources();
export const checkAndConfigureApiKeys = () => getApiKeysFromMultipleSources(); 