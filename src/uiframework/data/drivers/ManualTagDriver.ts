import type {
  TagDriver,
  TagDriverContext,
  TagDriverWriteRequest,
  TagDriverWriteResult,
} from "./TagDriver";

/**
 * Immediate local source. Manual behaves like a trivial device: an application
 * write is accepted and the same value is synchronously published as readback.
 */
export class ManualTagDriver implements TagDriver {
  readonly kind = "manual";
  private readonly context: TagDriverContext;

  constructor(context: TagDriverContext) {
    this.context = context;
  }

  start() {}
  stop() {}
  dispose() {}

  isRunning() {
    return true;
  }

  write(request: TagDriverWriteRequest): TagDriverWriteResult {
    const result = this.context.publish(request.path, request.value, {
      source: request.requestedBy,
    });
    return result.ok ? { ok: true } : { ok: false, error: result.error };
  }
}
