import React, { useEffect, useMemo, useState } from "react";

/*
 * Farbkreis & Schlafzimmer-Planer
 * -------------------------------
 * Tab "Schlafzimmer":
 *   - Wandfarbe, Boden, Bett (Holz), Bettbezug, Bettdecke/Tagesdecke,
 *     Bilder & Akzente, Kleiderschrank, Schreibtischplatte und Pflanzen
 *     einzeln wählen und sofort in der Raumvorschau sehen.
 *   - Farbcheck: zeigt, wo die gewählten Farben im Farbkreis liegen, und
 *     gibt Hinweise (Holztöne, Komplementärkontrast, Anzahl Buntfarben ...).
 *   - Auswahl wird im Browser gespeichert (falls möglich).
 * Tab "Farbkreis":
 *   - 12-teiliger Farbkreis (Itten / RYB) mit Nuancen, Farbebenen,
 *     Warm/Kalt und Farbharmonien. Eine Harmonie lässt sich direkt
 *     ins Schlafzimmer übernehmen.
 */

// ---------------------------------------------------------------------------
// Farbdaten
// ---------------------------------------------------------------------------

const HUES = [
  { name: "Gelb", hex: "#FFE11A", level: "primär" },
  { name: "Gelb-Orange", hex: "#FDB813", level: "tertiär" },
  { name: "Orange", hex: "#F7941D", level: "sekundär" },
  { name: "Rot-Orange", hex: "#F15A22", level: "tertiär" },
  { name: "Rot", hex: "#E31E24", level: "primär" },
  { name: "Rot-Violett", hex: "#C2185B", level: "tertiär" },
  { name: "Violett", hex: "#7B2C8E", level: "sekundär" },
  { name: "Blau-Violett", hex: "#4B3A97", level: "tertiär" },
  { name: "Blau", hex: "#1F5AA8", level: "primär" },
  { name: "Blau-Grün", hex: "#0A8F8A", level: "tertiär" },
  { name: "Grün", hex: "#2DA84A", level: "sekundär" },
  { name: "Gelb-Grün", hex: "#A6CE39", level: "tertiär" },
];

const WARM = new Set([0, 1, 2, 3, 4, 5]);

// Nuancen im Farbkreis
const NUANCES = [
  { id: "rein", label: "Rein", hint: "volle Sättigung – für Akzente" },
  { id: "gedeckt", label: "Gedeckt", hint: "mit Grau gemischt – ruhig, wohnlich" },
  { id: "hell", label: "Hell", hint: "mit Weiß gemischt – Pastell, luftig" },
  { id: "dunkel", label: "Dunkel", hint: "mit Schwarz gemischt – edel, gemütlich" },
];

// Nuancen in der Farbauswahl des Schlafzimmers (von zart bis dunkel)
const PICK_NUANCES = [
  { id: "zart", label: "Zart" },
  { id: "hell", label: "Hell" },
  { id: "gedeckt", label: "Gedeckt" },
  { id: "rein", label: "Rein" },
  { id: "dunkel", label: "Dunkel" },
];

const NUANCE_LABEL = Object.fromEntries(PICK_NUANCES.map((n) => [n.id, n.label]));

const NEUTRALS = [
  { id: "reinweiss", name: "Reinweiß", hex: "#FAFAF8" },
  { id: "altweiss", name: "Gebrochenes Weiß", hex: "#F1EDE4" },
  { id: "cremeweiss", name: "Cremeweiß", hex: "#F2E9D6" },
  { id: "leinen", name: "Leinen", hex: "#E5DCCB" },
  { id: "beige", name: "Beige", hex: "#D8C7AC" },
  { id: "sand", name: "Sand", hex: "#CBB591" },
  { id: "greige", name: "Greige", hex: "#C7BFB3" },
  { id: "hellgrau", name: "Hellgrau", hex: "#DADAD7" },
  { id: "steingrau", name: "Steingrau", hex: "#A9A7A2" },
  { id: "taupe", name: "Taupe", hex: "#8E8077" },
  { id: "anthrazit", name: "Anthrazit", hex: "#46474A" },
];

// hue = Lage des Holztons im Farbkreis (Holz ist fast immer ein gedecktes Orange)
const WOODS = [
  { id: "birke", name: "Birke / Ahorn", hex: "#E4CCA4", hue: 1 },
  { id: "eiche-weiss", name: "Eiche weiß geölt", hex: "#DDCDB3", hue: 1 },
  { id: "kiefer", name: "Kiefer", hex: "#E0B378", hue: 1 },
  { id: "eiche-natur", name: "Eiche natur", hex: "#C9A16B", hue: 1 },
  { id: "buche", name: "Buche", hex: "#D5A07A", hue: 2 },
  { id: "eiche-geoelt", name: "Eiche geölt", hex: "#B4844E", hue: 2 },
  { id: "kirsche", name: "Kirschbaum", hex: "#A35F3E", hue: 3 },
  { id: "nussbaum", name: "Nussbaum", hex: "#6E4C35", hue: 2 },
  { id: "raeuchereiche", name: "Räuchereiche", hex: "#57412F", hue: 2 },
  { id: "weiss-lack", name: "Weiß lackiert", hex: "#F1EFEA", hue: null },
  { id: "grau-lack", name: "Grau lackiert", hex: "#9A9894", hue: null },
  { id: "schwarz-lack", name: "Schwarz", hex: "#2E2E30", hue: null },
];

const PLANT_TONES = [
  { id: "salbei", name: "Salbei", hex: "#8FA88A" },
  { id: "gruen", name: "Sattgrün", hex: "#4F8A4B" },
  { id: "dunkel", name: "Dunkelgrün", hex: "#2F5D3A" },
  { id: "oliv", name: "Oliv", hex: "#7D8550" },
];

const ITEMS = [
  { id: "wand", label: "Wandfarbe", note: "frei wählbar", groups: ["neutral", "farbe"] },
  { id: "bett", label: "Bett (Holz)", note: "noch nicht gekauft", groups: ["holz"] },
  { id: "bettbezug", label: "Bettbezug", note: "frei wählbar", groups: ["neutral", "farbe"] },
  { id: "tagesdecke", label: "Bettdecke / Tagesdecke", note: "frei wählbar", groups: ["neutral", "farbe"] },
  { id: "akzent", label: "Bilder & Akzente", note: "Bilder, Zierkissen", groups: ["farbe", "neutral"] },
  { id: "schrank", label: "Kleiderschrank", note: "vorhanden: Eiche", groups: ["holz"] },
  { id: "schreibtisch", label: "Schreibtischplatte", note: "Eiche oder Buche?", groups: ["holz"] },
  { id: "boden", label: "Boden", note: "", groups: ["holz", "neutral"] },
];

