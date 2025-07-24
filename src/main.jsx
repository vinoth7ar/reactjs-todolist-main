import React, { useState, useCallback, memo } from "react";
import {
  ReactFlow,
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Handle,
  Position,
  Background,
  BackgroundVariant,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

// TypeScript interfaces
interface StageNodeData {
  title: string;
  description: string;
}

interface StatusNodeData {
  label: string;
}

interface EntityNodeData {
  label: string;
}

// Custom Stage Node Component
const StageNode = memo(({ data }: { data: StageNodeData }) => {
  return (
    <div className="stage-node">
      <h3 className="stage-title">{data.title}</h3>
      <p className="stage-description">{data.description}</p>
      <Handle
        type="source"
        position={Position.Bottom}
        className="stage-handle"
      />
      <Handle type="target" position={Position.Top} className="stage-handle" />
    </div>
  );
});

// Custom Status Node Component
const StatusNode = memo(({ data }: { data: StatusNodeData }) => {
  return (
    <div className="status-node">
      <div className="status-circle">
        <span className="status-text">{data.label}</span>
      </div>
      <Handle type="target" position={Position.Top} className="status-handle" />
    </div>
  );
});

// Custom Entity Node Component
const EntityNode = memo(({ data }: { data: EntityNodeData }) => {
  return (
    <div className="entity-node">
      <span className="entity-text">{data.label}</span>
      <span className="entity-more">⋯</span>
    </div>
  );
});

// Node types mapping
const nodeTypes = {
  stageNode: StageNode,
  statusNode: StatusNode,
  entityNode: EntityNode,
};

// Main Workflow Component
export default function WorkflowDiagram() {
  const [isEntitiesExpanded, setIsEntitiesExpanded] = useState(true);

  // Initial nodes
  const initialNodes: Node[] = [
    {
      id: "stage-1",
      type: "stageNode",
      position: { x: 50, y: 50 },
      data: {
        title: "Stage",
        description: "FLUME stages commitment data in PMF database",
      },
    },
    {
      id: "enrich-1",
      type: "stageNode",
      position: { x: 350, y: 50 },
      data: {
        title: "Enrich",
        description: "PMF enriches hypo loan positions.",
      },
    },
    {
      id: "status-1",
      type: "statusNode",
      position: { x: 98, y: 180 },
      data: {
        label: "staged",
      },
    },
    {
      id: "status-2",
      type: "statusNode",
      position: { x: 398, y: 180 },
      data: {
        label: "position created",
      },
    },
  ];

  // Initial edges
  const initialEdges: Edge[] = [
    {
      id: "stage-to-status1",
      source: "stage-1",
      target: "status-1",
      type: "straight",
      style: { stroke: "#999", strokeWidth: 1 },
    },
    {
      id: "enrich-to-status2",
      source: "enrich-1",
      target: "status-2",
      type: "straight",
      style: { stroke: "#999", strokeWidth: 1 },
    },
  ];

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  // Entity data
  const entities = [
    "Hypo Loan Position",
    "Loan Commitment",
    "Hypo Loan Base Price",
  ];

  return (
    <div className="workflow-container">
      <style>{styles}</style>

      <div className="workflow-card">
        {/* Header */}
        <div className="workflow-header">
          <h1 className="header-title">PMF</h1>
          <span className="header-more">⋯</span>
        </div>

        {/* Content */}
        <div className="workflow-content">
          <h2 className="workflow-title">Hypo Loan Position</h2>
          <p className="workflow-description">Workflow description</p>

          {/* React Flow Container */}
          <div className="flow-container">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              nodeTypes={nodeTypes}
              fitView
              attributionPosition="bottom-right"
              panOnDrag={true}
              zoomOnScroll={true}
              zoomOnPinch={true}
              zoomOnDoubleClick={true}
              nodesDraggable={true}
              nodesConnectable={true}
              elementsSelectable={true}
            >
              <Background
                variant={BackgroundVariant.Dots}
                gap={20}
                size={0.5}
                color="transparent"
              />
            </ReactFlow>
          </div>

          {/* Modified Data Entities */}
          <div className="entities-section">
            <button
              onClick={() => setIsEntitiesExpanded(!isEntitiesExpanded)}
              className="entities-button"
            >
              <span>Modified Data Entities</span>
              <span
                className={`chevron-icon ${
                  isEntitiesExpanded ? "expanded" : ""
                }`}
              >
                ▼
              </span>
            </button>

            {isEntitiesExpanded && (
              <div className="entities-list">
                {entities.map((entity, index) => (
                  <div key={index} className="entity-item">
                    <span className="entity-label">{entity}</span>
                    <span className="entity-more-icon">⋯</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// CSS Styles
const styles = `
  .workflow-container {
    min-height: 100vh;
    background-color: #fafafa;
    padding: 24px;
    font-family: system-ui, -apple-system, sans-serif;
  }

  .workflow-card {
    max-width: 1000px;
    margin: 0 auto;
    background-color: #ffffff;
    border: 1px solid #b3b3b3;
    border-radius: 8px;
    overflow: hidden;
  }

  .workflow-header {
    background-color: #666666;
    color: white;
    padding: 8px 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .header-title {
    font-size: 14px;
    font-weight: 500;
    margin: 0;
  }

  .header-more {
    color: white;
    font-size: 16px;
    font-weight: bold;
  }

  .workflow-content {
    padding: 24px;
  }

  .workflow-title {
    font-size: 20px;
    font-weight: bold;
    color: #333;
    margin: 0 0 4px 0;
  }

  .workflow-description {
    font-size: 14px;
    color: #666;
    margin: 0 0 24px 0;
  }

  .flow-container {
    border: 2px dashed #999999;
    border-radius: 8px;
    height: 280px;
    margin-bottom: 24px;
    background-color: #fafafa;
  }

  /* Stage Node Styles */
  .stage-node {
    width: 192px;
    height: 80px;
    padding: 12px;
    border: 1px solid #b3b3b3;
    border-radius: 4px;
    background-color: #f5f5f5;
    display: flex;
    flex-direction: column;
    justify-content: center;
    position: relative;
  }

  .stage-title {
    font-size: 14px;
    font-weight: 600;
    color: #333;
    margin: 0 0 4px 0;
  }

  .stage-description {
    font-size: 12px;
    color: #666;
    margin: 0;
    line-height: 1.3;
  }

  .stage-handle {
    width: 8px !important;
    height: 8px !important;
    background: #fff !important;
    border: 1px solid #b3b3b3 !important;
  }

  /* Status Node Styles */
  .status-node {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .status-circle {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background-color: #e0e0e0;
    border: 1px solid #b3b3b3;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .status-text {
    font-size: 10px;
    color: #666;
    font-weight: 500;
    text-align: center;
  }

  .status-handle {
    width: 8px !important;
    height: 8px !important;
    background: #fff !important;
    border: 1px solid #b3b3b3 !important;
  }

  /* Entity Node Styles */
  .entity-node {
    background-color: #f0e68c;
    padding: 8px 16px;
    border: 1px solid #b3b3b3;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-width: 192px;
  }

  .entity-text {
    font-size: 14px;
    font-weight: 500;
    color: #333;
  }

  .entity-more {
    color: #666;
    font-size: 16px;
  }

  /* Entities Section Styles */
  .entities-section {
    margin-top: 24px;
  }

  .entities-button {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    font-weight: 500;
    color: #333;
    background: none;
    border: none;
    cursor: pointer;
    padding: 0 0 16px 0;
    transition: color 0.2s;
  }

  .entities-button:hover {
    color: #666;
  }

  .chevron-icon {
    font-size: 12px;
    transition: transform 0.2s;
    display: inline-block;
  }

  .chevron-icon.expanded {
    transform: rotate(180deg);
  }

  .entities-list {
    display: flex;
    gap: 16px;
    flex-wrap: wrap;
  }

  .entity-item {
    background-color: #f0e68c;
    padding: 8px 16px;
    border: 1px solid #b3b3b3;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-width: 192px;
  }

  .entity-label {
    font-size: 14px;
    font-weight: 500;
    color: #333;
  }

  .entity-more-icon {
    color: #666;
    font-size: 16px;
  }

  /* React Flow Custom Styles */
  .react-flow__attribution {
    display: none !important;
  }

  .react-flow__edge path {
    stroke: #999 !important;
    stroke-width: 1 !important;
  }
`;
