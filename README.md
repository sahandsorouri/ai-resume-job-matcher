# Deep Job Researcher

> AI job matcher for PMs: upload a resume, crawl live listings, rank matches with explanations.

**Live:** [deep-job-researcher.sorouri.com](https://deep-job-researcher.sorouri.com)

## The Problem

Job search is slow when you manually scan boards and guess fit. I wanted one flow: parse my resume once, pull real postings from the web, and see why each role matches or not.

## What I Built

A Next.js app I use in my own job hunt. Upload a PDF resume, set filters (role, location, work type, salary band), and get a ranked list of jobs with match scores and short explanations.

Built and deployed by me. Not a team project.

## Key Features

- PDF resume upload with skill and experience extraction (OpenAI)
- Web job discovery via Firecrawl
- Filters: work type, location, salary, experience level
- Per-job match score with a plain-language reason

## Stack

`Next.js 15` `TypeScript` `React 19` `Tailwind CSS` `OpenAI` `Firecrawl` `Cloudflare Pages`

## How to Run

```bash
npm install
cp .env.example .env.local   # add OPENAI_API_KEY; Firecrawl key via app settings
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Results / Usage

- Running in production at [deep-job-researcher.sorouri.com](https://deep-job-researcher.sorouri.com)
- Built to dogfood my own PM job search workflow

## About

Built by [Sahand Sorouri](https://github.com/sahandsorouri) — AI Product Manager.
