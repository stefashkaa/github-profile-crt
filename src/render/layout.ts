export interface ScreenLayout {
  margin: { top: number; right: number; bottom: number; left: number };
  weekGap: number;
  barWidth: number;
  headerHeight: number;
  subHeaderHeight: number;
  monthRowHeight: number;
  chartTop: number;
  chartHeight: number;
  chartBottom: number;
  heatmapTop: number;
  heatmapGap: number;
  footerY: number;
  width: number;
  height: number;
}

export function buildLayout(weekCount: number): ScreenLayout {
  const margin = { top: 20, right: 28, bottom: 22, left: 28 };
  const weekGap = 6;
  const barWidth = 7;
  const headerHeight = 0;
  const subHeaderHeight = 0;
  const monthRowHeight = 16;
  const chartTop = margin.top + headerHeight + subHeaderHeight + monthRowHeight + 10;
  const chartHeight = 170;
  const chartBottom = chartTop + chartHeight;

  const heatmapTop = chartBottom + 22;
  const heatmapGap = 11;
  const footerY = heatmapTop + heatmapGap * 6 + 18;

  const width = margin.left + margin.right + weekCount * (barWidth + weekGap);
  const height = footerY + margin.bottom;

  return {
    margin,
    weekGap,
    barWidth,
    headerHeight,
    subHeaderHeight,
    monthRowHeight,
    chartTop,
    chartHeight,
    chartBottom,
    heatmapTop,
    heatmapGap,
    footerY,
    width,
    height
  };
}
