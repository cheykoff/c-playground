import React, { useMemo, useState } from "react";

/*
 * Interaktiver Farbkreis (12-teilig, nach Itten / RYB-Modell)
 * -----------------------------------------------------------
 * - Klick auf ein Feld wählt Grundfarbe und Nuance (Rein / Gedeckt / Hell).
 * - Farbharmonien: komplementär, split-komplementär, analog, Triade,
 *   Tetrade, Quadrat, monochrom.
 * - Ebenen hervorheben: Primär-, Sekundär-, Tertiärfarben.
 * - Warm/Kalt-Einteilung einblendbar.
 * - Raumvorschau nach der 60-30-10-Regel für die Inneneinrichtung.
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

const NUANCES = [
  { id: "rein", label: "Rein", hint: "volle Sättigung – für Akzente" },
  { id: "gedeckt", label: "Gedeckt", hint: "mit Grau gemischt – ruhig, wohnlich" },
  { id: "hell", label: "Hell", hint: "mit Weiß gemischt – Pastell, luftig" },
  { id: "dunkel", label: "Dunkel", hint: "mit Schwarz gemischt – edel, gemütlich" },
];

const HARMONIES = {
  komplementaer: {
    label: "Komplementär",
    offsets: [0, 6],
    text: "Zwei Farben, die sich im Kreis gegenüberliegen. Maximaler Kontrast – sie lassen sich gegenseitig leuchten.",
    tip: "Eine Farbe großflächig und gedeckt (z. B. Wand), die Gegenfarbe nur als kleinen Akzent (Kissen, Vase, Kunstdruck).",
  },
  split: {
    label: "Split-komplementär",
    offsets: [0, 5, 7],
    text: "Grundfarbe plus die beiden Nachbarn ihrer Komplementärfarbe. Kontrastreich, aber weniger hart.",
    tip: "Gut für Wohnzimmer: Grundfarbe dominiert, die zwei Akzentfarben verteilen sich auf Textilien und Deko.",
  },
  analog: {
    label: "Analog",
    offsets: [-1, 0, 1],
    text: "Drei benachbarte Farben. Harmonisch, ruhig und natürlich – wie ein Sonnenuntergang oder Wald.",
    tip: "Ideal für Schlafzimmer und Leseecken. Mit Holz und Naturmaterialien kombinieren.",
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

const shade = (hex, nuance) => {
  switch (nuance) {
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

// ---------------------------------------------------------------------------
// SVG-Geometrie
// ---------------------------------------------------------------------------

const CX = 300;
const CY = 300;
const SEG = 30; // Grad pro Segment

// Ringe von außen nach innen
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
// Komponenten
// ---------------------------------------------------------------------------

function Wheel({ base, nuance, harmonyIdx, level, showWarm, onPick }) {
  const ring = RINGS.find((r) => r.nuance === nuance);
  const markerR = ring ? (ring.r0 + ring.r1) / 2 : (RINGS[0].r0 + RINGS[0].r1) / 2;

  const polygon = harmonyIdx.length > 1
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

      {/* Beschriftung der Ebenen (P / S / T) im äußeren Ring */}
      {HUES.map((h, i) => {
        const [x, y] = polar(240, i * SEG);
        const visible = level === "alle" || h.level === level;
        if (!visible) return null;
        return (
          <text
            key={"lbl" + i}
            x={x}
            y={y + 5}
            textAnchor="middle"
            fontSize="14"
            fontWeight="700"
            fill={textOn(h.hex)}
            pointerEvents="none"
          >
            {h.level === "primär" ? "1" : h.level === "sekundär" ? "2" : "3"}
          </text>
        );
      })}

      {/* Harmonie-Verbindung */}
      {polygon && (
        <polygon points={polygon} fill="rgba(255,255,255,0.0)" stroke="#333" strokeWidth="2.5" strokeLinejoin="round" />
      )}
      {harmonyIdx.length > 1 &&
        harmonyIdx.map((i) => {
          const [x, y] = polar(92, i * SEG);
          return <circle key={"v" + i} cx={x} cy={y} r="5" fill="#333" />;
        })}

      {/* Marker auf den gewählten Feldern */}
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

      {/* Mitte: gewählte Farbe */}
      <circle cx={CX} cy={CY} r="40" fill={centerColor} stroke="#fff" strokeWidth="4" />
    </svg>
  );
}

