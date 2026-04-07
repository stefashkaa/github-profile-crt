export interface ContributionActivityStats {
  commits: number;
  pullRequests: number;
  issues: number;
  reviews: number;
}

export interface LanguageSlice {
  name: string;
  color: string;
  size: number;
  percentage: number;
}

export interface ProfileInsights {
  activity: ContributionActivityStats;
  languages: LanguageSlice[];
  totalLanguageSize: number;
}

