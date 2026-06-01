export interface Chunk {
  index: number;
  text: string;
  charCount: number;
  tokenCount: number;
  start: number;
  end: number;
}

export type ChunkStrategy = "fixed" | "sentence" | "recursive" | "semantic";

function estimateTokens(text: string): number {
  // Simple heuristic: ~4 chars per token (GPT-style)
  return Math.ceil(text.length / 4);
}

function withOverlap(chunks: string[], overlapTokens: number): string[] {
  if (overlapTokens <= 0 || chunks.length <= 1) return chunks;
  return chunks.map((chunk, i) => {
    if (i === 0) return chunk;
    const prevChunk = chunks[i - 1];
    const overlapChars = overlapTokens * 4;
    const overlap = prevChunk.slice(-overlapChars);
    return overlap + chunk;
  });
}

export function chunkFixed(text: string, chunkTokens: number, overlapTokens: number): Chunk[] {
  const chunkChars = chunkTokens * 4;
  const raw: string[] = [];
  for (let i = 0; i < text.length; i += chunkChars) {
    raw.push(text.slice(i, i + chunkChars));
  }
  const chunks = withOverlap(raw, overlapTokens);
  return buildChunks(chunks);
}

export function chunkSentence(text: string, chunkTokens: number, overlapTokens: number): Chunk[] {
  const sentences = text.match(/[^.!?\n]+[.!?\n]+/g) ?? [text];
  const groups: string[] = [];
  let current = "";
  for (const s of sentences) {
    if (estimateTokens(current + s) > chunkTokens && current.length > 0) {
      groups.push(current.trim());
      current = s;
    } else {
      current += s;
    }
  }
  if (current.trim()) groups.push(current.trim());
  return buildChunks(withOverlap(groups, overlapTokens));
}

export function chunkRecursive(
  text: string,
  chunkTokens: number,
  overlapTokens: number,
  separators: string[]
): Chunk[] {
  const tryChunk = (t: string, seps: string[]): string[] => {
    if (estimateTokens(t) <= chunkTokens) return [t];
    const [sep, ...rest] = seps;
    if (!sep) return [t.slice(0, chunkTokens * 4)];
    const parts = t.split(sep).filter(p => p.trim());
    const groups: string[] = [];
    let current = "";
    for (const p of parts) {
      const joined = current ? current + sep + p : p;
      if (estimateTokens(joined) > chunkTokens && current) {
        groups.push(current.trim());
        current = p;
      } else {
        current = joined;
      }
    }
    if (current.trim()) groups.push(current.trim());
    return groups.flatMap(g => (estimateTokens(g) > chunkTokens ? tryChunk(g, rest) : [g]));
  };
  return buildChunks(withOverlap(tryChunk(text, separators), overlapTokens));
}

export function chunkSemantic(text: string, chunkTokens: number, overlapTokens: number): Chunk[] {
  // Split on headings, then paragraphs
  const sections = text.split(/\n(?=#{1,3} )/).filter(s => s.trim());
  const groups: string[] = [];
  let current = "";
  for (const s of sections) {
    if (estimateTokens(current + "\n" + s) > chunkTokens && current) {
      groups.push(current.trim());
      current = s;
    } else {
      current = current ? current + "\n" + s : s;
    }
  }
  if (current.trim()) groups.push(current.trim());
  if (groups.length <= 1) {
    // Fallback to paragraph splitting
    const paras = text.split(/\n\n+/).filter(p => p.trim());
    return chunkSentence(paras.join("\n"), chunkTokens, overlapTokens);
  }
  return buildChunks(withOverlap(groups, overlapTokens));
}

function buildChunks(texts: string[]): Chunk[] {
  let pos = 0;
  return texts.map((text, i) => {
    const start = pos;
    const end = start + text.length;
    pos = end;
    return { index: i, text, charCount: text.length, tokenCount: estimateTokens(text), start, end };
  });
}
