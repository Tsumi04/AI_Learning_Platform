import { useState, useEffect, useRef, useCallback } from 'react';
import { Network, Loader2, RotateCcw, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { aiAPI } from '../../services/api';

/**
 * KnowledgeGraphView — Force-Directed Graph Visualization
 * 100% tự build, không dùng D3.js
 * Canvas-based rendering with physics simulation
 */
export default function KnowledgeGraphView({ documentId }) {
  const canvasRef = useRef(null);
  const [graphData, setGraphData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [started, setStarted] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);
  const [zoom, setZoom] = useState(1);
  const nodesRef = useRef([]);
  const edgesRef = useRef([]);
  const animFrameRef = useRef(null);
  const dragRef = useRef({ isDragging: false, nodeIndex: -1, offsetX: 0, offsetY: 0 });
  const panRef = useRef({ x: 0, y: 0, isPanning: false, startX: 0, startY: 0 });

  const loadGraph = async () => {
    try {
      setIsLoading(true); setError(''); setStarted(true);
      const data = await aiAPI.getKnowledgeGraph(documentId);
      if (data.graph && data.graph.nodes?.length > 0) {
        setGraphData(data.graph);
        initializeNodes(data.graph);
      } else {
        setError('No concepts found. Process the document first.');
      }
    } catch (err) {
      setError(err.message || 'Failed to build knowledge graph. Ensure AI server is running.');
    } finally {
      setIsLoading(false);
    }
  };

  const initializeNodes = (graph) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const W = canvas.width, H = canvas.height;
    const cx = W / 2, cy = H / 2;

    // Position nodes in a circle initially
    const nodes = graph.nodes.map((n, i) => {
      const angle = (2 * Math.PI * i) / graph.nodes.length;
      const r = Math.min(W, H) * 0.3;
      return {
        ...n,
        x: cx + r * Math.cos(angle) + (Math.random() - 0.5) * 40,
        y: cy + r * Math.sin(angle) + (Math.random() - 0.5) * 40,
        vx: 0, vy: 0,
        radius: Math.max(18, Math.min(35, 12 + (n.centrality_score || 0) * 60)),
      };
    });

    const edges = (graph.edges || []).map(e => ({
      ...e,
      sourceIdx: nodes.findIndex(n => n.concept === e.source),
      targetIdx: nodes.findIndex(n => n.concept === e.target),
    })).filter(e => e.sourceIdx >= 0 && e.targetIdx >= 0);

    nodesRef.current = nodes;
    edgesRef.current = edges;
    startSimulation();
  };

  // Force-directed layout simulation
  const startSimulation = () => {
    let iteration = 0;
    const maxIterations = 300;

    const simulate = () => {
      const nodes = nodesRef.current;
      const edges = edgesRef.current;
      if (!nodes.length) return;

      const canvas = canvasRef.current;
      if (!canvas) return;
      const W = canvas.width, H = canvas.height;

      // Damping factor (reduces over time for stability)
      const damping = Math.max(0.1, 1 - iteration / maxIterations);
      const repulsion = 8000 * damping;
      const attraction = 0.005;
      const centerPull = 0.01;

      // Repulsive forces between all node pairs
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[j].x - nodes[i].x;
          const dy = nodes[j].y - nodes[i].y;
          const dist = Math.max(1, Math.sqrt(dx * dx + dy * dy));
          const force = repulsion / (dist * dist);
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;
          nodes[i].vx -= fx; nodes[i].vy -= fy;
          nodes[j].vx += fx; nodes[j].vy += fy;
        }
      }

      // Attractive forces along edges
      for (const edge of edges) {
        const a = nodes[edge.sourceIdx], b = nodes[edge.targetIdx];
        if (!a || !b) continue;
        const dx = b.x - a.x, dy = b.y - a.y;
        const dist = Math.max(1, Math.sqrt(dx * dx + dy * dy));
        const idealDist = 120;
        const force = (dist - idealDist) * attraction;
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        a.vx += fx; a.vy += fy;
        b.vx -= fx; b.vy -= fy;
      }

      // Center gravity
      for (const node of nodes) {
        node.vx += (W / 2 - node.x) * centerPull;
        node.vy += (H / 2 - node.y) * centerPull;
      }

      // Apply velocity
      for (const node of nodes) {
        node.vx *= 0.85; node.vy *= 0.85;
        if (dragRef.current.isDragging && nodes.indexOf(node) === dragRef.current.nodeIndex) continue;
        node.x += node.vx;
        node.y += node.vy;
        node.x = Math.max(40, Math.min(W - 40, node.x));
        node.y = Math.max(40, Math.min(H - 40, node.y));
      }

      render();
      iteration++;
      if (iteration < maxIterations) {
        animFrameRef.current = requestAnimationFrame(simulate);
      }
    };

    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    simulate();
  };

  // Colors palette for nodes
  const nodeColors = [
    '#6366f1', '#8b5cf6', '#a78bfa', '#10b981', '#14b8a6',
    '#f59e0b', '#ef4444', '#ec4899', '#3b82f6', '#06b6d4',
  ];

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    const nodes = nodesRef.current;
    const edges = edgesRef.current;

    ctx.clearRect(0, 0, W, H);
    ctx.save();
    ctx.translate(panRef.current.x, panRef.current.y);
    ctx.scale(zoom, zoom);

    // Draw edges
    for (const edge of edges) {
      const a = nodes[edge.sourceIdx], b = nodes[edge.targetIdx];
      if (!a || !b) continue;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.strokeStyle = `rgba(99, 102, 241, ${0.1 + (edge.weight || 0.5) * 0.2})`;
      ctx.lineWidth = 1 + (edge.weight || 0.5);
      ctx.stroke();
    }

    // Draw nodes
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      const color = nodeColors[i % nodeColors.length];
      const isSelected = selectedNode === i;

      // Glow
      if (isSelected) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius + 8, 0, Math.PI * 2);
        ctx.fillStyle = `${color}22`;
        ctx.fill();
      }

      // Node circle
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
      const gradient = ctx.createRadialGradient(node.x - node.radius * 0.3, node.y - node.radius * 0.3, 0, node.x, node.y, node.radius);
      gradient.addColorStop(0, color);
      gradient.addColorStop(1, `${color}cc`);
      ctx.fillStyle = gradient;
      ctx.fill();

      // Border
      ctx.strokeStyle = isSelected ? '#fff' : `${color}66`;
      ctx.lineWidth = isSelected ? 3 : 1;
      ctx.stroke();

      // Shadow
      ctx.shadowColor = color;
      ctx.shadowBlur = isSelected ? 16 : 6;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 2;

      // Label
      ctx.shadowBlur = 0;
      const label = node.concept.length > 12 ? node.concept.slice(0, 11) + '…' : node.concept;
      ctx.font = `${isSelected ? '600' : '500'} ${Math.max(9, node.radius * 0.55)}px Inter, sans-serif`;
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, node.x, node.y);
    }

    ctx.restore();
  }, [zoom, selectedNode]);

  // Mouse interaction handlers
  const getMousePos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left - panRef.current.x) / zoom,
      y: (e.clientY - rect.top - panRef.current.y) / zoom,
    };
  };

  const findNodeAt = (mx, my) => {
    const nodes = nodesRef.current;
    for (let i = nodes.length - 1; i >= 0; i--) {
      const dx = mx - nodes[i].x, dy = my - nodes[i].y;
      if (dx * dx + dy * dy < nodes[i].radius * nodes[i].radius) return i;
    }
    return -1;
  };

  const handleMouseDown = (e) => {
    const { x, y } = getMousePos(e);
    const idx = findNodeAt(x, y);
    if (idx >= 0) {
      dragRef.current = { isDragging: true, nodeIndex: idx, offsetX: x - nodesRef.current[idx].x, offsetY: y - nodesRef.current[idx].y };
      setSelectedNode(idx);
    } else {
      panRef.current.isPanning = true;
      panRef.current.startX = e.clientX - panRef.current.x;
      panRef.current.startY = e.clientY - panRef.current.y;
      setSelectedNode(null);
    }
  };

  const handleMouseMove = (e) => {
    if (dragRef.current.isDragging) {
      const { x, y } = getMousePos(e);
      const node = nodesRef.current[dragRef.current.nodeIndex];
      if (node) {
        node.x = x - dragRef.current.offsetX;
        node.y = y - dragRef.current.offsetY;
        node.vx = 0; node.vy = 0;
        render();
      }
    } else if (panRef.current.isPanning) {
      panRef.current.x = e.clientX - panRef.current.startX;
      panRef.current.y = e.clientY - panRef.current.startY;
      render();
    }
  };

  const handleMouseUp = () => {
    dragRef.current.isDragging = false;
    panRef.current.isPanning = false;
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(prev => Math.max(0.3, Math.min(3, prev * delta)));
  };

  useEffect(() => { render(); }, [zoom, selectedNode, render]);

  useEffect(() => {
    return () => { if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current); };
  }, []);

  // Resize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    const resize = () => {
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
      render();
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [render]);

  if (!started) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 'var(--space-xl)', padding: 'var(--space-xl)' }}>
        <div style={{ width: 72, height: 72, borderRadius: 'var(--radius-xl)', background: 'rgba(245,158,11,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Network size={32} style={{ color: '#f59e0b' }} strokeWidth={1.5} />
        </div>
        <div style={{ textAlign: 'center' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--c-text-primary)', marginBottom: 8 }}>Knowledge Graph</h3>
          <p style={{ fontSize: '0.9375rem', color: 'var(--c-text-secondary)', maxWidth: 400 }}>
            Visualize concept relationships extracted from your document. Drag nodes, zoom, and explore how ideas connect.
          </p>
        </div>
        <button className="btn btn-primary btn-lg" onClick={loadGraph}>
          <Network size={18} /> Build Knowledge Graph
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 'var(--space-lg)' }}>
        <Loader2 size={32} style={{ color: 'var(--c-accent)', animation: 'rotate-slow 1s linear infinite' }} />
        <div style={{ fontSize: '0.9375rem', color: 'var(--c-text-secondary)' }}>Building knowledge graph...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 'var(--space-lg)' }}>
        <div style={{ color: 'var(--c-error)', fontSize: '0.9375rem' }}>{error}</div>
        <button className="btn btn-ghost" onClick={() => { setStarted(false); setError(''); }}><RotateCcw size={16} /> Try Again</button>
      </div>
    );
  }

  const selectedNodeData = selectedNode !== null ? nodesRef.current[selectedNode] : null;

  return (
    <div style={{ display: 'flex', height: '100%', position: 'relative' }}>
      {/* Canvas */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <canvas ref={canvasRef} style={{ display: 'block', cursor: dragRef.current.isDragging ? 'grabbing' : 'grab' }}
          onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp} onWheel={handleWheel} />

        {/* Zoom Controls */}
        <div style={{ position: 'absolute', bottom: 16, right: 16, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <button onClick={() => setZoom(z => Math.min(3, z * 1.2))} style={{ width: 36, height: 36, borderRadius: 'var(--radius-md)', background: 'white', border: '1px solid var(--c-border)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-md)' }}>
            <ZoomIn size={16} />
          </button>
          <button onClick={() => setZoom(z => Math.max(0.3, z * 0.8))} style={{ width: 36, height: 36, borderRadius: 'var(--radius-md)', background: 'white', border: '1px solid var(--c-border)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-md)' }}>
            <ZoomOut size={16} />
          </button>
          <button onClick={() => { setZoom(1); panRef.current.x = 0; panRef.current.y = 0; render(); }} style={{ width: 36, height: 36, borderRadius: 'var(--radius-md)', background: 'white', border: '1px solid var(--c-border)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-md)' }}>
            <Maximize2 size={16} />
          </button>
        </div>

        {/* Stats overlay */}
        <div style={{ position: 'absolute', top: 16, left: 16, background: 'rgba(255,255,255,0.9)', borderRadius: 'var(--radius-md)', padding: '0.5rem 0.75rem', fontSize: '0.6875rem', color: 'var(--c-text-secondary)', border: '1px solid var(--c-border)', backdropFilter: 'blur(8px)', boxShadow: 'var(--shadow-sm)' }}>
          <strong>{graphData?.stats?.total_concepts || 0}</strong> concepts · <strong>{graphData?.stats?.total_edges || 0}</strong> connections
        </div>
      </div>

      {/* Side Panel — Selected Node Info */}
      {selectedNodeData && (
        <div className="animate-slide-in-right" style={{ width: 260, borderLeft: '1px solid var(--c-border)', padding: 'var(--space-lg)', overflowY: 'auto', background: 'white' }}>
          <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--c-text-tertiary)', textTransform: 'uppercase', marginBottom: 'var(--space-sm)' }}>Selected Concept</div>
          <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--c-text-primary)', marginBottom: 'var(--space-md)' }}>{selectedNodeData.concept}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
              <span style={{ color: 'var(--c-text-tertiary)' }}>Centrality</span>
              <span style={{ color: 'var(--c-text-primary)', fontWeight: 600 }}>{((selectedNodeData.centrality_score || 0) * 100).toFixed(1)}%</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
              <span style={{ color: 'var(--c-text-tertiary)' }}>Related Chunks</span>
              <span style={{ color: 'var(--c-text-primary)', fontWeight: 600 }}>{selectedNodeData.related_chunk_ids?.length || 0}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
              <span style={{ color: 'var(--c-text-tertiary)' }}>Connections</span>
              <span style={{ color: 'var(--c-text-primary)', fontWeight: 600 }}>
                {edgesRef.current.filter(e => e.sourceIdx === selectedNode || e.targetIdx === selectedNode).length}
              </span>
            </div>
          </div>

          {/* Connected concepts */}
          <div style={{ marginTop: 'var(--space-lg)', fontSize: '0.6875rem', fontWeight: 600, color: 'var(--c-text-tertiary)', textTransform: 'uppercase', marginBottom: 'var(--space-sm)' }}>
            Connected To
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {edgesRef.current
              .filter(e => e.sourceIdx === selectedNode || e.targetIdx === selectedNode)
              .map((e, i) => {
                const otherIdx = e.sourceIdx === selectedNode ? e.targetIdx : e.sourceIdx;
                const other = nodesRef.current[otherIdx];
                return other ? (
                  <span key={i} onClick={() => setSelectedNode(otherIdx)} style={{
                    fontSize: '0.6875rem', padding: '0.25rem 0.5rem',
                    borderRadius: 'var(--radius-full)', background: 'var(--c-accent-glow)',
                    color: 'var(--c-accent)', cursor: 'pointer', fontWeight: 500,
                  }}>
                    {other.concept}
                  </span>
                ) : null;
              })}
          </div>
        </div>
      )}
    </div>
  );
}
