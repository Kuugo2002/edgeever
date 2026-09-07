import { describe, expect, test } from 'bun:test';
import { projectMindMapView } from './mind-map-view.ts';

const nodes = [{ id: 'root' }, { id: 'a', parentId: 'root' }, { id: 'b', parentId: 'root' }, { id: 'leaf', parentId: 'a' }, { id: 'detail', parentId: 'leaf' }];
describe('mind-map reading projection', () => {
  test('collapsing a branch keeps its heading and other branches; expanding restores every node', () => {
    const original = JSON.stringify(nodes);
    expect([...projectMindMapView(nodes, new Set(['a']), null).visible]).toEqual(['root', 'a', 'b']);
    expect([...projectMindMapView(nodes, new Set(), null).visible]).toEqual(nodes.map(n => n.id));
    expect(JSON.stringify(nodes)).toBe(original);
  });
  test('focus shows the selected subtree even when an ancestor was collapsed', () => {
    expect([...projectMindMapView(nodes, new Set(['root']), 'a').visible]).toEqual(['a', 'leaf', 'detail']);
    expect([...projectMindMapView(nodes, new Set(['a']), 'a').visible]).toEqual(['a']);
  });
  test('nested collapsed branches retain their state after opening their parent', () => {
    expect([...projectMindMapView(nodes, new Set(['leaf']), null).visible]).toEqual(['root', 'a', 'b', 'leaf']);
  });
  test('stale focus, orphaned nodes and cyclic parents remain safe', () => {
    expect(projectMindMapView(nodes, new Set(['missing']), 'missing').visible.size).toBe(5);
    const malformed = [{ id: 'orphan', parentId: 'missing' }, { id: 'x', parentId: 'y' }, { id: 'y', parentId: 'x' }];
    expect(projectMindMapView(malformed, new Set(), null).visible.size).toBe(3);
  });
});
