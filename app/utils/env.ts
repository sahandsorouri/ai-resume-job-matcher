// API keys are provided by the user and stored only in their own browser's
// localStorage. Nothing is read from the server or injected into the page, so
// no owner keys are ever shipped to the client.
export const getApiKeysFromMultipleSources = () => {
  let firecrawlKey: string | null = null;
  let openaiKey: string | null = null;

  if (typeof window !== 'undefined') {
    firecrawlKey = localStorage.getItem('firecrawl-api-key');
    openaiKey = localStorage.getItem('openai-api-key');
  }

  return {
    firecrawlKey,
    openaiKey,
    bothConfigured: !!(firecrawlKey && openaiKey)
  };
};

// Legacy functions for compatibility
export const getEnvVar = (_key: string): string | null => null;
export const getApiKeys = () => getApiKeysFromMultipleSources();
export const checkAndConfigureApiKeys = () => getApiKeysFromMultipleSources();
