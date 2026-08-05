"use client";

import { useRef, useState } from "react";

/**
 * HTML5 drag-and-drop reordering for table rows.
 *
 * Drag is initiated ONLY from a handle (so text selection inside
 * inline-edit inputs and row buttons never start a drag). Returns:
 *  - `rowProps(i)` — drop-target handlers for the <tr>
 *  - `handleProps(i)` — draggable handle props for the grip element
 *  - `dragIndex` / `overIndex` — for visual feedback
 */
export function useDragSort<T extends { id: string }>(
  items: T[],
  onReorder: (ordered: T[]) => void
) {
  const dragIndex = useRef<number | null>(null);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  function rowProps(index: number) {
    return {
      onDragEnter: () => {
        if (dragIndex.current !== null) setOverIndex(index);
      },
      onDragOver: (e: React.DragEvent) => {
        e.preventDefault();
        if (dragIndex.current !== null && dragIndex.current !== index) {
          setOverIndex(index);
        }
      },
      onDrop: (e: React.DragEvent) => {
        e.preventDefault();
        const from = dragIndex.current;
        dragIndex.current = null;
        setDragIdx(null);
        setOverIndex(null);
        if (from === null || from === index) return;
        const next = [...items];
        const [moved] = next.splice(from, 1);
        next.splice(index, 0, moved);
        onReorder(next);
      }
    };
  }

  function handleProps(index: number) {
    return {
      draggable: true,
      onDragStart: (e: React.DragEvent) => {
        e.dataTransfer.effectAllowed = "move";
        dragIndex.current = index;
        setDragIdx(index);
        setOverIndex(index);
      },
      onDragEnd: () => {
        dragIndex.current = null;
        setDragIdx(null);
        setOverIndex(null);
      }
    };
  }

  return { rowProps, handleProps, dragIndex: dragIdx, overIndex };
}
