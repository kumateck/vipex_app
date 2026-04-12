const globalWithDomException = globalThis as Record<string, unknown>;

if (typeof globalWithDomException.DOMException === 'undefined') {
  class DOMExceptionPolyfill extends Error {
    constructor(message = 'Operation failed', name = 'Error') {
      super(message);
      this.name = name;
    }
  }

  globalWithDomException.DOMException = DOMExceptionPolyfill;
}
