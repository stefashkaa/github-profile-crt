import type { VisualConfig } from "../config/env";
import {
  buildMonthLabels,
  formatDateShort,
  levelOpacity,
  type ContributionCalendar,
  type WeeklyStats
} from "../model/calendar";
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
  const { username, themeConfig, calendar, visual } = input;
  const palette = themeConfig.palette;
  const useSpectrumChart = themeConfig.spectrumChart === true;

  const layout = buildLayout(calendar.weeks.length);
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

  const dotGrid = renderDotGrid(weekly, layout, palette.primary, useSpectrumChart);

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
  const footerStats = `CONTRIBUTIONS: ${calendar.totalContributions} | BEST WEEK: ${maxWeekly} | LAST WEEK: ${lastWeek ? lastWeek.total : 0}`;
  const footerCredits = "CREDITS: stefashkaa/github-profile-crt";

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${layout.width}" height="${layout.height}" viewBox="0 0 ${layout.width} ${layout.height}" fill="none" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" role="img" aria-labelledby="title desc">
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

  <rect width="${layout.width}" height="${layout.height}" rx="14" fill="url(#bg)"/>
  <rect width="${layout.width}" height="${layout.height}" rx="14" filter="url(#noiseFilter)" opacity="${themeConfig.noiseOpacity}" fill="${palette.primarySoft}"/>
  <rect width="${layout.width}" height="${layout.height}" rx="14" fill="url(#scanPattern)" opacity="${themeConfig.scanOpacity}"/>
  <rect width="${layout.width}" height="${layout.height}" rx="14" fill="url(#vignette)" opacity="${themeConfig.vignetteOpacity}"/>

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

  <g>${dotGrid}</g>

  <text x="${layout.margin.left}" y="${layout.footerY}" class="footer">${escapeXml(footerUser)}</text>
  ${visual.showStats ? `<text x="${layout.width / 2}" y="${layout.footerY}" class="footer" text-anchor="middle">${escapeXml(footerStats)}</text>` : ""}
  <text x="${layout.width - layout.margin.right}" y="${layout.footerY}" class="credit" text-anchor="end">${escapeXml(footerCredits)}</text>
</svg>`;
}
