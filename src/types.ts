export interface RepositoryAnalysis {
  id: number;
  explosionScore: number;
  keyInnovation: string;
  targetAudience: string;
  whyBooming: string;
  subCategory: string;
  primaryUseCases: string[];
}

export interface Repository {
  id: number;
  name: string;
  fullName: string;
  description: string;
  stars: number;
  forks: number;
  language: string;
  topics: string[];
  url: string;
  owner: string;
  ownerAvatar: string;
  created: string;
  analysis: RepositoryAnalysis;
}

export interface IntelligenceInsights {
  trendTitle: string;
  trendSummary: string;
  keyTakeaway: string;
  growthDrivers: string[];
}

export interface ScanResult {
  repositories: Repository[];
  insights: IntelligenceInsights;
}

export interface ComparisonResult {
  comparisonSummary: string;
  keyDifferentiator: string;
  recommendedScenario: string;
  synergyPotential: string;
}

export type ScanCategory = "all" | "agents" | "llms" | "multimedia" | "infra";
