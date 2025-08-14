import React, { useEffect, useMemo, useState } from "react";
import ReactFlow, {
  Background,
  Controls,
  Handle,
  Position,
  useEdgesState,
  useNodesState,
  Node,
  Edge,
  type NodeProps,
} from "reactflow";
import "reactflow/dist/style.css";
import {
  Box,
  CardContent,
  Chip,
  Divider,
  Paper,
  Typography,
  Checkbox,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  Button,
} from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";

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
      <div className="flex items-center gap-1 rounded-2xl bg-gray-900 text-white px-3 py-1 shadow">
        <span className="font-semibold tracking-wide">{data.title}</span>
        <MoreVertIcon fontSize="small" />
      </div>
    </div>
    <div className="h-full w-full rounded-3xl border-2 border-dotted border-gray-300 p-6 bg-transparent" />
  </div>
);

const SectionHeaderNode: React.FC<NodeProps<{ text: string; variant?: string }>> = ({ data }) => (
  <div className="pointer-events-none select-none">
    <Typography variant={(data.variant as any) || "h6"} className="!font-semibold !text-gray-900">
      {data.text}
    </Typography>
  </div>
);

const StageCardNode: React.FC<NodeProps<{ title: string; body?: string; index?: number }>> = ({ data }) => (
  <Paper elevation={0} className="border border-gray-500 bg-[#e8f7e8] w-[360px]">
    <CardContent className="p-3">
      <div className="flex items-center gap-2 mb-1">
        {typeof data.index === "number" && (
          <div className="w-6 h-6 rounded-full grid place-items-center bg-green-600 text-white text-xs font-bold">{data.index + 1}</div>
        )}
        <Typography variant="subtitle2" className="!font-bold">
          {data.title}
        </Typography>
      </div>
      {data.body && (
        <Typography variant="body2" className="!leading-snug text-gray-800">
          {data.body}
        </Typography>
      )}
    </CardContent>
    <Handle id="left" type="target" position={Position.Left} />
    <Handle id="right" type="source" position={Position.Right} />
  </Paper>
);

const EventNode: React.FC<NodeProps<{ label: string }>> = ({ data }) => (
  <div className="w-[110px] h-[110px] rounded-full border border-gray-600 bg-white grid place-items-center">
    <Typography variant="body1" className="whitespace-pre-line text-center !text-gray-800">
      {data.label}
    </Typography>
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
    <MoreVertIcon fontSize="small" className="text-gray-600" />
  </button>
);

const ToggleNode: React.FC<NodeProps<{ expanded: boolean; onToggle: () => void }>> = ({ data }) => (
  <button onClick={data.onToggle} className="flex items-center gap-2 text-sky-700">
    {data.expanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
    <span className="underline">See Data Entities</span>
  </button>
);

const nodeTypes = { app: AppFrameNode, section: SectionHeaderNode, stage: StageCardNode, event: EventNode, tag: DataEntityTagNode, toggle: ToggleNode };

function buildGraph(data: WorkflowData, expanded: boolean, selectedEntity: string | null, onEntityClick: (label: string) => void, onToggle: () => void) {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const frameWidth = Math.max(1040, 160 + data.steps.length * (360 + 140));
  const frameHeight = 720;

  nodes.push({ id: "app", type: "app", position: { x: 40, y: 40 }, data: { title: data.appTitle }, style: { width: frameWidth, height: frameHeight }, draggable: false });
  nodes.push({ id: "title", type: "section", position: { x: 80, y: 70 }, data: { text: data.workflowTitle, variant: "h5" }, parentNode: "app", extent: "parent", draggable: false });

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

  const [nodes, setNodes, onNodesChange] = useNodesState<Node[]>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge[]>([]);

  useEffect(() => { setNodes(graph.nodes); setEdges(graph.edges); }, [graph, setNodes, setEdges]);

  useEffect(() => { if (!wfList.find(w => w.id === currentId)) setCurrentId(wfList[0].id); }, [wfList, currentId]);

  return (
    <div className="w-full h-screen bg-gray-50">
      <div className="flex items-center justify-between px-6 py-3 border-b bg-white">
        <div className="flex items-center gap-3">
          <span className="text-sky-700 font-bold">EBM Studio</span>
          <Divider orientation="vertical" flexItem className="!mx-2" />
          <div className="text-gray-600">{current.appTitle} ▾</div>
        </div>
        <div className="text-sm text-gray-500">Single Views + Search</div>
      </div>
      <div className="grid grid-cols-[1fr_320px] h-[calc(100vh-52px)]">
        <div className="relative">
          <ReactFlow nodes={nodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} nodeTypes={nodeTypes} fitView proOptions={{ hideAttribution: true }}>
            <Background />
            <Controls position="bottom-left" />
          </ReactFlow>
        </div>
        <div className="border-l bg-white p-4 overflow-y-auto">
          <Typography variant="subtitle1" className="!mb-3 !font-semibold">Customize View</Typography>
          <Paper variant="outlined" className="p-3 mb-6">
            <FormControlLabel control={<Checkbox checked={expanded} onChange={() => setExpanded(e => !e)} />} label="Expand all data entities" />
            <Divider className="!my-3" />
            <Typography variant="caption" className="!text-gray-600 !uppercase">Legend</Typography>
            <Box className="mt-2 space-y-2">
              <Chip label="Application" size="small" />
              <Chip label="Workflow" size="small" />
              <Chip label="Business Event" size="small" />
              <Chip label="Data Entity" size="small" />
            </Box>
          </Paper>
          <Typography variant="subtitle1" className="!mb-3 !font-semibold">Other Workflows</Typography>
          <div className="space-y-2">
            {wfList.map(w => (
              <Paper key={w.id} onClick={() => setCurrentId(w.id)} variant="outlined" className={`p-3 flex items-center justify-between hover:shadow-sm cursor-pointer ${current.id === w.id ? "ring-2 ring-sky-600" : ""}`}>
                <span className="text-gray-800">{w.appTitle} — {w.workflowTitle}</span>
                <div className="w-6 h-6 grid place-items-center rounded-full bg-yellow-400 font-semibold">M</div>
              </Paper>
            ))}
          </div>
          <Typography variant="subtitle1" className="!mt-6 !mb-2 !font-semibold">Event Explorer</Typography>
          <div className="space-y-2">
            {current.steps.map((s, i) => (
              <Paper key={i} variant="outlined" className="p-2 flex items-start gap-3">
                <div className="w-6 h-6 rounded-full grid place-items-center bg-sky-700 text-white text-xs font-bold">{i + 1}</div>
                <div>
                  <div className="font-semibold text-sm">{s.name}</div>
                  {s.description && <div className="text-xs text-gray-600">{s.description}</div>}
                  <div className="text-xs text-gray-500">Status: {s.status}</div>
                </div>
              </Paper>
            ))}
          </div>
        </div>
      </div>
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{selectedEntity}</DialogTitle>
        <DialogContent>
          <Typography variant="body2">Details for {selectedEntity} would appear here.</Typography>
          <Box className="mt-4 flex justify-end">
            <Button onClick={() => setDialogOpen(false)} variant="contained">Close</Button>
          </Box>
        </DialogContent>
      </Dialog>
    </div>
  );
}
