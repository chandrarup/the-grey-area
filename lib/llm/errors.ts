export class LLMConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LLMConfigError";
  }
}

export class LLMProviderError extends Error {
  constructor(message: string, public readonly providerError?: unknown) {
    super(message);
    this.name = "LLMProviderError";
  }
}

export class LLMValidationError extends Error {
  constructor(message: string, public readonly raw?: unknown) {
    super(message);
    this.name = "LLMValidationError";
  }
}
