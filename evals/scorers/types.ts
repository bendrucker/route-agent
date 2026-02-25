/**
 * Promptfoo grading result returned by custom scorer functions.
 *
 * @see https://www.promptfoo.dev/docs/configuration/expected-outputs/javascript/
 */
export interface GradingResult {
  pass: boolean;
  score: number;
  reason: string;
}

/**
 * Context object provided by Promptfoo to assertion functions.
 */
export interface AssertionContext {
  prompt: string;
  vars: Record<string, string>;
  test: Record<string, unknown>;
  config?: Record<string, unknown>;
}

/**
 * A Promptfoo assertion function that evaluates LLM output.
 *
 * When `output` is valid JSON, Promptfoo auto-parses it before passing to the function.
 */
export type AssertionFn = (output: unknown, context: AssertionContext) => GradingResult;
