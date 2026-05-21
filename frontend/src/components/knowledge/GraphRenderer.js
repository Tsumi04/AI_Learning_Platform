/**
 * GraphRenderer — Canvas rendering engine cho Knowledge Graph
 * High-DPI support, Level of Detail, particle effects, edge arrows
 * Mastery color-coding: đỏ → cam → vàng → xanh lá
 */

// ── Mastery Color Scale ──
const MASTERY_COLORS = [
  { threshold: 0.0, color: [239, 68, 68] },   // Red — chưa học
  { threshold: 0.25, color: [249, 115, 22] },  // Orange — mới bắt đầu
  { threshold: 0.5, color: [245, 158, 11] },   // Amber — đang học
  { threshold: 0.75, color: [34, 197, 94] },   // Green — khá
  { threshold: 1.0, color: [16, 185, 129] },   // Emerald — master
];

function getMasteryColor(mastery = 0) {
  const m = Math.max(0, Math.min(1, mastery));
  for (let i = MASTERY_COLORS.length - 1; i >= 0; i--) {
    if (m >= MASTERY_COLORS[i].threshold) {
      const c = MASTERY_COLORS[i].color;
      return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
    }
  }
  return 'rgb(107, 107, 128)'; // fallback gray
}

function getMasteryColorAlpha(mastery = 0, alpha = 1) {
  const m = Math.max(0, Math.min(1, mastery));
  for (let i = MASTERY_COLORS.length - 1; i >= 0; i--) {
    if (m >= MASTERY_COLORS[i].threshold) {
      const c = MASTERY_COLORS[i].color;
      return `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${alpha})`;
    }
  }
  return `rgba(107, 107, 128, ${alpha})`;
}

// ── Fallback colors khi không có mastery data ──
const NODE_PALETTE = [
  '#6366f1', '#8b5cf6', '#a78bfa', '#10b981', '#14b8a6',
  '#f59e0b', '#ec4899', '#3b82f6', '#06b6d4', '#f97316',
];

// ── Particle System ──
class ParticleSystem {
  constructor() {
    this.particles = [];
    this.lastSpawn = 0;
  }

  spawn(edges, nodes, now) {
    if (now - this.lastSpawn < 120) return; // spawn mỗi 120ms
    this.lastSpawn = now;

    if (edges.length === 0) return;
    const edge = edges[Math.floor(Math.random() * edges.length)];
    const a = nodes[edge.sourceIdx], b = nodes[edge.targetIdx];
    if (!a || !b) return;

    this.particles.push({
      x: a.x, y: a.y,
      tx: b.x, ty: b.y,
      progress: 0,
      speed: 0.008 + Math.random() * 0.006,
      sourceIdx: edge.sourceIdx,
      targetIdx: edge.targetIdx,
    });

    // Limit max particles
    if (this.particles.length > 30) this.particles.shift();
  }

  update(nodes) {
    this.particles = this.particles.filter(p => {
      const a = nodes[p.sourceIdx], b = nodes[p.targetIdx];
      if (!a || !b) return false;
      p.tx = b.x; p.ty = b.y;
      p.x = a.x + (p.tx - a.x) * p.progress;
      p.y = a.y + (p.ty - a.y) * p.progress;
      p.progress += p.speed;
      return p.progress < 1;
    });
  }
}

/**
 * GraphRenderer class
 */
