import { PatternLibraryItem } from "./types";

export const patternLibrary: PatternLibraryItem[] = [
  // URL Patterns
  {
    id: "url-basic",
    name: "Basic URL",
    pattern: "https?://[^\\s/$.?#].[^\\s]*",
    flags: { global: true, ignoreCase: true },
    description: "Matches basic HTTP and HTTPS URLs",
    examples: ["https://example.com", "http://test.org/path"],
    category: "url",
  },
  {
    id: "url-comprehensive",
    name: "Comprehensive URL",
    pattern:
      "(?:https?://)?(?:www\\.)?[-a-zA-Z0-9@:%._\\+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b(?:[-a-zA-Z0-9()@:%_\\+.~#?&=]*)",
    flags: { global: true, ignoreCase: true },
    description: "Matches URLs with optional protocol and www",
    examples: ["https://example.com", "www.test.org", "example.com/path?query=value"],
    category: "url",
  },
  {
    id: "url-domain",
    name: "Domain Only",
    pattern: "(?:[a-zA-Z0-9-]+\\.)+[a-zA-Z]{2,}",
    flags: { global: true, ignoreCase: true },
    description: "Matches domain names only",
    examples: ["example.com", "subdomain.test.org"],
    category: "url",
  },
  {
    id: "url-email",
    name: "Email Address",
    pattern: "\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}\\b",
    flags: { global: true },
    description: "Matches email addresses",
    examples: ["user@example.com", "test.email+tag@domain.co.uk"],
    category: "url",
  },

  // Date Patterns
  {
    id: "date-iso",
    name: "ISO Date (YYYY-MM-DD)",
    pattern: "\\b\\d{4}-\\d{2}-\\d{2}\\b",
    flags: { global: true },
    description: "Matches ISO format dates",
    examples: ["2023-12-25", "2024-01-01"],
    category: "date",
  },
  {
    id: "date-us",
    name: "US Date (MM/DD/YYYY)",
    pattern: "\\b\\d{1,2}/\\d{1,2}/\\d{4}\\b",
    flags: { global: true },
    description: "Matches US format dates",
    examples: ["12/25/2023", "1/1/2024"],
    category: "date",
  },
  {
    id: "date-european",
    name: "European Date (DD/MM/YYYY)",
    pattern: "\\b\\d{1,2}/\\d{1,2}/\\d{4}\\b",
    flags: { global: true },
    description: "Matches European format dates (same pattern as US, context dependent)",
    examples: ["25/12/2023", "1/1/2024"],
    category: "date",
  },
  {
    id: "date-written",
    name: "Written Date",
    pattern:
      "\\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\\s+\\d{1,2},?\\s+\\d{4}\\b",
    flags: { global: true, ignoreCase: true },
    description: 'Matches written dates like "January 1, 2024"',
    examples: ["January 1, 2024", "December 25 2023"],
    category: "date",
  },
  {
    id: "date-time-iso",
    name: "ISO DateTime",
    pattern:
      "\\b\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(?:\\.\\d{3})?(?:Z|[+-]\\d{2}:\\d{2})?\\b",
    flags: { global: true },
    description: "Matches ISO datetime format",
    examples: ["2023-12-25T10:30:00Z", "2024-01-01T15:45:30.123+05:30"],
    category: "date",
  },
  {
    id: "time-24h",
    name: "24-Hour Time",
    pattern: "\\b(?:[01]\\d|2[0-3]):[0-5]\\d(?::[0-5]\\d)?\\b",
    flags: { global: true },
    description: "Matches 24-hour time format",
    examples: ["14:30", "09:15:45", "23:59"],
    category: "date",
  },
  {
    id: "time-12h",
    name: "12-Hour Time",
    pattern: "\\b(?:1[0-2]|0?[1-9]):[0-5]\\d(?::[0-5]\\d)?\\s*(?:AM|PM)\\b",
    flags: { global: true, ignoreCase: true },
    description: "Matches 12-hour time format with AM/PM",
    examples: ["2:30 PM", "09:15:45 AM", "11:59 pm"],
    category: "date",
  },
];

export const regexCheatSheet = {
  title: "Regular Expression Cheat Sheet",
  githubLink: "https://github.com/niklongstone/regular-expression-cheat-sheet",
  sections: [
    {
      title: "Character Classes",
      items: [
        { pattern: ".", description: "Any character except newline" },
        { pattern: "\\d", description: "Digit (0-9)" },
        { pattern: "\\w", description: "Word character (a-z, A-Z, 0-9, _)" },
        { pattern: "\\s", description: "Whitespace character" },
        { pattern: "[abc]", description: "Any of a, b, or c" },
        { pattern: "[^abc]", description: "Not a, b, or c" },
        { pattern: "[a-z]", description: "Character between a and z" },
      ],
    },
    {
      title: "Quantifiers",
      items: [
        { pattern: "*", description: "0 or more" },
        { pattern: "+", description: "1 or more" },
        { pattern: "?", description: "0 or 1" },
        { pattern: "{3}", description: "Exactly 3" },
        { pattern: "{3,}", description: "3 or more" },
        { pattern: "{3,5}", description: "Between 3 and 5" },
      ],
    },
    {
      title: "Anchors",
      items: [
        { pattern: "^", description: "Start of string" },
        { pattern: "$", description: "End of string" },
        { pattern: "\\b", description: "Word boundary" },
        { pattern: "\\B", description: "Not word boundary" },
      ],
    },
    {
      title: "Groups & Lookaround",
      items: [
        { pattern: "(abc)", description: "Capture group" },
        { pattern: "(?:abc)", description: "Non-capturing group" },
        { pattern: "(?=abc)", description: "Positive lookahead" },
        { pattern: "(?!abc)", description: "Negative lookahead" },
        { pattern: "(?<=abc)", description: "Positive lookbehind" },
        { pattern: "(?<!abc)", description: "Negative lookbehind" },
      ],
    },
  ],
};
