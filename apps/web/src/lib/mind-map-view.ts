/** A view projection only: never removes or rewrites nodes in a diagram document. */
export type MindMapViewNode = { id: string; parentId?: string };

export function projectMindMapView(nodes: MindMapViewNode[], collapsed: ReadonlySet<string>, focusId: string | null) {
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const focus = focusId && byId.has(focusId) ? focusId : null;
  const visible = new Set<string>();
  const children = new Map<string, string[]>();
  for (const node of nodes) {
    if (node.parentId && byId.has(node.parentId)) {
      const siblings = children.get(node.parentId) ?? [];
      siblings.push(node.id);
      children.set(node.parentId, siblings);
    }
    let current: MindMapViewNode | undefined = node;
    let belongsToFocus = !focus;
    let hidden = false;
    const visited = new Set<string>();
    while (current && !visited.has(current.id)) {
      visited.add(current.id);
      if (current.id === focus) { belongsToFocus = true; break; }
      current = current.parentId ? byId.get(current.parentId) : undefined;
      if (current && collapsed.has(current.id)) hidden = true;
    }
    if (belongsToFocus && !hidden) visible.add(node.id);
  }
  return { visible, children };
}
