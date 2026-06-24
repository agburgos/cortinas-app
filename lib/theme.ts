export function applyTheme(accent: string, gold: string, teal: string) {
  const root = document.documentElement.style;
  root.setProperty("--accent", accent);
  root.setProperty("--gold", gold);
  root.setProperty("--teal", teal);
  root.setProperty("--accent-light", `color-mix(in srgb, ${accent} 70%, white)`);
  root.setProperty("--accent-bg", `color-mix(in srgb, ${accent} 14%, white)`);
  root.setProperty("--gold-bg", `color-mix(in srgb, ${gold} 22%, white)`);
  root.setProperty("--teal-bg", `color-mix(in srgb, ${teal} 16%, white)`);
  root.setProperty(
    "--gradient",
    `linear-gradient(135deg, ${accent} 0%, color-mix(in srgb, ${accent} 50%, ${gold}) 55%, ${gold} 100%)`
  );
}