export default class GraphRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.dpr = window.devicePixelRatio || 1;
    this.particles = new ParticleSystem();
    this.hoveredNode = -1;
    this.selectedNode = -1;
    this.hasMasteryData = false;
  }

  /** Resize canvas with High-DPI support */
  resize(width, height) {
    this.dpr = window.devicePixelRatio || 1;
    this.canvas.width = width * this.dpr;
    this.canvas.height = height * this.dpr;
    this.canvas.style.width = width + 'px';
    this.canvas.style.height = height + 'px';
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  /** Main render call */
  render(nodes, edges, zoom, panX, panY) {
    const ctx = this.ctx;
    const w = this.canvas.width / this.dpr;
    const h = this.canvas.height / this.dpr;

    // Check if any node has mastery data
    this.hasMasteryData = nodes.some(n => n.mastery !== undefined && n.mastery !== null);

    ctx.clearRect(0, 0, w, h);
    ctx.save();
    ctx.translate(panX, panY);
    ctx.scale(zoom, zoom);

    const showLabels = zoom > 0.4;
    const showDetails = zoom > 0.7;

    // Update and draw particles
    const now = performance.now();
    this.particles.spawn(edges, nodes, now);
    this.particles.update(nodes);

    // ── Draw edges ──
    this._drawEdges(ctx, nodes, edges, zoom, showDetails);

    // ── Draw particles ──
    this._drawParticles(ctx);

    // ── Draw nodes ──
    this._drawNodes(ctx, nodes, zoom, showLabels, showDetails);

    // ── Draw hover tooltip ──
    if (this.hoveredNode >= 0 && this.hoveredNode < nodes.length && this.hoveredNode !== this.selectedNode) {
      this._drawTooltip(ctx, nodes[this.hoveredNode], nodes, edges);
    }

    ctx.restore();
  }

  _drawEdges(ctx, nodes, edges, zoom, showDetails) {
    for (const edge of edges) {
      const a = nodes[edge.sourceIdx], b = nodes[edge.targetIdx];
      if (!a || !b) continue;

      const isHighlighted = this.selectedNode >= 0 &&
        (edge.sourceIdx === this.selectedNode || edge.targetIdx === this.selectedNode);
      const isDimmed = this.selectedNode >= 0 && !isHighlighted;

      const weight = edge.weight || 0.5;
      let alpha = isDimmed ? 0.04 : (0.12 + weight * 0.18);
      if (isHighlighted) alpha = 0.6;

      const lineWidth = isDimmed ? 0.5 : (1 + weight * 1.5);

      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.strokeStyle = isHighlighted
        ? `rgba(129, 140, 248, ${alpha})`
        : `rgba(148, 163, 184, ${alpha})`;
      ctx.lineWidth = lineWidth;
      ctx.stroke();

      // Arrow at target end
      if (showDetails && !isDimmed) {
        this._drawArrow(ctx, a, b, lineWidth, alpha, isHighlighted);
      }

      // Edge label (relation type)
      if (showDetails && !isDimmed && edge.relation && zoom > 1.0) {
        const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
        ctx.font = '500 9px Inter, sans-serif';
        ctx.fillStyle = `rgba(148, 163, 184, ${alpha * 0.8})`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(edge.relation, mx, my - 6);
      }
    }
  }

  _drawArrow(ctx, a, b, lineWidth, alpha, isHighlighted) {
    const dx = b.x - a.x, dy = b.y - a.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 1) return;

    const targetRadius = b.radius || 20;
    const arrowLen = 8 + lineWidth;
    const ratio = (dist - targetRadius - 2) / dist;
    const tipX = a.x + dx * ratio;
    const tipY = a.y + dy * ratio;

    const angle = Math.atan2(dy, dx);
    const spread = 0.4;

    ctx.beginPath();
    ctx.moveTo(tipX, tipY);
    ctx.lineTo(tipX - arrowLen * Math.cos(angle - spread), tipY - arrowLen * Math.sin(angle - spread));
    ctx.lineTo(tipX - arrowLen * Math.cos(angle + spread), tipY - arrowLen * Math.sin(angle + spread));
    ctx.closePath();
    ctx.fillStyle = isHighlighted
      ? `rgba(129, 140, 248, ${alpha})`
      : `rgba(148, 163, 184, ${alpha})`;
    ctx.fill();
  }

  _drawParticles(ctx) {
    for (const p of this.particles.particles) {
      const alpha = 1 - p.progress; // fade out
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(129, 140, 248, ${alpha * 0.7})`;
      ctx.fill();
      // glow
      ctx.beginPath();
      ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(129, 140, 248, ${alpha * 0.15})`;
      ctx.fill();
    }
  }

  _drawNodes(ctx, nodes, zoom, showLabels, showDetails) {
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      const isSelected = i === this.selectedNode;
      const isHovered = i === this.hoveredNode;
      const isNeighbor = this._isNeighborOfSelected(i, nodes);
      const isDimmed = this.selectedNode >= 0 && !isSelected && !isNeighbor;

      // Determine color
      let color;
      if (this.hasMasteryData) {
        color = getMasteryColor(node.mastery || 0);
      } else {
        color = NODE_PALETTE[i % NODE_PALETTE.length];
      }

      const r = node.radius;
      const alpha = isDimmed ? 0.15 : 1;

      // ── Outer glow for selected/hovered ──
      if ((isSelected || isHovered) && !isDimmed) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, r + 12, 0, Math.PI * 2);
        const glowColor = this.hasMasteryData
          ? getMasteryColorAlpha(node.mastery || 0, 0.12)
          : `${color}18`;
        ctx.fillStyle = glowColor;
        ctx.fill();
      }

      // ── Node circle with gradient ──
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(node.x, node.y, r, 0, Math.PI * 2);

      const grad = ctx.createRadialGradient(
        node.x - r * 0.3, node.y - r * 0.3, 0,
        node.x, node.y, r
      );
      grad.addColorStop(0, color);
      grad.addColorStop(1, this.hasMasteryData
        ? getMasteryColorAlpha(node.mastery || 0, 0.8)
        : `${color}cc`
      );
      ctx.fillStyle = grad;
      ctx.fill();

      // Border
      ctx.strokeStyle = isSelected ? '#fff' : (isHovered ? '#e2e8f0' : `${color}44`);
      ctx.lineWidth = isSelected ? 2.5 : (isHovered ? 2 : 1);
      ctx.stroke();
      ctx.restore();

      // ── Label ──
      if (showLabels && !isDimmed) {
        const maxLen = showDetails ? 18 : 10;
        const label = node.concept.length > maxLen
          ? node.concept.slice(0, maxLen - 1) + '…'
          : node.concept;
        const fontSize = Math.max(9, Math.min(13, r * 0.5));
        ctx.font = `${isSelected ? '700' : '500'} ${fontSize}px Inter, sans-serif`;
        ctx.fillStyle = isDimmed ? 'rgba(241,241,244,0.3)' : '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, node.x, node.y);
      }

      // ── Mastery badge (small circle below node) ──
      if (showDetails && this.hasMasteryData && !isDimmed) {
        const mastery = node.mastery || 0;
        const badgeR = 6;
        const badgeY = node.y + r + badgeR + 4;
        ctx.beginPath();
        ctx.arc(node.x, badgeY, badgeR, 0, Math.PI * 2);
        ctx.fillStyle = getMasteryColorAlpha(mastery, 0.9);
        ctx.fill();
        ctx.font = '600 7px Inter, sans-serif';
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(Math.round(mastery * 100), node.x, badgeY);
      }
    }
  }

  _drawTooltip(ctx, node, nodes, edges) {
    const x = node.x + node.radius + 12;
    const y = node.y - 20;
    const padding = 10;
    const lines = [
      node.concept,
      `Centrality: ${((node.centrality_score || 0) * 100).toFixed(1)}%`,
      `Connections: ${node.degree || 0}`,
    ];
    if (this.hasMasteryData) {
      lines.push(`Mastery: ${Math.round((node.mastery || 0) * 100)}%`);
    }

    ctx.font = '500 11px Inter, sans-serif';
    const maxWidth = Math.max(...lines.map(l => ctx.measureText(l).width));
    const w = maxWidth + padding * 2;
    const h = lines.length * 16 + padding * 2;

    // Background
    ctx.fillStyle = 'rgba(13, 13, 20, 0.92)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    this._roundRect(ctx, x, y, w, h, 8);
    ctx.fill();
    ctx.stroke();

    // Text
    ctx.fillStyle = '#f1f1f4';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    lines.forEach((line, i) => {
      ctx.font = i === 0 ? '600 11px Inter, sans-serif' : '400 10px Inter, sans-serif';
      ctx.fillStyle = i === 0 ? '#f1f1f4' : '#a1a1b5';
      ctx.fillText(line, x + padding, y + padding + i * 16);
    });
  }

  _roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
  }

  _isNeighborOfSelected(nodeIdx, nodes) {
    if (this.selectedNode < 0) return false;
    // This is checked by the component passing neighbor info
    return nodes[nodeIdx]?._isNeighbor || false;
  }

  /** Hit test — find node at given position */
  findNodeAt(nodes, mx, my) {
    for (let i = nodes.length - 1; i >= 0; i--) {
      const dx = mx - nodes[i].x, dy = my - nodes[i].y;
      if (dx * dx + dy * dy < nodes[i].radius * nodes[i].radius) return i;
    }
    return -1;
  }
}

export { getMasteryColor, getMasteryColorAlpha, NODE_PALETTE };
