import { RegexTestResult, RegexFlags, MatchResult, GroupResult } from "./types";

const MAX_ITERATIONS = 10000;
const MAX_INPUT_LENGTH = 50000;
const EXECUTION_TIMEOUT = 2000;

export class RegexEngine {
  static async testRegex(
    pattern: string,
    input: string,
    flags: RegexFlags
  ): Promise<RegexTestResult> {
    const startTime = performance.now();

    if (!pattern || !input) {
      return {
        matches: [],
        groups: [],
        performance: { executionTime: 0, matchCount: 0, iterations: 0 },
      };
    }

    if (input.length > MAX_INPUT_LENGTH) {
      return {
        matches: [],
        groups: [],
        performance: { executionTime: 0, matchCount: 0, iterations: 0 },
        error: `Input too long (max ${MAX_INPUT_LENGTH} characters)`,
      };
    }

    try {
      const cleanPattern = pattern.replace(/^\/|\/$/g, "");
      if (!cleanPattern) {
        return {
          matches: [],
          groups: [],
          performance: { executionTime: 0, matchCount: 0, iterations: 0 },
        };
      }

      const flagsString = [
        flags.global ? "g" : "",
        flags.ignoreCase ? "i" : "",
        flags.multiline ? "m" : "",
        flags.dotAll ? "s" : "",
        flags.unicode ? "u" : "",
        flags.sticky ? "y" : "",
      ].join("");

      const regex = new RegExp(cleanPattern, flagsString);
      const result = await this.safeRegexExec(regex, input, flags.global);

      const endTime = performance.now();
      const executionTime = endTime - startTime;

      return {
        matches: result.matches,
        groups: result.groups,
        performance: {
          executionTime,
          matchCount: result.matches.length,
          iterations: result.iterations,
        },
      };
    } catch (err) {
      const endTime = performance.now();
      const executionTime = endTime - startTime;

      return {
        matches: [],
        groups: [],
        performance: { executionTime, matchCount: 0, iterations: 0 },
        error: err instanceof Error ? err.message : "Invalid regular expression",
      };
    }
  }

  private static async safeRegexExec(
    regex: RegExp,
    text: string,
    isGlobal: boolean
  ): Promise<{ matches: MatchResult[]; groups: GroupResult[]; iterations: number }> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Regex execution timed out"));
      }, EXECUTION_TIMEOUT);

      try {
        const matches: MatchResult[] = [];
        const groups: GroupResult[] = [];
        let iterations = 0;
        let lastIndex = 0;

        while (iterations < MAX_ITERATIONS) {
          iterations++;

          const match = regex.exec(text);
          if (!match) break;

          // Prevent infinite loop on zero-length matches
          if (match.index === lastIndex && match[0].length === 0) {
            if (lastIndex >= text.length) break;
            regex.lastIndex = lastIndex + 1;
            continue;
          }

          // Process the match
          const matchResult: MatchResult = {
            index: match.index,
            match: match[0],
            groups: match.slice(1),
            namedGroups: match.groups || {},
            start: match.index,
            end: match.index + match[0].length,
            length: match[0].length,
          };

          matches.push(matchResult);

          // Process groups
          match.forEach((group, index) => {
            if (index > 0 && group !== undefined) {
              groups.push({
                index: index - 1,
                name: Object.keys(match.groups || {}).find(key => match.groups![key] === group),
                value: group,
                start: match.index,
                end: match.index + group.length,
              });
            }
          });

          lastIndex = regex.lastIndex;
          if (!isGlobal) break;
        }

        clearTimeout(timeout);
        resolve({ matches, groups, iterations });
      } catch (err) {
        clearTimeout(timeout);
        reject(err);
      }
    });
  }

  static explainPattern(pattern: string): string {
    // Basic pattern explanation - can be enhanced
    const explanations: { [key: string]: string } = {
      "^": "Start of string",
      $: "End of string",
      ".": "Any character",
      "*": "Zero or more of the preceding element",
      "+": "One or more of the preceding element",
      "?": "Zero or one of the preceding element",
      "\\d": "Any digit (0-9)",
      "\\w": "Any word character (a-z, A-Z, 0-9, _)",
      "\\s": "Any whitespace character",
      "\\b": "Word boundary",
    };

    let explanation = "This pattern matches: ";
    for (const [symbol, desc] of Object.entries(explanations)) {
      if (pattern.includes(symbol)) {
        explanation += `${desc}; `;
      }
    }

    return explanation || "Complex pattern - refer to cheat sheet for details";
  }
}
