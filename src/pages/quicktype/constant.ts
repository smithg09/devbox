export const DEFAULT_LANG = "typescript-zod";
export const DEFAULT_NAME = "Devbox";

export const DEFAULT_INPUT = `{
  "name": "DevBox",
  "version": "1.0.0",
  "features": [
    {
      "id": 1,
      "name": "JSON Formatter",
      "enabled": true
    },
    {
      "id": 2,
      "name": "Regex Tester",
      "enabled": true
    }
  ],
  "meta": {
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
`;

export const LANGUAGE_PRESET = [
  { language: "ruby", label: "Ruby", sourceLang: "ruby" },
  { language: "javascript", label: "Javascript", sourceLang: "javascript" },
  { language: "flow", label: "Flow", sourceLang: "javascript" },
  { language: "rust", label: "Rust", sourceLang: "rust" },
  { language: "kotlin", label: "Kotlin", sourceLang: "kotlin" },
  { language: "dart", label: "Dart", sourceLang: "dart" },
  { language: "python", label: "Python", sourceLang: "python" },
  { language: "csharp", label: "C#", sourceLang: "csharp" },
  { language: "go", label: "Go", sourceLang: "go" },
  { language: "cpp", label: "Cpp", sourceLang: "cpp" },
  { language: "java", label: "Java", sourceLang: "java" },
  { language: "scala", label: "Scala", sourceLang: "scala" },
  { language: "typescript", label: "Typescript", sourceLang: "typescript" },
  {
    language: "typescript-zod",
    label: "Typescript Zod",
    sourceLang: "typescript",
  },
  { language: "swift", label: "Swift", sourceLang: "swift" },
  { language: "objective-c", label: "Objective-C", sourceLang: "objective-c" },
  { language: "elm", label: "Elm", sourceLang: "fsharp" },
  { language: "json-schema", label: "JSON Schema", sourceLang: "json" },
  { language: "haskell", label: "Haskell", sourceLang: "abap" },
  { language: "pike", label: "Pike", sourceLang: "java" },
  {
    language: "javascript-prop-types",
    label: "Prop Types",
    sourceLang: "javascript",
  },
  { language: "php", label: "PHP", sourceLang: "php" },
];
