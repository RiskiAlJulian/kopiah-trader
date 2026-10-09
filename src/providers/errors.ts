export class RateLimitError extends Error { constructor() { super('rate_limit') } }
export class MissingKeyError extends Error { constructor() { super('missing_key') } }
export class ProviderError extends Error { constructor(m: string, public code?: number) { super(m) } }
