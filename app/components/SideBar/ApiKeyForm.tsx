import React, { useState, useEffect } from "react";
import Button from "../Button/Button";
import Input from "../InputSection/Input";
import { apiService } from "../../services/api";
import { getApiKeys } from "../../utils/env";
import { Eye, EyeOff } from "lucide-react";

interface ApiKeyFormProps {
  onApiKeySet: (firecrawlKey: string) => void;
}

const ApiKeyForm: React.FC<ApiKeyFormProps> = ({ onApiKeySet }) => {
  const [firecrawlApiKey, setFirecrawlApiKey] = useState("");
  const [openaiApiKey, setOpenaiApiKey] = useState("");
  const [isFirecrawlStored, setIsFirecrawlStored] = useState(false);
  const [isOpenaiStored, setIsOpenaiStored] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFirecrawlPassword, setShowFirecrawlPassword] = useState(false);
  const [showOpenaiPassword, setShowOpenaiPassword] = useState(false);

  // Check if API keys exist on component mount
  useEffect(() => {
    const { firecrawlKey, openaiKey, bothConfigured } = getApiKeys();
    
    // Check environment variables first
    if (firecrawlKey) {
      setFirecrawlApiKey(firecrawlKey);
      setIsFirecrawlStored(true);
    } else {
      // Fallback to localStorage
      const storedFirecrawlKey = apiService.getFirecrawlApiKey();
      if (storedFirecrawlKey) {
        setFirecrawlApiKey(storedFirecrawlKey);
        setIsFirecrawlStored(true);
      }
    }

    if (openaiKey) {
      setOpenaiApiKey(openaiKey);
      setIsOpenaiStored(true);
    } else {
      // Fallback to localStorage
      const storedOpenaiKey = apiService.getOpenaiApiKey();
      if (storedOpenaiKey) {
        setOpenaiApiKey(storedOpenaiKey);
        setIsOpenaiStored(true);
      }
    }

    // Only call onApiKeySet if both keys are configured
    if (bothConfigured || (firecrawlKey && openaiKey)) {
      onApiKeySet(firecrawlKey || "");
    }
  }, [onApiKeySet]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Remove all whitespace from the keys
    const cleanFirecrawlKey = firecrawlApiKey.trim().replace(/\s+/g, "");
    const cleanOpenaiKey = openaiApiKey.trim().replace(/\s+/g, "");

    if (!cleanFirecrawlKey) {
      setError("Firecrawl API key is required");
      return;
    }

    if (!cleanOpenaiKey) {
      setError("OpenAI API key is required");
      return;
    }

    // Validate Firecrawl key format
    if (!cleanFirecrawlKey.startsWith("fc-")) {
      setError(
        'Firecrawl API key must start with "fc-". Please enter the complete key as provided.',
      );
      return;
    }

    // Validate OpenAI key format (basic check)
    if (!cleanOpenaiKey.startsWith("sk-")) {
      setError(
        'OpenAI API key must start with "sk-". Please enter the complete key as provided.',
      );
      return;
    }

    setIsLoading(true);

    try {
      // Store both API keys
      apiService.setFirecrawlApiKey(cleanFirecrawlKey);
      apiService.setOpenaiApiKey(cleanOpenaiKey);
      setIsFirecrawlStored(true);
      setIsOpenaiStored(true);
      onApiKeySet(cleanFirecrawlKey);
    } catch (error: any) {
      console.error("Failed to set API keys:", error);
      setError(
        error.message ||
          "Failed to set API keys. Please check the format and try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearFirecrawlKey = () => {
    apiService.clearFirecrawlApiKey();
    setFirecrawlApiKey("");
    setIsFirecrawlStored(false);
    setError(null);
  };

  const handleClearOpenaiKey = () => {
    apiService.clearOpenaiApiKey();
    setOpenaiApiKey("");
    setIsOpenaiStored(false);
    setError(null);
  };

  return (
    <div className='space-y-6'>
      {/* Firecrawl API Key Form */}
      <div className='bg-white rounded-md'>
        <h3 className='text-md font-medium text-gray-900 mb-2'>
          Firecrawl API Key
        </h3>
        <div className='space-y-4'>
          <div className='relative'>
            <Input
              value={firecrawlApiKey}
              onChange={(e) => {
                setFirecrawlApiKey(e.target.value);
                setError(null);
              }}
              type={showFirecrawlPassword ? "text" : "password"}
              placeholder='Enter your Firecrawl API key (must start with fc-)'
              fullWidth
              disabled={isFirecrawlStored}
              required
              error={!!error}
              helperText={
                error ||
                'Required for website scraping. Must start with "fc-". Enter the key exactly as provided.'
              }
              className='pr-10'
            />
            <button
              type='button'
              className='absolute right-4 top-[14px] text-gray-500 hover:text-gray-700 focus:outline-none p-1'
              onClick={() => setShowFirecrawlPassword(!showFirecrawlPassword)}
              tabIndex={-1}
              aria-label={showFirecrawlPassword ? "Hide password" : "Show password"}>
              {showFirecrawlPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          <div className='flex gap-2'>
            {!isFirecrawlStored ? (
              <Button
                onClick={() => setIsFirecrawlStored(true)}
                fullWidth
                size='sm'
                squared>
                Mark as Saved
              </Button>
            ) : (
              <>
                <Button
                  variant='outline'
                  onClick={handleClearFirecrawlKey}
                  size='sm'
                  squared>
                  Change
                </Button>
                <Button disabled size='sm' className='flex-1' squared>
                  Key Saved ✓
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* OpenAI API Key Form */}
      <div className='bg-white rounded-md'>
        <h3 className='text-md font-medium text-gray-900 mb-2'>
          OpenAI API Key
        </h3>
        <div className='space-y-4'>
          <div className='relative'>
            <Input
              value={openaiApiKey}
              onChange={(e) => {
                setOpenaiApiKey(e.target.value);
                setError(null);
              }}
              type={showOpenaiPassword ? "text" : "password"}
              placeholder='Enter your OpenAI API key (must start with sk-)'
              fullWidth
              disabled={isOpenaiStored}
              required
              error={!!error}
              helperText={
                error ||
                'Required for AI analysis. Must start with "sk-". Enter the key exactly as provided.'
              }
              className='pr-10'
            />
            <button
              type='button'
              className='absolute right-4 top-[14px] text-gray-500 hover:text-gray-700 focus:outline-none p-1'
              onClick={() => setShowOpenaiPassword(!showOpenaiPassword)}
              tabIndex={-1}
              aria-label={showOpenaiPassword ? "Hide password" : "Show password"}>
              {showOpenaiPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          <div className='flex gap-2'>
            {!isOpenaiStored ? (
              <Button
                onClick={() => setIsOpenaiStored(true)}
                fullWidth
                size='sm'
                squared>
                Mark as Saved
              </Button>
            ) : (
              <>
                <Button
                  variant='outline'
                  onClick={handleClearOpenaiKey}
                  size='sm'
                  squared>
                  Change
                </Button>
                <Button disabled size='sm' className='flex-1' squared>
                  Key Saved ✓
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Save Both Keys Button */}
      <form onSubmit={handleSubmit}>
        <Button
          type='submit'
          isLoading={isLoading}
          fullWidth
          size='lg'
          disabled={!isFirecrawlStored || !isOpenaiStored}
          className='mt-4'>
          {isFirecrawlStored && isOpenaiStored ? "Save Both Keys" : "Configure Both Keys First"}
        </Button>
      </form>

      {/* Help Text */}
      <div className='mt-8 pt-4 border-t border-gray-200'>
        <h3 className='text-sm font-medium text-gray-700 mb-2'>
          About API Keys
        </h3>
        <p className='text-xs text-gray-600 mb-2'>
          <strong>Firecrawl API Key:</strong> Get your API key from{" "}
          <a
            href='https://firecrawl.dev'
            target='_blank'
            rel='noopener noreferrer'
            className='text-orange-500 hover:text-orange-600'>
            firecrawl.dev
          </a>
          . The key must start with 'fc-'.
        </p>
        <p className='text-xs text-gray-600 mb-2'>
          <strong>OpenAI API Key:</strong> Get your API key from{" "}
          <a
            href='https://platform.openai.com/api-keys'
            target='_blank'
            rel='noopener noreferrer'
            className='text-orange-500 hover:text-orange-600'>
            platform.openai.com
          </a>
          . The key must start with 'sk-'.
        </p>
        <div className='mt-3 p-2 bg-blue-50 rounded-md'>
          <p className='text-xs text-blue-700'>
            <strong>Note:</strong> Your API keys are stored locally in your browser and are never sent to our servers. 
            They are only used to make direct API calls to Firecrawl and OpenAI services.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ApiKeyForm;