const DEFAULT_ROOM = {
  wand: { kind: "neutral", id: "altweiss" },
  bett: { kind: "holz", id: "eiche-natur" },
  bettbezug: { kind: "farbe", hue: 8, nuance: "gedeckt" },
  tagesdecke: { kind: "neutral", id: "sand" },
  akzent: { kind: "farbe", hue: 3, nuance: "gedeckt" },
  schrank: { kind: "holz", id: "eiche-natur" },
  schreibtisch: { kind: "holz", id: "buche" },
  boden: { kind: "holz", id: "eiche-weiss" },
  pflanzen: 2,
  pflanzenTon: "gruen",
};

const STORAGE_KEY = "farbkreis-schlafzimmer-v1";

const HARMONIES = {
  komplementaer: {
    label: "Komplementär",
    offsets: [0, 6],
    text: "Zwei Farben, die sich im Kreis gegenüberliegen. Maximaler Kontrast – sie lassen sich gegenseitig leuchten.",
    tip: "Eine Farbe großflächig und gedeckt (z. B. Bettbezug), die Gegenfarbe nur als kleinen Akzent (Kissen, Bild).",
  },
  split: {
    label: "Split-komplementär",
    offsets: [0, 5, 7],
    text: "Grundfarbe plus die beiden Nachbarn ihrer Komplementärfarbe. Kontrastreich, aber weniger hart.",
    tip: "Grundfarbe dominiert, die zwei anderen verteilen sich auf Tagesdecke und Deko.",
  },
  analog: {
    label: "Analog",
    offsets: [-1, 0, 1],
    text: "Drei benachbarte Farben. Harmonisch, ruhig und natürlich – wie ein Sonnenuntergang oder Wald.",
    tip: "Ideal fürs Schlafzimmer und für Leseecken. Passt sehr gut zu Holz und Naturmaterialien.",
  },
  triade: {
    label: "Triade",
    offsets: [0, 4, 8],
    text: "Drei Farben im gleichen Abstand (gleichseitiges Dreieck). Lebendig und ausgewogen.",
    tip: "Kräftig – mindestens zwei der drei Farben gedeckt oder hell verwenden, sonst wird es schnell unruhig.",
  },
  tetrade: {
    label: "Tetrade (Rechteck)",
    offsets: [0, 2, 6, 8],
    text: "Zwei Komplementärpaare. Sehr vielseitig, braucht aber eine klar dominante Farbe.",
    tip: "Eine Farbe für die Fläche, die anderen sparsam. Viel Neutralton (Weiß, Grau, Beige) dazwischen.",
  },
  quadrat: {
    label: "Quadrat",
    offsets: [0, 3, 6, 9],
    text: "Vier Farben im gleichen Abstand. Bunt und verspielt.",
    tip: "Eher für Kinderzimmer oder einzelne Deko-Inseln. Für ganze Räume stark abtönen.",
  },
  monochrom: {
    label: "Monochrom",
    offsets: [0],
    text: "Eine einzige Farbe in verschiedenen Helligkeiten und Sättigungen.",
    tip: "Elegant und ruhig. Für Spannung sorgen Materialien und Texturen (Samt, Leinen, Holz, Metall).",
  },
};

const LEVELS = [
  { id: "alle", label: "Alle" },
  { id: "primär", label: "Primär" },
  { id: "sekundär", label: "Sekundär" },
  { id: "tertiär", label: "Tertiär" },
];

const RELATIONS = [
  { name: "Ton-in-Ton", tip: "harmonisch; Spannung entsteht nur über Hell und Dunkel." },
  { name: "analog (Nachbarn im Farbkreis)", tip: "ruhig und stimmig – ideal fürs Schlafzimmer." },
  { name: "verwandt", tip: "harmonisch mit leichter Spannung." },
  { name: "im rechten Winkel (90°)", tip: "lebendiger Kontrast; eine der beiden Farben gedeckt halten." },
  { name: "triadisch", tip: "bunt und ausgewogen; sparsam dosieren." },
  { name: "split-komplementär", tip: "kontrastreich, aber weicher als komplementär." },
  { name: "komplementär", tip: "maximaler Kontrast – den Akzent klein halten." },
];

// ---------------------------------------------------------------------------
// Farb-Hilfsfunktionen
// ---------------------------------------------------------------------------

const hexToRgb = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

const rgbToHex = ([r, g, b]) =>
  "#" + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("").toUpperCase();

const mix = (hexA, hexB, t) => {
  const a = hexToRgb(hexA);
  const b = hexToRgb(hexB);
  return rgbToHex(a.map((v, i) => v + (b[i] - v) * t));
};

const darker = (hex, t = 0.12) => mix(hex, "#000000", t);
const lighter = (hex, t = 0.25) => mix(hex, "#FFFFFF", t);

const shade = (hex, nuance) => {
  switch (nuance) {
    case "zart":
      return mix(mix(hex, "#8C8A85", 0.3), "#F4F2ED", 0.8);
    case "gedeckt":
      return mix(hex, "#8C8A85", 0.5);
    case "hell":
      return mix(hex, "#FFFFFF", 0.6);
    case "dunkel":
      return mix(hex, "#1A1A1A", 0.45);
    default:
      return hex;
  }
};

