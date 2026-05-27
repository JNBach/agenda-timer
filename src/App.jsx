import { useState, useEffect, useRef } from "react";

if (!document.getElementById("mat-fonts")) {
  const l = document.createElement("link");
  l.id = "mat-fonts";
  l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Sora:wght@300;400;500;600&display=swap";
  document.head.appendChild(l);
}
if (!document.getElementById("mat-style")) {
  const s = document.createElement("style");
  s.id = "mat-style";
  s.textContent = `
    input[type=number]::-webkit-inner-spin-button,
    input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; }
    input[type=number] { -moz-appearance: textfield; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    ::-webkit-scrollbar { width: 4px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: rgba(128,128,128,0.3); border-radius: 2px; }
    @keyframes pulse-dot { 0%,100%{opacity:1} 50%{opacity:0.3} }
    @keyframes item-in { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
  `;
  document.head.appendChild(s);
}

function makeColors(dark) {
  return dark ? {
    bg:         "#0C0D0E",
    surface:    "#131415",
    border:     "#242527",
    amber:      "#F59E0B",
    amberDim:   "rgba(245,158,11,0.1)",
    orange:     "#F97316",
    red:        "#EF4444",
    green:      "#10B981",
    greenDim:   "rgba(16,185,129,0.1)",
    text:       "#EDEDEC",
    textSec:    "#A0A2A6",
    textMuted:  "#636568",
    startBg:    "#F59E0B",
    startText:  "#0C0D0E",
  } : {
    bg:         "#F7F6F3",
    surface:    "#EEECEA",
    border:     "#D8D6D1",
    amber:      "#B45309",
    amberDim:   "rgba(180,83,9,0.07)",
    orange:     "#C2410C",
    red:        "#DC2626",
    green:      "#047857",
    greenDim:   "rgba(4,120,87,0.08)",
    text:       "#1C1B19",
    textSec:    "#57554F",
    textMuted:  "#9C9A94",
    startBg:    "#B45309",
    startText:  "#FFFFFF",
  };
}

// ─── Theme toggle button ──────────────────────────────────────────────────────

