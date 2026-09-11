import { designerTagStore } from "../uiframework/data/tags/designer-tag-store";
import type { TagWriteSource } from "../uiframework/data/tags/TagEvents";
import { getMockRuntimeSocket } from "./mock-runtime-socket";

type RuntimeTagChangedPayload = {
  type: "tag.changed";
  projectId: string;
  path: string;
  newValue: unknown;
  source?: TagWriteSource | undefined;
};

/**
 * Mirrors the project-scoped mock runtime TagStore into the designer view.
 * The runtime store remains canonical for handlers + drivers; the designer
 * store is only a reactive UI mirror and never feeds values back implicitly.
 */
export function connectMockDesignerTagBridge(projectId: string) {
  const socket = getMockRuntimeSocket();
  const handleMessage = (event: Event) => {
    const message = event as MessageEvent<string>;
    try {
      const payload = JSON.parse(message.data) as Partial<RuntimeTagChangedPayload>;
      if (
        payload.type !== "tag.changed" ||
        payload.projectId !== projectId ||
        typeof payload.path !== "string"
      ) {
        return;
      }

      designerTagStore.set(payload.path, payload.newValue, {
        source: payload.source ?? { kind: "driver", id: "mock-runtime" },
      });
    } catch {
      // Other runtime messages intentionally pass through this shared socket.
    }
  };

  socket.addEventListener("message", handleMessage);
  return () => socket.removeEventListener("message", handleMessage);
}
