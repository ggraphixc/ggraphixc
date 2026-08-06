// WCAG contrast audit for ggraphixc button/text color pairs.
// Computes contrast ratio (WCAG 2.x) for each pair; flags failures.

function lin(c) {
  const v = c / 255;
  return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}
function lum(r, g, b) {
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}
function contrast(hex1, hex2) {
  const p = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const [r1, g1, b1] = p(hex1);
  const [r2, g2, b2] = p(hex2);
  const l1 = lum(r1, g1, b1), l2 = lum(r2, g2, b2);
  const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}
// composite a translucent bg color over a base
function over(baseHex, rgba) {
  const [br, bg, bb] = [parseInt(baseHex.slice(1, 3), 16), parseInt(baseHex.slice(3, 5), 16), parseInt(baseHex.slice(5, 7), 16)];
  const a = rgba.a;
  return "#" + [br, bg, bb]
    .map((b, i) => Math.round(b * (1 - a) + rgba.c[i] * a).toString(16).padStart(2, "0"))
    .join("");
}

const BG = "#0a0a0c"; // --bg
const SURF = "#0f0f12"; // --surface
const ACCENT = "#00d2ff"; // --accent
const ROYAL = "#005bea"; // --royal
const TEXT = "#f5f5f7"; // --text
const MUTED = "#9aa0a8"; // --muted

const pairs = [];
// 1. .btn-primary white on gradient (worst = accent end), 14px bold = normal text -> 4.5:1
pairs.push(["btn-primary text on accent end", "#ffffff", ACCENT, "4.5"]);
pairs.push(["btn-primary text on royal end", "#ffffff", ROYAL, "4.5"]);
pairs.push(["btn-primary text on gradient midpoint (50/50 blend)", "#ffffff", (() => {
  const m = [0, (210 + 91) / 2, (255 + 234) / 2].map(Math.round);
  return "#" + m.map((v) => v.toString(16).padStart(2, "0")).join("");
})(), "4.5"]);
// 2. dark glyphs on gradient (FAB, concierge send, avatar)
pairs.push(["concierge FAB icon #04060a on accent end", "#04060a", ACCENT, "3.0"]);
pairs.push(["avatar initials #04060a on gradient midpoint", "#04060a", (() => {
  const m = [0, Math.round((210 + 91) / 2), Math.round((255 + 234) / 2)];
  return "#" + m.map((v) => v.toString(16).padStart(2, "0")).join("");
})(), "3.0"]);
// 3. outline/ghost buttons: light text on translucent bg over page bg
pairs.push(["btn-outline text on bg", TEXT, over(BG, { c: [0, 210, 255], a: 0.03 }), "4.5"]);
pairs.push(["btn-ghost text on bg", TEXT, over(BG, { c: [255, 255, 255], a: 0.04 }), "4.5"]);
pairs.push(["btn-danger text on bg", "#ff9b9b", over(BG, { c: [255, 80, 80], a: 0.1 }), "4.5"]);
// 4. nav + footer links
pairs.push(["nav-links muted on header shell", MUTED, over(BG, { c: [10, 10, 12], a: 0.6 }), "4.5"]);
pairs.push(["footer muted on surface", MUTED, SURF, "4.5"]);
pairs.push(["mobile-nav text on menu bg", TEXT, "#0a0a0c", "4.5"]);
// 5. chips / badges (11px uppercase, normal size -> 4.5)
pairs.push(["kicker accent text on chip bg", ACCENT, over(BG, { c: [0, 210, 255], a: 0.09 }), "4.5"]);
pairs.push(["badge-soft accent on badge bg", ACCENT, over(BG, { c: [0, 210, 255], a: 0.1 }), "4.5"]);
// 6. section numbers / hero accent (large display text -> 3:1)
pairs.push(["stat number accent on surface", ACCENT, SURF, "3.0"]);
pairs.push(["hero h1 accent on bg", ACCENT, BG, "3.0"]);
// 7. admin toast
pairs.push(["admin-toast ok text", "#4ade80", "#0e0e12", "4.5"]);
pairs.push(["admin-toast err text", "#ff9b9b", "#0e0e12", "4.5"]);
// 8. lightbox / concierge panel
pairs.push(["lightbox button text", TEXT, over("#040508", { c: [255, 255, 255], a: 0.06 }), "4.5"]);
pairs.push(["concierge bot msg text", "#e6e6ea", over("#0d0d10", { c: [255, 255, 255], a: 0.05 }), "4.5"]);

let fails = 0;
for (const [name, fg, bg, need] of pairs) {
  const c = contrast(fg, bg);
  const ok = c >= parseFloat(need);
  if (!ok) fails++;
  console.log(`${ok ? "PASS" : "FAIL"} ${c.toFixed(2)}:1 (need ${need})  ${name}  fg=${fg} bg=${bg}`);
}
console.log(`\n${fails} failure(s)`);

// ---- find scrim opacity for .btn-primary so white passes 4.5:1 on the accent end ----
console.log("\n=== btn-primary scrim search (white text on darkened gradient) ===");
for (const a of [0.3, 0.32, 0.35, 0.38, 0.4, 0.42, 0.45]) {
  const dark = { c: [2, 10, 25], a };
  const acc = over(ACCENT, dark);
  const roy = over(ROYAL, dark);
  const cAcc = contrast("#ffffff", acc);
  const cRoy = contrast("#ffffff", roy);
  console.log(`scrim ${(a * 100).toFixed(0)}% -> accent end ${cAcc.toFixed(2)}:1 | royal end ${cRoy.toFixed(2)}:1 ${cAcc >= 4.5 && cRoy >= 4.5 ? "PASS" : ""}`);
}