function ThemeBtn({ dark, onToggle, C }) {
  return (
    <button
      onClick={onToggle}
      title={dark ? "Switch to light mode" : "Switch to dark mode"}
      style={{
        background: "transparent",
        border: `0.5px solid ${C.border}`,
        borderRadius: 8,
        padding: "7px 10px",
        cursor: "pointer",
        color: C.textSec,
        fontSize: 14,
        lineHeight: 1,
        fontFamily: C.sans,
        display: "flex",
        alignItems: "center",
        gap: 6,
        flexShrink: 0,
      }}
    >
      {dark ? "☀" : "☾"}
      <span style={{ fontSize: 11 }}>{dark ? "Light" : "Dark"}</span>
    </button>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function beep(freq = 660, dur = 0.45, vol = 0.2) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.connect(g); g.connect(ctx.destination);
    osc.type = "sine"; osc.frequency.value = freq;
    g.gain.setValueAtTime(vol, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    osc.start(); osc.stop(ctx.currentTime + dur);
  } catch (e) {}
}
function playDone() {
  [660, 880, 1100].forEach((f, i) => setTimeout(() => beep(f, 0.3, 0.15), i * 120));
}
function fmt(secs) {
  const s = Math.max(0, Math.round(secs));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}
function fmtMin(mins) {
  if (mins >= 60) { const h = Math.floor(mins / 60), m = mins % 60; return m ? `${h}h ${m}m` : `${h}h`; }
  return `${mins}m`;
}

let _id = 5;
const newId = () => ++_id;

const DEFAULTS = [
  { id: 1, name: "Welcome & intros",      minutes: 5  },
  { id: 2, name: "Status updates",        minutes: 10 },
  { id: 3, name: "Open discussion",       minutes: 15 },
  { id: 4, name: "Action items & wrap-up",minutes: 5  },
];

// ─── Setup Screen ─────────────────────────────────────────────────────────────

function SetupScreen({ items, setItems, title, setTitle, onStart, dark, onToggleTheme }) {
  const C = makeColors(dark);
  const mono = "'DM Mono', monospace";
  const sans = "'Sora', sans-serif";
  const total = items.reduce((s, i) => s + (Number(i.minutes) || 0), 0);
  const canStart = items.length > 0 && items.every((i) => (Number(i.minutes) || 0) > 0);

  function add() { setItems((p) => [...p, { id: newId(), name: "", minutes: 5 }]); }
  function update(id, f, v) { setItems((p) => p.map((i) => i.id === id ? { ...i, [f]: v } : i)); }
  function remove(id) { setItems((p) => p.filter((i) => i.id !== id)); }
  function move(idx, dir) {
    setItems((p) => {
      const n = [...p], t = idx + dir;
      if (t < 0 || t >= n.length) return p;
      [n[idx], n[t]] = [n[t], n[idx]]; return n;
    });
  }

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: sans, display: "flex", flexDirection: "column", alignItems: "center", padding: "48px 20px 64px", transition: "background 0.2s, color 0.2s" }}>

      {/* Header row */}
      <div style={{ width: "100%", maxWidth: 580, marginBottom: 36 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
          <div style={{ fontSize: 10, letterSpacing: 4, color: C.amber, fontWeight: 500, textTransform: "uppercase", paddingTop: 2 }}>
            Meeting Agenda Timer
          </div>
          <ThemeBtn dark={dark} onToggle={onToggleTheme} C={C} />
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <h1 style={{ fontSize: 30, fontWeight: 600, color: C.text, lineHeight: 1 }}>Build your agenda</h1>
          <div style={{ textAlign: "right", paddingBottom: 2 }}>
            <div style={{ fontSize: 11, color: C.textSec, marginBottom: 3 }}>Total duration</div>
            <div style={{ fontFamily: mono, fontSize: 24, color: total > 0 ? C.amber : C.textMuted, fontWeight: 400, lineHeight: 1 }}>
              {total > 0 ? fmtMin(total) : "—"}
            </div>
          </div>
        </div>
        <div style={{ height: "0.5px", background: C.border, marginTop: 16 }} />
      </div>

      {/* Meeting title */}
      <div style={{ width: "100%", maxWidth: 580, marginBottom: 28 }}>
        <div style={{ fontSize: 10, letterSpacing: 3, color: C.textMuted, textTransform: "uppercase", marginBottom: 10 }}>
          Meeting title
        </div>
        <input value={title} onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Weekly team sync, Q2 planning kickoff…"
          maxLength={80}
          style={{ width: "100%", background: C.surface, border: `0.5px solid ${C.border}`, borderRadius: 8, padding: "12px 16px", color: C.text, fontSize: 16, fontFamily: sans, outline: "none", transition: "border-color 0.15s" }}
          onFocus={(e) => (e.target.style.borderColor = C.amber)}
          onBlur={(e)  => (e.target.style.borderColor = C.border)} />
      </div>

      {/* Items */}
      <div style={{ width: "100%", maxWidth: 580 }}>
        {items.length === 0 && (
          <div style={{ textAlign: "center", padding: "48px 0", color: C.textMuted, fontSize: 14 }}>
            No items yet — add one below to get started
          </div>
        )}

        {items.map((item, idx) => (
          <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, background: C.surface, border: `0.5px solid ${C.border}`, borderRadius: 8, padding: "10px 14px", animation: "item-in 0.2s ease" }}>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {[[-1, "▲"], [1, "▼"]].map(([d, lbl]) => (
                <button key={d} onClick={() => move(idx, d)}
                  disabled={(d === -1 && idx === 0) || (d === 1 && idx === items.length - 1)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: ((d === -1 && idx === 0) || (d === 1 && idx === items.length - 1)) ? C.textMuted : C.textSec, fontSize: 9, padding: "1px 4px", lineHeight: 1.4 }}>
                  {lbl}
                </button>
              ))}
            </div>
            <div style={{ width: 22, fontFamily: mono, fontSize: 12, color: C.textMuted, textAlign: "center", flexShrink: 0 }}>{idx + 1}</div>
            <input value={item.name} onChange={(e) => update(item.id, "name", e.target.value)}
              placeholder={`Agenda item ${idx + 1}`}
              style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: C.text, fontSize: 14, fontFamily: sans, minWidth: 0 }} />
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
              <input type="number" min="1" max="999" value={item.minutes}
                onChange={(e) => update(item.id, "minutes", Math.max(1, Number(e.target.value) || 1))}
                style={{ width: 52, background: C.bg, border: `0.5px solid ${C.border}`, borderRadius: 5, padding: "5px 8px", color: C.amber, fontSize: 14, fontFamily: mono, textAlign: "center", outline: "none" }} />
              <span style={{ fontSize: 11, color: C.textSec, width: 22 }}>min</span>
            </div>
            <button onClick={() => remove(item.id)}
              style={{ background: "none", border: "none", cursor: "pointer", color: C.textMuted, fontSize: 18, lineHeight: 1, padding: "2px 4px", flexShrink: 0 }}>×</button>
          </div>
        ))}

        <button onClick={add}
          style={{ width: "100%", padding: "11px", background: "transparent", border: `0.5px dashed ${C.border}`, borderRadius: 8, color: C.textSec, fontSize: 13, cursor: "pointer", marginTop: 4, fontFamily: sans }}>
          + Add item
        </button>

        <div style={{ height: "0.5px", background: C.border, margin: "32px 0" }} />

        <div style={{ display: "flex", gap: 24, marginBottom: 20, fontSize: 11, color: C.textMuted }}>
          {[["Space", "Pause / Resume"], ["→", "Skip item"], ["R", "Reset"]].map(([k, v]) => (
            <div key={k} style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <kbd style={{ background: C.surface, border: `0.5px solid ${C.border}`, borderRadius: 3, padding: "1px 6px", fontFamily: mono, fontSize: 10, color: C.textSec }}>{k}</kbd>
              <span>{v}</span>
            </div>
          ))}
        </div>

        <button onClick={canStart ? onStart : undefined}
          style={{ width: "100%", padding: "16px", background: canStart ? C.startBg : C.border, border: "none", borderRadius: 8, color: canStart ? C.startText : C.textMuted, fontSize: 15, fontWeight: 600, cursor: canStart ? "pointer" : "default", letterSpacing: 0.3, fontFamily: sans, transition: "background 0.2s" }}>
          ▶  Start meeting
        </button>
      </div>
    </div>
  );
}

