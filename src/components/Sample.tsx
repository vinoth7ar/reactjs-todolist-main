import React, { useEffect, useMemo, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  Handle,
  Position,
  useEdgesState,
  useNodesState,
  type Node as RFNode,
  type Edge as RFEdge,
  type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

type Step = { name: string; status: string; description?: string };
type Entity = { label: string; emphasis?: boolean };

type WorkflowData = {
  id: string;
  appTitle: string;
  workflowTitle: string;
  steps: Step[];
  entities: Entity[];
};

const AppFrameNode: React.FC<NodeProps<{ title: string }>> = ({ data }) => (
  <div className="relative w-full h-full rounded-3xl border border-gray-300 bg-transparent shadow-sm">
    <div className="absolute -top-6 left-4">
      <div className="flex items-center gap-2 rounded-2xl bg-gray-900 text-white px-3 py-1 shadow">
        <span className="font-semibold tracking-wide">{data.title}</span>
        <span className="opacity-80">•••</span>
      </div>
    </div>
    <div className="h-full w-full rounded-3xl border-2 border-dotted border-gray-300 p-6 bg-transparent" />
  </div>
);

const SectionHeaderNode: React.FC<NodeProps<{ text: string }>> = ({ data }) => (
  <div className="pointer-events-none select-none">
    <div className="font-semibold text-gray-900 text-lg">{data.text}</div>
  </div>
);

const StageCardNode: React.FC<NodeProps<{ title: string; body?: string; index?: number }>> = ({ data }) => (
  <div className="border border-gray-500 bg-[#e8f7e8] w-[360px]">
    <div className="p-3">
      <div className="flex items-center gap-2 mb-1">
        {typeof data.index === "number" && (
          <div className="w-6 h-6 rounded-full grid place-items-center bg-green-600 text-white text-xs font-bold">{data.index + 1}</div>
        )}
        <div className="font-semibold">{data.title}</div>
      </div>
      {data.body && <div className="text-sm leading-snug text-gray-800">{data.body}</div>}
    </div>
    <Handle id="left" type="target" position={Position.Left} />
    <Handle id="right" type="source" position={Position.Right} />
  </div>
);

const EventNode: React.FC<NodeProps<{ label: string }>> = ({ data }) => (
  <div className="w-[110px] h-[110px] rounded-full border border-gray-600 bg-white grid place-items-center">
    <div className="text-gray-800 text-sm whitespace-pre-line text-center">{data.label}</div>
    <Handle id="left" type="target" position={Position.Left} />
    <Handle id="right" type="source" position={Position.Right} />
  </div>
);

const DataEntityTagNode: React.FC<NodeProps<{ label: string; emphasis?: boolean; selected?: boolean; onClick?: (label: string) => void }>> = ({ data }) => (
  <button
    onClick={() => data.onClick && data.onClick(data.label)}
    className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 shadow-sm transition ${
      data.selected || data.emphasis ? "bg-yellow-100 border-yellow-500" : "bg-white border-gray-300 hover:bg-gray-50"
    }`}
  >
    <span className="text-sm font-medium text-gray-900">{data.label}</span>
    <span className="text-gray-600">•••</span>
  </button>
);

const ToggleNode: React.FC<NodeProps<{ expanded: boolean; onToggle: () => void }>> = ({ data }) => (
  <button onClick={data.onToggle} className="flex items-center gap-2 text-sky-700">
    <span>{data.expanded ? "▲" : "▼"}</span>
    <span className="underline">See Data Entities</span>
  </button>
);

const nodeTypes = { app: AppFrameNode, section: SectionHeaderNode, stage: StageCardNode, event: EventNode, tag: DataEntityTagNode, toggle: ToggleNode };

function buildGraph(data: WorkflowData, expanded: boolean, selectedEntity: string | null, onEntityClick: (label: string) => void, onToggle: () => void) {
  const nodes: RFNode[] = [];
  const edges: RFEdge[] = [];
  const frameWidth = Math.max(1040, 160 + data.steps.length * (360 + 140));
  const frameHeight = 720;

  nodes.push({ id: "app", type: "app", position: { x: 40, y: 40 }, data: { title: data.appTitle }, style: { width: frameWidth, height: frameHeight }, draggable: false });
  nodes.push({ id: "title", type: "section", position: { x: 80, y: 70 }, data: { text: data.workflowTitle }, parentNode: "app", extent: "parent", draggable: false });

  const startX = 80, yRect = 160, rectW = 360, gapX = 140, yCircle = 320;

  data.steps.forEach((step, i) => {
    const xRect = startX + i * (rectW + gapX);
    const rectId = `rect-${i}`;
    nodes.push({ id: rectId, type: "stage", position: { x: xRect, y: yRect }, data: { title: step.name, body: step.description, index: i }, parentNode: "app", extent: "parent" });
    const circleId = `circle-${i}`;
    const xCircle = xRect + rectW + gapX / 2 - 55;
    nodes.push({ id: circleId, type: "event", position: { x: xCircle, y: yCircle }, data: { label: step.status }, parentNode: "app", extent: "parent" });
    edges.push({ id: `e-${rectId}-${circleId}`, source: rectId, target: circleId, type: "smoothstep", sourceHandle: "right" });
    const nextRectId = `rect-${i + 1}`;
    if (i + 1 < data.steps.length) edges.push({ id: `e-${circleId}-${nextRectId}`, source: circleId, target: nextRectId, type: "smoothstep", targetHandle: "left" });
  });

  nodes.push({ id: "toggle", type: "toggle", position: { x: 80, y: 440 }, data: { expanded, onToggle }, parentNode: "app", extent: "parent" });

  if (expanded) {
    let entityX = 80, entityY = 480, entityRowGap = 50, entityColGap = 24;
    data.entities.forEach((e, idx) => {
      nodes.push({ id: `entity-${idx}`, type: "tag", position: { x: entityX, y: entityY }, data: { label: e.label, emphasis: e.emphasis, selected: selectedEntity === e.label, onClick: onEntityClick }, parentNode: "app", extent: "parent" });
      entityX += 260;
      if (entityX > frameWidth - 320) { entityX = 80; entityY += entityRowGap; } else { entityX += entityColGap; }
    });
  }
  return { nodes, edges };
}

const seedWorkflows: WorkflowData[] = [
  {
    id: "lsa",
    appTitle: "LSA",
    workflowTitle: "Commitment",
    steps: [
      { name: "Create", status: "created", description: "Seller enters commitment details in contract takeout screen. 5 hypo loans are created with base prices." },
      { name: "Accept", status: "accepted" },
      { name: "Stage", status: "staged" },
      { name: "Enrich", status: "enriched" },
    ],
    entities: [
      { label: "Loan Commitment", emphasis: true },
      { label: "Hypo Loan Position" },
      { label: "Hypo Loan Base Price" },
    ],
  },
  {
    id: "cwflume",
    appTitle: "CW/FLUME",
    workflowTitle: "Commitment",
    steps: [
      { name: "Accept", status: "accepted" },
      { name: "Stage", status: "staged" },
      { name: "Enrich", status: "enriched" },
      { name: "Publish", status: "published" },
    ],
    entities: [
      { label: "Loan Commitment" },
      { label: "Hypo Loan Position", emphasis: true },
      { label: "Hypo Loan Base Price" },
    ],
  },
];

export default function WorkflowVisualizer({ workflows }: { workflows?: WorkflowData[] }) {
  const wfList = workflows && workflows.length > 0 ? workflows : seedWorkflows;
  const [expanded, setExpanded] = useState(true);
  const [selectedEntity, setSelectedEntity] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentId, setCurrentId] = useState<string>(wfList[0].id);

  const current = useMemo(() => wfList.find(w => w.id === currentId) || wfList[0], [wfList, currentId]);

  const onEntityClick = (label: string) => { setSelectedEntity(label); setDialogOpen(true); };

  const graph = useMemo(() => buildGraph(current, expanded, selectedEntity, onEntityClick, () => setExpanded(e => !e)), [current, expanded, selectedEntity]);

  const [nodes, setNodes, onNodesChange] = useNodesState<RFNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<RFEdge>([]);

  useEffect(() => { setNodes(graph.nodes); setEdges(graph.edges); }, [graph, setNodes, setEdges]);

  useEffect(() => { if (!wfList.find(w => w.id === currentId)) setCurrentId(wfList[0].id); }, [wfList, currentId]);

  return (
    <div className="w-full h-screen bg-gray-50">
      <div className="flex items-center justify-between px-6 py-3 border-b bg-white">
        <div className="flex items-center gap-3">
          <span className="text-sky-700 font-bold">EBM Studio</span>
          <div className="mx-2 h-5 w-px bg-gray-300" />
          <div className="text-gray-600">{current.appTitle} ▾</div>
        </div>
        <div className="text-sm text-gray-500">Single Views + Search</div>
      </div>
      <div className="grid grid-cols-[1fr_320px] h-[calc(100vh-52px)]">
        <div className="relative">
          <ReactFlow nodes={nodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} nodeTypes={nodeTypes} fitView>
            <Background />
            <Controls position="bottom-left" />
          </ReactFlow>
        </div>
        <div className="border-l bg-white p-4 overflow-y-auto">
          <div className="mb-3 font-semibold">Customize View</div>
          <div className="border border-gray-200 rounded-md p-3 mb-6">
            <label className="inline-flex items-center gap-2 cursor-pointer select-none">
              <input type="checkbox" checked={expanded} onChange={() => setExpanded(e => !e)} className="h-4 w-4" />
              <span>Expand all data entities</span>
            </label>
            <div className="my-3 h-px bg-gray-200" />
            <div className="text-[10px] uppercase text-gray-600">Legend</div>
            <div className="mt-2 space-y-2">
              <div className="inline-block rounded-full border px-2 py-0.5 text-xs">Application</div>
              <div className="inline-block rounded-full border px-2 py-0.5 text-xs">Workflow</div>
              <div className="inline-block rounded-full border px-2 py-0.5 text-xs">Business Event</div>
              <div className="inline-block rounded-full border px-2 py-0.5 text-xs">Data Entity</div>
            </div>
          </div>
          <div className="mb-3 font-semibold">Other Workflows</div>
          <div className="space-y-2">
            {wfList.map(w => (
              <div key={w.id} onClick={() => setCurrentId(w.id)} className={`border rounded-md p-3 flex items-center justify-between hover:shadow-sm cursor-pointer ${current.id === w.id ? "ring-2 ring-sky-600" : ""}`}>
                <span className="text-gray-800">{w.appTitle} — {w.workflowTitle}</span>
                <div className="w-6 h-6 grid place-items-center rounded-full bg-yellow-400 font-semibold">M</div>
              </div>
            ))}
          </div>
          <div className="mt-6 mb-2 font-semibold">Event Explorer</div>
          <div className="space-y-2">
            {current.steps.map((s, i) => (
              <div key={i} className="border rounded-md p-2 flex items-start gap-3">
                <div className="w-6 h-6 rounded-full grid place-items-center bg-sky-700 text-white text-xs font-bold">{i + 1}</div>
                <div>
                  <div className="font-semibold text-sm">{s.name}</div>
                  {s.description && <div className="text-xs text-gray-600">{s.description}</div>}
                  <div className="text-xs text-gray-500">Status: {s.status}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {dialogOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDialogOpen(false)} />
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-lg shadow-lg">
            <div className="px-4 py-3 border-b font-semibold">{selectedEntity}</div>
            <div className="p-4 text-sm">Details for {selectedEntity} would appear here.</div>
            <div className="px-4 py-3 border-t flex justify-end">
              <button onClick={() => setDialogOpen(false)} className="px-3 py-1.5 rounded-md bg-sky-600 text-white">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
