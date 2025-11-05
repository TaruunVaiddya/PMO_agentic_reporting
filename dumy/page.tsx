"use client";

import { useState, useCallback, useEffect, useMemo } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Node,
  Edge,
  Connection,
  BackgroundVariant,
  Panel,
  reconnectEdge,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import './knowledge-graph.css';
import { fetcher } from '@/lib/get-fetcher';
import useSWR from 'swr';
import { ArrowLeft, Plus, Trash2, Network } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { MetallicButton } from '@/components/ui/metallic-button';
import { cn } from '@/lib/utils';
import { CustomEdge } from '@/components/knowledge-graph/CustomEdge';
import { Handle, Position } from '@xyflow/react';

// Metallic custom node
const MetallicNode = ({ data }: { data: any }) => {
  const getFileTypeBadge = () => {
    const type = data.document_type || 'OTHER';
    const colors = {
      PDF: 'bg-red-500/20 text-red-300 border-red-500/30',
      Excel: 'bg-green-500/20 text-green-300 border-green-500/30',
      OTHER: 'bg-blue-500/20 text-blue-300 border-blue-500/30'
    };

    return (
      <span className={cn(
        "px-2 py-0.5 text-xs rounded-md border",
        colors[type as keyof typeof colors] || colors.OTHER
      )}>
        {type}
      </span>
    );
  };

  return (
    <div className="relative">
      <Handle
        type="target"
        position={Position.Top}
        className="!top-[-8px] nodrag"
        isConnectable={true}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bottom-[-8px] nodrag"
        isConnectable={true}
      />
      <Handle
        type="target"
        position={Position.Left}
        className="!left-[-8px] nodrag"
        isConnectable={true}
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!right-[-8px] nodrag"
        isConnectable={true}
      />

      <div className={cn(
        "px-4 py-3 rounded-lg border backdrop-blur-sm min-w-[150px] max-w-[250px]",
        "bg-gradient-to-br from-white/5 via-black/40 to-black/60",
        "border-white/20",
        "hover:border-white/40 transition-all duration-200",
        "relative overflow-hidden"
      )}>
        {/* Metallic shine effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-50" />

        <div className="relative z-10 space-y-2">
          <div className="text-sm font-medium text-white/90 break-words">
            {data.label}
          </div>
          {data.document_type && (
            <div className="flex items-center gap-2">
              {getFileTypeBadge()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const nodeTypes = {
  metallic: MetallicNode,
};

const edgeTypes = {
  editableEdge: CustomEdge,
  customEdge: CustomEdge,
};

export default function KnowledgeGraphPage() {
  const router = useRouter();
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [selectedNodes, setSelectedNodes] = useState<string[]>([]);
  const [relationshipLabel, setRelationshipLabel] = useState('relates to');
  const [showRelationshipPanel, setShowRelationshipPanel] = useState(false);

  // Fetch documents
  const { data, isLoading } = useSWR('/documents', fetcher, {
    revalidateOnFocus: false,
  });

  const documents = Array.isArray(data) ? data : (data?.documents ?? []);

  // Initialize nodes from documents
  useEffect(() => {
    if (documents.length > 0 && nodes.length === 0) {
      // Create a circular layout
      const centerX = 400;
      const centerY = 300;
      const radius = 250;

      const newNodes: Node[] = documents.map((doc: any, index: number) => {
        const angle = (index / documents.length) * 2 * Math.PI;
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);

        return {
          id: doc.document_id ?? doc.id ?? `doc-${index}`,
          type: 'metallic',
          position: { x, y },
          data: {
            label: doc.document_name ?? doc.name ?? 'Untitled',
            document_type: doc.document_type ?? 'OTHER',
            document_id: doc.document_id ?? doc.id,
          },
        };
      });

      setNodes(newNodes);
    }
  }, [documents, nodes.length, setNodes]);

  const handleLabelChange = useCallback((edgeId: string, newLabel: string) => {
    setEdges((eds) =>
      eds.map((edge) =>
        edge.id === edgeId ? { ...edge, label: newLabel } : edge
      )
    );
  }, [setEdges]);

  const onConnect = useCallback(
    (params: Connection) => {
      const newEdge = {
        ...params,
        type: 'customEdge',
        animated: true,
        label: relationshipLabel || 'relates to',
        data: { onLabelChange: handleLabelChange },
        style: {
          stroke: '#ffffff',
          strokeWidth: 2,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: '#ffffff',
        },
      };
      setEdges((eds) => addEdge(newEdge, eds));
    },
    [setEdges, relationshipLabel, handleLabelChange]
  );

  const onReconnect = useCallback(
    (oldEdge: Edge, newConnection: Connection) => {
      setEdges((els) => reconnectEdge(oldEdge, newConnection, els));
    },
    [setEdges]
  );

  const onEdgesDelete = useCallback(
    (edgesToDelete: Edge[]) => {
      setEdges((eds) =>
        eds.filter((edge) => !edgesToDelete.some((e) => e.id === edge.id))
      );
    },
    [setEdges]
  );

  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    setSelectedNodes((prev) => {
      if (prev.includes(node.id)) {
        return prev.filter((id) => id !== node.id);
      } else if (prev.length < 2) {
        return [...prev, node.id];
      } else {
        return [node.id];
      }
    });
  }, []);

  const createRelationship = useCallback(() => {
    if (selectedNodes.length === 2) {
      const newEdge: Edge = {
        id: `e${selectedNodes[0]}-${selectedNodes[1]}-${Date.now()}`,
        source: selectedNodes[0],
        target: selectedNodes[1],
        type: 'customEdge',
        animated: true,
        label: relationshipLabel || 'relates to',
        data: { onLabelChange: handleLabelChange },
        style: {
          stroke: '#ffffff',
          strokeWidth: 2,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: '#ffffff',
        },
      };
      setEdges((eds) => [...eds, newEdge]);
      setSelectedNodes([]);
      setRelationshipLabel('relates to');
      setShowRelationshipPanel(false);
    }
  }, [selectedNodes, relationshipLabel, setEdges, handleLabelChange]);

  const deleteSelectedRelationship = useCallback(() => {
    if (selectedNodes.length === 2) {
      setEdges((eds) =>
        eds.filter(
          (edge) =>
            !(
              (edge.source === selectedNodes[0] && edge.target === selectedNodes[1]) ||
              (edge.source === selectedNodes[1] && edge.target === selectedNodes[0])
            )
        )
      );
      setSelectedNodes([]);
    }
  }, [selectedNodes, setEdges]);

  const selectedNodeData = useMemo(() => {
    return nodes.filter((node) => selectedNodes.includes(node.id));
  }, [nodes, selectedNodes]);

  return (
    <div className="w-full h-screen flex flex-col bg-gradient-to-br from-gray-900/20 via-black/5 to-gray-900/10 rounded-xl border border-white/10 shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-white/10 flex-shrink-0 bg-black/20 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/library')}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white/80" />
          </button>
          <div>
            <h1 className="text-2xl font-semibold text-white/90 flex items-center gap-2">
              <Network className="w-6 h-6" />
              Knowledge Graph
            </h1>
            <p className="text-sm text-white/60 mt-1">
              Visualize and define relationships between your documents
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <MetallicButton
            type="button"
            onClick={() => setShowRelationshipPanel(!showRelationshipPanel)}
            variant="compact"
          >
            <Plus className="w-4 h-4" />
            <span>Create Relationship</span>
          </MetallicButton>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 relative">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-white/60">Loading documents...</div>
          </div>
        ) : documents.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-t from-white/5 to-white/10 border border-white/10 flex items-center justify-center mb-6">
              <Network className="w-10 h-10 text-white/60" />
            </div>
            <h3 className="text-xl font-semibold text-white/90 mb-3">
              No documents yet
            </h3>
            <p className="text-sm text-white/60 mb-8 max-w-md text-center">
              Upload documents to your library first to create knowledge relationships
            </p>
            <MetallicButton type="button" onClick={() => router.push('/library')}>
              <ArrowLeft className="w-4 h-4" />
              <span>Go to Library</span>
            </MetallicButton>
          </div>
        ) : (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onReconnect={onReconnect}
            onEdgesDelete={onEdgesDelete}
            onNodeClick={onNodeClick}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            edgesReconnectable={true}
            deleteKeyCode="Delete"
            fitView
            colorMode="dark"
            className="bg-transparent"
            defaultEdgeOptions={{
              type: 'customEdge',
              animated: true,
              style: {
                stroke: '#ffffff',
                strokeWidth: 2,
              },
              markerEnd: {
                type: MarkerType.ArrowClosed,
                color: '#ffffff',
              },
            }}
          >
            <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
            <Controls />
            <MiniMap />

            {/* Instruction Panel */}
            <Panel position="top-left" className="bg-black/90 backdrop-blur-xl border border-white/20 rounded-xl p-4 m-2 max-w-[300px] shadow-2xl">
              <div className="text-white/90 space-y-2.5">
                <div className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <div className="w-1 h-4 bg-gradient-to-b from-white/60 to-white/20 rounded-full" />
                  How to use:
                </div>
                <ul className="text-xs space-y-1.5 text-white/70 leading-relaxed">
                  <li className="flex items-start gap-2">
                    <span className="text-white/40">•</span>
                    <span>Drag nodes to reposition</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-white/40">•</span>
                    <span>Drag from node edge to connect</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-white/40">•</span>
                    <span><strong>Click edge labels</strong> to edit text</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-white/40">•</span>
                    <span><strong>Drag edge endpoints</strong> to reconnect</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-white/40">•</span>
                    <span><strong>Select edge + Delete key</strong> to remove</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-white/40">•</span>
                    <span>Select 2 nodes for bulk actions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-white/40">•</span>
                    <span>Zoom & pan with mouse</span>
                  </li>
                </ul>
              </div>
            </Panel>

            {/* Relationship Panel */}
            {showRelationshipPanel && (
              <Panel position="top-right" className="bg-black/90 backdrop-blur-xl border border-white/20 rounded-xl p-4 m-2 w-80 shadow-2xl">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-white/95 flex items-center gap-2">
                      <div className="w-1 h-5 bg-gradient-to-b from-white/60 to-white/20 rounded-full" />
                      Create Relationship
                    </h3>
                    <button
                      onClick={() => setShowRelationshipPanel(false)}
                      className="text-white/60 hover:text-white/90 transition-colors text-xl w-6 h-6 flex items-center justify-center rounded hover:bg-white/10"
                    >
                      ×
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-medium text-white/70 mb-2.5 block">
                        Selected Documents ({selectedNodes.length}/2)
                      </label>
                      <div className="space-y-2">
                        {selectedNodeData.length === 0 ? (
                          <p className="text-xs text-white/50 bg-white/5 p-3 rounded-lg border border-white/10">
                            Click on documents in the graph to select them
                          </p>
                        ) : (
                          selectedNodeData.map((node) => (
                            <div
                              key={node.id}
                              className="text-xs bg-white/5 p-2.5 rounded-lg border border-white/15 truncate text-white/90 font-medium"
                            >
                              {(node.data as any).document_name}
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-white/70 mb-2.5 block">Relationship Description</label>
                      <input
                        type="text"
                        value={relationshipLabel}
                        onChange={(e) => setRelationshipLabel(e.target.value)}
                        placeholder="e.g., relates to, references, derived from..."
                        className="w-full px-3 py-2.5 text-sm bg-black/40 border-2 border-white/15 rounded-lg text-white/90 placeholder:text-white/40 focus:outline-none focus:border-white/30 transition-colors"
                      />
                      <p className="text-xs text-white/50 mt-1.5">Type any custom relationship description</p>
                    </div>

                    <div className="flex gap-2 pt-3">
                      <button
                        onClick={createRelationship}
                        disabled={selectedNodes.length !== 2}
                        className={cn(
                          "flex-1 px-4 py-2.5 text-sm rounded-lg transition-all flex items-center justify-center gap-2 font-medium",
                          selectedNodes.length === 2
                            ? "bg-white text-black hover:bg-white/90 shadow-lg"
                            : "bg-white/5 text-white/30 cursor-not-allowed border border-white/10"
                        )}
                      >
                        <Plus className="w-4 h-4" />
                        Create
                      </button>
                      <button
                        onClick={deleteSelectedRelationship}
                        disabled={selectedNodes.length !== 2}
                        className={cn(
                          "px-4 py-2.5 text-sm rounded-lg transition-all flex items-center gap-2 font-medium",
                          selectedNodes.length === 2
                            ? "bg-red-500/20 hover:bg-red-500/30 text-red-400 border-2 border-red-500/30"
                            : "bg-white/5 text-white/30 cursor-not-allowed border border-white/10"
                        )}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/10">
                    <div className="text-xs text-white/50 leading-relaxed">
                      💡 Tip: Select exactly 2 documents to create or delete relationships between them
                    </div>
                  </div>
                </div>
              </Panel>
            )}

            {/* Stats Panel */}
            <Panel position="bottom-left" className="bg-black/90 backdrop-blur-xl border border-white/20 rounded-xl p-3 m-2 shadow-2xl">
              <div className="flex items-center gap-4 text-xs text-white/70 font-medium">
                <div className="text-white/90">
                  <span className="font-semibold">{nodes.length}</span> Documents • <span className="font-semibold">{edges.length}</span> Connections
                </div>
              </div>
            </Panel>
          </ReactFlow>
        )}
      </div>
    </div>
  );
}
