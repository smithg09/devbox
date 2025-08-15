// Language-specific renderer option definitions for quicktype
export type OptionDefinition = {
  key: string;
  label: string;
  type: "boolean" | "text" | "select";
  options?: { value: string; label: string }[];
  default?: string;
  help?: string;
};

export type LanguageOptionsMap = Record<string, OptionDefinition[]>;

export const LANGUAGE_OPTION_DEFS: LanguageOptionsMap = {
  typescript: [
    {
      key: "just-types",
      label: "Just Types",
      type: "boolean",
      help: "Emit only type/interface declarations.",
    },
    {
      key: "prefer-unions",
      label: "Prefer Unions",
      type: "boolean",
      help: "Prefer union types over enums when possible.",
    },
    {
      key: "acronym-style",
      label: "Acronym Style",
      type: "select",
      options: [
        { value: "original", label: "Original" },
        { value: "pascal", label: "PascalCase" },
        { value: "camel", label: "camelCase" },
        { value: "lowerCase", label: "lowerCase" },
      ],
      default: "original",
    },
  ],
  "typescript-zod": [{ key: "just-schema", label: "Schema Only", type: "boolean" }],
  python: [
    {
      key: "python-version",
      label: "Python Version",
      type: "select",
      options: [
        { value: "3.5", label: "3.5" },
        { value: "3.6", label: "3.6" },
        { value: "3.7", label: "3.7" },
      ],
      default: "3.6",
    },
    { key: "just-types", label: "Classes Only", type: "boolean" },
  ],
  go: [
    { key: "package", label: "Package Name", type: "text", default: "main" },
    { key: "just-types", label: "Plain Types Only", type: "boolean" },
  ],
  rust: [
    {
      key: "density",
      label: "Density",
      type: "select",
      options: [
        { value: "normal", label: "Normal" },
        { value: "dense", label: "Dense" },
      ],
      default: "normal",
    },
    {
      key: "visibility",
      label: "Visibility",
      type: "select",
      options: [
        { value: "private", label: "Private" },
        { value: "crate", label: "Crate" },
        { value: "public", label: "Public" },
      ],
      default: "private",
    },
    { key: "derive-debug", label: "Derive Debug", type: "boolean" },
    { key: "derive-clone", label: "Derive Clone", type: "boolean" },
  ],
  csharp: [
    { key: "namespace", label: "Namespace", type: "text", default: "Devbox.Models" },
    {
      key: "array-type",
      label: "Array Type",
      type: "select",
      options: [
        { value: "array", label: "T[]" },
        { value: "list", label: "List<T>" },
      ],
      default: "array",
    },
    { key: "just-types", label: "Plain Types Only", type: "boolean" },
  ],
  java: [
    { key: "package", label: "Package", type: "text", default: "io.quicktype" },
    {
      key: "array-type",
      label: "Array Type",
      type: "select",
      options: [
        { value: "array", label: "T[]" },
        { value: "list", label: "List<T>" },
      ],
      default: "array",
    },
    { key: "just-types", label: "Plain Types Only", type: "boolean" },
    {
      key: "datetime-provider",
      label: "DateTime Provider",
      type: "select",
      options: [
        { value: "java8", label: "java8" },
        { value: "legacy", label: "legacy" },
      ],
      default: "java8",
    },
  ],
};

export const initialLanguageOptionValues: Record<
  string,
  Record<string, string>
> = Object.fromEntries(
  Object.entries(LANGUAGE_OPTION_DEFS).map(([lang, defs]) => [
    lang,
    Object.fromEntries(
      defs.filter(d => d.default !== undefined).map(d => [d.key, d.default as string])
    ),
  ])
);
