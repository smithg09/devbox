// Generate up to two-letter initials from a name
export function getInitials(name: string): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    const word = parts[0];
    if (word.length >= 2) return (word[0] + word[1]).toUpperCase();
    return word[0].toUpperCase();
  }
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

// Deterministic string -> color mapping (HSL) for consistent avatar colors
export function stringToColor(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    // Simple string hash
    hash = input.charCodeAt(i) + ((hash << 10) - hash);
    hash |= 0; // convert to 32-bit int
  }
  const hue = Math.abs(hash) % 360;
  // Brighter, matte-like palette: moderate saturation with mid lightness
  // This yields vivid yet not neon colors with good readability
  const saturation = 85; // 60–70% keeps colors punchy but not overly saturated
  const lightness = 25; // 50–60% feels bright without washing out
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}
