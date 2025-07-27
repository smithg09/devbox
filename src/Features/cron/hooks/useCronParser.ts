import { useState, useEffect } from "react";
import {
  validateCronExpression,
  parseCronExpression,
  getNextExecutions,
  analyzeCronComplexity,
} from "../utils/cronHelpers";
import { CronValidation, CronExecution } from "../types/cron.types";

export const useCronParser = (expression: string) => {
  const [validation, setValidation] = useState<CronValidation>({ isValid: true });
  const [meaning, setMeaning] = useState<string>("");
  const [nextExecutions, setNextExecutions] = useState<CronExecution[]>([]);
  const [complexity, setComplexity] = useState<"simple" | "moderate" | "complex">("simple");

  useEffect(() => {
    const newValidation = validateCronExpression(expression);
    setValidation(newValidation);

    if (newValidation.isValid) {
      setMeaning(parseCronExpression(expression));
      setNextExecutions(getNextExecutions(expression, 3));
      setComplexity(analyzeCronComplexity(expression));
    } else {
      setMeaning("Invalid cron expression");
      setNextExecutions([]);
      setComplexity("simple");
    }
  }, [expression]);

  return {
    validation,
    meaning,
    nextExecutions,
    complexity,
  };
};
