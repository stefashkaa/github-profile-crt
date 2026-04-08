import type { ContributionWeek, WeeklyStats } from './calendar';
import { levelWeight } from './calendar';
import { average, maxOf } from '../utils/math';

export function deriveWeeklyStats(weeks: ContributionWeek[]): WeeklyStats[] {
  return weeks.map((week, index) => {
    const totals = week.contributionDays.map((day) => day.contributionCount);

    return {
      index,
      firstDay: week.firstDay,
      total: totals.reduce((sum, value) => sum + value, 0),
      activeDays: week.contributionDays.filter((day) => day.contributionCount > 0).length,
      peak: maxOf(totals),
      intensity: average(week.contributionDays.map((day) => levelWeight(day.contributionLevel))),
      days: week.contributionDays
    };
  });
}
