/**
 * ForceEngine — Self-built Force-Directed Layout Engine
 * Barnes-Hut approximation (O(n log n)) cho performance tốt hơn O(n²)
 * Adaptive cooling, velocity verlet integration
 * 100% tự viết, không dùng D3.js
 */

// ── Quadtree cho Barnes-Hut ──
class QuadTreeNode {
  constructor(x, y, w, h) {
    this.x = x; this.y = y; this.w = w; this.h = h;
    this.body = null; // single node stored here
    this.mass = 0; this.cx = 0; this.cy = 0; // center of mass
    this.children = null; // [NW, NE, SW, SE]
  }

  insert(node) {
    if (this.mass === 0 && !this.body) {
      this.body = node;
      this.mass = 1;
      this.cx = node.x;
      this.cy = node.y;
      return;
    }

    if (!this.children) {
      this._subdivide();
      if (this.body) {
        this._insertChild(this.body);
        this.body = null;
      }
    }

    this._insertChild(node);
    // Update center of mass
    const newMass = this.mass + 1;
    this.cx = (this.cx * this.mass + node.x) / newMass;
    this.cy = (this.cy * this.mass + node.y) / newMass;
    this.mass = newMass;
  }

  _subdivide() {
    const hw = this.w / 2, hh = this.h / 2;
    this.children = [
      new QuadTreeNode(this.x, this.y, hw, hh),           // NW
      new QuadTreeNode(this.x + hw, this.y, hw, hh),      // NE
      new QuadTreeNode(this.x, this.y + hh, hw, hh),      // SW
      new QuadTreeNode(this.x + hw, this.y + hh, hw, hh), // SE
    ];
  }

  _insertChild(node) {
    const mx = this.x + this.w / 2, my = this.y + this.h / 2;
    const idx = (node.x < mx ? 0 : 1) + (node.y < my ? 0 : 2);
    this.children[idx].insert(node);
  }

  /**
   * Barnes-Hut force calculation
   * theta = 0.8 (threshold — lower = more accurate but slower)
   */
  computeForce(node, theta, repulsion) {
    if (this.mass === 0) return { fx: 0, fy: 0 };

    const dx = this.cx - node.x;
    const dy = this.cy - node.y;
    const distSq = dx * dx + dy * dy + 1; // +1 to avoid division by zero
    const dist = Math.sqrt(distSq);

    // If this cell is far enough, treat as single body
    if (this.children === null || (this.w / dist) < theta) {
      if (this.body === node) return { fx: 0, fy: 0 };
      const force = -repulsion * this.mass / distSq;
      return { fx: (dx / dist) * force, fy: (dy / dist) * force };
    }

    // Otherwise recurse into children
    let fx = 0, fy = 0;
    for (const child of this.children) {
      const f = child.computeForce(node, theta, repulsion);
      fx += f.fx;
      fy += f.fy;
    }
    return { fx, fy };
  }
}

/**
 * ForceEngine class — manages physics simulation
 */
export default class ForceEngine {
  constructor(options = {}) {
    this.repulsion = options.repulsion || 6000;
    this.attraction = options.attraction || 0.008;
    this.centerPull = options.centerPull || 0.012;
    this.damping = options.damping || 0.88;
    this.idealEdgeLength = options.idealEdgeLength || 140;
    this.theta = options.theta || 0.8; // Barnes-Hut threshold
    this.maxVelocity = options.maxVelocity || 15;

    this.alpha = 1.0; // cooling factor
    this.alphaDecay = options.alphaDecay || 0.003;
    this.alphaMin = 0.005;

    this.nodes = [];
    this.edges = [];
    this.width = 800;
    this.height = 600;
    this.running = false;
  }

  setSize(w, h) {
    this.width = w;
    this.height = h;
  }

  setGraph(nodes, edges) {
    const cx = this.width / 2, cy = this.height / 2;

    this.nodes = nodes.map((n, i) => {
      const angle = (2 * Math.PI * i) / Math.max(nodes.length, 1);
      const r = Math.min(this.width, this.height) * 0.3;
      return {
        ...n,
        x: cx + r * Math.cos(angle) + (Math.random() - 0.5) * 50,
        y: cy + r * Math.sin(angle) + (Math.random() - 0.5) * 50,
        vx: 0, vy: 0,
        radius: Math.max(20, Math.min(40, 14 + (n.centrality_score || 0) * 65)),
        degree: 0,
      };
    });

    this.edges = edges.map(e => ({
      ...e,
      sourceIdx: this.nodes.findIndex(n => n.concept === e.source),
      targetIdx: this.nodes.findIndex(n => n.concept === e.target),
    })).filter(e => e.sourceIdx >= 0 && e.targetIdx >= 0);

    // Calculate degree for each node
    for (const edge of this.edges) {
      this.nodes[edge.sourceIdx].degree = (this.nodes[edge.sourceIdx].degree || 0) + 1;
      this.nodes[edge.targetIdx].degree = (this.nodes[edge.targetIdx].degree || 0) + 1;
    }

    this.alpha = 1.0;
  }

  /** Reheat simulation (e.g., after drag) */
  reheat(amount = 0.3) {
    this.alpha = Math.min(1.0, this.alpha + amount);
  }

  /** Single simulation tick — returns true if still active */
  tick(pinnedNodeIndex = -1) {
    if (this.alpha < this.alphaMin) return false;

    const nodes = this.nodes;
    const edges = this.edges;
    if (!nodes.length) return false;

    const W = this.width, H = this.height;
    const effectiveRepulsion = this.repulsion * this.alpha;

    // ── Build Quadtree ──
    const qt = new QuadTreeNode(0, 0, W, H);
    for (const node of nodes) qt.insert(node);

    // ── Repulsive forces (Barnes-Hut) ──
    for (const node of nodes) {
      const f = qt.computeForce(node, this.theta, effectiveRepulsion);
      node.vx += f.fx;
      node.vy += f.fy;
    }

    // ── Attractive forces along edges ──
    for (const edge of edges) {
      const a = nodes[edge.sourceIdx], b = nodes[edge.targetIdx];
      if (!a || !b) continue;
      const dx = b.x - a.x, dy = b.y - a.y;
      const dist = Math.max(1, Math.sqrt(dx * dx + dy * dy));
      const force = (dist - this.idealEdgeLength) * this.attraction * this.alpha;
      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;
      a.vx += fx; a.vy += fy;
      b.vx -= fx; b.vy -= fy;
    }

    // ── Center gravity ──
    for (const node of nodes) {
      node.vx += (W / 2 - node.x) * this.centerPull * this.alpha;
      node.vy += (H / 2 - node.y) * this.centerPull * this.alpha;
    }

    // ── Apply velocity (Velocity Verlet) ──
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      if (i === pinnedNodeIndex) { node.vx = 0; node.vy = 0; continue; }

      node.vx *= this.damping;
      node.vy *= this.damping;

      // Clamp velocity
      const speed = Math.sqrt(node.vx * node.vx + node.vy * node.vy);
      if (speed > this.maxVelocity) {
        node.vx = (node.vx / speed) * this.maxVelocity;
        node.vy = (node.vy / speed) * this.maxVelocity;
      }

      node.x += node.vx;
      node.y += node.vy;

      // Boundary constraint (soft)
      const margin = 50;
      node.x = Math.max(margin, Math.min(W - margin, node.x));
      node.y = Math.max(margin, Math.min(H - margin, node.y));
    }

    // ── Cool down ──
    this.alpha = Math.max(this.alphaMin, this.alpha - this.alphaDecay);
    return this.alpha > this.alphaMin;
  }
}
