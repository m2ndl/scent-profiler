// Derive the Drydown palette from OKLCH so hue, chroma and lightness are chosen deliberately,
// then check WCAG contrast for every text-on-surface pair the site uses.
function oklchToHex(L, C, h) {
  const a = C * Math.cos(h * Math.PI / 180), b = C * Math.sin(h * Math.PI / 180);
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.2914855480 * b;
  const l = l_ ** 3, m = m_ ** 3, s = s_ ** 3;
  let r = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  let g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  let bb = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s;
  const gam = x => { x = Math.max(0, Math.min(1, x)); return x <= 0.0031308 ? 12.92 * x : 1.055 * x ** (1 / 2.4) - 0.055; };
  const to = x => Math.round(gam(x) * 255).toString(16).padStart(2, "0").toUpperCase();
  return "#" + to(r) + to(g) + to(bb);
}
function lum(hex) {
  const c = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255).map(v => v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
function contrast(a, b) { const x = lum(a), y = lum(b); return ((Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)).toFixed(2); }

const light = {
  ground: [0.945, 0.016, 80], paper: [0.985, 0.007, 85], paper2: [0.91, 0.02, 78],
  line: [0.87, 0.02, 75], line2: [0.79, 0.026, 72],
  ink: [0.26, 0.022, 50], ink2: [0.46, 0.022, 55], ink3: [0.60, 0.022, 60],
  accent: [0.43, 0.11, 345], accentSoft: [0.935, 0.028, 345],
  bad: [0.50, 0.14, 25], badSoft: [0.93, 0.035, 25],
  warn: [0.57, 0.115, 75], warnSoft: [0.94, 0.045, 85],
  good: [0.50, 0.085, 145], goodSoft: [0.93, 0.035, 145],
  open: [0.82, 0.12, 95], heart: [0.72, 0.10, 10], dry: [0.58, 0.11, 58]
};
const dark = {
  ground: [0.21, 0.014, 60], paper: [0.26, 0.015, 60], paper2: [0.31, 0.016, 60],
  line: [0.36, 0.018, 60], line2: [0.45, 0.02, 60],
  ink: [0.94, 0.012, 80], ink2: [0.78, 0.014, 75], ink3: [0.63, 0.016, 70],
  accent: [0.78, 0.085, 345], accentSoft: [0.32, 0.045, 345],
  bad: [0.74, 0.12, 25], badSoft: [0.32, 0.05, 25],
  warn: [0.80, 0.11, 80], warnSoft: [0.33, 0.045, 80],
  good: [0.76, 0.09, 145], goodSoft: [0.31, 0.04, 145],
  open: [0.84, 0.11, 95], heart: [0.76, 0.09, 10], dry: [0.70, 0.11, 58]
};
for (const [name, P] of [["light", light], ["dark", dark]]) {
  const H = {}; for (const k in P) H[k] = oklchToHex(...P[k]);
  console.log("\n" + name); for (const k in H) console.log(`  ${k.padEnd(11)} ${H[k]}`);
  const pairs = [["ink", "ground"], ["ink", "paper"], ["ink2", "ground"], ["ink2", "paper"], ["ink3", "paper"], ["accent", "paper"], ["accent", "ground"],
    ["bad", "paper"], ["bad", "badSoft"], ["warn", "paper"], ["warn", "warnSoft"], ["good", "paper"], ["good", "goodSoft"], ["accent", "accentSoft"]];
  for (const [f, b] of pairs) console.log(`  ${f} on ${b}: ${contrast(H[f], H[b])}`);
  const onAccent = name === "light" ? H.paper : H.ground;
  console.log(`  white-ish on accent: ${contrast(onAccent, H.accent)}  on bad: ${contrast(onAccent, H.bad)}  on good: ${contrast(onAccent, H.good)}  on warn: ${contrast(onAccent, H.warn)}`);
}
