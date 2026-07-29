export class MarketplaceError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "MarketplaceError";
    this.code = code;
  }
}

export class MarketplaceNotFoundError extends MarketplaceError {
  constructor(entity: string, id?: string) {
    super("NOT_FOUND", id ? `${entity} not found: ${id}` : `${entity} not found`);
    this.name = "MarketplaceNotFoundError";
  }
}

export class MarketplaceNotImplementedError extends MarketplaceError {
  constructor(feature: string) {
    super("NOT_IMPLEMENTED", `${feature} is not implemented yet`);
    this.name = "MarketplaceNotImplementedError";
  }
}
