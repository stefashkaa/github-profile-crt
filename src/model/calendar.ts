export type ContributionLevel = 'NONE' | 'FIRST_QUARTILE' | 'SECOND_QUARTILE' | 'THIRD_QUARTILE' | 'FOURTH_QUARTILE';

export interface ContributionDay {
  date: string;
  contributionCount: number;
  contributionLevel: ContributionLevel;
  weekday: number;
  color: string;
}

export interface ContributionWeek {
  firstDay: string;
  contributionDays: ContributionDay[];
}

export interface ContributionMonth {
  firstDay: string;
  name: string;
  year: number;
}

export interface ContributionCalendar {
  totalContributions: number;
  weeks: ContributionWeek[];
  months: ContributionMonth[];
}

export interface WeeklyStats {
  index: number;
  firstDay: string;
  total: number;
  activeDays: number;
  peak: number;
  intensity: number;
  days: ContributionDay[];
}

export interface MonthLabel {
  index: number;
  label: string;
}

export function levelWeight(level: ContributionLevel): number {
  switch (level) {
    case 'NONE':
      return 0;
    case 'FIRST_QUARTILE':
      return 1;
    case 'SECOND_QUARTILE':
      return 2;
    case 'THIRD_QUARTILE':
      return 3;
    case 'FOURTH_QUARTILE':
      return 4;
    default:
      return 0;
  }
}

export function levelOpacity(level: ContributionLevel): number {
  switch (level) {
    case 'NONE':
      return 0.1;
    case 'FIRST_QUARTILE':
      return 0.24;
    case 'SECOND_QUARTILE':
      return 0.42;
    case 'THIRD_QUARTILE':
      return 0.62;
    case 'FOURTH_QUARTILE':
      return 0.88;
    default:
      return 0.2;
  }
}

export function formatDateShort(dateString: string): string {
  const date = new Date(dateString);
  const year = String(date.getUTCFullYear()).slice(-2);
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');

  return `${year}.${month}.${day}`;
}

export function buildMonthLabels(weeks: ContributionWeek[], months: ContributionMonth[]): MonthLabel[] {
  const labels: MonthLabel[] = [];

  for (const month of months) {
    const monthStartDate = new Date(month.firstDay);
    const weekIndex = weeks.findIndex((week) => new Date(week.firstDay) >= monthStartDate);

    if (weekIndex >= 0) {
      labels.push({ index: weekIndex, label: month.name.slice(0, 3).toUpperCase() });
    }
  }

  return labels;
}
