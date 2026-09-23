// Shared Chart.js palette + options for the admin.
// Colors are read from the global CSS tokens in index.css, so chart styling
// lives in global CSS, not inline in components.

const TOKENS = [
  "admin-chart-ink",
  "admin-chart-money",
  "admin-chart-amber",
  "admin-chart-violet",
  "admin-chart-sky",
  "admin-chart-grid",
];

export function readChartPalette(element) {
  const root = element?.ownerDocument?.documentElement || (
    typeof document !== "undefined" ? document.documentElement : null
  );
  if (!root) return {};
  const style = getComputedStyle(root);
  return TOKENS.reduce((acc, name) => {
    acc[name] = (style.getPropertyValue(`--${name}`) || "").trim();
    return acc;
  }, {});
}

export const chartPalette = () => readChartPalette();

// Append an alpha to a color token that supports it (oklch gains / alpha).
export function withAlpha(color, alpha) {
  if (!color) return color;
  if (color.startsWith("oklch(") && !color.includes("/")) {
    return color.replace(")", ` / ${alpha})`);
  }
  return color;
}

// Area sparklines used by the stat cards.
export const sparklineOptions = {
  responsive: true,
  maintainAspectRatio: false,
  animation: { duration: 900, easing: "easeOutQuart" },
  plugins: { legend: { display: false }, tooltip: { enabled: false } },
  scales: {
    x: { display: false },
    y: { display: false, min: 0 },
  },
  layout: { padding: { top: 6, bottom: 0, left: -4, right: -4 } },
};

export function areaGradient(color, ctx, height) {
  const g = ctx.createLinearGradient(0, 0, 0, height || 48);
  g.addColorStop(0, withAlpha(color, "0.24"));
  g.addColorStop(1, withAlpha(color, "0"));
  return g;
}

export const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  animation: { animateRotate: true, duration: 900, easing: "easeOutQuart" },
  plugins: {
    legend: {
      position: "bottom",
      labels: {
        usePointStyle: true,
        pointStyle: "circle",
        padding: 18,
        boxWidth: 7,
        boxHeight: 7,
        font: { size: 11, family: "Inter", weight: "500" },
        color: "oklch(0.556 0 0)",
      },
    },
    tooltip: {
      backgroundColor: "oklch(0.205 0 0 / 0.92)",
      titleColor: "oklch(0.985 0 0)",
      bodyColor: "oklch(0.985 0 0)",
      padding: 12,
      cornerRadius: 8,
      displayColors: false,
      font: { family: "Inter", size: 12 },
    },
  },
};