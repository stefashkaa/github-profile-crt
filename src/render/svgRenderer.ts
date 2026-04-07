import type { VisualConfig } from "../config/env";
import {
  buildMonthLabels,
  formatDateShort,
  levelOpacity,
  type ContributionCalendar,
  type WeeklyStats
} from "../model/calendar";
import type { ProfileInsights } from "../model/insights";
import { deriveWeeklyStats } from "../model/weekly";
import { clamp, maxOf } from "../utils/math";
import { escapeXml } from "../utils/xml";
import { buildLayout } from "./layout";
import { buildAreaPath, buildSteppedPath, type ChartPoint } from "./paths";
import type { ThemeableConfig } from "./themes";

export interface SvgRenderInput {
  username: string;
  themeConfig: ThemeableConfig;
  calendar: ContributionCalendar;
  insights?: ProfileInsights | null;
  visual: VisualConfig;
}

function spectrumHueAt(index: number, count: number): number {
  if (count <= 1) {
    return 260;
  }

  const progress = index / (count - 1);
  return 260 + progress * 360;
}

function spectrumColor(index: number, count: number, saturation: number, lightness: number): string {
  return `hsl(${spectrumHueAt(index, count).toFixed(1)}, ${saturation}%, ${lightness}%)`;
}

const BAR_DEPTH_X = 2;
const BAR_DEPTH_Y = 2;
const PULSE_PATH_LENGTH = 1000;

interface BarGeometry {
  x: number;
  y: number;
  height: number;
  centerX: number;
  lineX: number;
  lineY: number;
}

function resolveBarGeometry(
  index: number,
  total: number,
  maxWeekly: number,
  layout: ReturnType<typeof buildLayout>
): BarGeometry {
  const x = layout.margin.left + index * (layout.barWidth + layout.weekGap) + 0.5;
  const normalized = total / maxWeekly;
  const height = Math.max(4, normalized * (layout.chartHeight - 8));
  const y = layout.chartBottom - height + 0.5;
  const centerX = x + Math.floor(layout.barWidth / 2);

  return {
    x,
    y,
    height: Math.max(1, Math.floor(height)),
    centerX,
    lineX: centerX + BAR_DEPTH_X * 0.35,
    lineY: y - BAR_DEPTH_Y * 0.55
  };
}

function renderBars(
  weekly: WeeklyStats[],
  geometries: BarGeometry[],
  layout: ReturnType<typeof buildLayout>,
  themeConfig: ThemeableConfig,
  primary: string,
  primarySoft: string,
  useSpectrumChart: boolean
): string {
  return weekly
    .map((week, index) => {
      const geometry = geometries[index]!;

      const intensity = clamp(
        themeConfig.barMinOpacity + (week.intensity / 4) * (themeConfig.barMaxOpacity - themeConfig.barMinOpacity),
        themeConfig.barMinOpacity,
        themeConfig.barMaxOpacity
      );

      const title = `${week.firstDay}: ${week.total} contributions | active days: ${week.activeDays} | peak day: ${week.peak}`;
      const barFrontFill = useSpectrumChart ? spectrumColor(index, weekly.length, 92, 54) : "url(#barGradient)";
      const barTopFill = useSpectrumChart ? spectrumColor(index, weekly.length, 97, 73) : primarySoft;
      const barSideFill = useSpectrumChart ? spectrumColor(index, weekly.length, 88, 42) : primary;
      const topFace = `${geometry.x},${geometry.y} ${geometry.x + layout.barWidth},${geometry.y} ${geometry.x + layout.barWidth + BAR_DEPTH_X},${geometry.y - BAR_DEPTH_Y} ${geometry.x + BAR_DEPTH_X},${geometry.y - BAR_DEPTH_Y}`;
      const sideFace = `${geometry.x + layout.barWidth},${geometry.y} ${geometry.x + layout.barWidth + BAR_DEPTH_X},${geometry.y - BAR_DEPTH_Y} ${geometry.x + layout.barWidth + BAR_DEPTH_X},${geometry.y + geometry.height - BAR_DEPTH_Y} ${geometry.x + layout.barWidth},${geometry.y + geometry.height}`;

      return `
      <g shape-rendering="crispEdges">
        <title>${escapeXml(title)}</title>
        <polygon
          points="${sideFace}"
          fill="${barSideFill}"
          opacity="${Math.max(0.14, intensity * 0.62)}"
        />
        <rect
          x="${geometry.x}"
          y="${geometry.y}"
          width="${layout.barWidth}"
          height="${geometry.height}"
          rx="${themeConfig.barRadius}"
          fill="${barFrontFill}"
          opacity="${intensity}"
        />
        <polygon
          points="${topFace}"
          fill="${barTopFill}"
          opacity="${Math.min(0.97, intensity + 0.18)}"
        />
        <line
          x1="${geometry.x + BAR_DEPTH_X}"
          y1="${geometry.y - BAR_DEPTH_Y}"
          x2="${geometry.x + layout.barWidth + BAR_DEPTH_X}"
          y2="${geometry.y - BAR_DEPTH_Y}"
          stroke="${barTopFill}"
          stroke-opacity="${Math.min(0.98, intensity + 0.22)}"
          stroke-width="1"
        />
      </g>
    `;
    })
    .join("\n");
}

