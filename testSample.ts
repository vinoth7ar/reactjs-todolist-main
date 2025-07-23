import ReactFlow, { Background } from 'react-flow-renderer';

const nodes = [
  {
    id: '1',
    data: { label: <strong>Stage</strong> },
    position: { x: 100, y: 50 },
    style: {
      padding: 10,
      border: '1px solid #555',
      borderRadius: 4,
      background: '#fff',
      width: 200,
      textAlign: 'center',
    },
  },
  {
    id: '2',
    data: { label: <strong>Enrich</strong> },
    position: { x: 400, y: 50 },
    style: {
      padding: 10,
      border: '1px solid #555',
      borderRadius: 4,
      background: '#fff',
      width: 200,
      textAlign: 'center',
    },
  },
  {
    id: '3',
    data: { label: 'staged' },
    position: { x: 250, y: 100 },
    style: {
      padding: 6,
      border: '1px dashed #999',
      borderRadius: 15,
      background: '#f0f0f0',
      width: 70,
      textAlign: 'center',
    },
    draggable: false,
  },
  {
    id: '4',
    data: { label: 'position created' },
    position: { x: 450, y: 100 },
    style: {
      padding: 6,
      border: '1px dashed #999',
      borderRadius: 15,
      background: '#f0f0f0',
      width: 110,
      textAlign: 'center',
    },
    draggable: false,
  },
  {
    id: '5',
    data: { label: '🔶 Hypo Loan Position → Loan Commitment' },
    position: { x: 100, y: 200 },
    style: {
      padding: 8,
      border: '1px solid #999',
      background: '#fff8e1',
      borderRadius: 4,
    },
    draggable: false,
  },
  {
    id: '6',
    data: { label: '🔶 Hypo Loan Base Price' },
    position: { x: 100, y: 250 },
    style: {
      padding: 8,
      border: '1px solid #999',
      background: '#fff8e1',
      borderRadius: 4,
    },
    draggable: false,
  },
];

const edges = [
  { id: 'e1-3', source: '1', target: '3', animated: true },
  { id: 'e3-2', source: '3', target: '2', animated: true },
  { id: 'e2-4', source: '2', target: '4', animated: true },
];

const HypoLoanDiagram = () => {
  return (
    <div style={{ width: '100%', height: 500 }}>
      <ReactFlow nodes={nodes} edges={edges} fitView>
        <Background />
      </ReactFlow>
    </div>
  );
};

export default HypoLoanDiagram;
