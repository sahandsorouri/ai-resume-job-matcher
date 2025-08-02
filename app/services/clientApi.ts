import OpenAI from "openai";
import { ResumeData, JobData } from "./firecrawl";

// Client-side job matching function
export async function matchJobsClient(
  profile: ResumeData,
  jobs: JobData[],
  analysis: string,
  apiKey: string
): Promise<{ jobs: JobData[] }> {
  try {
    // Check if we have jobs to process
    if (!jobs || !Array.isArray(jobs) || jobs.length === 0) {
      throw new Error("No jobs provided for matching");
    }

    // If jobs already have match scores, just return them
    if (jobs.length > 0 && jobs[0].matchScore) {
      return { jobs };
    }

    // In development/without an API key, return simulated scoring
    if (!apiKey || apiKey === "your_openai_api_key_here") {
      console.log("Using automatic job matching (no API key configured)");

      // Attempt to do basic matching based on skills and job requirements
      const matchedJobs = jobs.map((job: JobData, index: number) => {
        const userSkills = profile.skills || [];
        const jobKeywords = [
          ...(job.requirements || []),
          job.title.toLowerCase(),
          job.description.toLowerCase(),
        ];

        // Count how many user skills appear in the job description/requirements
        let matchCount = 0;
        let matchedSkills: string[] = [];

        userSkills.forEach((skill: string) => {
          const lowerSkill = skill.toLowerCase();
          if (
            jobKeywords.some((keyword) =>
              keyword.toLowerCase().includes(lowerSkill),
            )
          ) {
            matchCount++;
            matchedSkills.push(skill);
          }
        });

        // Calculate a match score based on skill matches and position in the list
        const baseScore = 70;
        const skillMatchPercentage =
          userSkills.length > 0
            ? Math.floor((matchCount / userSkills.length) * 25)
            : 15;
        const positionPenalty = Math.min(index * 2, 10);

        const calculatedScore = Math.max(
          40,
          Math.min(95, baseScore + skillMatchPercentage - positionPenalty),
        );

        // Create a meaningful match reason
        let matchReason = "This job aligns with your profile";
        if (matchedSkills.length > 0) {
          matchReason = `This position matches your skills in ${matchedSkills
            .slice(0, 3)
            .join(", ")}${
            matchedSkills.length > 3
              ? ` and ${matchedSkills.length - 3} more`
              : ""
          }.`;

          if (
            job.title.toLowerCase().includes(profile.title?.toLowerCase() || "")
          ) {
            matchReason +=
              " The job title is very similar to your current role.";
          }

          if (
            job.location?.toLowerCase().includes("remote") &&
            profile.summary?.toLowerCase().includes("remote")
          ) {
            matchReason +=
              " This is a remote position, which you indicated preference for.";
          }
        }

        return {
          ...job,
          matchScore: calculatedScore,
          matchReason: matchReason,
        };
      });

      // Sort jobs by match score (highest first)
      const sortedJobs = [...matchedJobs].sort(
        (a, b) => (b.matchScore || 0) - (a.matchScore || 0),
      );

      return { jobs: sortedJobs };
    }

    // Initialize OpenAI with valid API key
    const openai = new OpenAI({ 
      apiKey,
      dangerouslyAllowBrowser: true 
    });

    // Prepare the data for the OpenAI API
    const userSkills = profile.skills?.join(", ") || "";
    const userExperience =
      profile.experience
        ?.map((exp: any) => `${exp.position} at ${exp.company}`)
        .join(", ") || "";
    const userEducation =
      profile.education
        ?.map((edu: any) => `${edu.degree} from ${edu.institution}`)
        .join(", ") || "";

    // Creating a concise representation of the profile
    const profileSummary = `
      Name: ${profile.name || "Unknown"}
      Title: ${profile.title || "Unknown"}
      Skills: ${userSkills}
      Experience: ${userExperience}
      Education: ${userEducation}
      Summary: ${profile.summary || ""}
    `;

    // Prepare job data for matching
    const jobsData = jobs.map((job: JobData) => {
      return {
        title: job.title,
        company: job.company,
        description: job.description,
        requirements: job.requirements?.join(", ") || "",
        location: job.location || "",
        salaryRange: job.salaryRange || "",
        url: job.url || "",
      };
    });

    console.log("Calling OpenAI API for job matching...");

    // Call OpenAI API with o3 model
    const response = await openai.chat.completions.create({
      model: "o3",
      messages: [
        {
          role: "system",
          content: `You are a job matching expert. Your task is to match a candidate's profile with job listings and rank them by relevance. For each job, provide a match score (0-100) and a brief explanation of why the job is a good match. Focus on concrete skills, experience, and requirements rather than generic statements. Be specific about why each job is a good match.`,
        },
        {
          role: "user",
          content: `
            I need to match this candidate profile with job listings:
            
            CANDIDATE PROFILE:
            ${profileSummary}
            
            JOB LISTINGS (in JSON format):
            ${JSON.stringify(jobsData, null, 2)}
            
            ADDITIONAL ANALYSIS:
            ${analysis}
            
            For each job, provide:
            1. A match score from 0-100 (with high-quality matches being 70-95, average matches 40-70, low matches below 40)
            2. A specific explanation of why this job matches the candidate's skills and experience
            
            Return the results as a JSON array with each job having the original fields plus 'matchScore' and 'matchReason' fields.
            Format the response as: {"jobs": [...]}
          `,
        },
      ],
      response_format: { type: "json_object" },
    });

    // Parse the response
    const content = response.choices[0]?.message.content || "{}";
    console.log("OpenAI API response received");

    try {
      const matchedJobs = JSON.parse(content);

      // Combine the original job data with the match scores and reasons
      if (Array.isArray(matchedJobs.jobs)) {
        const enhancedJobs = matchedJobs.jobs
          .map((matchedJob: any) => {
            const originalJob = jobs.find(
              (job: JobData) =>
                job.title === matchedJob.title &&
                job.company === matchedJob.company,
            );
            if (originalJob) {
              return {
                ...originalJob,
                matchScore: matchedJob.matchScore || 0,
                matchReason: matchedJob.matchReason || "",
              };
            }
            return null;
          })
          .filter(Boolean)
          .sort((a: any, b: any) => (b.matchScore || 0) - (a.matchScore || 0));

        return { jobs: enhancedJobs };
      }

      console.warn("Unexpected response format from OpenAI");
      return { jobs };
    } catch (parseError) {
      console.error("Error parsing OpenAI response:", parseError);
      console.error("Raw response:", content);
      throw new Error("Failed to parse OpenAI response for job matching");
    }
  } catch (error) {
    console.error("Error in match-jobs client:", error);
    throw new Error("Failed to match jobs with profile");
  }
}