function renderSignalDropLines(
  points: ChartPoint[],
  geometries: BarGeometry[],
  themeConfig: ThemeableConfig,
  useSpectrumChart: boolean,
  primarySoft: string
): string {
  return points
    .map((point, index) => {
      if (index % 3 !== 0) {
        return "";
      }

      const geometry = geometries[index]!;

      if (point.y >= geometry.y) {
        return "";
      }

      const stroke = useSpectrumChart ? spectrumColor(index, points.length, 92, 72) : primarySoft;
      const opacity = Math.max(0.08, themeConfig.lineGlowOpacity * 0.42);

      return `<line x1="${point.x}" y1="${point.y + 0.4}" x2="${point.x}" y2="${geometry.y}" stroke="${stroke}" stroke-opacity="${opacity}" stroke-width="1" shape-rendering="crispEdges"/>`;
    })
    .join("\n");
}

function polarToCartesian(centerX: number, centerY: number, radius: number, angleDegrees: number): { x: number; y: number } {
  const angleRadians = (angleDegrees - 90) * (Math.PI / 180);

  return {
    x: centerX + radius * Math.cos(angleRadians),
    y: centerY + radius * Math.sin(angleRadians)
  };
}

function renderLanguageDonut(
  insights: ProfileInsights,
  layout: ReturnType<typeof buildLayout>,
  dashboardTop: number,
  themeConfig: ThemeableConfig,
  useSpectrumChart: boolean
): string {
  const centerX = layout.margin.left + 86;
  const centerY = dashboardTop + 42;
  const radius = 27;
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * radius;
  const legendX = centerX + 46;
  const legendStartY = centerY - 16;
  const titleY = centerY - 46;
  const hasLanguageData = insights.languages.length > 0 && insights.totalLanguageSize > 0;
  const baseRingStroke = useSpectrumChart ? "hsl(250, 35%, 45%)" : themeConfig.palette.textDim;
  const ringDuration = Math.max(3.2, themeConfig.sweepDuration * 1.2).toFixed(2);

  if (!hasLanguageData) {
    return `
    <g>
      <text x="${centerX}" y="${titleY}" class="dash-title" text-anchor="middle">LANGS</text>
      <circle cx="${centerX}" cy="${centerY}" r="${radius}" fill="none" stroke="${baseRingStroke}" stroke-opacity="0.26" stroke-width="${strokeWidth}"/>
      <circle cx="${centerX}" cy="${centerY}" r="${radius - strokeWidth * 0.48}" fill="${themeConfig.palette.bg1}" fill-opacity="0.72"/>
      <text x="${centerX}" y="${centerY + 3}" class="dash-label" text-anchor="middle">NO DATA</text>
    </g>
    `;
  }

  let consumedLength = 0;
  const slices = insights.languages
    .map((language, index) => {
      const percentage = language.percentage;
      const length = percentage * circumference;
      const color = language.color || (useSpectrumChart
        ? spectrumColor(index, insights.languages.length, 86, 62)
        : themeConfig.palette.primarySoft);
      const dashOffset = -consumedLength;
      consumedLength += length;
      const animationDelay = (index * 0.12).toFixed(2);

      return `
      <circle
        cx="${centerX}"
        cy="${centerY}"
        r="${radius}"
        fill="none"
        stroke="${color}"
        stroke-width="${strokeWidth}"
        stroke-linecap="butt"
        stroke-dasharray="${length.toFixed(2)} ${(circumference - length).toFixed(2)}"
        stroke-dashoffset="${dashOffset.toFixed(2)}"
        transform="rotate(-90 ${centerX} ${centerY})"
      >
        <animate
          attributeName="stroke-dasharray"
          values="0 ${circumference.toFixed(2)};${length.toFixed(2)} ${(circumference - length).toFixed(2)}"
          dur="0.95s"
          begin="${animationDelay}s"
          fill="freeze"
        />
      </circle>
      `;
    })
    .join("\n");

  const legend = insights.languages
    .slice(0, 5)
    .map((language, index) => {
      const y = legendStartY + index * 10;
      const color = language.color || (useSpectrumChart
        ? spectrumColor(index, insights.languages.length, 86, 62)
        : themeConfig.palette.primarySoft);
      const width = Math.max(2, Math.round(language.percentage * 40));
      const delay = (index * 0.12 + 0.22).toFixed(2);

      return `
      <rect x="${legendX}" y="${y - 5}" width="6" height="6" rx="1" fill="${color}"/>
      <rect x="${legendX + 10}" y="${y - 5}" width="40" height="4" rx="1.2" fill="${themeConfig.palette.textDim}" fill-opacity="0.18"/>
      <rect x="${legendX + 10}" y="${y - 5}" width="${width}" height="4" rx="1.2" fill="${color}" fill-opacity="0.9">
        <animate attributeName="width" values="0;${width}" dur="0.8s" begin="${delay}s" fill="freeze"/>
      </rect>
      <text x="${legendX + 53}" y="${y}" class="dash-label">${escapeXml(language.name.toUpperCase())} ${(language.percentage * 100).toFixed(0)}%</text>
      `;
    })
    .join("\n");

  return `
    <g>
      <text x="${centerX}" y="${titleY}" class="dash-title" text-anchor="middle">LANGS</text>
      <circle cx="${centerX}" cy="${centerY}" r="${radius}" fill="none" stroke="${baseRingStroke}" stroke-opacity="0.18" stroke-width="${strokeWidth}"/>
      <g>
        ${slices}
        <animateTransform
          attributeName="transform"
          type="rotate"
          values="0 ${centerX} ${centerY};360 ${centerX} ${centerY}"
          dur="${ringDuration}s"
          repeatCount="indefinite"
        />
      </g>
      <circle cx="${centerX}" cy="${centerY}" r="${radius - strokeWidth * 0.47}" fill="${themeConfig.palette.bg1}" fill-opacity="0.74"/>
      ${legend}
    </g>
  `;
}