// ─── Done Screen ──────────────────────────────────────────────────────────────

function DoneScreen({ items, title, onReset, dark, onToggleTheme }) {
  const C = makeColors(dark);
  const mono = "'DM Mono', monospace";
  const sans = "'Sora', sans-serif";
  const total = items.reduce((s, i) => s + i.minutes * 60, 0);

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: sans, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 40, transition: "background 0.2s" }}>

      {/* Theme toggle — top right */}
      <div style={{ position: "absolute", top: 20, right: 20 }}>
        <ThemeBtn dark={dark} onToggle={onToggleTheme} C={C} />
      </div>

      <div style={{ width: 36, height: 36, borderRadius: "50%", background: C.greenDim, border: `1px solid ${C.green}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, marginBottom: 20, color: C.green }}>✓</div>
      <div style={{ fontSize: 10, letterSpacing: 4, color: C.green, textTransform: "uppercase", marginBottom: 10 }}>Meeting complete</div>
      <div style={{ fontSize: 28, fontWeight: 600, marginBottom: 6 }}>That's a wrap.</div>
      {title && <div style={{ fontSize: 15, color: C.textSec, fontWeight: 500, marginBottom: 4 }}>{title}</div>}
      <div style={{ fontSize: 13, color: C.textSec, marginBottom: 48 }}>
        {fmtMin(Math.round(total / 60))} · {items.length} agenda {items.length === 1 ? "item" : "items"}
      </div>

      <div style={{ width: "100%", maxWidth: 420, marginBottom: 48 }}>
        {items.map((item, i) => (
          <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 0", borderBottom: `0.5px solid ${C.border}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontFamily: mono, fontSize: 11, color: C.textMuted }}>{String(i + 1).padStart(2, "0")}</span>
              <span style={{ fontSize: 14, color: C.textSec }}>{item.name || `Item ${i + 1}`}</span>
            </div>
            <span style={{ fontFamily: mono, fontSize: 13, color: C.textSec }}>{fmt(item.minutes * 60)}</span>
          </div>
        ))}
      </div>

      <button onClick={onReset}
        style={{ padding: "12px 36px", background: "transparent", border: `0.5px solid ${C.amber}`, borderRadius: 8, color: C.amber, fontSize: 14, cursor: "pointer", fontFamily: sans, letterSpacing: 0.3 }}>
        ↺  New meeting
      </button>
    </div>
  );
}

