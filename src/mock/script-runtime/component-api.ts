import { createUdtInstanceApi } from "../../uiframework/data/runtime/TagRuntimeProxy";
import { isTagRef } from "../../uiframework/data/collections/TagRef";
import type { UiComponentDefinition, UiNode } from "../../uiframework/core/document";
import {
  getComponentApiMethodNames,
  getComponentApiPropertyNames,
  getComponentColorProperty,
  getResolvedComponentProps,
} from "../../uiframework/component-api";
import {
  getComponentVariantNames,
  getComponentVariantProps,
} from "../../uiframework/component-variants";
import { createIntentId, shadowKey } from "../../execution";
import { getMockScript } from "../mock-script-store";
import { executeJavaScriptSource } from "./javascript-executor";
import { createTagGlobals, createTagRuntimeContext } from "./tag-api";
import { hasOwn } from "./object-utils";
import type {
  CreateComponentApiOptions,
  MockScriptContext,
  MockScriptExecutionEnvironment,
  MockScriptHost,
  MockScriptInputsApi,
  MockScriptInternalApi,
  MockScriptUiApi,
  UiComponentScriptApi,
  UiComponentVariantScriptApi,
} from "./types";

export function createInputsApi(
  definition: UiComponentDefinition,
  self: UiComponentScriptApi
): MockScriptInputsApi {
  const inputNames = new Set(Object.keys(definition.inputs ?? {}));
  return new Proxy({} as MockScriptInputsApi, {
    get(_target, property) {
      return typeof property === "string" && inputNames.has(property)
        ? self[property]
        : undefined;
    },
    set(_target, property, value) {
      if (typeof property !== "string" || !inputNames.has(property)) return false;
      self[property] = value;
      return true;
    },
    ownKeys() {
      return [...inputNames];
    },
    getOwnPropertyDescriptor() {
      return { enumerable: true, configurable: true };
    },
  });
}

export function createUiApi(
  host: MockScriptHost,
  projectId: string,
  getContext: () => MockScriptContext,
  environment: MockScriptExecutionEnvironment
): MockScriptUiApi {
  // Names are only API aliases. Stable node ids are the actual identity, so
  // Button1 on a page and Button1 inside a component never share a cache slot.
  const componentCache = new Map<string, UiComponentScriptApi>();

  const baseApi = {
    get(name: string) {
      return resolveComponent(name);
    },
  };

  function resolveComponent(name: string): UiComponentScriptApi {
    const node = host.resolveUiNode(name);
    if (!node) throw new Error(`Unknown UI component on current scene: ${name}`);

    const cached = componentCache.get(node.id);
    if (cached) return cached;

    const api = createComponentApi(
      node,
      host,
      projectId,
      getContext,
      environment
    );
    componentCache.set(node.id, api);
    return api;
  }

  return new Proxy(baseApi as MockScriptUiApi, {
    get(target, property, receiver) {
      if (typeof property !== "string" || hasOwn(target, property)) {
        return Reflect.get(target, property, receiver);
      }

      return resolveComponent(property);
    },
  });
}

/**
 * Private facade for a reusable component definition.
 *
 * It contains only nodes physically owned by this definition. Nested reusable
 * components are deliberately represented by their PUBLIC facade, so a parent
 * component cannot pierce the private tree of a child component.
 */
export function createInternalUiApi(
  definition: UiComponentDefinition,
  runtimeInstanceId: string,
  host: MockScriptHost,
  projectId: string,
  getContext: () => MockScriptContext,
  environment: MockScriptExecutionEnvironment
): MockScriptInternalApi {
  const nodesByName = new Map<string, UiNode>();
  const duplicateNames = new Set<string>();
  const cache = new Map<string, UiComponentScriptApi>();

  for (const node of Object.values(definition.nodes)) {
    if (nodesByName.has(node.name)) duplicateNames.add(node.name);
    else nodesByName.set(node.name, node);
  }

  function resolveInternal(name: string): UiComponentScriptApi {
    if (duplicateNames.has(name)) {
      throw new Error(
        `Ambiguous internal component name “${name}” in ${definition.name}. Rename internal nodes to unique API names.`
      );
    }

    const node = nodesByName.get(name);
    if (!node) {
      throw new Error(
        `Unknown internal component: ${definition.name}.${name}`
      );
    }

    const cached = cache.get(node.id);
    if (cached) return cached;

    const runtimeNodeId = `${runtimeInstanceId}::${node.id}`;
    const api = createComponentApi(
      node,
      host,
      projectId,
      getContext,
      environment,
      { runtimeNodeId }
    );
    cache.set(node.id, api);
    return api;
  }

  const baseApi = {
    get(name: string) {
      return resolveInternal(name);
    },
  } as MockScriptInternalApi;

  return new Proxy(baseApi, {
    get(target, property, receiver) {
      if (typeof property !== "string" || hasOwn(target, property)) {
        return Reflect.get(target, property, receiver);
      }
      return resolveInternal(property);
    },
  });
}