function renderActivityRadar(
  insights: ProfileInsights,
  layout: ReturnType<typeof buildLayout>,
  dashboardTop: number,
  themeConfig: ThemeableConfig,
  useSpectrumChart: boolean
): string {
  const centerX = layout.width - layout.margin.right - 112;
  const centerY = dashboardTop + 42;
  const radius = 40;
  const labels = ["COMMIT", "PR", "ISSUE", "REVIEW"];
  const values = [
    insights.activity.commits,
    insights.activity.pullRequests,
    insights.activity.issues,
    insights.activity.reviews
  ];
  const maxLog = Math.max(1, ...values.map((value) => Math.log10(value + 1)));
  const metricRadii = values.map((value) => {
    if (value <= 0) {
      return radius * 0.12;
    }

    const normalized = Math.log10(value + 1) / maxLog;
    return radius * (0.22 + normalized * 0.78);
  });
  const axisCount = labels.length;
  const stepAngle = 360 / axisCount;
  const angles = labels.map((_, index) => -90 + index * stepAngle);
  const radarStroke = useSpectrumChart ? "url(#spectrumStrokeGradient)" : themeConfig.palette.primary;
  const radarFill = useSpectrumChart ? "url(#spectrumAreaGradient)" : "url(#areaGradient)";
  const radarPulseDuration = Math.max(2.8, themeConfig.sweepDuration * 1.06).toFixed(2);
  const radarSweepDuration = Math.max(2.6, themeConfig.sweepDuration * 0.86).toFixed(2);
  const totalActivity = values.reduce((sum, value) => sum + value, 0);
  const labelGap = 12;

  const ringPolygons = [0.2, 0.4, 0.6, 0.8, 1]
    .map((ring) => {
      const ringPoints = angles
        .map((angle) => {
          const point = polarToCartesian(centerX, centerY, radius * ring, angle);
          return `${point.x.toFixed(2)},${point.y.toFixed(2)}`;
        })
        .join(" ");
      const opacity = ring === 1 ? 0.28 : 0.18;

      return `<polygon points="${ringPoints}" fill="none" stroke="${themeConfig.palette.textDim}" stroke-opacity="${opacity}" stroke-width="1"/>`;
    })
    .join("\n");

  const axes = angles
    .map((angle) => {
      const edge = polarToCartesian(centerX, centerY, radius, angle);
      return `<line x1="${centerX}" y1="${centerY}" x2="${edge.x.toFixed(2)}" y2="${edge.y.toFixed(2)}" stroke="${themeConfig.palette.textDim}" stroke-opacity="0.24" stroke-width="1"/>`;
    })
    .join("\n");

  const leftAxisPoint = polarToCartesian(centerX, centerY, radius, angles[0]!);
  const topAxisPoint = polarToCartesian(centerX, centerY, radius, angles[1]!);
  const rightAxisPoint = polarToCartesian(centerX, centerY, radius, angles[2]!);
  const bottomAxisPoint = polarToCartesian(centerX, centerY, radius, angles[3]!);
  const commitLabelX = leftAxisPoint.x - labelGap;
  const issueLabelX = rightAxisPoint.x + labelGap;
  const sideLabelY = centerY;
  const prLabelY = topAxisPoint.y - labelGap;
  const reviewLabelY = bottomAxisPoint.y + labelGap;
  const headerY = prLabelY - 10;
  const labelText = [
    `<text x="${commitLabelX.toFixed(2)}" y="${sideLabelY.toFixed(2)}" class="dash-label" text-anchor="end" dominant-baseline="middle">COMMIT</text>`,
    `<text x="${centerX}" y="${prLabelY.toFixed(2)}" class="dash-label" text-anchor="middle" dominant-baseline="middle">PR</text>`,
    `<text x="${issueLabelX.toFixed(2)}" y="${sideLabelY.toFixed(2)}" class="dash-label" text-anchor="start" dominant-baseline="middle">ISSUE</text>`,
    `<text x="${centerX}" y="${reviewLabelY.toFixed(2)}" class="dash-label" text-anchor="middle" dominant-baseline="middle">REVIEW</text>`
  ].join("\n");

  const metricPoints = (radii: number[]): string => radii
    .map((metricRadius, index) => {
      const point = polarToCartesian(centerX, centerY, metricRadius, angles[index]!);
      return `${point.x.toFixed(2)},${point.y.toFixed(2)}`;
    })
    .join(" ");
  const basePoints = metricPoints(metricRadii);
  const pulsePoints = metricPoints(metricRadii.map((value) => Math.min(radius, value * 1.07)));
  const relaxedPoints = metricPoints(metricRadii.map((value) => Math.max(radius * 0.2, value * 0.9)));
  const metricNodes = metricRadii
    .map((metricRadius, index) => {
      const point = polarToCartesian(centerX, centerY, metricRadius, angles[index]!);
      const nodeColor = useSpectrumChart
        ? spectrumColor(index, metricRadii.length, 92, 74)
        : themeConfig.palette.primarySoft;

      return `
      <circle cx="${point.x.toFixed(2)}" cy="${point.y.toFixed(2)}" r="2.2" fill="${nodeColor}" opacity="0.92">
        <animate attributeName="r" values="1.8;2.9;1.8" dur="${(2.2 + index * 0.35).toFixed(2)}s" repeatCount="indefinite"/>
      </circle>
      `;
    })
    .join("\n");

  return `
    <g>
      <text x="${centerX}" y="${headerY}" class="dash-label" text-anchor="middle">TOTAL ${totalActivity}</text>
      ${ringPolygons}
      ${axes}
      <line
        x1="${centerX}"
        y1="${centerY}"
        x2="${centerX}"
        y2="${centerY - radius}"
        stroke="${themeConfig.palette.primarySoft}"
        stroke-opacity="0.22"
        stroke-width="1.15"
      >
        <animateTransform
          attributeName="transform"
          type="rotate"
          values="0 ${centerX} ${centerY};360 ${centerX} ${centerY}"
          dur="${radarSweepDuration}s"
          repeatCount="indefinite"
        />
      </line>
      <polygon points="${basePoints}" fill="${radarFill}" fill-opacity="0.28" stroke="${radarStroke}" stroke-opacity="0.95" stroke-width="1.6">
        <animate
          attributeName="points"
          values="${basePoints};${pulsePoints};${basePoints};${relaxedPoints};${basePoints}"
          dur="${radarPulseDuration}s"
          repeatCount="indefinite"
        />
      </polygon>
      ${metricNodes}
      ${labelText}
    </g>
  `;
}