// Client-side resume summarization function
export async function summarizeResumeClient(
  file: File,
  apiKey: string
): Promise<{
  job_profiles: Array<{
    title: string;
    company: string;
    start_date: string;
    end_date: string;
    description?: string;
  }>;
  skills: string[];
  name?: string;
  title?: string;
  summary_text?: string;
}> {
  if (!apiKey) {
    throw new Error("OpenAI API key is required");
  }

  const openai = new OpenAI({ 
    apiKey,
    dangerouslyAllowBrowser: true 
  });

  try {
    console.log("Client-side resume summarization started");

    // Upload file
    const uploadedFile = await openai.files.create({
      file: file,
      purpose: "assistants",
    });

    // Create assistant
    const assistant = await openai.beta.assistants.create({
      name: "Resume Analyzer",
      instructions: `You are an expert resume analyzer. Extract relevant professional skills and experiences from the provided PDF resume file attached to the user message.

**Primary Task: Extract Skills**
- Focus on specific skills, technologies, tools, languages, frameworks, methodologies.
- Prioritize items listed in explicit "Skills" sections.

**Filtering Guidance:**
- Avoid generic category names (e.g., "Technical Skills").
- Generally exclude social platforms (LinkedIn) or basic software (Word) unless used technically.
- Exclude project/company names as skills.

**Output Format:**
Respond ONLY with a valid JSON object containing these keys:
- skills: string array of filtered, relevant skills found.
- job_profiles: array of objects {title, company, start_date, end_date, description}
- name: string (if found)
- title: string (if found)
- summary_text: string (if found)`,
      model: "gpt-4o",
      tools: [{ type: "code_interpreter" }],
    });

    // Create thread
    const thread = await openai.beta.threads.create();

    // Add message with file
    await openai.beta.threads.messages.create(thread.id, {
      role: "user",
      content:
        "Please analyze the attached resume PDF and extract the skills and experience according to your instructions. Respond only with the JSON object.",
      attachments: [{ file_id: uploadedFile.id, tools: [{ type: "code_interpreter" }] }],
    });

    // Run assistant
    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: assistant.id,
    });

    // Poll for completion
    let completedRun = await openai.beta.threads.runs.retrieve(thread.id, run.id);
    while (completedRun.status === "queued" || completedRun.status === "in_progress") {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      completedRun = await openai.beta.threads.runs.retrieve(thread.id, run.id);
    }

    if (completedRun.status !== "completed") {
      throw new Error(`Assistant run failed with status: ${completedRun.status}`);
    }

    // Get response
    const messages = await openai.beta.threads.messages.list(thread.id, {
      order: "desc",
      limit: 1,
    });

    const assistantMessage = messages.data.find((m) => m.role === "assistant");
    if (!assistantMessage || assistantMessage.content[0]?.type !== "text") {
      throw new Error("Could not retrieve a valid text response from the assistant.");
    }

    const responseText = assistantMessage.content[0].text.value;
    
    // Parse JSON response
    let jsonString = responseText
      .replace(/```json\s*/g, "")
      .replace(/```\s*$/g, "");

    const match = jsonString.match(/\{[\s\S]*\}/);
    if (match) {
      jsonString = match[0];
    }

    const extractedData = JSON.parse(jsonString);

    return {
      job_profiles: extractedData.job_profiles || [],
      skills: extractedData.skills || [],
      name: extractedData.name,
      title: extractedData.title,
      summary_text: extractedData.summary_text,
    };
  } catch (error: any) {
    console.error("Error in summarize resume client:", error);
    throw new Error(error.message || "Failed to process resume");
  }
} 