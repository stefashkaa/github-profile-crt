import type { VisualConfig } from '../config/env';
import { type ContributionCalendar, type WeeklyStats } from '../model/calendar';
import type { ProfileInsights } from '../model/insights';
import { deriveWeeklyStats } from '../model/weekly';
import { clamp, maxOf } from '../utils/math';
import { escapeXml } from '../utils/xml';
import { buildLayout } from './layout';
import type { ThemeableConfig } from './themes';

export interface SvgRenderInput {
  username: string;
  themeConfig: ThemeableConfig;
  calendar: ContributionCalendar;
  insights?: ProfileInsights | null;
  visual: VisualConfig;
}

function createDeterministicRandom(seed: number): () => number {
  let state = seed >>> 0;

  return () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 0xffffffff;
  };
}

function renderNoisePath(seed: number, tileSize: number, points: number): string {
  const random = createDeterministicRandom(seed);
  const segments: string[] = [];

  for (let index = 0; index < points; index += 1) {
    const x = Math.floor(random() * tileSize);
    const y = Math.floor(random() * tileSize);
    const wide = random() > 0.86;
    const w = wide ? 2 : 1;
    const h = wide ? 2 : 1;
    segments.push(`M${x} ${y}h${w}v${h}h-${w}z`);
  }

  return segments.join('');
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

interface BarGeometry {
  x: number;
  y: number;
  height: number;
  centerX: number;
}

function resolveBarGeometry(
  index: number,
  total: number,
  maxWeekly: number,
  layout: ReturnType<typeof buildLayout>
): BarGeometry {
  const x = layout.margin.left + layout.weekGap / 2 + index * (layout.barWidth + layout.weekGap) + 0.5;
  const safeMaxWeekly = maxWeekly > 0 ? maxWeekly : 1;
  const normalized = total <= 0 ? 0 : total / safeMaxWeekly;
  const height = total <= 0 ? 0 : Math.max(9, normalized * (layout.chartHeight - 8));
  const y = layout.chartBottom - height + 0.5;
  const centerX = x + Math.floor(layout.barWidth / 2);

  return {
    x,
    y,
    height: Math.max(0, Math.floor(height)),
    centerX
  };
}

function renderBars(
  weekly: WeeklyStats[],
  geometries: BarGeometry[],
  layout: ReturnType<typeof buildLayout>,
  themeConfig: ThemeableConfig,
  primary: string,
  primarySoft: string,
  useSpectrumChart: boolean,
  enableHoverAttrs: boolean
): string {
  const maxBarHeight = layout.chartHeight - 6;
  const animateEqualizer = themeConfig.animateEqualizer;
  const durationScale = clamp(themeConfig.equalizerDurationScale, 0.35, 2.5);
  const travelScale = clamp(themeConfig.equalizerTravelScale, 0, 2.4);
  const isWinampTheme = themeConfig.id === 'winamp';

  return weekly
    .map((week, index) => {
      const geometry = geometries[index]!;

      const intensity = clamp(
        themeConfig.barMinOpacity + (week.intensity / 4) * (themeConfig.barMaxOpacity - themeConfig.barMinOpacity),
        themeConfig.barMinOpacity,
        themeConfig.barMaxOpacity
      );

      const title = `${week.firstDay}: ${week.total} contributions | active days: ${week.activeDays} | peak day: ${week.peak}`;
      const hoverTitle = enableHoverAttrs ? `<title>${escapeXml(title)}</title>` : '';
      const barFrontFill = useSpectrumChart
        ? spectrumColor(index, weekly.length, 92, 54)
        : isWinampTheme
          ? 'url(#winampBarGradient)'
          : 'url(#barGradient)';
      const barTopFill = useSpectrumChart
        ? spectrumColor(index, weekly.length, 97, 73)
        : isWinampTheme
          ? 'url(#winampTopGradient)'
          : primarySoft;
      const barSideFill = useSpectrumChart
        ? spectrumColor(index, weekly.length, 88, 42)
        : isWinampTheme
          ? 'url(#winampSideGradient)'
          : primary;
      const outlineStroke = useSpectrumChart
        ? spectrumColor(index, weekly.length, 98, 80)
        : isWinampTheme
          ? '#f0f3fa'
          : primarySoft;
      const outlineOpacity = isWinampTheme
        ? Math.min(0.88, Math.max(0.52, intensity + 0.1))
        : Math.min(0.9, Math.max(0.4, intensity + 0.18));
      const pointerStrokeOpacity = isWinampTheme ? 0.9 : Math.min(0.98, outlineOpacity + 0.06);
      const pointerFrontFill = isWinampTheme ? 'url(#winampPointerFrontGradient)' : barFrontFill;
      const pointerTopFill = isWinampTheme ? '#f7f9ff' : barTopFill;
      const pointerSideFill = isWinampTheme ? '#aeb3c3' : barSideFill;
      const pointerStroke = isWinampTheme ? '#f8faff' : outlineStroke;
      const capLineStroke = isWinampTheme ? '#d7deed' : barTopFill;

      const bottomY = geometry.y + geometry.height;
      const pointerWidth = Math.max(4, layout.barWidth - 1);
      const pointerHeight = Math.max(2, Math.floor(layout.barWidth * 0.34));
      const pointerGap = Math.max(1, pointerHeight - 1);
      const requiredPointerClearance = pointerHeight + BAR_DEPTH_Y;

      // Keep animated bars below the true-value pointer position with guaranteed spacing.
      const animationPeakHeight = Math.max(
        4,
        Math.min(maxBarHeight, Math.floor(geometry.height + pointerGap - requiredPointerClearance))
      );
      const motionFactor = 0.12 + 0.1 * travelScale;
      const maxPulse = Math.max(2, Math.round(4 + 6 * travelScale));
      const pulseAmplitude = animateEqualizer ? clamp(Math.round(animationPeakHeight * motionFactor), 1, maxPulse) : 0;
      const lowHeight = animateEqualizer ? Math.max(4, animationPeakHeight - pulseAmplitude) : animationPeakHeight;
      const midHeight = animateEqualizer
        ? Math.max(4, animationPeakHeight - Math.max(1, Math.floor(pulseAmplitude * 0.5)))
        : animationPeakHeight;
      const heightFrames = animateEqualizer
        ? [lowHeight, midHeight, animationPeakHeight, midHeight, lowHeight]
        : [animationPeakHeight];
      const topFrames = heightFrames.map((height) => bottomY - height);
      const baseFrameIndex = Math.floor(topFrames.length / 2);
      const currentTop = topFrames[baseFrameIndex] ?? geometry.y;
      const currentHeight = heightFrames[baseFrameIndex] ?? geometry.height;

      const topFaceFromY = (y: number): string =>
        `${geometry.x},${y} ${geometry.x + layout.barWidth},${y} ${geometry.x + layout.barWidth + BAR_DEPTH_X},${y - BAR_DEPTH_Y} ${geometry.x + BAR_DEPTH_X},${y - BAR_DEPTH_Y}`;
      const sideFaceFromY = (y: number): string =>
        `${geometry.x + layout.barWidth},${y} ${geometry.x + layout.barWidth + BAR_DEPTH_X},${y - BAR_DEPTH_Y} ${geometry.x + layout.barWidth + BAR_DEPTH_X},${bottomY - BAR_DEPTH_Y} ${geometry.x + layout.barWidth},${bottomY}`;

      const yValues = topFrames.map((value) => value.toFixed(2)).join(';');
      const heightValues = heightFrames.map((value) => value.toFixed(2)).join(';');
      const sideFaceValues = topFrames.map((y) => sideFaceFromY(y)).join(';');

      const pointerDepthX = Math.max(1.3, BAR_DEPTH_X - 0.2);
      const pointerDepthY = Math.max(1.3, BAR_DEPTH_Y - 0.2);
      const pointerX = geometry.x + (layout.barWidth - pointerWidth) / 2;
      const pointerTopFaceFromY = (y: number): string =>
        `${pointerX},${y} ${pointerX + pointerWidth},${y} ${pointerX + pointerWidth + pointerDepthX},${y - pointerDepthY} ${pointerX + pointerDepthX},${y - pointerDepthY}`;
      const pointerSideFaceFromY = (y: number): string =>
        `${pointerX + pointerWidth},${y} ${pointerX + pointerWidth + pointerDepthX},${y - pointerDepthY} ${pointerX + pointerWidth + pointerDepthX},${y + pointerHeight - pointerDepthY} ${pointerX + pointerWidth},${y + pointerHeight}`;
      const pointerFrontY = geometry.y - pointerGap - pointerHeight;
      const pointerMarkup = `
        <g>
          <polygon
            points="${pointerSideFaceFromY(pointerFrontY)}"
            fill="${pointerSideFill}"
            opacity="${isWinampTheme ? 0.82 : Math.max(0.2, intensity * 0.7)}"
            stroke="${pointerStroke}"
            stroke-opacity="${pointerStrokeOpacity}"
            stroke-width="0.8"
          />
          <rect
            x="${pointerX}"
            y="${pointerFrontY}"
            width="${pointerWidth}"
            height="${pointerHeight}"
            fill="${pointerFrontFill}"
            opacity="${isWinampTheme ? 0.95 : Math.min(0.96, intensity + 0.16)}"
            stroke="${pointerStroke}"
            stroke-opacity="${pointerStrokeOpacity}"
            stroke-width="0.8"
          />
          <polygon
            points="${pointerTopFaceFromY(pointerFrontY)}"
            fill="${pointerTopFill}"
            opacity="${isWinampTheme ? 0.98 : Math.min(0.98, intensity + 0.24)}"
            stroke="${pointerStroke}"
            stroke-opacity="${pointerStrokeOpacity}"
            stroke-width="0.8"
          />
        </g>
      `;

      const waveDuration = ((1.58 + (index % 9) * 0.13 + (4 - week.intensity) * 0.03) * durationScale).toFixed(2);
      const waveDelay = animateEqualizer ? `-${((index % 13) * 0.19).toFixed(2)}` : '0s';
      const sideFaceAnimate = animateEqualizer
        ? `<animate attributeName="points" values="${sideFaceValues}" dur="${waveDuration}s" begin="${waveDelay}s" repeatCount="indefinite"/>`
        : '';
      const barBodyAnimate = animateEqualizer
        ? `
          <animate attributeName="y" values="${yValues}" dur="${waveDuration}s" begin="${waveDelay}s" repeatCount="indefinite"/>
          <animate attributeName="height" values="${heightValues}" dur="${waveDuration}s" begin="${waveDelay}s" repeatCount="indefinite"/>
        `
        : '';
      const topTranslateValues = topFrames.map((y) => `0 ${(y - currentTop).toFixed(2)}`).join(';');
      const topLayerAnimate = animateEqualizer
        ? `<animateTransform attributeName="transform" type="translate" values="${topTranslateValues}" dur="${waveDuration}s" begin="${waveDelay}s" repeatCount="indefinite"/>`
        : '';

      if (week.total <= 0) {
        return `
      <g>
        ${hoverTitle}
        ${pointerMarkup}
      </g>
    `;
      }

      return `
      <g>
        ${hoverTitle}
        <polygon
          points="${sideFaceFromY(currentTop)}"
          fill="${barSideFill}"
          opacity="${Math.max(0.14, intensity * 0.62)}"
          stroke="${outlineStroke}"
          stroke-opacity="${outlineOpacity}"
          stroke-width="0.8"
        >
          ${sideFaceAnimate}
        </polygon>
        <rect
          x="${geometry.x}"
          y="${currentTop}"
          width="${layout.barWidth}"
          height="${currentHeight}"
          rx="${themeConfig.barRadius}"
          fill="${barFrontFill}"
          opacity="${intensity}"
          stroke="${outlineStroke}"
          stroke-opacity="${outlineOpacity}"
          stroke-width="0.8"
        >
          ${barBodyAnimate}
        </rect>
        <g>
          ${topLayerAnimate}
          <polygon
            points="${topFaceFromY(currentTop)}"
            fill="${barTopFill}"
            opacity="${Math.min(0.97, intensity + 0.18)}"
            stroke="${outlineStroke}"
            stroke-opacity="${outlineOpacity}"
            stroke-width="0.8"
          />
          <line
            x1="${geometry.x + BAR_DEPTH_X}"
            y1="${currentTop - BAR_DEPTH_Y}"
            x2="${geometry.x + layout.barWidth + BAR_DEPTH_X}"
            y2="${currentTop - BAR_DEPTH_Y}"
            stroke="${capLineStroke}"
            stroke-opacity="${isWinampTheme ? 0.74 : Math.min(0.98, intensity + 0.2)}"
            stroke-width="1"
          />
        </g>
        ${pointerMarkup}
      </g>
    `;
    })
    .join('\n');
}

function renderYAxisLabels(
  layout: ReturnType<typeof buildLayout>,
  maxWeekly: number,
  palette: ThemeableConfig['palette']
): string {
  const steps = [1, 0.75, 0.5, 0.25, 0];

  return steps
    .map((progress) => {
      const value = Math.round(maxWeekly * progress);
      const y = layout.chartTop + layout.chartHeight * (1 - progress) + 3;
      const x = layout.margin.left - 8;
      return `<text x="${x}" y="${y.toFixed(2)}" class="y-axis-label" text-anchor="end" fill="${palette.textDim}" opacity="${progress === 1 ? 0.84 : 0.68}">${value}</text>`;
    })
    .join('\n');
}

function polarToCartesian(
  centerX: number,
  centerY: number,
  radius: number,
  angleDegrees: number
): { x: number; y: number } {
  const angleRadians = (angleDegrees - 90) * (Math.PI / 180);

  return {
    x: centerX + radius * Math.cos(angleRadians),
    y: centerY + radius * Math.sin(angleRadians)
  };
}

function formatLanguagePercentage(percentage: number): string {
  const normalized = Number.isFinite(percentage) ? clamp(percentage, 0, 1) : 0;
  const roundedPercent = Math.round(normalized * 100);

  if (roundedPercent === 0 && normalized > 0) {
    return '&lt;1%';
  }

  return `${roundedPercent}%`;
}

function renderLanguageStackProfile(
  insights: ProfileInsights,
  layout: ReturnType<typeof buildLayout>,
  dashboardTop: number,
  themeConfig: ThemeableConfig,
  useSpectrumChart: boolean
): string {
  const hasLanguageData = insights.languages.length > 0 && insights.totalLanguageSize > 0;
  const animateDashboard = themeConfig.animateDashboard;
  const titleX = layout.margin.left + 60;
  const titleY = dashboardTop + 2;
  const panelX = titleX;
  const panelY = dashboardTop + 24;
  const panelWidth = 245;
  const panelHeight = 66;
  const topPadding = 7;
  const rowStep = 11;
  const barHeight = 7;
  const nameX = panelX + 8;
  const barTrackX = panelX + 70;
  const barTrackEndX = panelX + panelWidth - 34;
  const barTrackWidth = barTrackEndX - barTrackX;
  const percentX = panelX + panelWidth - 8;

  const separators = Array.from({ length: 4 }, (_, index) => index + 1)
    .map((index) => {
      const y = panelY + topPadding + index * rowStep - 1.5;
      return `<line x1="${panelX}" x2="${panelX + panelWidth}" y1="${y}" y2="${y}" stroke="${themeConfig.palette.textDim}" stroke-opacity="0.08"/>`;
    })
    .join('\n');

  if (!hasLanguageData) {
    return `
    <g>
      <text x="${titleX}" y="${titleY}" class="panel-title" text-anchor="start">STACK PROFILE</text>
      <rect x="${panelX}" y="${panelY}" width="${panelWidth}" height="${panelHeight}" rx="8" fill="${themeConfig.palette.bg1}" fill-opacity="0.18" stroke="${themeConfig.palette.textDim}" stroke-opacity="0.12"/>
      ${separators}
      <text x="${panelX + panelWidth / 2}" y="${panelY + panelHeight / 2 + 2}" class="dash-label" text-anchor="middle">NO LANGUAGE DATA</text>
    </g>
    `;
  }

  const rows = insights.languages.slice(0, 5);

  const rowLabelAndTrack: string[] = [];
  const rowGlowRects: string[] = [];
  const rowColorRects: string[] = [];

  rows.forEach((language, index) => {
    const trackY = panelY + topPadding + index * rowStep;
    const labelY = trackY + 6;
    const targetWidth = Math.max(2, Math.round(language.percentage * barTrackWidth));
    const color =
      language.color ||
      (useSpectrumChart ? spectrumColor(index, rows.length, 86, 62) : themeConfig.palette.primarySoft);
    const pulseDuration = (1.8 + index * 0.22).toFixed(2);
    const pulseDelay = (index * 0.12).toFixed(2);
    const pulseClass = animateDashboard ? 'stack-pulse stack-pulse-active' : 'stack-pulse';
    const pulseStyle = `--pulse-duration:${pulseDuration}s;--pulse-delay:${pulseDelay}s;`;
    const themeBlendOpacity = useSpectrumChart ? 0.46 : 0.72;
    const languageBlendOpacity = useSpectrumChart ? 0.42 : 0.24;
    const accentOpacity = useSpectrumChart ? 0.68 : 0.54;
    const segmentCount = Math.max(8, Math.floor(barTrackWidth / 9));
    const segmentStep = barTrackWidth / segmentCount;
    const segmentLines = Array.from({ length: segmentCount - 1 }, (_, segmentIndex) => {
      const x = barTrackX + segmentStep * (segmentIndex + 1);
      return `M${x} ${trackY}v${barHeight}`;
    }).join(' ');

    rowLabelAndTrack.push(`
      <text x="${nameX}" y="${labelY}" class="tiny-label">${escapeXml(language.name.toUpperCase())}</text>
      <text x="${percentX}" y="${labelY + 1}" class="dash-label" text-anchor="end">${formatLanguagePercentage(language.percentage)}</text>
      <rect x="${barTrackX}" y="${trackY}" width="${barTrackWidth}" height="${barHeight}" rx="1.4" fill="${themeConfig.palette.textDim}" fill-opacity="0.12" shape-rendering="crispEdges"/>
      <path d="${segmentLines}" stroke="${themeConfig.palette.bg1}" stroke-opacity="0.55" shape-rendering="crispEdges"/>
      <rect x="${barTrackX - 4}" y="${trackY}" width="2" height="${barHeight}" rx="0.8" fill="${color}" fill-opacity="${accentOpacity}" shape-rendering="crispEdges"/>
      `);

    rowGlowRects.push(`
      <rect x="${barTrackX}" y="${trackY}" width="${targetWidth}" height="${barHeight}" rx="1.4" fill="${themeConfig.palette.primarySoft}" fill-opacity="${themeBlendOpacity}" shape-rendering="crispEdges" class="${pulseClass}" style="${pulseStyle}"/>
      `);

    rowColorRects.push(`
      <rect x="${barTrackX}" y="${trackY}" width="${targetWidth}" height="${barHeight}" rx="1.4" fill="${color}" fill-opacity="${languageBlendOpacity}" shape-rendering="crispEdges" class="${pulseClass}" style="${pulseStyle}"/>
      `);
  });

  return `
  <g>
    <text x="${titleX}" y="${titleY}" class="panel-title" text-anchor="start">STACK PROFILE</text>
    <rect x="${panelX}" y="${panelY}" width="${panelWidth}" height="${panelHeight}" rx="8" fill="${themeConfig.palette.bg1}" fill-opacity="0.18" stroke="${themeConfig.palette.textDim}" stroke-opacity="0.12"/>
    ${separators}
    <g shape-rendering="crispEdges">
      ${rowLabelAndTrack.join('\n')}
      <g filter="url(#phosphorGlowDash)">
        ${rowGlowRects.join('\n')}
      </g>
      ${rowColorRects.join('\n')}
    </g>
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
  const dashboardPanelInset = layout.margin.left + 86;
  const dashboardPanelWidth = 245;
  const dashboardPanelX = layout.width - dashboardPanelInset - dashboardPanelWidth;
  const dashboardPanelY = dashboardTop + 24;
  const activityShiftX = 70;
  const centerX = dashboardPanelX + dashboardPanelWidth / 2 + activityShiftX;
  const centerY = dashboardPanelY + 46;
  const radius = 34;
  const animateDashboard = themeConfig.animateDashboard;
  const radarStroke = useSpectrumChart ? 'url(#spectrumStrokeGradient)' : themeConfig.palette.primary;
  const radarFill = useSpectrumChart ? 'url(#spectrumAreaGradient)' : 'url(#areaGradient)';
  const radialGuideStroke = useSpectrumChart ? 'url(#spectrumStrokeGradient)' : themeConfig.palette.primarySoft;
  const radarPulseDuration = Math.max(3.4, themeConfig.sweepDuration * 1.12).toFixed(2);
  const radarSweepDuration = Math.max(2.8, themeConfig.sweepDuration * 0.9).toFixed(2);
  const sweepRotateAnimation = animateDashboard
    ? `<animateTransform attributeName="transform" type="rotate" values="0 ${centerX} ${centerY};360 ${centerX} ${centerY}" dur="${radarSweepDuration}s" repeatCount="indefinite"/>`
    : '';
  const radarPointOuterClass = animateDashboard ? 'radar-point-outer radar-point-outer-active' : 'radar-point-outer';
  const radarPointInnerClass = animateDashboard ? 'radar-point-inner radar-point-inner-active' : 'radar-point-inner';
  const radarPointStyle = (x: number, y: number, duration: string): string =>
    `transform-origin:${x.toFixed(2)}px ${y.toFixed(2)}px;--radar-duration:${duration};`;

  const values = {
    commit: insights.activity.commits,
    pr: insights.activity.pullRequests,
    issue: insights.activity.issues,
    review: insights.activity.reviews
  };
  const totalActivity = values.commit + values.pr + values.issue + values.review;
  const maxLog = Math.max(
    1,
    Math.log10(values.commit + 1),
    Math.log10(values.pr + 1),
    Math.log10(values.issue + 1),
    Math.log10(values.review + 1)
  );
  const toRadius = (value: number): number => {
    if (value <= 0) {
      return radius * 0.28;
    }

    const normalized = Math.log10(value + 1) / maxLog;
    return radius * (0.28 + normalized * 0.72);
  };

  const radii = {
    commit: toRadius(values.commit),
    pr: toRadius(values.pr),
    issue: toRadius(values.issue),
    review: toRadius(values.review)
  };

  const computePoints = (pointRadii: typeof radii) => {
    const commit = polarToCartesian(centerX, centerY, pointRadii.commit, 270);
    const pr = polarToCartesian(centerX, centerY, pointRadii.pr, 0);
    const issue = polarToCartesian(centerX, centerY, pointRadii.issue, 90);
    const review = polarToCartesian(centerX, centerY, pointRadii.review, 180);

    return {
      commit,
      pr,
      issue,
      review,
      polygon: `${commit.x.toFixed(2)},${commit.y.toFixed(2)} ${pr.x.toFixed(2)},${pr.y.toFixed(2)} ${issue.x.toFixed(2)},${issue.y.toFixed(2)} ${review.x.toFixed(2)},${review.y.toFixed(2)}`
    };
  };

  const basePoints = computePoints(radii);
  const pulsePoints = computePoints({
    commit: Math.min(radius, radii.commit * 1.08),
    pr: Math.min(radius, radii.pr * 1.08),
    issue: Math.min(radius, radii.issue * 1.08),
    review: Math.min(radius, radii.review * 1.08)
  });
  const relaxedPoints = computePoints({
    commit: Math.max(radius * 0.38, radii.commit * 0.9),
    pr: Math.max(radius * 0.38, radii.pr * 0.9),
    issue: Math.max(radius * 0.38, radii.issue * 0.9),
    review: Math.max(radius * 0.38, radii.review * 0.9)
  });
  const polygonPulseAnimation = animateDashboard
    ? `<animate attributeName="points" values="${basePoints.polygon};${pulsePoints.polygon};${basePoints.polygon};${relaxedPoints.polygon};${basePoints.polygon}" dur="${radarPulseDuration}s" repeatCount="indefinite"/>`
    : '';

  const orbitalRings = [14, 24, 34]
    .map((ring, index) => {
      const opacity = (0.08 + index * 0.02).toFixed(2);
      return `<circle cx="${centerX}" cy="${centerY}" r="${ring}" fill="none" stroke="${themeConfig.palette.textDim}" stroke-opacity="${opacity}"/>`;
    })
    .join('\n');

  const diagonalRadius = Math.round(radius * 0.71);
  const crosshair = `M${centerX} ${centerY - radius} L${centerX} ${centerY + radius} M${centerX - radius} ${centerY} L${centerX + radius} ${centerY} M${centerX - diagonalRadius} ${centerY - diagonalRadius} L${centerX + diagonalRadius} ${centerY + diagonalRadius} M${centerX + diagonalRadius} ${centerY - diagonalRadius} L${centerX - diagonalRadius} ${centerY + diagonalRadius}`;
  const sweepArm = radius - 7;
  const labelOffset = 12;
  const labelY = centerY + 3;
  const prLabelY = centerY - radius - 4;
  const reviewLabelY = centerY + radius + 12;
  const commitLabelX = centerX - radius - labelOffset;
  const issueLabelX = centerX + radius + labelOffset;
  const headerY = dashboardTop + 2;
  const subtitleY = headerY + 12;

  return `
  <g>
    <text x="${centerX}" y="${headerY}" class="panel-title" text-anchor="middle">ACTIVITY VECTOR</text>
    <text x="${centerX}" y="${subtitleY}" class="micro-label" text-anchor="middle">TOTAL ${totalActivity} / CONTRIBUTION SIGNATURE</text>

    <circle cx="${centerX}" cy="${centerY}" r="8" fill="${themeConfig.palette.bg1}" stroke="${themeConfig.palette.textDim}" stroke-opacity="0.18"/>
    ${orbitalRings}
    <path d="${crosshair}" stroke="${themeConfig.palette.textDim}" stroke-opacity="0.15" stroke-width="1"/>

    <path d="M${centerX} ${centerY} L${centerX} ${centerY - sweepArm}" stroke="${themeConfig.palette.primarySoft}" stroke-opacity="0.22" stroke-width="1.2">
      ${sweepRotateAnimation}
    </path>

    <polygon points="${basePoints.polygon}" fill="${radarFill}" fill-opacity="0.34" stroke="${radarStroke}" stroke-opacity="0.95" stroke-width="1.7" filter="url(#phosphorGlowRadar)">
      ${polygonPulseAnimation}
    </polygon>

    <line x1="${centerX}" y1="${centerY}" x2="${centerX}" y2="${(centerY - radius).toFixed(2)}" stroke="${radialGuideStroke}" stroke-opacity="0.45" stroke-width="1.9" stroke-linecap="round"/>
    <line x1="${centerX}" y1="${centerY}" x2="${(centerX - radius).toFixed(2)}" y2="${centerY}" stroke="${radialGuideStroke}" stroke-opacity="0.45" stroke-width="1.9" stroke-linecap="round"/>
    <line x1="${centerX}" y1="${centerY}" x2="${(centerX + radius).toFixed(2)}" y2="${centerY}" stroke="${radialGuideStroke}" stroke-opacity="0.45" stroke-width="1.9" stroke-linecap="round"/>
    <line x1="${centerX}" y1="${centerY}" x2="${centerX}" y2="${(centerY + radius).toFixed(2)}" stroke="${radialGuideStroke}" stroke-opacity="0.45" stroke-width="1.9" stroke-linecap="round"/>

    <circle cx="${basePoints.commit.x.toFixed(2)}" cy="${basePoints.commit.y.toFixed(2)}" r="5.2" fill="${themeConfig.palette.primarySoft}" fill-opacity="0.2" class="${radarPointOuterClass}" style="${radarPointStyle(basePoints.commit.x, basePoints.commit.y, '2.2s')}"/>
    <circle cx="${basePoints.commit.x.toFixed(2)}" cy="${basePoints.commit.y.toFixed(2)}" r="2.4" fill="${themeConfig.palette.primarySoft}" class="${radarPointInnerClass}" style="${radarPointStyle(basePoints.commit.x, basePoints.commit.y, '2.2s')}"/>
    <circle cx="${basePoints.pr.x.toFixed(2)}" cy="${basePoints.pr.y.toFixed(2)}" r="5.2" fill="${themeConfig.palette.primarySoft}" fill-opacity="0.2" class="${radarPointOuterClass}" style="${radarPointStyle(basePoints.pr.x, basePoints.pr.y, '2.5s')}"/>
    <circle cx="${basePoints.pr.x.toFixed(2)}" cy="${basePoints.pr.y.toFixed(2)}" r="2.4" fill="${themeConfig.palette.primarySoft}" class="${radarPointInnerClass}" style="${radarPointStyle(basePoints.pr.x, basePoints.pr.y, '2.5s')}"/>
    <circle cx="${basePoints.issue.x.toFixed(2)}" cy="${basePoints.issue.y.toFixed(2)}" r="5.2" fill="${themeConfig.palette.primarySoft}" fill-opacity="0.2" class="${radarPointOuterClass}" style="${radarPointStyle(basePoints.issue.x, basePoints.issue.y, '2.8s')}"/>
    <circle cx="${basePoints.issue.x.toFixed(2)}" cy="${basePoints.issue.y.toFixed(2)}" r="2.4" fill="${themeConfig.palette.primarySoft}" class="${radarPointInnerClass}" style="${radarPointStyle(basePoints.issue.x, basePoints.issue.y, '2.8s')}"/>
    <circle cx="${basePoints.review.x.toFixed(2)}" cy="${basePoints.review.y.toFixed(2)}" r="5.2" fill="${themeConfig.palette.primarySoft}" fill-opacity="0.2" class="${radarPointOuterClass}" style="${radarPointStyle(basePoints.review.x, basePoints.review.y, '3.1s')}"/>
    <circle cx="${basePoints.review.x.toFixed(2)}" cy="${basePoints.review.y.toFixed(2)}" r="2.4" fill="${themeConfig.palette.primarySoft}" class="${radarPointInnerClass}" style="${radarPointStyle(basePoints.review.x, basePoints.review.y, '3.1s')}"/>

    <text x="${centerX}" y="${prLabelY}" class="dash-label" text-anchor="middle">PR</text>
    <text x="${commitLabelX}" y="${labelY}" class="dash-label" text-anchor="end">COMMIT</text>
    <text x="${issueLabelX}" y="${labelY}" class="dash-label">ISSUE</text>
    <text x="${centerX}" y="${reviewLabelY}" class="dash-label" text-anchor="middle">REVIEW</text>
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
  ${renderLanguageStackProfile(insights, layout, dashboardTop, themeConfig, useSpectrumChart)}
  ${renderActivityRadar(insights, layout, dashboardTop, themeConfig, useSpectrumChart)}
  `;
}

function renderMonthLabels(
  monthPositions: Array<{ label: string; year: number; x: number; showLabel?: boolean }>,
  y: number
): string {
  return monthPositions
    .filter(({ showLabel }) => showLabel !== false)
    .map(({ label, x }) => {
      return `<text x="${x.toFixed(2)}" y="${y}" class="month" text-anchor="middle">${escapeXml(label)}</text>`;
    })
    .join('\n');
}

function renderYearLabels(
  monthPositions: Array<{ label: string; year: number; x: number }>,
  leftLimit: number,
  rightLimit: number,
  y: number
): string {
  if (monthPositions.length === 0) {
    return '';
  }

  const labels: string[] = [];
  let index = 0;

  while (index < monthPositions.length) {
    const year = monthPositions[index]!.year;
    const yearX = clamp(monthPositions[index]!.x, leftLimit, rightLimit);

    labels.push(`<text x="${yearX.toFixed(2)}" y="${y}" class="year-label" text-anchor="middle">${year}</text>`);

    let nextIndex = index + 1;
    while (nextIndex < monthPositions.length && monthPositions[nextIndex]!.year === year) {
      nextIndex += 1;
    }

    index = nextIndex;
  }

  return labels.join('\n');
}

export function renderCrtContributionSvg(input: SvgRenderInput): string {
  const { username, themeConfig, calendar, insights, visual } = input;
  const palette = themeConfig.palette;
  const useSpectrumChart = themeConfig.spectrumChart === true;
  const isWinampTheme = themeConfig.id === 'winamp';
  const showDashboard = visual.showStats;
  const layout = buildLayout(calendar.weeks.length);
  const dashboardTopGap = showDashboard ? 30 : 0;
  const dashboardFooterGap = showDashboard ? 52 : 0;
  const dashboardTop = layout.heatmapTop + dashboardTopGap;
  const footerY = showDashboard ? layout.footerY + dashboardTopGap + dashboardFooterGap : layout.chartBottom + 28;
  const canvasHeight = showDashboard
    ? layout.height + dashboardTopGap + dashboardFooterGap
    : footerY + layout.margin.bottom;
  const weekly = deriveWeeklyStats(calendar.weeks);
  const maxWeekly = Math.max(1, maxOf(weekly.map((week) => week.total)));
  const geometries = weekly.map((week, index) => resolveBarGeometry(index, week.total, maxWeekly, layout));
  const rawMonthMarkers = calendar.months
    .map((month) => {
      const monthStartDate = new Date(month.firstDay);
      const index = calendar.weeks.findIndex((week) => new Date(week.firstDay) >= monthStartDate);

      if (index < 0 || index >= weekly.length) {
        return null;
      }

      return {
        index,
        label: month.name.slice(0, 3).toUpperCase(),
        year: month.year
      };
    })
    .filter((marker): marker is { index: number; label: string; year: number } => marker !== null);
  const monthMarkers = rawMonthMarkers.map((marker, markerIndex) => {
    const nextIndex = rawMonthMarkers[markerIndex + 1]?.index ?? weekly.length;
    const weekCount = Math.max(0, nextIndex - marker.index);

    return {
      ...marker,
      weekCount
    };
  });
  const monthStep = layout.barWidth + layout.weekGap;
  const chartStartX = layout.margin.left + layout.weekGap / 2;
  const monthBoundaryShift = 0.5 - layout.weekGap / 2;
  const chartRightBoundaryX = layout.width - layout.margin.right;
  const monthBoundaryXs = monthMarkers.map(({ index }) => chartStartX + index * monthStep + monthBoundaryShift);
  const monthLabelY = layout.margin.top + layout.headerHeight + layout.subHeaderHeight + 12;
  const yearLabelY = monthLabelY - 14;
  const monthLeftLimit = layout.margin.left + 12;
  const monthRightLimit = layout.width - layout.margin.right - 12;
  const yearLeftLimit = layout.margin.left + 18;
  const yearRightLimit = layout.width - layout.margin.right - 18;
  const monthPositions = monthMarkers.map(({ label, year, weekCount }, markerIndex) => {
    const startBoundaryX = monthBoundaryXs[markerIndex] ?? monthBoundaryXs[0] ?? 0;
    const endBoundaryX = monthBoundaryXs[markerIndex + 1] ?? chartRightBoundaryX;
    const segmentWidth = Math.max(0, endBoundaryX - startBoundaryX);
    const centerX = startBoundaryX + segmentWidth / 2;
    const isEdgeMonth = markerIndex === 0 || markerIndex === monthMarkers.length - 1;
    const showLabel = !(isEdgeMonth && weekCount <= 1);

    return {
      label,
      year,
      x: clamp(centerX, monthLeftLimit, monthRightLimit),
      showLabel
    };
  });

  const bars = renderBars(
    weekly,
    geometries,
    layout,
    themeConfig,
    palette.primary,
    palette.primarySoft,
    useSpectrumChart,
    visual.enableHoverAttrs
  );
  const yAxisLabels = renderYAxisLabels(layout, maxWeekly, palette);
  const monthLabels = renderMonthLabels(monthPositions, monthLabelY);
  const yearLabels = renderYearLabels(monthPositions, yearLeftLimit, yearRightLimit, yearLabelY);

  const gridPathData = visual.showGrid
    ? [0, 0.25, 0.5, 0.75, 1]
        .map((progress) => {
          const y = (layout.chartTop + layout.chartHeight * progress).toFixed(2);
          return `M${layout.margin.left} ${y}H${layout.width - layout.margin.right}`;
        })
        .join(' ')
    : '';
  const gridLines = gridPathData ? `<path d="${gridPathData}" class="grid-line"/>` : '';

  const verticalTicksPathData = visual.showGrid
    ? [...monthBoundaryXs, chartRightBoundaryX]
        .filter((x, index, all) => index === 0 || Math.abs(x - all[index - 1]!) > 0.01)
        .map((x) => {
          return `M${x.toFixed(2)} ${layout.chartTop}V${layout.chartBottom}`;
        })
        .join(' ')
    : '';
  const verticalTicks = verticalTicksPathData ? `<path d="${verticalTicksPathData}" class="grid-line"/>` : '';

  const dashboardPanels = showDashboard
    ? renderDashboardPanels(insights, layout, dashboardTop, themeConfig, useSpectrumChart)
    : '';

  const includeNoiseLayer = themeConfig.noiseOpacity > 0;
  const includeScanLayer = themeConfig.scanOpacity > 0;

  const noiseTileSize = 80;
  const noiseDotsPrimary = includeNoiseLayer
    ? renderNoisePath(themeConfig.noiseSeed * 31 + 17, noiseTileSize, 220)
    : '';
  const noiseDotsSecondary = includeNoiseLayer
    ? renderNoisePath(themeConfig.noiseSeed * 47 + 29, noiseTileSize, 140)
    : '';
  const noisePatternPrimaryAnimation =
    includeNoiseLayer && themeConfig.animateNoise
      ? `
      <animateTransform
        attributeName="patternTransform"
        type="translate"
        values="0 0; ${Math.round(noiseTileSize * 0.46)} ${Math.round(noiseTileSize * 0.28)}; 0 0"
        dur="${Math.max(1.8, themeConfig.noiseDuration * 1.06).toFixed(2)}s"
        repeatCount="indefinite"/>
    `
      : '';
  const noisePatternSecondaryAnimation =
    includeNoiseLayer && themeConfig.animateNoise
      ? `
      <animateTransform
        attributeName="patternTransform"
        type="translate"
        values="0 0; ${Math.round(-noiseTileSize * 0.32)} ${Math.round(noiseTileSize * 0.41)}; 0 0"
        dur="${Math.max(1.7, themeConfig.noiseDuration * 0.84).toFixed(2)}s"
        repeatCount="indefinite"/>
    `
      : '';

  const scanPatternAnimation =
    includeScanLayer && themeConfig.animateScanlines
      ? `
      <animateTransform
        attributeName="patternTransform"
        type="translate"
        values="0 0; 0 ${themeConfig.scanSpacing * 2}"
        dur="${themeConfig.scanLineDuration}s"
        repeatCount="indefinite"/>
    `
      : '';

  const noisePatternDef = includeNoiseLayer
    ? `
    <pattern id="noisePatternPrimary" width="${noiseTileSize}" height="${noiseTileSize}" patternUnits="userSpaceOnUse">
      ${noisePatternPrimaryAnimation}
      <path d="${noiseDotsPrimary}" fill="${palette.primarySoft}" fill-opacity="0.13"/>
    </pattern>
    <pattern id="noisePatternSecondary" width="${noiseTileSize}" height="${noiseTileSize}" patternUnits="userSpaceOnUse">
      ${noisePatternSecondaryAnimation}
      <path d="${noiseDotsSecondary}" fill="${palette.primarySoft}" fill-opacity="0.08"/>
    </pattern>
  `
    : '';

  const scanPatternDef = includeScanLayer
    ? `
    <pattern id="scanPattern" width="${themeConfig.scanSpacing}" height="${themeConfig.scanSpacing}" patternUnits="userSpaceOnUse">
      ${scanPatternAnimation}
      <rect width="${themeConfig.scanSpacing}" height="${Math.max(1, themeConfig.scanSpacing - 2)}" fill="transparent"/>
      <rect y="${Math.max(1, themeConfig.scanSpacing - 2)}" width="${themeConfig.scanSpacing}" height="1" fill="${palette.scan}"/>
    </pattern>
  `
    : '';

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
    : '';

  const winampDefs = isWinampTheme
    ? `
    <linearGradient id="winampBarGradient" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#cc9e36"/>
      <stop offset="14%" stop-color="#cc9e36"/>
      <stop offset="14%" stop-color="#c5d03b"/>
      <stop offset="32%" stop-color="#c5d03b"/>
      <stop offset="32%" stop-color="#8fd92f"/>
      <stop offset="52%" stop-color="#8fd92f"/>
      <stop offset="52%" stop-color="#42cb2a"/>
      <stop offset="74%" stop-color="#42cb2a"/>
      <stop offset="74%" stop-color="#23990f"/>
      <stop offset="100%" stop-color="#16750a"/>
    </linearGradient>

    <linearGradient id="winampSideGradient" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#a7812e"/>
      <stop offset="24%" stop-color="#9aa830"/>
      <stop offset="52%" stop-color="#2ea31a"/>
      <stop offset="100%" stop-color="#125e08"/>
    </linearGradient>

    <linearGradient id="winampTopGradient" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#e0e768"/>
      <stop offset="100%" stop-color="#bfc746"/>
    </linearGradient>

    <linearGradient id="winampPointerFrontGradient" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#f4f6fc"/>
      <stop offset="100%" stop-color="#c9cfdb"/>
    </linearGradient>
  `
    : '';

  const chartBaseLineOpacity = Math.max(0.16, themeConfig.barMinOpacity * 0.55);
  const gridStroke = useSpectrumChart ? 'hsl(170, 72%, 72%)' : palette.primarySoft;
  const stackPanelX = layout.margin.left + 60;
  const stackPanelY = dashboardTop + 24;
  const stackPanelWidth = 245;
  const stackPanelHeight = 66;
  const radarPanelInset = layout.margin.left + 86;
  const radarPanelWidth = 245;
  const radarPanelX = layout.width - radarPanelInset - radarPanelWidth;
  const radarCenterX = radarPanelX + radarPanelWidth / 2 + 70;
  const radarCenterY = stackPanelY + 46;
  const radarRadius = 34;
  const dashboardBlurPadding = Math.max(8, Math.ceil(themeConfig.phosphorBlur * 6));

  const lastWeek = weekly[weekly.length - 1];
  const footerUser = `USER: @${username}`;
  const footerStatsParts = [`CONTRIBUTIONS: ${calendar.totalContributions}`, `BEST WEEK: ${maxWeekly}`];

  if (visual.showLastWeekInFooter) {
    footerStatsParts.push(`LAST WEEK: ${lastWeek ? lastWeek.total : 0}`);
  }

  const footerStats = `| ${footerStatsParts.join(' | ')} |`;
  const footerCredits = 'CREDITS: stefashkaa/github-profile-crt';

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
    ${winampDefs}
    ${spectrumDefs}

    <radialGradient id="vignette" cx="50%" cy="50%" r="75%">
      <stop offset="60%" stop-color="rgba(0,0,0,0)"/>
      <stop offset="100%" stop-color="rgba(0,0,0,1)"/>
    </radialGradient>

    <filter
      id="phosphorGlowDash"
      x="${stackPanelX - dashboardBlurPadding}"
      y="${stackPanelY - dashboardBlurPadding}"
      width="${stackPanelWidth + dashboardBlurPadding * 2}"
      height="${stackPanelHeight + dashboardBlurPadding * 2}"
      filterUnits="userSpaceOnUse"
      primitiveUnits="userSpaceOnUse"
      color-interpolation-filters="sRGB">
      <feGaussianBlur stdDeviation="${themeConfig.phosphorBlur}" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    <filter
      id="phosphorGlowRadar"
      x="${radarCenterX - radarRadius - dashboardBlurPadding}"
      y="${radarCenterY - radarRadius - dashboardBlurPadding}"
      width="${radarRadius * 2 + dashboardBlurPadding * 2}"
      height="${radarRadius * 2 + dashboardBlurPadding * 2}"
      filterUnits="userSpaceOnUse"
      primitiveUnits="userSpaceOnUse"
      color-interpolation-filters="sRGB">
      <feGaussianBlur stdDeviation="${themeConfig.phosphorBlur}" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>

    ${noisePatternDef}
    ${scanPatternDef}
  </defs>

  <style>
    .month {
      font: 600 10px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
      fill: ${palette.textDim};
      letter-spacing: 0.10em;
    }
    .year-label {
      font: 700 10px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
      fill: ${palette.primarySoft};
      letter-spacing: 0.08em;
      opacity: 0.95;
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
    .panel-title {
      font: 700 8.1px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
      fill: ${palette.textDim};
      letter-spacing: 0.08em;
      opacity: 0.92;
    }
    .dash-label {
      font: 600 7.2px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
      fill: ${palette.textDim};
      letter-spacing: 0.04em;
      opacity: 0.88;
    }
    .micro-label {
      font: 600 6.6px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
      fill: ${palette.textDim};
      letter-spacing: 0.06em;
      opacity: 0.74;
    }
    .tiny-label {
      font: 600 6.7px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
      fill: ${palette.textDim};
      letter-spacing: 0.04em;
      opacity: 0.9;
    }
    .y-axis-label {
      font: 600 6.7px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
      letter-spacing: 0.03em;
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
    .grid-line {
      stroke: ${gridStroke};
      stroke-opacity: ${themeConfig.gridOpacity};
      stroke-width: 1;
      shape-rendering: crispEdges;
    }
    .stack-pulse {
      transform-box: fill-box;
      transform-origin: left center;
    }
    .stack-pulse-active {
      animation: stackPulseX var(--pulse-duration) linear var(--pulse-delay) infinite;
      will-change: transform;
    }
    .radar-point-outer-active {
      animation: radarOuterPulse var(--radar-duration) linear infinite;
      will-change: transform, fill-opacity;
    }
    .radar-point-inner-active {
      animation: radarInnerPulse var(--radar-duration) linear infinite;
      will-change: transform;
    }
    @keyframes stackPulseX {
      0% { transform: scaleX(0.74); }
      25% { transform: scaleX(1); }
      50% { transform: scaleX(0.87); }
      75% { transform: scaleX(1); }
      100% { transform: scaleX(0.74); }
    }
    @keyframes radarOuterPulse {
      0% { transform: scale(0.846); fill-opacity: 0.12; }
      50% { transform: scale(1.077); fill-opacity: 0.24; }
      100% { transform: scale(0.846); fill-opacity: 0.12; }
    }
    @keyframes radarInnerPulse {
      0% { transform: scale(0.875); }
      50% { transform: scale(1.167); }
      100% { transform: scale(0.875); }
    }
  </style>

  <rect width="${layout.width}" height="${canvasHeight}" rx="14" fill="url(#bg)"/>
  ${includeNoiseLayer ? `<rect width="${layout.width}" height="${canvasHeight}" rx="14" fill="url(#noisePatternPrimary)" opacity="${(themeConfig.noiseOpacity * 0.72).toFixed(4)}"/>` : ''}
  ${includeNoiseLayer ? `<rect width="${layout.width}" height="${canvasHeight}" rx="14" fill="url(#noisePatternSecondary)" opacity="${(themeConfig.noiseOpacity * 0.58).toFixed(4)}"/>` : ''}
  ${includeScanLayer ? `<rect width="${layout.width}" height="${canvasHeight}" rx="14" fill="url(#scanPattern)" opacity="${themeConfig.scanOpacity}"/>` : ''}
  <rect width="${layout.width}" height="${canvasHeight}" rx="14" fill="url(#vignette)" opacity="${themeConfig.vignetteOpacity}"/>

  ${yearLabels}
  ${monthLabels}
  ${yAxisLabels}
  ${gridLines}
  ${verticalTicks}

  <g shape-rendering="crispEdges">
    ${bars}
  </g>
  <line
    x1="${layout.margin.left}"
    y1="${layout.chartBottom + 0.5}"
    x2="${layout.width - layout.margin.right}"
    y2="${layout.chartBottom + 0.5}"
    stroke="${palette.primary}"
    stroke-opacity="${chartBaseLineOpacity}"
    stroke-width="1"
    shape-rendering="crispEdges"
  />

  ${dashboardPanels}

  <text x="${layout.margin.left}" y="${footerY}" class="footer">${escapeXml(footerUser)}</text>
  ${visual.showStatsFooter ? `<text x="${layout.width / 2 - 12}" y="${footerY}" class="footer" text-anchor="middle">${escapeXml(footerStats)}</text>` : ''}
  <text x="${layout.width - layout.margin.right}" y="${footerY}" class="credit" text-anchor="end">${escapeXml(footerCredits)}</text>
</svg>`;
}