function renderDashboardPanels(
  insights: ProfileInsights | null | undefined,
  layout: ReturnType<typeof buildLayout>,
  dashboardTop: number,
  themeConfig: ThemeableConfig,
  useSpectrumChart: boolean
): string {
  if (!insights) {
    return `
    <text x="${layout.width / 2}" y="${dashboardTop + 42}" class="dash-label" text-anchor="middle">INSIGHTS UNAVAILABLE</text>
    `;
  }

  return `
  ${renderLanguageDonut(insights, layout, dashboardTop, themeConfig, useSpectrumChart)}
  ${renderActivityRadar(insights, layout, dashboardTop, themeConfig, useSpectrumChart)}
  `;
}

function renderMonthLabels(
  weeklyLength: number,
  firstX: number,
  step: number,
  calendar: ContributionCalendar,
  y: number
): string {
  const labels = buildMonthLabels(calendar.weeks, calendar.months);

  return labels
    .filter(({ index }) => index >= 0 && index < weeklyLength)
    .map(({ index, label }) => {
      const x = firstX + index * step;
      return `<text x="${x}" y="${y}" class="month">${escapeXml(label)}</text>`;
    })
    .join("\n");
}

function renderDotGrid(
  weekly: WeeklyStats[],
  layout: ReturnType<typeof buildLayout>,
  primary: string,
  useSpectrumChart: boolean
): string {
  return weekly
    .map((week, weekIndex) => {
      const centerX =
        layout.margin.left + weekIndex * (layout.barWidth + layout.weekGap) + Math.floor(layout.barWidth / 2) + 0.5;
      const dotColor = useSpectrumChart ? spectrumColor(weekIndex, weekly.length, 88, 56) : primary;

      return week.days
        .map((day, row) => {
          const centerY = layout.heatmapTop + row * layout.heatmapGap;

          return `
        <rect
          x="${centerX - 2}"
          y="${centerY - 2}"
          width="4"
          height="4"
          rx="0.8"
          fill="${dotColor}"
          opacity="${levelOpacity(day.contributionLevel)}"
          shape-rendering="crispEdges"
        >
          <title>${escapeXml(`${formatDateShort(day.date)} | ${day.contributionCount} contributions`)}</title>
        </rect>
      `;
        })
        .join("\n");
    })
    .join("\n");
}

