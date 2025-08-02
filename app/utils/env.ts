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

// Function to check if API keys are available and auto-configure them
export const checkAndConfigureApiKeys = () => {
  const { firecrawlKey, openaiKey, bothConfigured } = getApiKeys();
  
  // If we have environment variables, store them in localStorage
  if (typeof window !== 'undefined') {
    const envFirecrawl = getEnvVar('FIRECRAWL_API_KEY');
    const envOpenai = getEnvVar('OPENAI_API_KEY');
    
    if (envFirecrawl && !localStorage.getItem('firecrawl-api-key')) {
      localStorage.setItem('firecrawl-api-key', envFirecrawl);
    }
    
    if (envOpenai && !localStorage.getItem('openai-api-key')) {
      localStorage.setItem('openai-api-key', envOpenai);
    }
  }
  
  return { firecrawlKey, openaiKey, bothConfigured };
};

// Alternative approach: Check for environment variables in the URL or other sources
export const getApiKeysFromMultipleSources = () => {
  // Check localStorage first
  const localStorageFirecrawl = typeof window !== 'undefined' ? localStorage.getItem('firecrawl-api-key') : null;
  const localStorageOpenai = typeof window !== 'undefined' ? localStorage.getItem('openai-api-key') : null;
  
  // Check environment variables
  const envFirecrawl = getEnvVar('FIRECRAWL_API_KEY');
  const envOpenai = getEnvVar('OPENAI_API_KEY');
  
  // Check URL parameters (for testing)
  let urlFirecrawl = null;
  let urlOpenai = null;
  if (typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search);
    urlFirecrawl = urlParams.get('firecrawl_key');
    urlOpenai = urlParams.get('openai_key');
  }
  
  const firecrawlKey = envFirecrawl || localStorageFirecrawl || urlFirecrawl;
  const openaiKey = envOpenai || localStorageOpenai || urlOpenai;
  
  return {
    firecrawlKey,
    openaiKey,
    bothConfigured: !!(firecrawlKey && openaiKey)
  };
}; 