import { createIntentId } from "../../execution";
import {
  ensureProjectAppearance,
  getThemeDisplayName,
  resolveThemeSelection,
} from "../../uiframework/design-system/theme-config";
import type {
  MockScriptAppApi,
  MockScriptExecutionEnvironment,
  MockScriptHost,
} from "./types";

export function createAppApi(
  host: MockScriptHost,
  environment: MockScriptExecutionEnvironment
): MockScriptAppApi {
  let pendingThemeId: string | undefined;

  const api: MockScriptAppApi = {} as MockScriptAppApi;
  Object.defineProperties(api, {
    theme: {
      enumerable: true,
      get() {
        const document = host.getDocument();
        const themeId = pendingThemeId ?? host.getActiveThemeId();
        return getThemeDisplayName(document?.designSystem, themeId) ?? themeId ?? "";
      },
      set(requested: string) {
        if (typeof requested !== "string" || !requested.trim()) {
          throw new TypeError("App.theme expects a theme name or id.");
        }
        const document = host.getDocument();
        if (!document) throw new Error("Project document is unavailable.");
        const appearance = ensureProjectAppearance(document.appearance, document.designSystem);
        if (appearance.themeMode !== "runtime") {
          throw new Error(
            'App.theme can be changed only when Theme source is "Runtime controlled".'
          );
        }
        const themeId = resolveThemeSelection(document.designSystem, requested);
        if (!themeId) throw new Error(`Unknown theme: ${requested}`);
        pendingThemeId = themeId;
        environment.collector.push({
          id: createIntentId(),
          type: "theme-set",
          source: environment.source,
          themeId,
          themeName: document.designSystem?.themes?.[themeId]?.name,
        });
      },
    },
    themeId: {
      enumerable: true,
      get() {
        return pendingThemeId ?? host.getActiveThemeId() ?? "";
      },
    },
  });

  return Object.freeze(api);
}
