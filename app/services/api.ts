import {
  firecrawlService,
  ResumeData,
  JobData,
  JobSearchFilters,
} from "./firecrawl";
import { matchJobsClient, summarizeResumeClient } from "./clientApi";
import { getApiKeys } from "../utils/env";

// Progress update callback type
export type ProgressCallback = (message: string) => void;

class ApiService {
  private FIRECRAWL_API_KEY_STORAGE_KEY = "firecrawl-api-key";
  private OPENAI_API_KEY_STORAGE_KEY = "openai-api-key";

  // Set the Firecrawl API key in local storage
  setFirecrawlApiKey(key: string) {
    if (typeof window !== "undefined") {
      localStorage.setItem(this.FIRECRAWL_API_KEY_STORAGE_KEY, key);
      // Also set the key in the firecrawl service
      firecrawlService.setApiKey(key);
    }
  }

  // Get the Firecrawl API key from local storage or environment
  getFirecrawlApiKey(): string | null {
    const { firecrawlKey } = getApiKeys();
    if (firecrawlKey) {
      return firecrawlKey;
    }
    if (typeof window !== "undefined") {
      return localStorage.getItem(this.FIRECRAWL_API_KEY_STORAGE_KEY);
    }
    return null;
  }

  // Clear the Firecrawl API key from local storage
  clearFirecrawlApiKey(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem(this.FIRECRAWL_API_KEY_STORAGE_KEY);
  }

  // Set the OpenAI API key in local storage
  setOpenaiApiKey(key: string) {
    if (typeof window !== "undefined") {
      localStorage.setItem(this.OPENAI_API_KEY_STORAGE_KEY, key);
    }
  }

  // Get the OpenAI API key from local storage or environment
  getOpenaiApiKey(): string | null {
    const { openaiKey } = getApiKeys();
    if (openaiKey) {
      return openaiKey;
    }
    if (typeof window !== "undefined") {
      return localStorage.getItem(this.OPENAI_API_KEY_STORAGE_KEY);
    }
    return null;
  }

  // Clear the OpenAI API key from local storage
  clearOpenaiApiKey(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem(this.OPENAI_API_KEY_STORAGE_KEY);
  }

  // Process a profile URL and find matching jobs
  async analyzeProfileUrl(
    url: string,
    updateProgress: ProgressCallback = () => {},
    initialFilters?: JobSearchFilters,
  ): Promise<{
    profile: ResumeData;
    jobs: JobData[];
    analysis: string;
  }> {
    if (!url) {
      throw new Error("URL is required");
    }

    try {
      // Extract profile data from URL
      updateProgress("Extracting profile information...");
      const profile = await firecrawlService.extractProfile(url);

      // Find job matches based on profile
      updateProgress("Finding job matches based on your profile...");
      if (
        initialFilters &&
        (initialFilters.workType.length > 0 ||
          initialFilters.location ||
          initialFilters.salaryRange ||
          initialFilters.experienceLevel)
      ) {
        updateProgress("Applying your job filters to the search...");
      }

      const { jobs, analysis } = await firecrawlService.findJobMatches(
        profile,
        10,
        updateProgress,
        initialFilters, 
      );

      // Match jobs to the profile using client-side API
      updateProgress("Calculating match scores for job listings...");
      const openaiApiKey = this.getOpenaiApiKey();
      if (!openaiApiKey) {
        throw new Error("OpenAI API key is required for job matching");
      }
      const matchedJobs = await matchJobsClient(profile, jobs, analysis, openaiApiKey);

      return { profile, jobs: matchedJobs.jobs, analysis };
    } catch (error) {
      console.error("API service error:", error);
      throw error;
    }
  }

  // Process a resume file and find matching jobs
  async analyzeResumeFile(
    file: File,
    updateProgress: ProgressCallback = () => {},
    initialFilters?: JobSearchFilters,
  ): Promise<{
    profile: ResumeData;
    jobs: JobData[];
    analysis: string;
  }> {
    if (!file) {
      throw new Error("Resume file is required");
    }

    try {
      updateProgress("Processing your resume...");
      const openaiApiKey = this.getOpenaiApiKey();
      if (!openaiApiKey) {
        throw new Error("OpenAI API key is required for resume processing");
      }
      const summary = await summarizeResumeClient(file, openaiApiKey);
      
      // Convert summary to ResumeData format
      const profile: ResumeData = {
        name: summary.name || "Unknown",
        title: summary.title || "Professional",
        skills: summary.skills || [],
        experience: summary.job_profiles.map((job) => ({
          position: job.title,
          company: job.company,
          startDate: job.start_date,
          endDate: job.end_date,
          description: job.description || "",
        })),
        education: [],
        summary: summary.summary_text || "",
      };

      // Find job matches based on extracted profile
      updateProgress("Finding job matches based on your resume...");
      if (
        initialFilters &&
        (initialFilters.workType.length > 0 ||
          initialFilters.location ||
          initialFilters.salaryRange ||
          initialFilters.experienceLevel)
      ) {
        updateProgress("Applying your job filters to the search...");
      }

      const { jobs, analysis } = await firecrawlService.findJobMatches(
        profile,
        10,
        updateProgress,
        initialFilters, // Pass initial filters if provided
      );

      // Match jobs to the profile using client-side API
      updateProgress("Calculating match scores for job listings...");
      const matchedJobs = await matchJobsClient(profile, jobs, analysis, openaiApiKey);

      return { profile, jobs: matchedJobs.jobs, analysis };
    } catch (error) {
      console.error("API service error:", error);
      throw error;
    }
  }



  // Method to handle job filtering with filters
  async findJobsWithFilters(
    profile: ResumeData,
    filters: JobSearchFilters,
    updateProgress: ProgressCallback = () => {},
  ): Promise<{ jobs: JobData[]; analysis: string }> {
    if (!profile) {
      throw new Error("Profile data is required for job matching");
    }

    updateProgress("Starting job search with filters...");

    // Call the findJobMatches method with filters
    const results = await firecrawlService.findJobMatches(
      profile,
      10, // maxResults
      updateProgress,
      filters,
    );

    // Match jobs to the profile using client-side API
    updateProgress("Calculating match scores for filtered job listings...");
    const openaiApiKey = this.getOpenaiApiKey();
    if (!openaiApiKey) {
      throw new Error("OpenAI API key is required for job matching");
    }
    const matchedJobs = await matchJobsClient(profile, results.jobs, results.analysis, openaiApiKey);

    return {
      jobs: matchedJobs.jobs,
      analysis: results.analysis,
    };
  }

  // Debug function to test PDF.js worker configuration
  async debugPdfJs(): Promise<string> {
    return firecrawlService.debugPdfJs();
  }
}

export const apiService = new ApiService();