export function createComponentApi(
  node: UiNode,
  host: MockScriptHost,
  projectId: string,
  getContext: () => MockScriptContext,
  environment: MockScriptExecutionEnvironment,
  options: CreateComponentApiOptions = {}
): UiComponentScriptApi {
  const runtimeNodeId = options.runtimeNodeId ?? node.id;
  const reusableDefinition = node.componentDefinitionId
    ? host.resolveComponentDefinition(node.componentDefinitionId)
    : undefined;
  const allowedProps = new Set(
    reusableDefinition
      ? Object.keys(reusableDefinition.inputs ?? {})
      : getComponentApiPropertyNames(node)
  );
  const publicMethods = reusableDefinition
    ? Object.entries(reusableDefinition.methods ?? {})
        .filter(([, method]) => method.visibility === "public")
        .map(([name]) => name)
    : getComponentApiMethodNames(node);
  const allMethods = reusableDefinition
    ? Object.keys(reusableDefinition.methods ?? {})
    : publicMethods;
  const allowedMethods = new Set(publicMethods);
  const allMethodNames = new Set(allMethods);
  const localProps = reusableDefinition
    ? {
        ...Object.fromEntries(
          Object.entries(reusableDefinition.inputs ?? {}).map(([name, input]) => [
            name,
            input.defaultValue,
          ])
        ),
        ...(node.props ?? {}),
        ...host.getNodeProps(runtimeNodeId),
      }
    : {
        ...getResolvedComponentProps(node),
        ...host.getNodeProps(runtimeNodeId),
      };
  const colorProperty = reusableDefinition
    ? Object.entries(reusableDefinition.inputs ?? {}).find(
        ([, input]) => input.type === "color"
      )?.[0]
    : getComponentColorProperty(node);
  const methodCache = new Map<string, (...args: unknown[]) => unknown>();
  const variantSource = reusableDefinition?.nodes[reusableDefinition.rootId] ?? node;
  const variantNames = getComponentVariantNames(variantSource);
  const variantRuntimeNodeId = reusableDefinition
    ? `${runtimeNodeId}::${variantSource.id}`
    : runtimeNodeId;
  const localWrites = new Map<string, unknown>();
  const storedVariant = host.getNodeVariant(variantRuntimeNodeId);
  let localVariant =
    storedVariant && variantSource.variants?.[storedVariant]
      ? storedVariant
      : variantSource.defaultVariant;

  let internalApi: MockScriptInternalApi | undefined;

  function setProp(property: string, value: unknown) {
    if (!allowedProps.has(property)) {
      throw new Error(
        `${node.name} (${reusableDefinition?.name ?? node.type}) has no public property “${property}”. Available: ${[
          ...allowedProps,
        ].join(", ")}`
      );
    }

    localProps[property] = value;
    localWrites.set(property, value);
    environment.collector.setShadow(
      shadowKey.componentProperty(runtimeNodeId, property),
      value
    );
    environment.collector.push({
      id: createIntentId(),
      type: "set-property",
      source: environment.source,
      target: {
        kind: "component-property",
        componentId: runtimeNodeId,
        property,
        path: `${node.name}.${property}`,
      },
      value,
    });
  }

  function getInternalApi() {
    if (!reusableDefinition) return undefined;
    internalApi ??= createInternalUiApi(
      reusableDefinition,
      runtimeNodeId,
      host,
      projectId,
      getContext,
      environment
    );
    return internalApi;
  }

  function getMethod(methodName: string, allowPrivate: boolean) {
    if (!allowPrivate && !allowedMethods.has(methodName)) return undefined;
    if (allowPrivate && !allMethodNames.has(methodName)) return undefined;

    const cacheKey = `${allowPrivate ? "all" : "public"}:${methodName}`;
    const cached = methodCache.get(cacheKey);
    if (cached) return cached;

    const methodRef = reusableDefinition
      ? reusableDefinition.methods?.[methodName]
      : node.methods?.[methodName];
    if (!methodRef) return undefined;

    const callable = (...args: unknown[]) => {
      environment.collector.push({
        id: createIntentId(),
        type: "call-method",
        source: environment.source,
        target: {
          kind: "method",
          ownerId: runtimeNodeId,
          method: methodName,
          path: node.name,
        },
        args,
        expanded: true,
      });
      const script = getMockScript(projectId, methodRef.scriptId);
      const baseContext = getContext();
      const executionContext = reusableDefinition
        ? Object.freeze({
            ...baseContext,
            inputs: createInputsApi(reusableDefinition, componentSelfProxy),
          })
        : baseContext;
      return executeJavaScriptSource({
        code: script.code,
        ctx: executionContext,
        self: reusableDefinition ? componentSelfProxy : publicProxy,
        internal: getInternalApi(),
        args,
        globals: createTagGlobals(host, executionContext, environment),
        sourceUrl: `scadatomic://${encodeURIComponent(projectId)}/methods/${encodeURIComponent(node.name)}.${encodeURIComponent(methodName)}.js`,
      });
    };

    methodCache.set(cacheKey, callable);
    return callable;
  }

  function setVariant(variantName: string) {
    if (!variantSource.variants?.[variantName]) {
      throw new Error(
        `${node.name} (${reusableDefinition?.name ?? node.type}) has no variant “${variantName}”.`
      );
    }

    localVariant = variantName;

    if (!reusableDefinition) {
      Object.assign(localProps, getComponentVariantProps(variantSource, variantName));
      for (const [property, value] of localWrites) localProps[property] = value;
    }

    environment.collector.setShadow(
      shadowKey.componentVariant(variantRuntimeNodeId),
      variantName
    );
    environment.collector.push({
      id: createIntentId(),
      type: "set-variant",
      source: environment.source,
      target: {
        kind: "component-variant",
        componentId: variantRuntimeNodeId,
        path: `${node.name}.variant`,
      },
      variantName,
    });
  }

  const variantApi =
    variantNames.length > 0
      ? createVariantApi({
          variantNames,
          getCurrent: () => localVariant,
          setVariant,
        })
      : undefined;

  // Reusable components are strict facades: only explicitly declared inputs,
  // public methods and variants are visible externally. Primitive nodes keep
  // framework metadata/helpers for low-level component scripting.
  const target = reusableDefinition
    ? ({
        ...(variantApi ? { variant: variantApi } : {}),
      } as UiComponentScriptApi)
    : ({
        id: runtimeNodeId,
        name: node.name,
        type: node.type,
        ...(variantApi ? { variant: variantApi } : {}),
        setProp,
        setColor(color: string) {
          if (!colorProperty) {
            throw new Error(
              `${node.name} (${node.type}) has no color property.`
            );
          }
          setProp(colorProperty, color);
        },
      } as UiComponentScriptApi);

  function makeProxy(includePrivateMethods: boolean) {
    return new Proxy(target, {
      get(apiTarget, property, receiver) {
        if (typeof property !== "string" || hasOwn(apiTarget, property)) {
          return Reflect.get(apiTarget, property, receiver);
        }
        if (allowedProps.has(property)) {
          const input = reusableDefinition?.inputs?.[property];
          const value = localProps[property];
          if (input?.type === "tagRef" && isTagRef(value)) {
            const tagRuntime = host.getTagRuntime();
            const tag = tagRuntime?.listTags().find((candidate) => candidate.id === value.tagId);
            if (!tagRuntime || !tag || tag.type.kind !== "udt" || tag.type.udtId !== input.udtId) {
              return undefined;
            }
            return createUdtInstanceApi(tag.name, tagRuntime, {
              ...createTagRuntimeContext(environment, getContext),
            });
          }
          return value;
        }
        return getMethod(property, includePrivateMethods);
      },
      set(_apiTarget, property, value) {
        if (typeof property !== "string") return false;
        setProp(property, value);
        return true;
      },
    }) as UiComponentScriptApi;
  }

  const publicProxy = makeProxy(false);
  const componentSelfProxy = reusableDefinition ? makeProxy(true) : publicProxy;
  return options.includePrivateMethods ? componentSelfProxy : publicProxy;
}

function createVariantApi({
  variantNames,
  getCurrent,
  setVariant,
}: {
  variantNames: string[];
  getCurrent: () => string | undefined;
  setVariant: (variantName: string) => void;
}): UiComponentVariantScriptApi {
  const methods = new Map<string, () => void>();

  const target = {
    get current() {
      return getCurrent();
    },
  } as UiComponentVariantScriptApi;

  return new Proxy(target, {
    get(apiTarget, property, receiver) {
      if (typeof property !== "string" || hasOwn(apiTarget, property)) {
        return Reflect.get(apiTarget, property, receiver);
      }

      if (!variantNames.includes(property)) return undefined;

      const cached = methods.get(property);
      if (cached) return cached;

      const callable = () => {
        setVariant(property);
      };

      methods.set(property, callable);
      return callable;
    },
  });
}