// ─── Running Screen ───────────────────────────────────────────────────────────

function RunningScreen({ items, title, currentIndex, elapsed, running, onTogglePause, onSkip, onReset, dark, onToggleTheme }) {
  const C = makeColors(dark);
  const mono = "'DM Mono', monospace";
  const sans = "'Sora', sans-serif";

  const currentItem  = items[currentIndex];
  const currentDurSec = (currentItem?.minutes || 0) * 60;
  const remaining    = Math.max(0, currentDurSec - elapsed);
  const itemProgress = currentDurSec > 0 ? Math.min(1, elapsed / currentDurSec) : 0;
  const completedSec = items.slice(0, currentIndex).reduce((s, i) => s + i.minutes * 60, 0);
  const totalSec     = items.reduce((s, i) => s + i.minutes * 60, 0);
  const overallElapsed  = completedSec + elapsed;
  const overallProgress = totalSec > 0 ? Math.min(1, overallElapsed / totalSec) : 0;
  const totalRemaining  = Math.max(0, totalSec - overallElapsed);
  const isWarning = remaining <= 60 && remaining > 0 && remaining <= currentDurSec;
  const isDanger  = remaining <= 30 && remaining > 0 && remaining <= currentDurSec;
  const timerColor = isDanger ? C.red : isWarning ? C.orange : C.text;
  const barColor   = isDanger ? C.red : isWarning ? C.orange : C.amber;
  const nextItem   = items[currentIndex + 1];

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: sans, display: "flex", flexDirection: "column", transition: "background 0.2s, color 0.2s" }}>

      {/* Overall progress bar */}
      <div style={{ height: 2, background: C.border }}>
        <div style={{ height: "100%", width: `${overallProgress * 100}%`, background: C.amber, transition: "width 1s linear" }} />
      </div>

      {/* Sub-header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 24px", borderBottom: `0.5px solid ${C.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ fontSize: 10, letterSpacing: 3, color: C.amber, textTransform: "uppercase" }}>Live</span>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: running ? C.amber : C.textMuted, animation: running ? "pulse-dot 1.5s ease infinite" : "none" }} />
          {title && <span style={{ fontSize: 13, fontWeight: 500, color: C.text, maxWidth: 300, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{title}</span>}
          <span style={{ fontSize: 12, color: C.textSec }}>Item {currentIndex + 1} of {items.length}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ fontFamily: mono, fontSize: 12, color: C.textSec }}>{fmt(totalRemaining)} total remaining</div>
          <ThemeBtn dark={dark} onToggle={onToggleTheme} C={C} />
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, display: "flex", minHeight: 0 }}>

        {/* Left: timer */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 32px", borderRight: `0.5px solid ${C.border}` }}>
          <div style={{ fontSize: 10, letterSpacing: 3, color: C.textSec, textTransform: "uppercase", marginBottom: 14 }}>
            {running ? "Current item" : "Paused"}
          </div>
          <div style={{ fontSize: 20, fontWeight: 500, color: C.text, marginBottom: 36, textAlign: "center", maxWidth: 360, lineHeight: 1.3 }}>
            {currentItem?.name || `Item ${currentIndex + 1}`}
          </div>
          <div style={{ fontFamily: mono, fontSize: 84, fontWeight: 300, color: timerColor, lineHeight: 1, letterSpacing: -3, marginBottom: 28, transition: "color 0.4s ease", userSelect: "none" }}>
            {fmt(remaining)}
          </div>
          <div style={{ width: "100%", maxWidth: 300 }}>
            <div style={{ height: 2, background: C.border, borderRadius: 2, marginBottom: 8 }}>
              <div style={{ height: "100%", width: `${itemProgress * 100}%`, background: barColor, borderRadius: 2, transition: "width 1s linear, background 0.4s" }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, fontFamily: mono, color: C.textMuted }}>
              <span>{fmt(elapsed)}</span><span>{fmt(currentDurSec)}</span>
            </div>
          </div>
          {nextItem && (
            <div style={{ marginTop: 32, padding: "10px 20px", background: C.surface, border: `0.5px solid ${C.border}`, borderRadius: 8, display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 10, letterSpacing: 2, color: C.textMuted, textTransform: "uppercase" }}>Next</span>
              <span style={{ fontSize: 13, color: C.textSec }}>{nextItem.name || `Item ${currentIndex + 2}`}</span>
              <span style={{ fontFamily: mono, fontSize: 11, color: C.textMuted }}>{fmt(nextItem.minutes * 60)}</span>
            </div>
          )}
        </div>

        {/* Right: agenda list */}
        <div style={{ width: 256, display: "flex", flexDirection: "column", overflowY: "auto" }}>
          <div style={{ padding: "20px 20px 10px", fontSize: 10, letterSpacing: 3, color: C.textMuted, textTransform: "uppercase", position: "sticky", top: 0, background: C.bg, zIndex: 1, borderBottom: `0.5px solid ${C.border}` }}>
            {title || "Agenda"}
          </div>
          {items.map((item, i) => {
            const done = i < currentIndex, current = i === currentIndex;
            return (
              <div key={item.id} style={{ padding: "14px 16px", borderLeft: current ? `2px solid ${C.amber}` : "2px solid transparent", background: current ? C.amberDim : "transparent", borderBottom: `0.5px solid ${C.border}` }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                  <span style={{ fontSize: 11, color: done ? C.green : current ? C.amber : C.textMuted, marginTop: 1, flexShrink: 0, fontFamily: mono }}>
                    {done ? "✓" : current ? "▶" : String(i + 1).padStart(2, "0")}
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: current ? 500 : 400, color: done ? C.textMuted : current ? C.text : C.textSec, textDecoration: done ? "line-through" : "none", lineHeight: 1.3, marginBottom: 3, wordBreak: "break-word" }}>
                      {item.name || `Item ${i + 1}`}
                    </div>
                    <div style={{ fontFamily: mono, fontSize: 11, color: C.textMuted }}>{fmt(item.minutes * 60)}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: "flex", gap: 10, padding: "18px 24px", borderTop: `0.5px solid ${C.border}`, justifyContent: "center", alignItems: "center" }}>
        <button onClick={onTogglePause}
          style={{ padding: "11px 32px", background: C.startBg, border: "none", borderRadius: 8, color: C.startText, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: sans, minWidth: 140, letterSpacing: 0.3 }}>
          {running ? "⏸  Pause" : "▶  Resume"}
        </button>
        <div style={{ width: "0.5px", height: 28, background: C.border }} />
        <button onClick={onSkip}
          style={{ padding: "11px 22px", background: "transparent", border: `0.5px solid ${C.border}`, borderRadius: 8, color: C.textSec, fontSize: 13, cursor: "pointer", fontFamily: sans }}>
          Skip  ⏭
        </button>
        <button onClick={onReset}
          style={{ padding: "11px 22px", background: "transparent", border: `0.5px solid ${C.border}`, borderRadius: 8, color: C.textSec, fontSize: 13, cursor: "pointer", fontFamily: sans }}>
          ↺  Reset
        </button>
        <div style={{ marginLeft: "auto", display: "flex", gap: 14, fontSize: 11, color: C.textMuted }}>
          {[["Space", "Pause"], ["→", "Skip"], ["R", "Reset"]].map(([k, v]) => (
            <span key={k}><kbd style={{ fontFamily: mono, fontSize: 10, color: C.textMuted }}>{k}</kbd> {v}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Root App ─────────────────────────────────────────────────────────────────

export default function App() {
  const [phase, setPhase]             = useState("setup");
  const [dark, setDark]               = useState(false);
  const [title, setTitle]             = useState("");
  const [items, setItems]             = useState(DEFAULTS);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [elapsed, setElapsed]         = useState(0);
  const [running, setRunning]         = useState(false);
  const [transitioning, setTransitioning] = useState(false);

  const intervalRef      = useRef(null);
  const currentIndexRef  = useRef(currentIndex); currentIndexRef.current = currentIndex;
  const itemsRef         = useRef(items);         itemsRef.current = items;

  const toggleTheme = () => setDark((d) => !d);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [running]);

  useEffect(() => {
    if (phase !== "running" || transitioning) return;
    const dur = (items[currentIndex]?.minutes || 0) * 60;
    if (elapsed >= dur && dur > 0) {
      setTransitioning(true);
      if (currentIndex < items.length - 1) {
        beep(880, 0.3);
        setTimeout(() => { setCurrentIndex((i) => i + 1); setElapsed(0); setTransitioning(false); }, 400);
      } else {
        playDone();
        setTimeout(() => { setRunning(false); setPhase("done"); setTransitioning(false); }, 600);
      }
    }
  }, [elapsed, currentIndex, items, phase, transitioning]);

  useEffect(() => {
    if (phase !== "running") return;
    const handler = (e) => {
      if (e.target.tagName === "INPUT") return;
      if (e.code === "Space")      { e.preventDefault(); setRunning((r) => !r); }
      if (e.code === "ArrowRight") { e.preventDefault(); doSkip(); }
      if (e.code === "KeyR")       { e.preventDefault(); doReset(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [phase]);

  function doStart() { setPhase("running"); setCurrentIndex(0); setElapsed(0); setRunning(true); }
  function doTogglePause() { setRunning((r) => !r); }
  function doSkip() {
    beep(440, 0.15, 0.1);
    const ci = currentIndexRef.current, its = itemsRef.current;
    if (ci < its.length - 1) { setCurrentIndex(ci + 1); setElapsed(0); }
    else { setRunning(false); setPhase("done"); }
  }
  function doReset() {
    clearInterval(intervalRef.current);
    setRunning(false); setPhase("setup"); setCurrentIndex(0); setElapsed(0); setTransitioning(false);
  }

  const shared = { dark, onToggleTheme: toggleTheme };

  if (phase === "setup")
    return <SetupScreen items={items} setItems={setItems} title={title} setTitle={setTitle} onStart={doStart} {...shared} />;
  if (phase === "done")
    return <DoneScreen items={items} title={title} onReset={doReset} {...shared} />;
  return (
    <RunningScreen items={items} title={title} currentIndex={currentIndex} elapsed={elapsed}
      running={running} onTogglePause={doTogglePause} onSkip={doSkip} onReset={doReset} {...shared} />
  );
}