function Swatch({ color, title, subtitle, share }) {
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
        flex: share ? `${share} 1 0` : "1 1 0",
        minWidth: 70,
        minHeight: 96,
        background: color,
        color: textOn(color),
        border: "none",
        borderRadius: 10,
        padding: "10px 10px",
        textAlign: "left",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        fontFamily: "inherit",
      }}
    >
      {share && <span style={{ fontSize: 22, fontWeight: 700 }}>{share}%</span>}
      <span style={{ fontSize: 13, fontWeight: 600 }}>{title}</span>
      <span style={{ fontSize: 12, opacity: 0.85 }}>{subtitle}</span>
      <span style={{ fontSize: 12, fontFamily: "monospace" }}>{copied ? "kopiert ✓" : color}</span>
    </button>
  );
}

function Room({ wall, furniture, accent }) {
  return (
    <svg viewBox="0 0 400 250" style={{ width: "100%", borderRadius: 12, display: "block" }}>
      {/* Wand (60 %) */}
      <rect x="0" y="0" width="400" height="185" fill={wall} />
      {/* Fußboden */}
      <rect x="0" y="185" width="400" height="65" fill="#C9A57B" />
      <rect x="0" y="185" width="400" height="5" fill="#B08D63" />
      {/* Bild an der Wand (Akzent) */}
      <rect x="150" y="30" width="100" height="62" fill="#fff" stroke="#e5e5e5" />
      <rect x="158" y="38" width="84" height="46" fill={accent} opacity="0.9" />
      <circle cx="222" cy="52" r="9" fill={furniture} />
      {/* Teppich */}
      <ellipse cx="200" cy="222" rx="150" ry="18" fill="#EDE7DD" />
      {/* Sofa (30 %) */}
      <rect x="80" y="112" width="240" height="50" rx="12" fill={furniture} />
      <rect x="68" y="130" width="36" height="58" rx="10" fill={furniture} />
      <rect x="296" y="130" width="36" height="58" rx="10" fill={furniture} />
      <rect x="96" y="150" width="208" height="38" rx="8" fill={mix(furniture, "#000000", 0.12)} />
      <rect x="92" y="186" width="6" height="12" fill="#5a4630" />
      <rect x="302" y="186" width="6" height="12" fill="#5a4630" />
      {/* Kissen (10 %) */}
      <rect x="108" y="122" width="40" height="34" rx="8" fill={accent} transform="rotate(-8 128 139)" />
      <rect x="252" y="122" width="40" height="34" rx="8" fill={accent} transform="rotate(8 272 139)" />
      {/* Stehlampe */}
      <rect x="352" y="80" width="3" height="110" fill="#333" />
      <path d="M335 80 L372 80 L364 55 L343 55 Z" fill="#F5F1E8" stroke="#ddd" />
      {/* Pflanze */}
      <rect x="20" y="160" width="28" height="28" rx="4" fill={accent} />
      <ellipse cx="34" cy="140" rx="18" ry="26" fill="#4E7A4A" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Hauptkomponente
// ---------------------------------------------------------------------------

export default function Farbkreis() {
  const [base, setBase] = useState(2); // Orange
  const [nuance, setNuance] = useState("gedeckt");
  const [harmony, setHarmony] = useState("komplementaer");
  const [level, setLevel] = useState("alle");
  const [showWarm, setShowWarm] = useState(false);
  const [rotation, setRotation] = useState(0); // Rollen in der 60-30-10-Verteilung tauschen
  const [accentPure, setAccentPure] = useState(true);

  const h = HARMONIES[harmony];
  const harmonyIdx = useMemo(() => h.offsets.map((o) => wrap(base + o)), [h, base]);
  // Grundfarbe zuerst, damit sie den Marker "Basis" bekommt
  const ordered = useMemo(
    () => [base, ...harmonyIdx.filter((i) => i !== base)],
    [base, harmonyIdx]
  );

  // Palette
  const palette = useMemo(() => {
    if (harmony === "monochrom") {
      return NUANCES.map((n) => ({
        hue: base,
        nuance: n.id,
        color: shade(HUES[base].hex, n.id),
      }));
    }
    return ordered.map((i) => ({ hue: i, nuance, color: shade(HUES[i].hex, nuance) }));
  }, [harmony, ordered, base, nuance]);

  // 60-30-10-Rollen
  const roles = useMemo(() => {
    let colors;
    if (harmony === "monochrom") {
      const by = Object.fromEntries(palette.map((p) => [p.nuance, p]));
      colors = [by.hell, by.gedeckt, by.dunkel];
    } else {
      colors = palette.slice(0, 3);
      if (colors.length === 2) colors = [colors[0], colors[0], colors[1]];
    }
    const n = colors.length;
    const rotated = colors.map((_, k) => colors[(k + rotation) % n]);
    const [wall, furniture, accent] = rotated;
    // Wand und Möbel einer Farbe? Dann Möbel etwas dunkler, damit man sie unterscheidet.
    const furnitureColor =
      furniture.color === wall.color ? mix(wall.color, "#1A1A1A", 0.3) : furniture.color;
    const accentColor =
      accentPure && harmony !== "monochrom" ? HUES[accent.hue].hex : accent.color;
    return {
      wall,
      furniture: { ...furniture, color: furnitureColor },
      accent: { ...accent, color: accentColor },
    };
  }, [palette, harmony, rotation, accentPure]);

  const onPick = (i, n) => {
    setBase(i);
    setNuance(n);
  };

  const pill = (active) => ({
    padding: "7px 12px",
    borderRadius: 999,
    border: active ? "2px solid #1d1d1f" : "1px solid #d0d0d5",
    background: active ? "#1d1d1f" : "#fff",
    color: active ? "#fff" : "#1d1d1f",
    fontSize: 14,
    cursor: "pointer",
    fontFamily: "inherit",
  });

  const card = {
    background: "#fff",
    borderRadius: 16,
    padding: 20,
    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
  };

  const label = { fontSize: 12, fontWeight: 700, letterSpacing: 0.6, textTransform: "uppercase", color: "#6e6e73", margin: "0 0 8px" };

  const baseHue = HUES[base];

  return (
    <div
      style={{
        fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
        background: "#F4F2EE",
        color: "#1d1d1f",
        minHeight: "100vh",
        padding: "24px 16px",
        boxSizing: "border-box",
      }}
    >
      <div style={{ maxWidth: 1180, margin: "0 auto" }}>
        <header style={{ marginBottom: 20 }}>
          <h1 style={{ margin: 0, fontSize: 28 }}>Farbkreis für die Inneneinrichtung</h1>
          <p style={{ margin: "6px 0 0", color: "#6e6e73" }}>
            Klicke auf ein Feld, um Grundfarbe und Nuance zu wählen. Außen: rein · Mitte: gedeckt · innen: hell.
          </p>
        </header>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20 }}>
          {/* Linke Spalte: Kreis */}
          <section style={card}>
            <Wheel
              base={base}
              nuance={nuance}
              harmonyIdx={ordered}
              level={level}
              showWarm={showWarm}
              onPick={onPick}
            />

            <p style={{ textAlign: "center", margin: "8px 0 16px", fontSize: 15 }}>
              Grundfarbe: <strong>{baseHue.name}</strong> ({baseHue.level}) ·{" "}
              {NUANCES.find((n) => n.id === nuance).label} ·{" "}
              {WARM.has(base) ? "warm" : "kalt"}
            </p>

            <p style={label}>Farbebene hervorheben</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
              {LEVELS.map((l) => (
                <button key={l.id} style={pill(level === l.id)} onClick={() => setLevel(l.id)}>
                  {l.label}
                </button>
              ))}
              <button style={pill(showWarm)} onClick={() => setShowWarm((v) => !v)}>
                Warm / Kalt
              </button>
            </div>

            <div style={{ fontSize: 13, color: "#6e6e73", lineHeight: 1.5 }}>
              <strong>1</strong> Primärfarben: Gelb, Rot, Blau – nicht mischbar.{" "}
              <strong>2</strong> Sekundärfarben: Mischung zweier Primärfarben (Orange, Violett, Grün).{" "}
              <strong>3</strong> Tertiärfarben: Mischung aus Primär- und benachbarter Sekundärfarbe.
            </div>
          </section>

          {/* Rechte Spalte: Steuerung + Ergebnis */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <section style={card}>
              <p style={label}>Farbharmonie</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {Object.entries(HARMONIES).map(([id, hm]) => (
                  <button key={id} style={pill(harmony === id)} onClick={() => { setHarmony(id); setRotation(0); }}>
                    {hm.label}
                  </button>
                ))}
              </div>
              <p style={{ margin: "14px 0 6px", lineHeight: 1.5 }}>{h.text}</p>
              <p style={{ margin: 0, lineHeight: 1.5, color: "#3a3a3c" }}>
                <strong>Einrichtungstipp:</strong> {h.tip}
              </p>

              <p style={{ ...label, marginTop: 18 }}>Nuance</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {NUANCES.map((n) => (
                  <button key={n.id} title={n.hint} style={pill(nuance === n.id)} onClick={() => setNuance(n.id)}>
                    {n.label}
                  </button>
                ))}
              </div>
              <p style={{ margin: "8px 0 0", fontSize: 13, color: "#6e6e73" }}>
                {NUANCES.find((n) => n.id === nuance).hint}
              </p>
            </section>

            <section style={card}>
              <p style={label}>Palette (Klick kopiert den Hex-Code)</p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {palette.map((p) => (
                  <Swatch
                    key={p.hue + p.nuance}
                    color={p.color}
                    title={HUES[p.hue].name}
                    subtitle={NUANCES.find((n) => n.id === p.nuance).label}
                  />
                ))}
              </div>
            </section>

            <section style={card}>
              <p style={label}>Raumvorschau · 60-30-10-Regel</p>
              <Room wall={roles.wall.color} furniture={roles.furniture.color} accent={roles.accent.color} />
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <Swatch color={roles.wall.color} share={60} title="Wand & Fläche" subtitle={HUES[roles.wall.hue].name} />
                <Swatch color={roles.furniture.color} share={30} title="Möbel & Textil" subtitle={HUES[roles.furniture.hue].name} />
                <Swatch color={roles.accent.color} share={10} title="Akzente" subtitle={HUES[roles.accent.hue].name} />
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
                <button style={pill(false)} onClick={() => setRotation((r) => r + 1)}>
                  ↻ Rollen tauschen
                </button>
                {harmony !== "monochrom" && (
                  <button style={pill(accentPure)} onClick={() => setAccentPure((v) => !v)}>
                    Akzent in reiner Farbe
                  </button>
                )}
              </div>
              <p style={{ margin: "12px 0 0", fontSize: 13, color: "#6e6e73", lineHeight: 1.5 }}>
                Faustregel: 60 % dominante Farbe (Wände, große Flächen), 30 % Sekundärfarbe (Sofa, Vorhänge, Teppich),
                10 % Akzentfarbe (Kissen, Vasen, Bilder). Kräftige Farben wirken am besten in kleinen Dosen.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
