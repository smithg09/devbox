import parser from "cron-parser";
import cronstrue from "cronstrue";
import { format, formatDistance } from "date-fns";
import { CronExecution, CronValidation } from "../types/cron.types";

export const validateCronExpression = (expression: string): CronValidation => {
  try {
    parser.parseExpression(expression);
    return { isValid: true };
  } catch (error) {
    return {
      isValid: false,
      error: "Invalid cron expression",
      details: (error as Error).message,
    };
  }
};

export const parseCronExpression = (expression: string): string => {
  try {
    return cronstrue.toString(expression);
  } catch (error) {
    return "Invalid cron expression";
  }
};

export const getNextExecutions = (expression: string, count: number = 3): CronExecution[] => {
  try {
    const interval = parser.parseExpression(expression);
    const executions: CronExecution[] = [];

    for (let i = 0; i < count; i++) {
      const nextDate = interval.next().toDate();
      executions.push({
        date: nextDate,
        humanReadable: format(nextDate, "yyyy-MM-dd HH:mm:ss"),
        fromNow: formatDistance(nextDate, new Date(), { addSuffix: true }),
      });
    }

    return executions;
  } catch (error) {
    return [];
  }
};

export const analyzeCronComplexity = (expression: string): "simple" | "moderate" | "complex" => {
  const parts = expression.split(" ");
  let complexity = 0;

  parts.forEach(part => {
    if (part.includes("/")) complexity += 1; // Step values
    if (part.includes("-")) complexity += 1; // Ranges
    if (part.includes(",")) complexity += 1; // Lists
    if (part !== "*" && !part.includes("/") && !part.includes("-") && !part.includes(",")) {
      complexity += 0.5; // Specific values
    }
  });

  if (complexity <= 1) return "simple";
  if (complexity <= 3) return "moderate";
  return "complex";
};

export const generateRandomCron = (): string => {
  const rand = (max: number) => Math.floor(Math.random() * max);
  const randHour = rand(24);
  const randMinute = rand(60);
  const randDay = rand(7);
  return `${randMinute} ${randHour} * * ${randDay}`;
};
