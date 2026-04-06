import type { ThemeName, VisualConfig } from "../config/env";
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
import { getPalette } from "./palette";
import { buildAreaPath, buildSteppedPath } from "./paths";

export interface SvgRenderInput {
  username: string;
  theme: ThemeName;
  calendar: ContributionCalendar;
  visual: VisualConfig;
}

function renderBars(
  weekly: WeeklyStats[],
  layout: ReturnType<typeof buildLayout>,
  maxWeekly: number,
  visual: VisualConfig,
  primarySoft: string
): string {
  return weekly
    .map((week, index) => {
      const x = layout.margin.left + index * (layout.barWidth + layout.weekGap) + 0.5;
      const normalized = week.total / maxWeekly;
      const height = Math.max(4, normalized * (layout.chartHeight - 8));
      const y = layout.chartBottom - height + 0.5;

      const intensity = clamp(
        visual.barMinOpacity + (week.intensity / 4) * (visual.barMaxOpacity - visual.barMinOpacity),
        visual.barMinOpacity,
        visual.barMaxOpacity
      );

      const title = `${week.firstDay}: ${week.total} contributions | active days: ${week.activeDays} | peak day: ${week.peak}`;

      return `
      <g shape-rendering="crispEdges">
        <title>${escapeXml(title)}</title>
        <rect
          x="${x}"
          y="${y}"
          width="${layout.barWidth}"
          height="${Math.max(1, Math.floor(height))}"
          rx="${visual.barRadius}"
          fill="url(#barGradient)"
          opacity="${intensity}"
        />
        <rect
          x="${x}"
          y="${y}"
          width="${layout.barWidth}"
          height="1"
          rx="0"
          fill="${primarySoft}"
          opacity="${Math.min(0.95, intensity + 0.12)}"
        />
      </g>
    `;
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
  primary: string
): string {
  return weekly
    .map((week, weekIndex) => {
      const centerX =
        layout.margin.left + weekIndex * (layout.barWidth + layout.weekGap) + Math.floor(layout.barWidth / 2) + 0.5;

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
          fill="${primary}"
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
  const { username, theme, calendar, visual } = input;
  const palette = getPalette(theme);

  const layout = buildLayout(calendar.weeks.length);
  const weekly = deriveWeeklyStats(calendar.weeks);
  const maxWeekly = Math.max(1, maxOf(weekly.map((week) => week.total)));

  const points = weekly.map((week, index) => {
    const x = layout.margin.left + index * (layout.barWidth + layout.weekGap) + Math.floor(layout.barWidth / 2) + 0.5;
    const normalized = week.total / maxWeekly;
    const barHeight = Math.max(4, normalized * (layout.chartHeight - 8));
    const y = layout.chartBottom - barHeight;

    return { x, y };
  });

  const steppedPath = buildSteppedPath(points);
  const areaPath = buildAreaPath(points, layout.chartBottom);

  const bars = renderBars(weekly, layout, maxWeekly, visual, palette.primarySoft);
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

  const dotGrid = renderDotGrid(weekly, layout, palette.primary);

  const sweepFrom = layout.margin.left - 16;
  const sweepTo = layout.width - layout.margin.right + 16;

  const noiseAnimation = visual.animateNoise
    ? `
      <animate
        xlink:href="#noiseTurbulence"
        attributeName="baseFrequency"
        values="${visual.noiseFrequency};${(visual.noiseFrequency * 0.92).toFixed(3)};${(visual.noiseFrequency * 1.05).toFixed(3)};${visual.noiseFrequency}"
        dur="${visual.noiseDuration}s"
        repeatCount="indefinite"/>
    `
    : "";

  const scanPatternAnimation = visual.animateScanlines
    ? `
      <animateTransform
        attributeName="patternTransform"
        type="translate"
        values="0 0; 0 ${visual.scanSpacing * 2}"
        dur="${visual.scanLineDuration}s"
        repeatCount="indefinite"/>
    `
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
      <stop offset="0%" stop-color="${palette.primary}" stop-opacity="${visual.areaOpacity}"/>
      <stop offset="100%" stop-color="${palette.primary}" stop-opacity="0"/>
    </linearGradient>

    <radialGradient id="vignette" cx="50%" cy="50%" r="75%">
      <stop offset="60%" stop-color="rgba(0,0,0,0)"/>
      <stop offset="100%" stop-color="rgba(0,0,0,1)"/>
    </radialGradient>

    <filter id="phosphorGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="${visual.phosphorBlur}" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>

    <filter id="noiseFilter">
      <feTurbulence
        id="noiseTurbulence"
        type="fractalNoise"
        baseFrequency="${visual.noiseFrequency}"
        numOctaves="1"
        seed="${visual.noiseSeed}"
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

    <pattern id="scanPattern" width="${visual.scanSpacing}" height="${visual.scanSpacing}" patternUnits="userSpaceOnUse">
      ${scanPatternAnimation}
      <rect width="${visual.scanSpacing}" height="${Math.max(1, visual.scanSpacing - 2)}" fill="transparent"/>
      <rect y="${Math.max(1, visual.scanSpacing - 2)}" width="${visual.scanSpacing}" height="1" fill="${palette.scan}"/>
    </pattern>

    <clipPath id="sweepClip">
      <rect x="${sweepFrom}" y="${layout.chartTop - 8}" width="26" height="${layout.chartHeight + 16}" rx="2">
        <animate attributeName="x" values="${sweepFrom};${sweepTo}" dur="${visual.sweepDuration}s" repeatCount="indefinite"/>
      </rect>
    </clipPath>
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
      stroke-opacity: ${visual.gridOpacity};
      stroke-width: 1;
      shape-rendering: crispEdges;
    }
    .vtick {
      stroke: ${palette.primary};
      stroke-opacity: ${visual.verticalTickOpacity};
      stroke-width: 1;
      shape-rendering: crispEdges;
    }
  </style>

  <rect width="${layout.width}" height="${layout.height}" rx="14" fill="url(#bg)"/>
  <rect width="${layout.width}" height="${layout.height}" rx="14" filter="url(#noiseFilter)" opacity="${visual.noiseOpacity}" fill="${palette.primarySoft}"/>
  <rect width="${layout.width}" height="${layout.height}" rx="14" fill="url(#scanPattern)" opacity="${visual.scanOpacity}"/>
  <rect width="${layout.width}" height="${layout.height}" rx="14" fill="url(#vignette)" opacity="${visual.vignetteOpacity}"/>

  ${monthLabels}
  ${gridLines}
  ${verticalTicks}

  <path d="${areaPath}" fill="url(#areaGradient)"/>

  ${bars}

  <path
    d="${steppedPath}"
    stroke="${palette.primary}"
    stroke-width="${visual.lineWidth}"
    fill="none"
    stroke-linejoin="miter"
    stroke-linecap="square"
    shape-rendering="crispEdges"
    opacity="0.95"
  />
  <path
    d="${steppedPath}"
    stroke="${palette.primarySoft}"
    stroke-width="${visual.sweepWidth + 1.1}"
    fill="none"
    stroke-linejoin="miter"
    stroke-linecap="square"
    opacity="${visual.lineGlowOpacity}"
    filter="url(#phosphorGlow)"
  />

  <g clip-path="url(#sweepClip)">
    <path
      d="${steppedPath}"
      stroke="${palette.primarySoft}"
      stroke-width="${visual.sweepWidth}"
      fill="none"
      stroke-linejoin="miter"
      stroke-linecap="square"
      shape-rendering="crispEdges"
      opacity="0.95"
    />
  </g>

  <line
    x1="${sweepFrom}"
    y1="${layout.chartTop - 8}"
    x2="${sweepFrom}"
    y2="${layout.chartBottom + 8}"
    stroke="${palette.primarySoft}"
    stroke-opacity="${visual.sweepOpacity}"
    stroke-width="1.1"
  >
    <animate attributeName="x1" values="${sweepFrom};${sweepTo}" dur="${visual.sweepDuration}s" repeatCount="indefinite"/>
    <animate attributeName="x2" values="${sweepFrom};${sweepTo}" dur="${visual.sweepDuration}s" repeatCount="indefinite"/>
  </line>

  <g>${dotGrid}</g>

  <text x="${layout.margin.left}" y="${layout.footerY}" class="footer">${escapeXml(footerUser)}</text>
  ${visual.showStats ? `<text x="${layout.width / 2}" y="${layout.footerY}" class="footer" text-anchor="middle">${escapeXml(footerStats)}</text>` : ""}
  <text x="${layout.width - layout.margin.right}" y="${layout.footerY}" class="credit" text-anchor="end">${escapeXml(footerCredits)}</text>
</svg>`;
}
