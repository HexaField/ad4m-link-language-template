/**
 * Shared type definitions for the language.
 *
 * These supplement the core types from @coasys/ad4m.
 */

/** A link expression with author/timestamp metadata */
export interface LinkExpression {
  author: string;
  timestamp: string;
  data: {
    source: string;
    target: string;
    predicate?: string;
  };
  proof: {
    key: string;
    signature: string;
    valid: boolean;
    invalid: boolean;
  };
}

/** Configuration passed via language settings */
export interface LanguageConfig {
  // TODO: Add your language-specific configuration here
  [key: string]: unknown;
}