const luminance = (hex) => {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const textOn = (hex) => (luminance(hex) > 0.4 ? "#1d1d1f" : "#ffffff");

const wrap = (i) => ((i % 12) + 12) % 12;

const hueDist = (a, b) => {
  const d = Math.abs(wrap(a) - wrap(b));
  return Math.min(d, 12 - d);
};

// Auswahl -> { hex, name, hue }
const resolve = (sel) => {
  if (!sel) return { hex: "#CCCCCC", name: "?", hue: null };
  if (sel.kind === "farbe") {
    const h = HUES[wrap(sel.hue)];
    return { hex: shade(h.hex, sel.nuance), name: `${h.name} ${NUANCE_LABEL[sel.nuance] || ""}`.trim(), hue: wrap(sel.hue) };
  }
  if (sel.kind === "holz") {
    const w = WOODS.find((x) => x.id === sel.id) || WOODS[3];
    return { hex: w.hex, name: w.name, hue: w.hue };
  }
  const n = NEUTRALS.find((x) => x.id === sel.id) || NEUTRALS[1];
  return { hex: n.hex, name: n.name, hue: null };
};

const sameSel = (a, b) =>
  a && b && a.kind === b.kind && (a.kind === "farbe" ? a.hue === b.hue && a.nuance === b.nuance : a.id === b.id);

// ---------------------------------------------------------------------------
// SVG-Geometrie Farbkreis
// ---------------------------------------------------------------------------

const CX = 300;
const CY = 300;
const SEG = 30;

const RINGS = [
  { nuance: "rein", r0: 205, r1: 275 },
  { nuance: "gedeckt", r0: 150, r1: 205 },
  { nuance: "hell", r0: 100, r1: 150 },
];

const polar = (r, deg) => {
  const rad = ((deg - 90) * Math.PI) / 180;
  return [CX + r * Math.cos(rad), CY + r * Math.sin(rad)];
};

const sectorPath = (i, r0, r1) => {
  const a0 = i * SEG - SEG / 2;
  const a1 = i * SEG + SEG / 2;
  const [x0, y0] = polar(r1, a0);
  const [x1, y1] = polar(r1, a1);
  const [x2, y2] = polar(r0, a1);
  const [x3, y3] = polar(r0, a0);
  return `M${x0},${y0} A${r1},${r1} 0 0 1 ${x1},${y1} L${x2},${y2} A${r0},${r0} 0 0 0 ${x3},${y3} Z`;
};

const arcPath = (r, a0, a1) => {
  const [x0, y0] = polar(r, a0);
  const [x1, y1] = polar(r, a1);
  const large = a1 - a0 > 180 ? 1 : 0;
  return `M${x0},${y0} A${r},${r} 0 ${large} 1 ${x1},${y1}`;
};

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const CSS = `
.fk { font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; background: #F4F2EE; color: #1d1d1f;
  min-height: 100vh; box-sizing: border-box; padding-block: 20px 40px;
  padding-left: max(16px, env(safe-area-inset-left, 0px)); padding-right: max(16px, env(safe-area-inset-right, 0px)); }
.fk *, .fk *::before, .fk *::after { box-sizing: border-box; }
.fk-wrap { max-width: 1180px; margin: 0 auto; }
.fk h1 { margin: 0; font-size: clamp(22px, 5vw, 28px); text-wrap: balance; }
.fk-sub { margin: 6px 0 0; color: #6e6e73; line-height: 1.45; }
.fk-tabs { display: inline-flex; background: #E6E3DD; border-radius: 999px; padding: 4px; gap: 4px; margin: 16px 0 18px; }
.fk-tab { border: none; background: transparent; padding: 8px 16px; border-radius: 999px; font: inherit; font-size: 15px; cursor: pointer; color: #1d1d1f; }
.fk-tab[aria-selected="true"] { background: #fff; font-weight: 600; box-shadow: 0 1px 2px rgba(0,0,0,.12); }
.card { background: #fff; border-radius: 16px; padding: 18px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); min-width: 0; }
.label { font-size: 12px; font-weight: 700; letter-spacing: .6px; text-transform: uppercase; color: #6e6e73; margin: 0 0 8px; }
.pill { padding: 7px 12px; border-radius: 999px; border: 1px solid #d0d0d5; background: #fff; color: #1d1d1f; font: inherit; font-size: 14px; cursor: pointer; }
.pill[aria-pressed="true"] { border-color: #1d1d1f; background: #1d1d1f; color: #fff; }
.pills { display: flex; flex-wrap: wrap; gap: 8px; }
button:focus-visible { outline: 3px solid #2F6FDE; outline-offset: 2px; }
.two { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 340px), 1fr)); gap: 20px; }
.stack { display: flex; flex-direction: column; gap: 20px; min-width: 0; }

/* Schlafzimmer-Layout */
.room-layout { display: grid; gap: 16px; grid-template-columns: minmax(0, 1fr);
  grid-template-areas: "preview" "controls" "check"; }
.room-left { display: contents; }
.room-preview { grid-area: preview; position: sticky; top: env(safe-area-inset-top, 0px); z-index: 5; padding: 10px; }
.room-controls { grid-area: controls; }
.room-check { grid-area: check; }
.room-svg { width: 100%; display: block; border-radius: 10px; }
@media (min-width: 900px) {
  .room-layout { grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr); grid-template-areas: "left controls"; gap: 20px; }
  .room-left { display: flex; flex-direction: column; gap: 20px; grid-area: left; position: sticky; top: 16px; align-self: start; }
  .room-preview { position: static; padding: 14px; }
}

/* Auswahl-Zeilen */
.rows { display: flex; flex-direction: column; }
.row { border-top: 1px solid #ECEAE6; }
.row:first-child { border-top: none; }
.row-head { width: 100%; display: flex; align-items: center; gap: 12px; padding: 12px 2px; background: none; border: none; font: inherit; color: inherit; cursor: pointer; text-align: left; }
.row-sw { width: 34px; height: 34px; border-radius: 8px; flex: none; box-shadow: inset 0 0 0 1px rgba(0,0,0,.12); }
.row-text { display: flex; flex-direction: column; min-width: 0; flex: 1; }
.row-label { font-weight: 600; font-size: 15px; }
.row-val { font-size: 13px; color: #6e6e73; }
.row-note { font-size: 11px; color: #6e6e73; background: #F2F0EC; border-radius: 999px; padding: 3px 8px; white-space: nowrap; }
.row-note-inline { display: none; }
@media (max-width: 560px) { .row-note { display: none; } .row-note-inline { display: inline; } }
.chev { flex: none; transition: transform .15s; color: #8a8a8e; }
.row-head[aria-expanded="true"] .chev { transform: rotate(180deg); }
.row-body { padding: 4px 2px 16px; display: flex; flex-direction: column; gap: 12px; }
.pk-title { font-size: 12px; color: #6e6e73; margin: 0 0 6px; font-weight: 600; }
.chips { display: flex; flex-wrap: wrap; gap: 6px; }
.chip { width: 68px; display: flex; flex-direction: column; align-items: center; gap: 4px; background: none; border: none; padding: 4px 0; font: inherit; cursor: pointer; color: inherit; border-radius: 8px; }
.chip-sw { width: 36px; height: 36px; border-radius: 50%; box-shadow: inset 0 0 0 1px rgba(0,0,0,.15); }
.chip-name { font-size: 11px; line-height: 1.2; text-align: center; color: #3a3a3c; }
.chip[aria-pressed="true"] .chip-sw { box-shadow: 0 0 0 2px #fff, 0 0 0 4px #1d1d1f; }
.chip[aria-pressed="true"] .chip-name { font-weight: 700; color: #1d1d1f; }
.pk-grid { display: grid; grid-template-columns: 54px repeat(12, minmax(0, 1fr)); gap: 3px; align-items: center; }
.pk-rowlabel { font-size: 11px; color: #6e6e73; }
.pk-cell { aspect-ratio: 1; max-width: 100%; border: none; border-radius: 4px; cursor: pointer; padding: 0; }
.pk-cell[aria-pressed="true"] { box-shadow: 0 0 0 2px #fff, 0 0 0 4px #1d1d1f; position: relative; z-index: 1; }

/* Farbcheck */
.check-top { display: grid; grid-template-columns: 150px minmax(0, 1fr); gap: 14px; align-items: center; }
@media (max-width: 420px) { .check-top { grid-template-columns: 120px minmax(0, 1fr); } }
.legend { display: flex; flex-direction: column; gap: 5px; font-size: 13px; }
.legend-row { display: flex; align-items: center; gap: 8px; min-width: 0; }
.legend-num { width: 20px; height: 20px; border-radius: 50%; font-size: 11px; font-weight: 700; display: inline-flex; align-items: center; justify-content: center; flex: none; box-shadow: inset 0 0 0 1px rgba(0,0,0,.15); }
.legend-text { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.msgs { list-style: none; padding: 0; margin: 14px 0 0; display: flex; flex-direction: column; gap: 8px; }
.msg { display: flex; gap: 10px; font-size: 14px; line-height: 1.45; }
.msg-dot { flex: none; width: 20px; height: 20px; border-radius: 50%; color: #fff; font-size: 12px; font-weight: 700; display: inline-flex; align-items: center; justify-content: center; margin-top: 1px; }
.msg-ok .msg-dot { background: #3E8E5A; }
.msg-hint .msg-dot { background: #C98A1B; }
.msg-warn .msg-dot { background: #C2432F; }
.msg-info .msg-dot { background: #4A6FA5; }
.rule { margin: 14px 0 0; font-size: 13px; color: #6e6e73; line-height: 1.5; }
.plant-row { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
`;

// ---------------------------------------------------------------------------
// Farbkreis-Komponenten
// ---------------------------------------------------------------------------

function Wheel({ base, nuance, harmonyIdx, level, showWarm, onPick }) {
  const ring = RINGS.find((r) => r.nuance === nuance);
  const markerR = ring ? (ring.r0 + ring.r1) / 2 : (RINGS[0].r0 + RINGS[0].r1) / 2;

  const polygon =
    harmonyIdx.length > 1
      ? harmonyIdx
          .slice()
          .sort((a, b) => a - b)
          .map((i) => polar(92, i * SEG).join(","))
          .join(" ")
      : null;

  const centerColor = shade(HUES[base].hex, nuance);

  return (
    <svg viewBox="-50 -20 700 640" style={{ width: "100%", maxWidth: 560, display: "block", margin: "0 auto" }}>
      {showWarm && (
        <g>
          <path d={arcPath(288, -SEG / 2 + 2, 5 * SEG + SEG / 2 - 2)} stroke="#E8743B" strokeWidth="6" fill="none" strokeLinecap="round" />
          <path d={arcPath(288, 6 * SEG - SEG / 2 + 2, 11 * SEG + SEG / 2 - 2)} stroke="#3B7BE8" strokeWidth="6" fill="none" strokeLinecap="round" />
          <text x={polar(296, 75)[0]} y={polar(296, 75)[1]} fontSize="15" fontWeight="600" fill="#E8743B" textAnchor="start">warm</text>
          <text x={polar(296, 255)[0]} y={polar(296, 255)[1]} fontSize="15" fontWeight="600" fill="#3B7BE8" textAnchor="end">kalt</text>
        </g>
      )}

      {HUES.map((h, i) => {
        const dim = level !== "alle" && h.level !== level;
        return (
          <g key={h.name} style={{ cursor: "pointer" }} opacity={dim ? 0.15 : 1}>
            {RINGS.map((r) => (
              <path
                key={r.nuance}
                d={sectorPath(i, r.r0, r.r1)}
                fill={shade(h.hex, r.nuance)}
                stroke="#fff"
                strokeWidth="2"
                onClick={() => onPick(i, r.nuance)}
              >
                <title>{`${h.name} · ${r.nuance} · ${shade(h.hex, r.nuance)}`}</title>
              </path>
            ))}
          </g>
        );
      })}

      {HUES.map((h, i) => {
        const [x, y] = polar(240, i * SEG);
        if (level !== "alle" && h.level !== level) return null;
        return (
          <text key={"lbl" + i} x={x} y={y + 5} textAnchor="middle" fontSize="14" fontWeight="700" fill={textOn(h.hex)} pointerEvents="none">
            {h.level === "primär" ? "1" : h.level === "sekundär" ? "2" : "3"}
          </text>
        );
      })}

      {polygon && <polygon points={polygon} fill="none" stroke="#333" strokeWidth="2.5" strokeLinejoin="round" />}
      {harmonyIdx.length > 1 &&
        harmonyIdx.map((i) => {
          const [x, y] = polar(92, i * SEG);
          return <circle key={"v" + i} cx={x} cy={y} r="5" fill="#333" />;
        })}

      {harmonyIdx.map((i, k) => {
        const [x, y] = polar(markerR, i * SEG);
        return (
          <circle
            key={"m" + i}
            cx={x}
            cy={y}
            r={k === 0 ? 11 : 8}
            fill="none"
            stroke={k === 0 ? "#111" : "#fff"}
            strokeWidth={k === 0 ? 4 : 3}
            pointerEvents="none"
          />
        );
      })}

      <circle cx={CX} cy={CY} r="40" fill={centerColor} stroke="#fff" strokeWidth="4" />
    </svg>
  );
}

// Kleiner Farbkreis für den Farbcheck: zeigt die gewählten Farben als nummerierte Punkte
function MiniWheel({ marks }) {
  const perHue = {};
  return (
    <svg viewBox="10 10 580 580" style={{ width: "100%", display: "block" }} role="img" aria-label="Lage der Farben im Farbkreis">
      {HUES.map((h, i) =>
        RINGS.map((r) => (
          <path key={h.name + r.nuance} d={sectorPath(i, r.r0, r.r1)} fill={shade(h.hex, r.nuance)} stroke="#fff" strokeWidth="3" opacity="0.4" />
        ))
      )}
      {marks.map((m) => {
        const k = perHue[m.hue] || 0;
        perHue[m.hue] = k + 1;
        const [x, y] = polar(245 - k * 50, m.hue * SEG);
        return (
          <g key={m.key}>
            <circle cx={x} cy={y} r="27" fill={m.hex} stroke="#fff" strokeWidth="5" />
            <text x={x} y={y + 10} textAnchor="middle" fontSize="28" fontWeight="700" fill={textOn(m.hex)}>
              {m.num}
            </text>
          </g>
        );
      })}
      <text x={CX} y={CY + 8} textAnchor="middle" fontSize="24" fill="#8a8a8e">
        Farbkreis
      </text>
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Schlafzimmer-Komponenten
// ---------------------------------------------------------------------------

function Plant({ x, y, s = 1, tone, trailing = false }) {
  const dark = darker(tone, 0.22);
  const upright = [
    [-11, -36, -28],
    [10, -40, 24],
    [0, -50, 0],
    [-17, -24, -55],
    [17, -26, 55],
    [-4, -32, -10],
  ];
  const hanging = [
    [-13, -10, 25],
    [13, -10, -25],
    [-16, 2, 10],
    [16, 4, -10],
    [-15, 14, 5],
    [-6, -22, -20],
    [6, -22, 20],
    [0, -26, 0],
  ];
  const leaves = trailing ? hanging : upright;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {!trailing &&
        upright.map(([lx, ly], i) => (
          <line key={"s" + i} x1="0" y1="-14" x2={lx * 0.7} y2={ly * 0.7} stroke={dark} strokeWidth="1.2" />
        ))}
      {leaves.map(([lx, ly, rot], i) => (
        <ellipse
          key={i}
          cx={lx}
          cy={ly}
          rx={trailing ? 4.5 : 6}
          ry={trailing ? 7.5 : 15}
          transform={`rotate(${rot} ${lx} ${ly})`}
          fill={i % 2 ? dark : tone}
        />
      ))}
      <path d="M-10 -16 L10 -16 L8 0 L-8 0 Z" fill="#E2DCD0" stroke="#C9C2B4" strokeWidth="0.8" />
    </g>
  );
}

const grainLines = (x, y, w, h, hex, vertical, n = 4) => {
  const stroke = darker(hex, 0.1);
  return Array.from({ length: n }, (_, i) => {
    const t = (i + 1) / (n + 1);
    return vertical ? (
      <line key={i} x1={x + w * t} y1={y + 3} x2={x + w * t + (i % 2 ? 1.5 : -1.5)} y2={y + h - 3} stroke={stroke} strokeWidth="0.7" opacity="0.6" />
    ) : (
      <line key={i} x1={x + 3} y1={y + h * t} x2={x + w - 3} y2={y + h * t + (i % 2 ? 1 : -1)} stroke={stroke} strokeWidth="0.7" opacity="0.6" />
    );
  });
};

function Bedroom({ room, c }) {
  const isWood = (id) => room[id].kind === "holz" && resolve(room[id]).hue !== null;
  const tone = (PLANT_TONES.find((p) => p.id === room.pflanzenTon) || PLANT_TONES[1]).hex;
  const n = room.pflanzen;
  const wall = c.wand.hex;
  const metal = "#36363A";

  return (
    <svg viewBox="0 0 420 270" className="room-svg" role="img" aria-label="Vorschau Schlafzimmer">
      <defs>
        <linearGradient id="fk-wallshade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#000" stopOpacity="0.06" />
          <stop offset="1" stopColor="#000" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Wand */}
      <rect x="0" y="0" width="420" height="200" fill={wall} />
      <rect x="0" y="0" width="420" height="200" fill="url(#fk-wallshade)" />

      {/* Boden */}
      <rect x="0" y="200" width="420" height="70" fill={c.boden.hex} />
      {room.boden.kind === "holz" &&
        [214, 230, 248].map((ly, i) => (
          <g key={ly}>
            <line x1="0" y1={ly} x2="420" y2={ly} stroke={darker(c.boden.hex, 0.12)} strokeWidth="0.8" />
            {[60, 170, 290, 380].map((sx, j) => (
              <line key={sx} x1={sx + (i % 2) * 50 - j * 7} y1={ly - (i === 0 ? 14 : i === 1 ? 16 : 18)} x2={sx + (i % 2) * 50 - j * 7} y2={ly} stroke={darker(c.boden.hex, 0.12)} strokeWidth="0.8" />
            ))}
          </g>
        ))}
      <rect x="0" y="196" width="420" height="5" fill={lighter(wall, 0.55)} />
      <line x1="0" y1="201" x2="420" y2="201" stroke={darker(wall, 0.15)} strokeWidth="0.8" />

      {/* Bilder über dem Bett */}
      <rect x="186" y="38" width="52" height="66" fill="#FBFAF7" stroke="#2E2E30" strokeWidth="2" />
      <rect x="193" y="45" width="38" height="52" fill={lighter(c.akzent.hex, 0.78)} />
      <circle cx="212" cy="80" r="12" fill={c.akzent.hex} />
      <path d="M193 97 Q212 70 231 88 L231 97 Z" fill={darker(c.akzent.hex, 0.15)} opacity="0.85" />
      <rect x="248" y="50" width="44" height="54" fill="#FBFAF7" stroke="#2E2E30" strokeWidth="2" />
      <rect x="254" y="56" width="32" height="42" fill={c.akzent.hex} />
      <path d="M262 92 Q270 66 278 92" stroke={lighter(c.akzent.hex, 0.6)} strokeWidth="2.5" fill="none" />

      {/* Kleiderschrank */}
      <rect x="10" y="30" width="94" height="6" fill={darker(c.schrank.hex, 0.08)} />
      <rect x="12" y="36" width="90" height="160" fill={c.schrank.hex} />
      <rect x="16" y="41" width="40" height="150" fill={c.schrank.hex} stroke={darker(c.schrank.hex, 0.2)} strokeWidth="1" />
      <rect x="58" y="41" width="40" height="150" fill={c.schrank.hex} stroke={darker(c.schrank.hex, 0.2)} strokeWidth="1" />
      {isWood("schrank") && grainLines(16, 41, 40, 150, c.schrank.hex, true, 3)}
      {isWood("schrank") && grainLines(58, 41, 40, 150, c.schrank.hex, true, 3)}
      <rect x="51" y="104" width="2.5" height="20" rx="1" fill={metal} />
      <rect x="61" y="104" width="2.5" height="20" rx="1" fill={metal} />
      <rect x="16" y="196" width="6" height="5" fill={darker(c.schrank.hex, 0.3)} />
      <rect x="92" y="196" width="6" height="5" fill={darker(c.schrank.hex, 0.3)} />
      {n >= 3 && <Plant x={78} y={30} s={0.9} tone={tone} trailing />}

      {/* Pflanze am Boden */}
      {n >= 1 && <Plant x={124} y={200} s={1.35} tone={tone} />}

      {/* Bett */}
      <ellipse cx="240" cy="222" rx="104" ry="6" fill="#000" opacity="0.12" />
      <rect x="160" y="112" width="160" height="72" rx="4" fill={c.bett.hex} />
      {isWood("bett") && grainLines(160, 112, 160, 72, c.bett.hex, false, 5)}
      <rect x="172" y="140" width="64" height="27" rx="10" fill={lighter(c.bettbezug.hex, 0.25)} stroke={darker(c.bettbezug.hex, 0.08)} strokeWidth="0.8" />
      <rect x="244" y="140" width="64" height="27" rx="10" fill={lighter(c.bettbezug.hex, 0.25)} stroke={darker(c.bettbezug.hex, 0.08)} strokeWidth="0.8" />
      <rect x="226" y="149" width="28" height="24" rx="6" fill={c.akzent.hex} transform="rotate(-6 240 161)" />
      <path d="M146 172 Q240 160 334 172 L336 200 L144 200 Z" fill={c.bettbezug.hex} />
      <path d="M162 184 Q240 176 318 184" stroke={darker(c.bettbezug.hex, 0.1)} strokeWidth="1" fill="none" />
      <path d="M140 189 Q240 181 340 189 L342 210 L138 210 Z" fill={c.tagesdecke.hex} />
      <path d="M140 189 Q240 181 340 189" stroke={darker(c.tagesdecke.hex, 0.14)} strokeWidth="1.2" fill="none" />
      <rect x="148" y="208" width="184" height="10" fill={c.bett.hex} />
      <line x1="148" y1="208" x2="332" y2="208" stroke={darker(c.bett.hex, 0.18)} strokeWidth="1" />
      <rect x="152" y="218" width="7" height="7" fill={darker(c.bett.hex, 0.1)} />
      <rect x="321" y="218" width="7" height="7" fill={darker(c.bett.hex, 0.1)} />

      {/* Schreibtisch */}
      <rect x="344" y="154" width="3" height="46" fill={metal} />
      <rect x="409" y="154" width="3" height="46" fill={metal} />
      <rect x="340" y="148" width="76" height="7" fill={c.schreibtisch.hex} />
      <line x1="340" y1="155" x2="416" y2="155" stroke={darker(c.schreibtisch.hex, 0.2)} strokeWidth="1" />
      {isWood("schreibtisch") && grainLines(340, 148, 76, 7, c.schreibtisch.hex, false, 2)}
      {/* Lampe */}
      <ellipse cx="402" cy="147" rx="7" ry="2" fill={metal} />
      <path d="M402 146 L396 116 L380 122" stroke={metal} strokeWidth="2" fill="none" />
      <path d="M372 120 L388 118 L386 128 L374 130 Z" fill={metal} />
      {n >= 2 && <Plant x={360} y={148} s={0.75} tone={tone} />}
    </svg>
  );
}

function Chevron() {
  return (
    <svg className="chev" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Picker({ value, groups, onChange }) {
  return (
    <>
      {groups.map((g) => {
        if (g === "neutral" || g === "holz") {
          const list = g === "neutral" ? NEUTRALS : WOODS;
          return (
            <div key={g}>
              <p className="pk-title">{g === "neutral" ? "Weiß-, Grau- und Beigetöne" : "Holz & Lack"}</p>
              <div className="chips">
                {list.map((it) => {
                  const sel = { kind: g, id: it.id };
                  return (
                    <button key={it.id} className="chip" aria-pressed={sameSel(value, sel)} onClick={() => onChange(sel)}>
                      <span className="chip-sw" style={{ background: it.hex }} />
                      <span className="chip-name">{it.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        }
        return (
          <div key={g}>
            <p className="pk-title">Farbkreis</p>
            <div className="pk-grid">
              {PICK_NUANCES.map((n) => (
                <React.Fragment key={n.id}>
                  <span className="pk-rowlabel">{n.label}</span>
                  {HUES.map((h, i) => {
                    const sel = { kind: "farbe", hue: i, nuance: n.id };
                    const hex = shade(h.hex, n.id);
                    return (
                      <button
                        key={i}
                        className="pk-cell"
                        style={{ background: hex }}
                        title={`${h.name} ${n.label}`}
                        aria-label={`${h.name} ${n.label}`}
                        aria-pressed={sameSel(value, sel)}
                        onClick={() => onChange(sel)}
                      />
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>
        );
      })}
    </>
  );
}

function analyze(room, c) {
  const msgs = [];
  const name = (id) => ITEMS.find((it) => it.id === id).label;

  // Wand
  const w = room.wand;
  if (w.kind === "neutral") {
    msgs.push({ t: "ok", s: `Neutrale Wand (${c.wand.name}): ruhiger Hintergrund, Holz und Textilien kommen gut zur Geltung.` });
  } else if (w.nuance === "zart" || w.nuance === "hell") {
    msgs.push({ t: "ok", s: `Zarte Wandfarbe (${c.wand.name}): wohnlich, ohne den Raum zu dominieren.` });
  } else if (w.nuance === "gedeckt") {
    msgs.push({ t: "hint", s: "Gedeckte Wandfarbe wirkt gemütlich, macht den Raum aber optisch kleiner. Gut als einzelne Wand hinter dem Bett." });
  } else {
    msgs.push({ t: "warn", s: "Kräftige Wandfarbe wirkt im Schlafzimmer eher anregend als beruhigend. Besser abtönen oder nur eine Wand streichen." });
  }

  // Holztöne der Möbel
  const furn = ["bett", "schrank", "schreibtisch"].filter((id) => room[id].kind === "holz");
  const ids = new Set(furn.map((id) => room[id].id));
  if (furn.length === 3 && ids.size === 1) {
    msgs.push({ t: "ok", s: `Alle Möbel in ${c.bett.name}: ruhig und einheitlich.` });
  } else {
    let similar = null;
    for (let i = 0; i < furn.length && !similar; i++) {
      for (let j = i + 1; j < furn.length; j++) {
        const a = furn[i];
        const b = furn[j];
        if (room[a].id === room[b].id || c[a].hue === null || c[b].hue === null) continue;
        if (Math.abs(luminance(c[a].hex) - luminance(c[b].hex)) < 0.07) {
          similar = [a, b];
          break;
        }
      }
    }
    if (similar) {
      const [a, b] = similar;
      msgs.push({
        t: "hint",
        s: `${name(a)} (${c[a].name}) und ${name(b)} (${c[b].name}) sind sich ähnlich, aber nicht gleich – das kann zufällig wirken. Entweder angleichen oder bewusst kontrastieren (hell gegen dunkel). Ein Textil in einer Zwischenfarbe verbindet beide.`,
      });
    } else {
      msgs.push({ t: "ok", s: "Die Holztöne unterscheiden sich deutlich – das wirkt gewollt. Am besten taucht jeder Ton mindestens zweimal auf (z. B. Bilderrahmen, Nachttisch)." });
    }
  }

  // Holz vs. Textilien
  const woodHue = c.bett.hue;
  const textiles = ["bettbezug", "tagesdecke", "akzent"].filter((id) => room[id].kind === "farbe");
  if (woodHue !== null && textiles.length) {
    const opposite = textiles.filter((id) => hueDist(c[id].hue, woodHue) >= 5);
    if (opposite.length) {
      msgs.push({
        t: "ok",
        s: `${opposite.map(name).join(" und ")} ${opposite.length > 1 ? "liegen" : "liegt"} dem warmen Holzton im Farbkreis gegenüber (Komplementärkontrast) – frisch und ausgewogen.`,
      });
    } else if (textiles.every((id) => hueDist(c[id].hue, woodHue) <= 1)) {
      msgs.push({ t: "hint", s: "Textilien Ton-in-Ton mit dem Holz: sehr warm und gemütlich. Ein kühler Akzent (Blau, Blau-Grün) würde Frische bringen." });
    }
  } else if (!textiles.length) {
    msgs.push({ t: "hint", s: "Nur Neutraltöne und Holz: zeitlos und ruhig. Ein farbiger Akzent (Bilder, Zierkissen) gibt dem Raum Persönlichkeit." });
  }

  // Bettbezug und Akzent
  if (room.bettbezug.kind === "farbe" && room.akzent.kind === "farbe") {
    const rel = RELATIONS[hueDist(c.bettbezug.hue, c.akzent.hue)];
    msgs.push({ t: "info", s: `Bettbezug und Akzent sind ${rel.name}: ${rel.tip}` });
  }

  // Anzahl Buntfarben
  const colorful = new Set(ITEMS.filter((it) => room[it.id].kind === "farbe").map((it) => c[it.id].hue));
  if (colorful.size > 3) {
    msgs.push({ t: "warn", s: `${colorful.size} verschiedene bunte Farbtöne – das wirkt schnell unruhig. Zwei bis drei reichen meist.` });
  }

  // Reine Farbe auf großer Fläche
  const loud = ["bettbezug", "tagesdecke"].filter((id) => room[id].kind === "farbe" && room[id].nuance === "rein");
  if (loud.length) {
    msgs.push({ t: "hint", s: `Reine, kräftige Farbe auf großer Fläche (${loud.map(name).join(", ")}). Im Schlafzimmer wirken gedeckte oder helle Nuancen ruhiger.` });
  }

  // Kontrast Wand / Bettbezug
  if (Math.abs(luminance(c.wand.hex) - luminance(c.bettbezug.hex)) < 0.04) {
    msgs.push({ t: "hint", s: "Bettbezug und Wand sind fast gleich hell – das Bett verschwimmt etwas. Die Tagesdecke kann Kontrast bringen." });
  }

  // Pflanzen
  if (room.pflanzen > 0) {
    const red = room.akzent.kind === "farbe" && [3, 4, 5].includes(c.akzent.hue);
    msgs.push({
      t: "ok",
      s: red
        ? "Pflanzengrün ist komplementär zu deinem roten Akzent – beide beleben sich gegenseitig."
        : "Pflanzengrün wirkt als Naturton, nicht als zusätzliche Farbe – passt zu fast jedem Holz.",
    });
  } else {
    msgs.push({ t: "hint", s: "Ein, zwei Pflanzen bringen Leben ins Zimmer – Grün passt zu fast jedem Holz." });
  }

  return msgs;
}

const MSG_ICON = { ok: "✓", hint: "!", warn: "!", info: "i" };

function loadRoom() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const saved = JSON.parse(raw);
      if (saved && typeof saved === "object") return { ...DEFAULT_ROOM, ...saved };
    }
  } catch {
    /* Speicher nicht verfügbar */
  }
  return DEFAULT_ROOM;
}

function BedroomPlanner({ room, setRoom }) {
  const [open, setOpen] = useState("bett");

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(room));
    } catch {
      /* Speicher nicht verfügbar */
    }
  }, [room]);

  const c = useMemo(() => Object.fromEntries(ITEMS.map((it) => [it.id, resolve(room[it.id])])), [room]);
  const msgs = useMemo(() => analyze(room, c), [room, c]);

  const marks = ITEMS.map((it, k) => ({ key: it.id, num: k + 1, hex: c[it.id].hex, hue: c[it.id].hue })).filter((m) => m.hue !== null);

  const set = (id, val) => setRoom((r) => ({ ...r, [id]: val }));
  const plantTone = PLANT_TONES.find((p) => p.id === room.pflanzenTon) || PLANT_TONES[1];

  return (
    <div className="room-layout">
      <div className="room-left">
        <section className="card room-preview">
          <Bedroom room={room} c={c} />
        </section>

        <section className="card room-check">
          <p className="label">Farbcheck</p>
          <div className="check-top">
            <MiniWheel marks={marks} />
            <div className="legend">
              {ITEMS.map((it, k) => (
                <div className="legend-row" key={it.id}>
                  <span className="legend-num" style={{ background: c[it.id].hex, color: textOn(c[it.id].hex) }}>
                    {k + 1}
                  </span>
                  <span className="legend-text">
                    {it.label}
                    {c[it.id].hue === null && <span style={{ color: "#8a8a8e" }}> · neutral</span>}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <ul className="msgs">
            {msgs.map((m, i) => (
              <li key={i} className={`msg msg-${m.t}`}>
                <span className="msg-dot" aria-hidden="true">{MSG_ICON[m.t]}</span>
                <span>{m.s}</span>
              </li>
            ))}
          </ul>
          <p className="rule">
            Faustregel fürs Schlafzimmer: rund 60 % ruhige Basis (Wand, Boden, Holz), 30 % Textilien (Bettbezug,
            Tagesdecke, Vorhänge), 10 % Akzente (Bilder, Zierkissen). Holz zählt im Farbkreis als gedecktes Orange –
            deshalb harmonieren Blau- und Blaugrüntöne besonders gut mit Eiche und Buche.
          </p>
        </section>
      </div>

      <section className="card room-controls">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
          <p className="label" style={{ margin: 0 }}>Dein Schlafzimmer</p>
          <button className="pill" onClick={() => setRoom(DEFAULT_ROOM)}>Zurücksetzen</button>
        </div>
        <div className="rows" style={{ marginTop: 6 }}>
          {ITEMS.map((it) => {
            const isOpen = open === it.id;
            return (
              <div className="row" key={it.id}>
                <button className="row-head" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : it.id)}>
                  <span className="row-sw" style={{ background: c[it.id].hex }} />
                  <span className="row-text">
                    <span className="row-label">{it.label}</span>
                    <span className="row-val">
                      {c[it.id].name}
                      {it.note && <span className="row-note-inline"> · {it.note}</span>}
                    </span>
                  </span>
                  {it.note && <span className="row-note">{it.note}</span>}
                  <Chevron />
                </button>
                {isOpen && (
                  <div className="row-body">
                    <Picker value={room[it.id]} groups={it.groups} onChange={(v) => set(it.id, v)} />
                  </div>
                )}
              </div>
            );
          })}

          <div className="row">
            <button className="row-head" aria-expanded={open === "pflanzen"} onClick={() => setOpen(open === "pflanzen" ? null : "pflanzen")}>
              <span className="row-sw" style={{ background: plantTone.hex }} />
              <span className="row-text">
                <span className="row-label">Pflanzen</span>
                <span className="row-val">
                  {room.pflanzen === 0 ? "keine" : `${room.pflanzen} × ${plantTone.name}`}
                </span>
              </span>
              <Chevron />
            </button>
            {open === "pflanzen" && (
              <div className="row-body">
                <div>
                  <p className="pk-title">Anzahl</p>
                  <div className="plant-row">
                    {[0, 1, 2, 3].map((k) => (
                      <button key={k} className="pill" aria-pressed={room.pflanzen === k} onClick={() => set("pflanzen", k)}>
                        {k === 0 ? "keine" : k}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="pk-title">Grünton</p>
                  <div className="chips">
                    {PLANT_TONES.map((p) => (
                      <button key={p.id} className="chip" aria-pressed={room.pflanzenTon === p.id} onClick={() => set("pflanzenTon", p.id)}>
                        <span className="chip-sw" style={{ background: p.hex }} />
                        <span className="chip-name">{p.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab Farbkreis
// ---------------------------------------------------------------------------

function WheelTab({ onApply }) {
  const [base, setBase] = useState(8); // Blau
  const [nuance, setNuance] = useState("gedeckt");
  const [harmony, setHarmony] = useState("komplementaer");
  const [level, setLevel] = useState("alle");
  const [showWarm, setShowWarm] = useState(false);

  const h = HARMONIES[harmony];
  const harmonyIdx = useMemo(() => h.offsets.map((o) => wrap(base + o)), [h, base]);
  const ordered = useMemo(() => [base, ...harmonyIdx.filter((i) => i !== base)], [base, harmonyIdx]);

  const palette = useMemo(() => {
    if (harmony === "monochrom") {
      return NUANCES.map((n) => ({ hue: base, nuance: n.id, color: shade(HUES[base].hex, n.id) }));
    }
    return ordered.map((i) => ({ hue: i, nuance, color: shade(HUES[i].hex, nuance) }));
  }, [harmony, ordered, base, nuance]);

  const applyToRoom = () => {
    let next;
    if (harmony === "monochrom") {
      next = {
        bettbezug: { kind: "farbe", hue: base, nuance: "hell" },
        tagesdecke: { kind: "farbe", hue: base, nuance: "gedeckt" },
        akzent: { kind: "farbe", hue: base, nuance: "dunkel" },
      };
    } else {
      const big = nuance === "rein" ? "gedeckt" : nuance;
      next = {
        bettbezug: { kind: "farbe", hue: ordered[0], nuance: big },
        tagesdecke: { kind: "farbe", hue: ordered[1] ?? ordered[0], nuance: ordered.length > 2 ? big : "hell" },
        akzent: { kind: "farbe", hue: ordered[2] ?? ordered[1] ?? ordered[0], nuance: "rein" },
      };
    }
    onApply(next);
  };

  const baseHue = HUES[base];

  return (
    <div className="two">
      <section className="card">
        <Wheel base={base} nuance={nuance} harmonyIdx={ordered} level={level} showWarm={showWarm} onPick={(i, n) => { setBase(i); setNuance(n); }} />
        <p style={{ textAlign: "center", margin: "8px 0 16px", fontSize: 15 }}>
          Grundfarbe: <strong>{baseHue.name}</strong> ({baseHue.level}) · {NUANCES.find((n) => n.id === nuance).label} ·{" "}
          {WARM.has(base) ? "warm" : "kalt"}
        </p>
        <p className="label">Farbebene hervorheben</p>
        <div className="pills" style={{ marginBottom: 14 }}>
          {LEVELS.map((l) => (
            <button key={l.id} className="pill" aria-pressed={level === l.id} onClick={() => setLevel(l.id)}>
              {l.label}
            </button>
          ))}
          <button className="pill" aria-pressed={showWarm} onClick={() => setShowWarm((v) => !v)}>
            Warm / Kalt
          </button>
        </div>
        <div style={{ fontSize: 13, color: "#6e6e73", lineHeight: 1.5 }}>
          <strong>1</strong> Primärfarben: Gelb, Rot, Blau – nicht mischbar. <strong>2</strong> Sekundärfarben: Mischung zweier
          Primärfarben (Orange, Violett, Grün). <strong>3</strong> Tertiärfarben: Mischung aus Primär- und benachbarter Sekundärfarbe.
        </div>
      </section>

      <div className="stack">
        <section className="card">
          <p className="label">Farbharmonie</p>
          <div className="pills">
            {Object.entries(HARMONIES).map(([id, hm]) => (
              <button key={id} className="pill" aria-pressed={harmony === id} onClick={() => setHarmony(id)}>
                {hm.label}
              </button>
            ))}
          </div>
          <p style={{ margin: "14px 0 6px", lineHeight: 1.5 }}>{h.text}</p>
          <p style={{ margin: 0, lineHeight: 1.5, color: "#3a3a3c" }}>
            <strong>Einrichtungstipp:</strong> {h.tip}
          </p>
          <p className="label" style={{ marginTop: 18 }}>Nuance</p>
          <div className="pills">
            {NUANCES.map((n) => (
              <button key={n.id} title={n.hint} className="pill" aria-pressed={nuance === n.id} onClick={() => setNuance(n.id)}>
                {n.label}
              </button>
            ))}
          </div>
          <p style={{ margin: "8px 0 0", fontSize: 13, color: "#6e6e73" }}>{NUANCES.find((n) => n.id === nuance).hint}</p>
        </section>

        <section className="card">
          <p className="label">Palette (Klick kopiert den Hex-Code)</p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {palette.map((p) => (
              <Swatch key={p.hue + p.nuance} color={p.color} title={HUES[p.hue].name} subtitle={NUANCES.find((n) => n.id === p.nuance).label} />
            ))}
          </div>
          <button className="pill" aria-pressed="true" style={{ marginTop: 14 }} onClick={applyToRoom}>
            Im Schlafzimmer ausprobieren →
          </button>
          <p style={{ margin: "8px 0 0", fontSize: 13, color: "#6e6e73" }}>
            Übernimmt die Palette für Bettbezug, Tagesdecke und Akzente. Wand, Holz und Boden bleiben, wie sie sind.
          </p>
        </section>
      </div>
    </div>
  );
}

function Swatch({ color, title, subtitle }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(color);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      /* Zwischenablage nicht verfügbar */
    }
  };
  return (
    <button
      onClick={copy}
      title="Hex-Code kopieren"
      style={{
        flex: "1 1 0",
        minWidth: 70,
        minHeight: 90,
        background: color,
        color: textOn(color),
        border: "none",
        borderRadius: 10,
        padding: 10,
        textAlign: "left",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        fontFamily: "inherit",
      }}
    >
      <span style={{ fontSize: 13, fontWeight: 600 }}>{title}</span>
      <span style={{ fontSize: 12, opacity: 0.85 }}>{subtitle}</span>
      <span style={{ fontSize: 12, fontFamily: "monospace", userSelect: "all" }}>{copied ? "kopiert ✓" : color}</span>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Hauptkomponente
// ---------------------------------------------------------------------------

export default function Farbkreis() {
  const [tab, setTab] = useState("zimmer");
  const [room, setRoom] = useState(loadRoom);

  const applyToRoom = (patch) => {
    setRoom((r) => ({ ...r, ...patch }));
    setTab("zimmer");
    try {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      /* egal */
    }
  };

  return (
    <div className="fk">
      <style>{CSS}</style>
      <div className="fk-wrap">
        <header>
          <h1>Farbkreis & Schlafzimmer</h1>
          <p className="fk-sub">
            {tab === "zimmer"
              ? "Tippe auf ein Möbelstück in der Liste und wähle Holz oder Farbe. Die Vorschau und der Farbcheck passen sich sofort an."
              : "Tippe auf ein Feld, um Grundfarbe und Nuance zu wählen. Außen: rein · Mitte: gedeckt · innen: hell."}
          </p>
        </header>

        <div className="fk-tabs" role="tablist">
          <button className="fk-tab" role="tab" aria-selected={tab === "zimmer"} onClick={() => setTab("zimmer")}>
            Schlafzimmer
          </button>
          <button className="fk-tab" role="tab" aria-selected={tab === "kreis"} onClick={() => setTab("kreis")}>
            Farbkreis
          </button>
        </div>

        {tab === "zimmer" ? <BedroomPlanner room={room} setRoom={setRoom} /> : <WheelTab onApply={applyToRoom} />}
      </div>
    </div>
  );
}
