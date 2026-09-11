export function createRepeatInstanceId(
  containerId: string,
  tagId: string,
  componentDefinitionId: string
) {
  return `repeat~${containerId}~${tagId}~${componentDefinitionId}`;
}

export function parseRepeatInstanceId(value: string) {
  const [prefix, containerId, tagId, componentDefinitionId] = value.split("~");
  return prefix === "repeat" && containerId && tagId && componentDefinitionId
    ? { containerId, tagId, componentDefinitionId }
    : undefined;
}
