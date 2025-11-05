"use client";

import React, { useState } from "react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps,
} from "@xyflow/react";

export interface CustomEdgeData {
  onLabelChange?: (edgeId: string, newLabel: string) => void;
}

export const CustomEdge: React.FC<EdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  label = "relates to",
  data,
  markerEnd,
  style = {},
}) => {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });

  const [isEditing, setIsEditing] = useState(false);
  const [edgeLabel, setEdgeLabel] = useState(label);

  const edgeData = data as CustomEdgeData | undefined;

  const handleLabelClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  const handleBlur = () => {
    setIsEditing(false);
    edgeData?.onLabelChange?.(id, String(edgeLabel || ''));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      setIsEditing(false);
      edgeData?.onLabelChange?.(id, String(edgeLabel || ''));
    } else if (e.key === "Escape") {
      setIsEditing(false);
      setEdgeLabel(label);
    }
  };

  // Clean simple solid edge style
  const edgeStyle = {
    stroke: "#ffffff",
    strokeWidth: 2,
    strokeDasharray: "none",
    fill: "none",
    pointerEvents: "none" as const, // prevents flicker when connecting
    ...style,
  };

  return (
    <>
      <BaseEdge id={id} path={edgePath} style={edgeStyle} />
      <EdgeLabelRenderer>
        <div
          style={{
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            fontSize: 10,
            pointerEvents: "all",
            userSelect: "none",
          }}
          className="nodrag nopan"
        >
          {isEditing ? (
            <input
              type="text"
              value={String(edgeLabel || '')}
              onChange={(e) => setEdgeLabel(e.target.value)}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              autoFocus
              style={{
                padding: "4px 8px",
                fontSize: 12,
                fontWeight: 600,
                backgroundColor: "rgba(0, 0, 0, 0.8)",
                color: "#ffffff",
                border: "1px solid rgba(255, 255, 255, 0.3)",
                borderRadius: "6px",
                outline: "none",
                minWidth: "80px",
                textAlign: "center",
              }}
            />
          ) : (
            <button
              onClick={handleLabelClick}
              style={{
                padding: "4px 12px",
                fontSize: 12,
                fontWeight: 600,
                backgroundColor: "rgba(0, 0, 0, 0.8)",
                color: "#ffffff",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                borderRadius: "6px",
                cursor: "pointer",
                transition: "background-color 0.15s ease, border-color 0.15s ease",
                minWidth: "80px",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.9)";
                e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.4)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
                e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.2)";
              }}
            >
              {edgeLabel || "Click to edit"}
            </button>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
};

export default CustomEdge;