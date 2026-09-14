import type { NavigationTreeNode } from "../../uiframework/navigation/navigation";
import { createIntentId } from "../../execution";
import { hasOwn } from "./object-utils";
import type {
  MockScriptExecutionEnvironment,
  MockScriptHost,
  MockScriptNavigationApi,
  MockScriptNavigationNodeApi,
} from "./types";

export function createNavigationApi(
  host: MockScriptHost,
  environment: MockScriptExecutionEnvironment
): MockScriptNavigationApi {
  const roots = host.getNavigationTree();
  const rootByName = new Map(roots.map((node) => [node.name, node]));
  const cache = new Map<string, MockScriptNavigationNodeApi>();

  function createNodeApi(node: NavigationTreeNode): MockScriptNavigationNodeApi {
    const cached = cache.get(node.pageId);
    if (cached) return cached;

    const childByName = new Map(node.children.map((child) => [child.name, child]));
    const target = {
      path: node.path,
      pageId: node.pageId,
      go() {
        environment.collector.push({
          id: createIntentId(),
          type: "navigate",
          source: environment.source,
          path: node.path,
        });
      },
    } as MockScriptNavigationNodeApi;

    const proxy = new Proxy(target, {
      get(apiTarget, property, receiver) {
        if (typeof property !== "string" || hasOwn(apiTarget, property)) {
          return Reflect.get(apiTarget, property, receiver);
        }
        const child = childByName.get(property);
        return child ? createNodeApi(child) : undefined;
      },
    });

    cache.set(node.pageId, proxy);
    return proxy;
  }

  return new Proxy({} as MockScriptNavigationApi, {
    get(_target, property) {
      if (typeof property !== "string") return undefined;
      const node = rootByName.get(property);
      return node ? createNodeApi(node) : undefined;
    },
  });
}

/** Public scene facade. Reusable components expose public inputs/methods only. */
