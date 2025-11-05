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
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import './knowledge-graph.css';
import { ArrowLeft, Plus, Edit2, Trash2, Network, X, Save, BookOpen } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { MetallicButton } from '@/components/ui/metallic-button';
import { cn } from '@/lib/utils';
import { CustomEdge } from '@/components/knowledge-graph/CustomEdge';
import { Handle, Position } from '@xyflow/react';

// Types
interface ConceptNode {
  id: string;
  name: string;
  type: 'concept';
  description?: string;
  linkedDocuments?: string[]; // Document IDs attached to this concept
}

interface ConceptEdge {
  id: string;
  source: string;
  target: string;
  relation: string;
}

interface CollectionNetwork {
  collectionId: string;
  nodes: ConceptNode[];
  edges: ConceptEdge[];
}

// Relationship type presets
const RELATIONSHIP_TYPES = [
  { value: 'is_part_of', label: 'is part of' },
  { value: 'supports', label: 'supports' },
  { value: 'depends_on', label: 'depends on' },
  { value: 'related_to', label: 'related to' },
  { value: 'leads_to', label: 'leads to' },
  { value: 'custom', label: 'Custom...' },
];

// Concept Node Component
const ConceptNodeComponent = ({ data, selected }: { data: any; selected: boolean }) => {
  const linkedDocsCount = data.linkedDocuments?.length || 0;

  return (
    <div className="relative">
      <Handle
        type="target"
        position={Position.Top} 
        isConnectable={true}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={true}
      />
      <Handle
        type="target"
        position={Position.Left}
        isConnectable={true}
      />
      <Handle
        type="source"
        position={Position.Right}
        isConnectable={true}
      />

      <div className={cn(
        "px-4 py-3 rounded-lg border backdrop-blur-sm min-w-[150px] max-w-[250px]",
        "bg-gradient-to-br from-white/5 via-black/40 to-black/60",
        selected
          ? "border-white/60 shadow-lg shadow-white/20"
          : "border-white/20 hover:border-white/40",
        "transition-all duration-200",
        "relative overflow-hidden cursor-pointer"
      )}>
        {/* Metallic shine effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-50" />

        <div className="relative z-10 space-y-2">
          <div className="text-sm font-semibold text-white/95 break-words">
            {data.label}
          </div>
          {data.description && (
            <div className="text-xs text-white/60 line-clamp-2 break-words">
              {data.description}
            </div>
          )}
          {linkedDocsCount > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-white/50 pt-1 border-t border-white/10">
              <BookOpen className="w-3 h-3" />
              <span>{linkedDocsCount} {linkedDocsCount === 1 ? 'document' : 'documents'}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const nodeTypes = {
  concept: ConceptNodeComponent,
};

const edgeTypes = {
  customEdge: CustomEdge,
};

export default function CollectionNetworkPage() {
  const router = useRouter();
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [showAddNode, setShowAddNode] = useState(false);
  const [showDetailsPanel, setShowDetailsPanel] = useState(false);

  // Form states for adding/editing nodes
  const [nodeName, setNodeName] = useState('');
  const [nodeDescription, setNodeDescription] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);

  // Relationship form state
  const [relationshipType, setRelationshipType] = useState('related_to');
  const [customRelationType, setCustomRelationType] = useState('');

  // TODO: Replace with real API call to fetch collection network
  // Example endpoint: GET /api/collections/{collectionId}/network
  useEffect(() => {
    // Initialize empty or load saved network from API
    // When implementing:
    // 1. Fetch network data from backend
    // 2. Transform nodes: setNodes(data.nodes.map(node => ({ ...node, position: {...} })))
    // 3. Transform edges: setEdges(data.edges.map(edge => ({ ...edge, type: 'custom' })))
  }, []);

  // Save network to backend
  const saveNetwork = useCallback(() => {
    // TODO: Implement API call to save network
    // Example endpoint: POST /api/collections/{collectionId}/network
    const network: CollectionNetwork = {
      collectionId: 'collection-1',
      nodes: nodes.map(node => ({
        id: node.id,
        name: (node.data as any).label,
        type: 'concept',
        description: (node.data as any).description,
        linkedDocuments: (node.data as any).linkedDocuments || [],
      })),
      edges: edges.map(edge => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        relation: (edge.label as string) || 'related_to',
      })),
    };

    console.log('Saving network:', network);
    // await fetch(`/api/collections/${collectionId}/network`, {
    //   method: 'POST',
    //   body: JSON.stringify(network),
    // });
  }, [nodes, edges]);

  // Add new concept node
  const handleAddNode = useCallback(() => {
    if (!nodeName.trim()) return;

    const newNode: Node = {
      id: `concept-${Date.now()}`,
      type: 'concept',
      position: {
        x: Math.random() * 500 + 100,
        y: Math.random() * 300 + 100,
      },
      data: {
        label: nodeName.trim(),
        description: nodeDescription.trim(),
        linkedDocuments: [],
      },
    };

    setNodes((nds) => [...nds, newNode]);
    setNodeName('');
    setNodeDescription('');
    setShowAddNode(false);
  }, [nodeName, nodeDescription, setNodes]);

  // Edit existing node
  const handleEditNode = useCallback(() => {
    if (!selectedNodeId || !nodeName.trim()) return;

    setNodes((nds) =>
      nds.map((node) =>
        node.id === selectedNodeId
          ? {
              ...node,
              data: {
                ...node.data,
                label: nodeName.trim(),
                description: nodeDescription.trim(),
              },
            }
          : node
      )
    );

    setIsEditMode(false);
    setNodeName('');
    setNodeDescription('');
  }, [selectedNodeId, nodeName, nodeDescription, setNodes]);

  // Delete selected node
  const handleDeleteNode = useCallback(() => {
    if (!selectedNodeId) return;

    setNodes((nds) => nds.filter((node) => node.id !== selectedNodeId));
    setEdges((eds) =>
      eds.filter((edge) => edge.source !== selectedNodeId && edge.target !== selectedNodeId)
    );
    setSelectedNodeId(null);
    setShowDetailsPanel(false);
  }, [selectedNodeId, setNodes, setEdges]);

  // Handle node click
  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    setSelectedNodeId(node.id);
    setShowDetailsPanel(true);
    setIsEditMode(false);
  }, []);

  // Handle edge label change
  const handleLabelChange = useCallback((edgeId: string, newLabel: string) => {
    setEdges((eds) =>
      eds.map((edge) =>
        edge.id === edgeId ? { ...edge, label: newLabel } : edge
      )
    );
  }, [setEdges]);

  // Handle connection
  const onConnect = useCallback(
    (params: Connection) => {
      const relationLabel = relationshipType === 'custom'
        ? customRelationType || 'related to'
        : RELATIONSHIP_TYPES.find(r => r.value === relationshipType)?.label || 'related to';

      const newEdge = {
        ...params,
        type: 'customEdge',
        animated: true,
        label: relationLabel,
        data: { onLabelChange: handleLabelChange },
        style: {
          stroke: '#ffffff',
          strokeWidth: 1,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: '#ffffff',
        },
      };
      setEdges((eds) => addEdge(newEdge, eds));
    },
    [relationshipType, customRelationType, setEdges, handleLabelChange]
  );

  // Get selected node data
  const selectedNode = useMemo(() => {
    return nodes.find((node) => node.id === selectedNodeId);
  }, [nodes, selectedNodeId]);

  // Get related nodes and edges for selected node
  const relatedInfo = useMemo(() => {
    if (!selectedNodeId) return { incoming: [], outgoing: [] };

    const incoming = edges
      .filter((edge) => edge.target === selectedNodeId)
      .map((edge) => {
        const sourceNode = nodes.find((n) => n.id === edge.source);
        return {
          edge,
          node: sourceNode,
          relation: edge.label || 'related to',
        };
      });

    const outgoing = edges
      .filter((edge) => edge.source === selectedNodeId)
      .map((edge) => {
        const targetNode = nodes.find((n) => n.id === edge.target);
        return {
          edge,
          node: targetNode,
          relation: edge.label || 'related to',
        };
      });

    return { incoming, outgoing };
  }, [selectedNodeId, edges, nodes]);

  // Start editing selected node
  const startEditingNode = useCallback(() => {
    if (!selectedNode) return;
    setNodeName((selectedNode.data as any).label || '');
    setNodeDescription((selectedNode.data as any).description || '');
    setIsEditMode(true);
  }, [selectedNode]);

  // Empty state check
  const isEmpty = nodes.length === 0;

  return (
    <div className="w-full h-screen flex flex-col bg-gradient-to-br from-gray-900/20 via-black/5 to-gray-900/10 rounded-xl border border-white/10 shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-2 border-b border-white/10 flex-shrink-0 bg-black/20 backdrop-blur-sm">
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
              Collection Network
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <MetallicButton
            type="button"
            onClick={() => setShowAddNode(true)}
          >
            <Plus className="w-4 h-4" />
            <span>Add Concept</span>
          </MetallicButton>
          <MetallicButton
            type="button"
            onClick={saveNetwork}
          >
            <Save className="w-4 h-4" />
            <span>Save Network</span>
          </MetallicButton>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 relative">
        {isEmpty ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-t from-white/5 to-white/10 border border-white/10 flex items-center justify-center mb-6">
              <Network className="w-10 h-10 text-white/60" />
            </div>
            <h3 className="text-xl font-semibold text-white/90 mb-3">
              No structure defined yet
            </h3>
            <p className="text-sm text-white/60 mb-8 max-w-md text-center">
              Start by adding key concepts and themes for your collection. Define how they relate to build a conceptual map.
            </p>
            <MetallicButton type="button" onClick={() => setShowAddNode(true)}>
              <Plus className="w-4 h-4" />
              <span>Add First Concept</span>
            </MetallicButton>
          </div>
        ) : (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            deleteKeyCode="Delete"
            fitView
            colorMode="dark"
            className="bg-transparent"
            // nodesDraggable={true}
            // noDragClassName="nodrag"
            // defaultEdgeOptions={{
            //   type: 'customEdge',
            //   animated: false,
            //   markerEnd: undefined,
            //   markerStart: undefined,
            //   style: {
            //     stroke: '#ffffff',
            //     strokeWidth: 2,
            //     strokeDasharray: 'none',
            //   },
            // }}
          >
            <Background variant={BackgroundVariant.Cross} gap={12} size={0.5} />
            <Controls />
            <MiniMap />

            {/* Instructions Panel */}
            {/* <Panel position="top-left" className="bg-black/90 backdrop-blur-xl border border-white/20 rounded-xl p-4 m-2 max-w-[300px] shadow-2xl">
              <div className="text-white/90 space-y-2.5">
                <div className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <div className="w-1 h-4 bg-gradient-to-b from-white/60 to-white/20 rounded-full" />
                  How to use:
                </div>
                <ul className="text-xs space-y-1.5 text-white/70 leading-relaxed">
                  <li className="flex items-start gap-2">
                    <span className="text-white/40">•</span>
                    <span>Click <strong>Add Concept</strong> to create nodes</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-white/40">•</span>
                    <span>Drag nodes to reposition them</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-white/40">•</span>
                    <span>Drag from node handles to connect</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-white/40">•</span>
                    <span>Click <strong>edge labels</strong> to edit relationship types</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-white/40">•</span>
                    <span>Click a node to view details</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-white/40">•</span>
                    <span>Select edges and press <strong>Delete</strong> to remove</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-white/40">•</span>
                    <span>Use <strong>Save Network</strong> to persist changes</span>
                  </li>
                </ul>
              </div>
            </Panel> */}

            {/* Relationship Type Selector Panel */}
            <Panel position="top-right" className="bg-black/90 backdrop-blur-xl border border-white/20 rounded-xl p-4 m-2 w-72 shadow-2xl">
              <div className="space-y-3">
                <div className="text-sm font-semibold text-white/95 flex items-center gap-2">
                  <div className="w-1 h-5 bg-gradient-to-b from-white/60 to-white/20 rounded-full" />
                  New Connection Type
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-white/70 block">
                    When connecting concepts:
                  </label>
                  <select
                    value={relationshipType}
                    onChange={(e) => setRelationshipType(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-black/40 border-2 border-white/15 rounded-lg text-white/90 focus:outline-none focus:border-white/30 transition-colors"
                  >
                    {RELATIONSHIP_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                  {relationshipType === 'custom' && (
                    <input
                      type="text"
                      value={customRelationType}
                      onChange={(e) => setCustomRelationType(e.target.value)}
                      placeholder="Enter custom relationship..."
                      className="w-full px-3 py-2 text-sm bg-black/40 border-2 border-white/15 rounded-lg text-white/90 placeholder:text-white/40 focus:outline-none focus:border-white/30 transition-colors"
                    />
                  )}
                </div>
                <p className="text-xs text-white/50 leading-relaxed">
                  Drag from any node handle to another to create a connection
                </p>
              </div>
            </Panel>
          </ReactFlow>
        )}
      </div>

      {/* Add Node Modal */}
      {showAddNode && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-black/95 to-neutral-950/95 backdrop-blur-xl border border-white/30 rounded-xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white/95">Add New Concept</h2>
              <button
                onClick={() => {
                  setShowAddNode(false);
                  setNodeName('');
                  setNodeDescription('');
                }}
                className="text-white/60 hover:text-white/90 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-white/80 mb-2 block">
                  Concept Name *
                </label>
                <input
                  type="text"
                  value={nodeName}
                  onChange={(e) => setNodeName(e.target.value)}
                  placeholder="e.g., Loan Processing, Risk Management..."
                  className="w-full px-3 py-2.5 text-sm bg-black/40 border-2 border-white/15 rounded-lg text-white/90 placeholder:text-white/40 focus:outline-none focus:border-white/30 transition-colors"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-sm font-medium text-white/80 mb-2 block">
                  Description (optional)
                </label>
                <textarea
                  value={nodeDescription}
                  onChange={(e) => setNodeDescription(e.target.value)}
                  placeholder="Brief description of this concept..."
                  rows={3}
                  className="w-full px-3 py-2.5 text-sm bg-black/40 border-2 border-white/15 rounded-lg text-white/90 placeholder:text-white/40 focus:outline-none focus:border-white/30 transition-colors resize-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowAddNode(false);
                    setNodeName('');
                    setNodeDescription('');
                  }}
                  className="flex-1 px-4 py-2.5 text-sm rounded-lg bg-white/5 text-white/70 hover:bg-white/10 hover:text-white/90 border border-white/10 transition-all font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddNode}
                  disabled={!nodeName.trim()}
                  className={cn(
                    "flex-1 px-4 py-2.5 text-sm rounded-lg transition-all font-medium",
                    nodeName.trim()
                      ? "bg-white text-black hover:bg-white/90 shadow-lg"
                      : "bg-white/5 text-white/30 cursor-not-allowed border border-white/10"
                  )}
                >
                  Add Concept
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Node Details Panel */}
      {showDetailsPanel && selectedNode && (
        <div className="fixed right-0 top-0 h-full w-96 bg-gradient-to-br from-black/95 to-neutral-950/95 backdrop-blur-xl border-l border-white/30 shadow-2xl z-40 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-white/95 mb-1">
                  {isEditMode ? 'Edit Concept' : 'Concept Details'}
                </h2>
                <p className="text-xs text-white/50">
                  {isEditMode ? 'Update concept information' : 'View and manage concept'}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowDetailsPanel(false);
                  setSelectedNodeId(null);
                  setIsEditMode(false);
                }}
                className="text-white/60 hover:text-white/90 transition-colors p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Edit/View Mode */}
            {isEditMode ? (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-white/80 mb-2 block">
                    Concept Name *
                  </label>
                  <input
                    type="text"
                    value={nodeName}
                    onChange={(e) => setNodeName(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm bg-black/40 border-2 border-white/15 rounded-lg text-white/90 focus:outline-none focus:border-white/30 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-white/80 mb-2 block">
                    Description
                  </label>
                  <textarea
                    value={nodeDescription}
                    onChange={(e) => setNodeDescription(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2.5 text-sm bg-black/40 border-2 border-white/15 rounded-lg text-white/90 focus:outline-none focus:border-white/30 transition-colors resize-none"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setIsEditMode(false);
                      setNodeName('');
                      setNodeDescription('');
                    }}
                    className="flex-1 px-4 py-2.5 text-sm rounded-lg bg-white/5 text-white/70 hover:bg-white/10 hover:text-white/90 border border-white/10 transition-all font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleEditNode}
                    disabled={!nodeName.trim()}
                    className={cn(
                      "flex-1 px-4 py-2.5 text-sm rounded-lg transition-all font-medium flex items-center justify-center gap-2",
                      nodeName.trim()
                        ? "bg-white text-black hover:bg-white/90"
                        : "bg-white/5 text-white/30 cursor-not-allowed border border-white/10"
                    )}
                  >
                    <Save className="w-4 h-4" />
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Concept Info */}
                <div className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-3">
                  <div>
                    <div className="text-xs font-medium text-white/50 mb-1">Name</div>
                    <div className="text-sm text-white/90 font-medium">
                      {(selectedNode.data as any).label}
                    </div>
                  </div>
                  {(selectedNode.data as any).description && (
                    <div>
                      <div className="text-xs font-medium text-white/50 mb-1">Description</div>
                      <div className="text-sm text-white/80 leading-relaxed">
                        {(selectedNode.data as any).description}
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={startEditingNode}
                    className="flex-1 px-4 py-2.5 text-sm rounded-lg bg-white/10 text-white/90 hover:bg-white/15 border border-white/20 transition-all font-medium flex items-center justify-center gap-2"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={handleDeleteNode}
                    className="px-4 py-2.5 text-sm rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 border-2 border-red-500/30 transition-all font-medium flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>

                {/* Relationships */}
                <div className="space-y-3">
                  <div className="text-sm font-semibold text-white/95 flex items-center gap-2">
                    <div className="w-1 h-4 bg-gradient-to-b from-white/60 to-white/20 rounded-full" />
                    Relationships
                  </div>

                  {/* Outgoing */}
                  {relatedInfo.outgoing.length > 0 && (
                    <div>
                      <div className="text-xs font-medium text-white/60 mb-2">This concept:</div>
                      <div className="space-y-1.5">
                        {relatedInfo.outgoing.map(({ edge, node, relation }) => (
                          <div
                            key={edge.id}
                            className="bg-white/5 border border-white/10 rounded-lg p-2.5 text-xs"
                          >
                            <div className="text-white/50 mb-0.5">{relation}</div>
                            <div className="text-white/90 font-medium">
                              {node ? (node.data as any).label : 'Unknown'}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Incoming */}
                  {relatedInfo.incoming.length > 0 && (
                    <div>
                      <div className="text-xs font-medium text-white/60 mb-2">Related from:</div>
                      <div className="space-y-1.5">
                        {relatedInfo.incoming.map(({ edge, node, relation }) => (
                          <div
                            key={edge.id}
                            className="bg-white/5 border border-white/10 rounded-lg p-2.5 text-xs"
                          >
                            <div className="text-white/90 font-medium mb-0.5">
                              {node ? (node.data as any).label : 'Unknown'}
                            </div>
                            <div className="text-white/50">{relation} this</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {relatedInfo.incoming.length === 0 && relatedInfo.outgoing.length === 0 && (
                    <div className="text-xs text-white/50 bg-white/5 p-3 rounded-lg border border-white/10 text-center">
                      No relationships yet. Drag from node handles to connect.
                    </div>
                  )}
                </div>

                {/* Linked Documents */}
                <div className="space-y-3">
                  <div className="text-sm font-semibold text-white/95 flex items-center gap-2">
                    <div className="w-1 h-4 bg-gradient-to-b from-white/60 to-white/20 rounded-full" />
                    Linked Documents
                  </div>
                  {((selectedNode.data as any).linkedDocuments?.length || 0) > 0 ? (
                    <div className="space-y-1.5">
                      {(selectedNode.data as any).linkedDocuments.map((docId: string) => (
                        <div
                          key={docId}
                          className="bg-white/5 border border-white/10 rounded-lg p-2.5 text-xs text-white/80"
                        >
                          <div className="flex items-center gap-2">
                            <BookOpen className="w-3.5 h-3.5 text-white/50" />
                            <span>Document {docId}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-white/50 bg-white/5 p-3 rounded-lg border border-white/10 text-center">
                      No documents linked yet
                      {/* TODO: Add button to link documents to this concept */}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
