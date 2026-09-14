import type {
  ComponentPropertyReference,
  ComponentVariantReference,
  EventReference,
  MethodReference,
  ModalReference,
  RuntimeReference,
} from "../model/intent";

export interface RuntimeEffects {
  setValue(target: RuntimeReference, value: unknown): void | Promise<void>;
  setProperty(target: ComponentPropertyReference, value: unknown): void | Promise<void>;
  setVariant(target: ComponentVariantReference, variantName: string): void | Promise<void>;
  emitEvent(event: EventReference, payload?: Record<string, unknown>): void | Promise<void>;
  openModal(target: ModalReference, payload?: Record<string, unknown>): void | Promise<void>;
  closeModal(target: ModalReference, payload?: Record<string, unknown>): void | Promise<void>;
  navigate(path: string): void | Promise<void>;
  setState(key: string, value: unknown): void | Promise<void>;
  deleteState(key: string): void | Promise<void>;
  clearState(): void | Promise<void>;
  callMethod(target: MethodReference, args: unknown[]): unknown | Promise<unknown>;
}