export function renderCrtContributionSvg(input: SvgRenderInput): string {
  const { username, themeConfig, calendar, insights, visual } = input;
  const palette = themeConfig.palette;
  const useSpectrumChart = themeConfig.spectrumChart === true;
  const dashboardMode = visual.layoutMode === "dashboard";
  const layout = buildLayout(calendar.weeks.length);
  const dashboardTopGap = dashboardMode ? 30 : 0;
  const dashboardFooterGap = dashboardMode ? 52 : 0;
  const dashboardTop = layout.heatmapTop + dashboardTopGap;
  const footerY = layout.footerY + dashboardTopGap + dashboardFooterGap;
  const canvasHeight = layout.height + dashboardTopGap + dashboardFooterGap;
  const weekly = deriveWeeklyStats(calendar.weeks);
  const maxWeekly = Math.max(1, maxOf(weekly.map((week) => week.total)));
  const geometries = weekly.map((week, index) => resolveBarGeometry(index, week.total, maxWeekly, layout));

  const points = geometries.map((geometry) => {
    return { x: geometry.lineX, y: geometry.lineY };
  });

  const steppedPath = buildSteppedPath(points);
  const areaPath = buildAreaPath(points, layout.chartBottom);

  const bars = renderBars(weekly, geometries, layout, themeConfig, palette.primary, palette.primarySoft, useSpectrumChart);
  const signalDropLines = renderSignalDropLines(points, geometries, themeConfig, useSpectrumChart, palette.primarySoft);
  const monthLabels = renderMonthLabels(
    weekly.length,
    layout.margin.left,
    layout.barWidth + layout.weekGap,
    calendar,
    layout.margin.top + layout.headerHeight + layout.subHeaderHeight + 12
  );

  const gridLines = visual.showGrid
    ? [0, 0.25, 0.5, 0.75, 1]
        .map((progress) => {
          const y = layout.chartTop + layout.chartHeight * progress;
          return `<line x1="${layout.margin.left}" y1="${y}" x2="${layout.width - layout.margin.right}" y2="${y}" class="grid"/>`;
        })
        .join("\n")
    : "";

  const verticalTicks = visual.showGrid
    ? weekly
        .filter((_, index) => index % 4 === 0)
        .map((_, tickIndex) => {
          const index = tickIndex * 4;
          const x =
            layout.margin.left + index * (layout.barWidth + layout.weekGap) + Math.floor(layout.barWidth / 2) + 0.5;
          return `<line x1="${x}" y1="${layout.chartTop}" x2="${x}" y2="${layout.chartBottom}" class="vtick"/>`;
        })
        .join("\n")
    : "";

  const dotGrid = dashboardMode ? "" : renderDotGrid(weekly, layout, palette.primary, useSpectrumChart);
  const dashboardPanels = dashboardMode
    ? renderDashboardPanels(insights, layout, dashboardTop, themeConfig, useSpectrumChart)
    : "";

  const noiseAnimation = themeConfig.animateNoise
    ? `
      <animate
        xlink:href="#noiseTurbulence"
        attributeName="baseFrequency"
        values="${themeConfig.noiseFrequency};${(themeConfig.noiseFrequency * 0.92).toFixed(3)};${(themeConfig.noiseFrequency * 1.05).toFixed(3)};${themeConfig.noiseFrequency}"
        dur="${themeConfig.noiseDuration}s"
        repeatCount="indefinite"/>
    `
    : "";

  const scanPatternAnimation = themeConfig.animateScanlines
    ? `
      <animateTransform
        attributeName="patternTransform"
        type="translate"
        values="0 0; 0 ${themeConfig.scanSpacing * 2}"
        dur="${themeConfig.scanLineDuration}s"
        repeatCount="indefinite"/>
    `
    : "";

  const spectrumDefs = useSpectrumChart
    ? `
    <linearGradient id="spectrumStrokeGradient" gradientUnits="userSpaceOnUse" x1="${layout.margin.left}" y1="${layout.chartTop}" x2="${layout.width - layout.margin.right}" y2="${layout.chartTop}">
      <stop offset="0%" stop-color="hsl(260, 96%, 66%)"/>
      <stop offset="16%" stop-color="hsl(218, 96%, 64%)"/>
      <stop offset="32%" stop-color="hsl(186, 94%, 60%)"/>
      <stop offset="50%" stop-color="hsl(132, 90%, 55%)"/>
      <stop offset="68%" stop-color="hsl(78, 92%, 56%)"/>
      <stop offset="84%" stop-color="hsl(24, 94%, 60%)"/>
      <stop offset="100%" stop-color="hsl(300, 92%, 62%)"/>
    </linearGradient>

    <linearGradient id="spectrumGlowGradient" gradientUnits="userSpaceOnUse" x1="${layout.margin.left}" y1="${layout.chartTop}" x2="${layout.width - layout.margin.right}" y2="${layout.chartTop}">
      <stop offset="0%" stop-color="hsl(260, 100%, 78%)"/>
      <stop offset="16%" stop-color="hsl(218, 100%, 76%)"/>
      <stop offset="32%" stop-color="hsl(186, 100%, 74%)"/>
      <stop offset="50%" stop-color="hsl(132, 100%, 72%)"/>
      <stop offset="68%" stop-color="hsl(78, 100%, 74%)"/>
      <stop offset="84%" stop-color="hsl(24, 100%, 76%)"/>
      <stop offset="100%" stop-color="hsl(300, 100%, 78%)"/>
    </linearGradient>

    <linearGradient id="spectrumAreaGradient" gradientUnits="userSpaceOnUse" x1="${layout.margin.left}" y1="${layout.chartTop}" x2="${layout.width - layout.margin.right}" y2="${layout.chartTop}">
      <stop offset="0%" stop-color="hsl(260, 96%, 66%)" stop-opacity="${(themeConfig.areaOpacity * 0.85).toFixed(3)}"/>
      <stop offset="16%" stop-color="hsl(218, 96%, 64%)" stop-opacity="${(themeConfig.areaOpacity * 0.85).toFixed(3)}"/>
      <stop offset="32%" stop-color="hsl(186, 94%, 60%)" stop-opacity="${(themeConfig.areaOpacity * 0.85).toFixed(3)}"/>
      <stop offset="50%" stop-color="hsl(132, 90%, 55%)" stop-opacity="${(themeConfig.areaOpacity * 0.85).toFixed(3)}"/>
      <stop offset="68%" stop-color="hsl(78, 92%, 56%)" stop-opacity="${(themeConfig.areaOpacity * 0.85).toFixed(3)}"/>
      <stop offset="84%" stop-color="hsl(24, 94%, 60%)" stop-opacity="${(themeConfig.areaOpacity * 0.85).toFixed(3)}"/>
      <stop offset="100%" stop-color="hsl(300, 92%, 62%)" stop-opacity="${(themeConfig.areaOpacity * 0.85).toFixed(3)}"/>
    </linearGradient>
  `
    : "";

  const areaFill = useSpectrumChart ? "url(#spectrumAreaGradient)" : "url(#areaGradient)";
  const lineStroke = useSpectrumChart ? "url(#spectrumStrokeGradient)" : palette.primary;
  const lineGlowStroke = useSpectrumChart ? "url(#spectrumGlowGradient)" : palette.primarySoft;
  const pulseStroke = useSpectrumChart ? "url(#spectrumGlowGradient)" : palette.primarySoft;
  const pulseVisibleLength = useSpectrumChart ? 124 : 96;
  const pulseTrailLength = Math.min(PULSE_PATH_LENGTH - 64, pulseVisibleLength + 130);
  const pulseDurationSeconds = Math.max(2.6, themeConfig.sweepDuration * 0.84);
  const pulseDuration = pulseDurationSeconds.toFixed(2);
  const pulseTrailDuration = (pulseDurationSeconds * 1.18).toFixed(2);
  const sweepFrom = layout.margin.left - 16;
  const sweepTo = layout.width - layout.margin.right + 16;
  const sweepLineOpacity = useSpectrumChart ? Math.max(themeConfig.sweepOpacity, 0.16) : Math.max(0.11, themeConfig.sweepOpacity * 0.82);
  const sweepLineGlowOpacity = Math.min(0.4, sweepLineOpacity + 0.1);
  const sweepLineWidth = useSpectrumChart ? 1.35 : 1.1;
  const glowBaseOpacity = clamp(themeConfig.lineGlowOpacity, 0.08, 0.9);
  const glowMinOpacity = Math.max(0.08, glowBaseOpacity * 0.74).toFixed(3);
  const glowMaxOpacity = Math.min(0.96, glowBaseOpacity * 1.16).toFixed(3);
  const glowPulseAnimation = themeConfig.animateNoise || themeConfig.animateScanlines
    ? `<animate attributeName="opacity" values="${glowMinOpacity};${glowMaxOpacity};${glowMinOpacity}" dur="${(themeConfig.sweepDuration * 1.34).toFixed(2)}s" repeatCount="indefinite"/>`
    : "";

  const lastWeek = weekly[weekly.length - 1];
  const footerUser = `USER: @${username}`;
  const footerStats = `CONTRIBUTIONS: ${calendar.totalContributions} | BEST WEEK: ${maxWeekly} | LAST WEEK: ${lastWeek ? lastWeek.total : 0} |`;
  const footerCredits = "CREDITS: stefashkaa/github-profile-crt";

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${layout.width}" height="${canvasHeight}" viewBox="0 0 ${layout.width} ${canvasHeight}" fill="none" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" role="img" aria-labelledby="title desc">
  <title id="title">${escapeXml(username)} contribution CRT monitor</title>
  <desc id="desc">CRT-style contribution chart generated from GitHub contribution calendar data.</desc>

  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${palette.bg0}"/>
      <stop offset="60%" stop-color="${palette.bg1}"/>
      <stop offset="100%" stop-color="${palette.bg2}"/>
    </linearGradient>

    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${palette.primarySoft}" stop-opacity="0.95"/>
      <stop offset="100%" stop-color="${palette.primary}" stop-opacity="0.45"/>
    </linearGradient>

    <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${palette.primary}" stop-opacity="${themeConfig.areaOpacity}"/>
      <stop offset="100%" stop-color="${palette.primary}" stop-opacity="0"/>
    </linearGradient>
    ${spectrumDefs}

    <radialGradient id="vignette" cx="50%" cy="50%" r="75%">
      <stop offset="60%" stop-color="rgba(0,0,0,0)"/>
      <stop offset="100%" stop-color="rgba(0,0,0,1)"/>
    </radialGradient>

    <filter id="phosphorGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="${themeConfig.phosphorBlur}" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>

    <filter id="noiseFilter">
      <feTurbulence
        id="noiseTurbulence"
        type="fractalNoise"
        baseFrequency="${themeConfig.noiseFrequency}"
        numOctaves="1"
        seed="${themeConfig.noiseSeed}"
        stitchTiles="stitch"
        result="noise"/>
      ${noiseAnimation}
      <feColorMatrix
        in="noise"
        type="matrix"
        values="
          1 0 0 0 0
          0 1 0 0 0
          0 0 1 0 0
          0 0 0 1 0"/>
    </filter>

    <pattern id="scanPattern" width="${themeConfig.scanSpacing}" height="${themeConfig.scanSpacing}" patternUnits="userSpaceOnUse">
      ${scanPatternAnimation}
      <rect width="${themeConfig.scanSpacing}" height="${Math.max(1, themeConfig.scanSpacing - 2)}" fill="transparent"/>
      <rect y="${Math.max(1, themeConfig.scanSpacing - 2)}" width="${themeConfig.scanSpacing}" height="1" fill="${palette.scan}"/>
    </pattern>
  </defs>

  <style>
    .month {
      font: 600 10px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
      fill: ${palette.textDim};
      letter-spacing: 0.10em;
    }
    .credit {
      font: 600 8.25px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
      fill: ${palette.textDim};
      letter-spacing: 0.03em;
      opacity: 0.78;
    }
    .footer {
      font: 600 8.5px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
      fill: ${palette.textDim};
      letter-spacing: 0.04em;
      opacity: 0.9;
    }
    .dash-title {
      font: 700 8px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
      fill: ${palette.textDim};
      letter-spacing: 0.08em;
      opacity: 0.9;
    }
    .dash-label {
      font: 600 7.2px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
      fill: ${palette.textDim};
      letter-spacing: 0.04em;
      opacity: 0.88;
    }
    .dash-metric {
      font: 700 10px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
      fill: ${palette.primarySoft};
      letter-spacing: 0.05em;
      opacity: 0.94;
    }
    .dash-small {
      font: 600 6.9px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
      fill: ${palette.textDim};
      letter-spacing: 0.03em;
      opacity: 0.82;
    }
    .grid {
      stroke: ${palette.primary};
      stroke-opacity: ${themeConfig.gridOpacity};
      stroke-width: 1;
      shape-rendering: crispEdges;
    }
    .vtick {
      stroke: ${palette.primary};
      stroke-opacity: ${themeConfig.verticalTickOpacity};
      stroke-width: 1;
      shape-rendering: crispEdges;
    }
  </style>

  <rect width="${layout.width}" height="${canvasHeight}" rx="14" fill="url(#bg)"/>
  <rect width="${layout.width}" height="${canvasHeight}" rx="14" filter="url(#noiseFilter)" opacity="${themeConfig.noiseOpacity}" fill="${palette.primarySoft}"/>
  <rect width="${layout.width}" height="${canvasHeight}" rx="14" fill="url(#scanPattern)" opacity="${themeConfig.scanOpacity}"/>
  <rect width="${layout.width}" height="${canvasHeight}" rx="14" fill="url(#vignette)" opacity="${themeConfig.vignetteOpacity}"/>

  ${monthLabels}
  ${gridLines}
  ${verticalTicks}

  <path d="${areaPath}" fill="${areaFill}"/>

  ${bars}
  <g>${signalDropLines}</g>

  <path
    d="${steppedPath}"
    stroke="${lineStroke}"
    stroke-width="${themeConfig.lineWidth}"
    fill="none"
    stroke-linejoin="miter"
    stroke-linecap="square"
    shape-rendering="crispEdges"
    opacity="0.95"
  />
  <path
    d="${steppedPath}"
    stroke="${lineGlowStroke}"
    stroke-width="${themeConfig.sweepWidth + 1.1}"
    fill="none"
    stroke-linejoin="miter"
    stroke-linecap="square"
    opacity="${glowMinOpacity}"
    filter="url(#phosphorGlow)"
  >${glowPulseAnimation}</path>
  <path
    d="${steppedPath}"
    stroke="${pulseStroke}"
    stroke-width="${themeConfig.sweepWidth + 1.18}"
    fill="none"
    stroke-linejoin="miter"
    stroke-linecap="square"
    opacity="${Math.max(0.2, glowBaseOpacity * 0.72)}"
    filter="url(#phosphorGlow)"
    pathLength="${PULSE_PATH_LENGTH}"
    stroke-dasharray="${pulseTrailLength} ${PULSE_PATH_LENGTH - pulseTrailLength}"
  >
    <animate
      attributeName="stroke-dashoffset"
      values="${PULSE_PATH_LENGTH + 180};180"
      dur="${pulseTrailDuration}s"
      repeatCount="indefinite"
    />
  </path>
  <path
    d="${steppedPath}"
    stroke="${pulseStroke}"
    stroke-width="${themeConfig.sweepWidth}"
    fill="none"
    stroke-linejoin="miter"
    stroke-linecap="square"
    shape-rendering="crispEdges"
    opacity="0.92"
    pathLength="${PULSE_PATH_LENGTH}"
    stroke-dasharray="${pulseVisibleLength} ${PULSE_PATH_LENGTH - pulseVisibleLength}"
  >
    <animate
      attributeName="stroke-dashoffset"
      values="${PULSE_PATH_LENGTH};0"
      dur="${pulseDuration}s"
      repeatCount="indefinite"
    />
  </path>
  <line
    x1="${sweepFrom}"
    y1="${layout.chartTop - 10}"
    x2="${sweepFrom}"
    y2="${layout.chartBottom + 10}"
    stroke="${pulseStroke}"
    stroke-opacity="${sweepLineGlowOpacity}"
    stroke-width="${sweepLineWidth + 2.2}"
    filter="url(#phosphorGlow)"
  >
    <animate attributeName="x1" values="${sweepFrom};${sweepTo}" dur="${pulseDuration}s" repeatCount="indefinite"/>
    <animate attributeName="x2" values="${sweepFrom};${sweepTo}" dur="${pulseDuration}s" repeatCount="indefinite"/>
  </line>
  <line
    x1="${sweepFrom}"
    y1="${layout.chartTop - 10}"
    x2="${sweepFrom}"
    y2="${layout.chartBottom + 10}"
    stroke="${pulseStroke}"
    stroke-opacity="${sweepLineOpacity}"
    stroke-width="${sweepLineWidth}"
    shape-rendering="crispEdges"
  >
    <animate attributeName="x1" values="${sweepFrom};${sweepTo}" dur="${pulseDuration}s" repeatCount="indefinite"/>
    <animate attributeName="x2" values="${sweepFrom};${sweepTo}" dur="${pulseDuration}s" repeatCount="indefinite"/>
  </line>

  ${dashboardPanels}
  <g>${dotGrid}</g>

  <text x="${layout.margin.left}" y="${footerY}" class="footer">${escapeXml(footerUser)}</text>
  ${visual.showStats ? `<text x="${(layout.width / 2) - 6}" y="${footerY}" class="footer" text-anchor="middle">${escapeXml(footerStats)}</text>` : ""}
  <text x="${layout.width - layout.margin.right}" y="${footerY}" class="credit" text-anchor="end">${escapeXml(footerCredits)}</text>
</svg>`;
}
