// Client-side environment variable handling for Cloudflare Pages
export const getEnvVar = (key: string): string | null => {
  // Check if environment variables are injected into the page
  if (typeof window !== 'undefined') {
    const envVars = (window as any).__ENV__;
    if (envVars && envVars[key]) {
      return envVars[key];
    }
  }
  return null;
};

// Get API keys from environment or localStorage
export const getApiKeys = () => {
  const firecrawlKey = getEnvVar('FIRECRAWL_API_KEY') || 
                      (typeof window !== 'undefined' ? localStorage.getItem('firecrawl-api-key') : null);
  
  const openaiKey = getEnvVar('OPENAI_API_KEY') || 
                   (typeof window !== 'undefined' ? localStorage.getItem('openai-api-key') : null);
  
  return {
    firecrawlKey,
    openaiKey,
    bothConfigured: !!(firecrawlKey && openaiKey)
  };
};

// Auto-configure API keys from environment variables (server-side only)
export const autoConfigureApiKeys = () => {
  if (typeof window === 'undefined') {
    // Server-side: we can access environment variables
    const firecrawlKey = process.env.FIRECRAWL_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;
    
    if (firecrawlKey && openaiKey) {
      // Store them in localStorage for client-side access
      if (typeof window !== 'undefined') {
        localStorage.setItem('firecrawl-api-key', firecrawlKey);
        localStorage.setItem('openai-api-key', openaiKey);
      }
      return true;
    }
  }
  return false;
}; 