"""
NEUROVAULT — Knowledge Graph Builder v2 (White-Box)
Xây dựng đồ thị kiến thức từ chunks + concepts.

v2 Improvements:
- Relation extraction (is-a, part-of, related-to, prerequisite)
- PageRank-based node centrality scoring
- Prerequisite detection (topological ordering)
- Definition extraction integration
- Edge weight normalization
- Graph statistics + community detection (basic)
"""

from typing import List, Dict, Tuple, Set, Optional
from knowledge.concept_extractor import ConceptExtractor
import math
import re


class KnowledgeGraphBuilder:
    """
    Build knowledge graph v2:
    - concept nodes with definitions + centrality
    - typed edges (related, is-a, part-of, prerequisite)
    - PageRank scoring
    - prerequisite ordering
    """

    def __init__(self, max_concepts: int = 30):
        self.extractor = ConceptExtractor(max_concepts=max_concepts)

    def build(
        self,
        chunks: List[Dict],
        document_id: str,
        user_id: str,
    ) -> Dict:
        """
        Build knowledge graph from chunks.

        Returns:
            {
                "nodes": [...],
                "edges": [...],
                "stats": {...},
                "prerequisite_order": [...],
            }
        """
        # Extract concepts from full text
        all_texts = [c["text"] for c in chunks]
        full_text = " ".join(all_texts)

        global_concepts = self.extractor.extract(full_text, all_texts)
        concept_names = [c["concept"] for c in global_concepts]

        # Extract definitions
        definitions = self.extractor.extract_definitions(full_text)
        def_map = {d["concept"].lower(): d["definition"] for d in definitions}

        # Map concepts to chunks
        chunk_concepts: Dict[str, List[str]] = {}
        concept_chunks: Dict[str, List[str]] = {}  # Reverse mapping

        for chunk in chunks:
            chunk_id = chunk["chunk_id"]
            text_lower = chunk["text"].lower()
            found = [c for c in concept_names if c in text_lower]
            chunk_concepts[chunk_id] = found

            for c in found:
                if c not in concept_chunks:
                    concept_chunks[c] = []
                concept_chunks[c].append(chunk_id)

        # Build edges with relation types
        edges, edge_map = self._build_edges(
            chunks, chunk_concepts, concept_names
        )

        # Build adjacency list for PageRank
        adjacency = self._build_adjacency(concept_names, edge_map)

        # Compute PageRank
        pagerank = self._pagerank(concept_names, adjacency)

        # Detect prerequisites
        prerequisite_order = self._detect_prerequisites(
            chunks, chunk_concepts, concept_names
        )

        # Build nodes
        nodes = []
        for concept_data in global_concepts:
            name = concept_data["concept"]
            related = concept_chunks.get(name, [])
            pr_score = pagerank.get(name, 0.0)

            # Use PageRank + TF-IDF score for final centrality
            combined_score = 0.6 * pr_score + 0.4 * concept_data["score"]

            nodes.append({
                "user_id": user_id,
                "document_id": document_id,
                "concept": name,
                "definition": def_map.get(name.lower(), ""),
                "related_chunk_ids": related,
                "centrality_score": round(combined_score, 4),
                "pagerank": round(pr_score, 4),
                "tfidf_score": round(concept_data["score"], 4),
                "frequency": concept_data.get("frequency", 0),
            })

        # Sort nodes by centrality
        nodes.sort(key=lambda n: n["centrality_score"], reverse=True)

        return {
            "nodes": nodes,
            "edges": list(edge_map.values()),
            "stats": {
                "total_concepts": len(nodes),
                "total_edges": len(edge_map),
                "chunks_analyzed": len(chunks),
                "definitions_found": len(definitions),
                "avg_centrality": round(
                    sum(n["centrality_score"] for n in nodes) / max(len(nodes), 1),
                    4,
                ),
            },
            "prerequisite_order": prerequisite_order,
        }

    def _build_edges(
        self,
        chunks: List[Dict],
        chunk_concepts: Dict[str, List[str]],
        concept_names: List[str],
    ) -> Tuple[List[Dict], Dict[str, Dict]]:
        """Build edges with typed relations."""
        edges = []

        for chunk in chunks:
            chunk_id = chunk["chunk_id"]
            text = chunk["text"]
            text_lower = text.lower()
            concepts = chunk_concepts.get(chunk_id, [])

            for i in range(len(concepts)):
                for j in range(i + 1, len(concepts)):
                    src, tgt = concepts[i], concepts[j]
                    relation = self._detect_relation(
                        src, tgt, text_lower
                    )
                    edges.append({
                        "source": src,
                        "target": tgt,
                        "relation_type": relation,
                        "weight": 1.0,
                        "evidence_chunk": chunk_id,
                    })

        # Deduplicate and weight edges
        edge_map: Dict[str, Dict] = {}
        for edge in edges:
            key = f"{min(edge['source'], edge['target'])}|{max(edge['source'], edge['target'])}"

            if key in edge_map:
                edge_map[key]["weight"] += 0.15
                edge_map[key]["weight"] = min(edge_map[key]["weight"], 1.0)
                # Upgrade relation if more specific found
                if edge["relation_type"] != "related":
                    edge_map[key]["relation_type"] = edge["relation_type"]
            else:
                edge_map[key] = edge

        return edges, edge_map

    def _detect_relation(
        self, concept_a: str, concept_b: str, text: str
    ) -> str:
        """
        Detect relation type between two concepts based on context patterns.

        Types:
        - "is-a": inheritance/taxonomy
        - "part-of": composition
        - "prerequisite": concept_a needed before concept_b
        - "related": general co-occurrence
        """
        # Pattern matching for relation detection
        a_esc = re.escape(concept_a.lower())
        b_esc = re.escape(concept_b.lower())

        # is-a patterns
        is_a_patterns = [
            rf'{a_esc}\s+(?:is|are)\s+(?:a|an)\s+(?:type|kind|form)\s+of\s+.*{b_esc}',
            rf'{a_esc}\s+(?:là)\s+(?:một|loại|dạng)\s+.*{b_esc}',
            rf'{b_esc}\s+(?:such as|including|like)\s+.*{a_esc}',
            rf'{b_esc}\s+(?:bao gồm|như|ví dụ)\s+.*{a_esc}',
        ]
        for p in is_a_patterns:
            if re.search(p, text, re.IGNORECASE):
                return "is-a"

        # part-of patterns
        part_of_patterns = [
            rf'{a_esc}\s+(?:is|are)\s+(?:part|component|element)\s+of\s+.*{b_esc}',
            rf'{a_esc}\s+(?:là|thuộc)\s+(?:phần|thành phần|bộ phận)\s+.*{b_esc}',
            rf'{b_esc}\s+(?:consists|comprises|contains)\s+.*{a_esc}',
        ]
        for p in part_of_patterns:
            if re.search(p, text, re.IGNORECASE):
                return "part-of"

        # prerequisite patterns
        prereq_patterns = [
            rf'(?:before|prior to|requires?|need)\s+.*{a_esc}.*{b_esc}',
            rf'{a_esc}.*(?:before|prior|prerequisite|foundation).*{b_esc}',
            rf'(?:trước khi|cần|yêu cầu)\s+.*{a_esc}.*{b_esc}',
        ]
        for p in prereq_patterns:
            if re.search(p, text, re.IGNORECASE):
                return "prerequisite"

        return "related"

    def _build_adjacency(
        self,
        concepts: List[str],
        edge_map: Dict[str, Dict],
    ) -> Dict[str, List[Tuple[str, float]]]:
        """Build adjacency list from edge map."""
        adj: Dict[str, List[Tuple[str, float]]] = {c: [] for c in concepts}

        for edge in edge_map.values():
            src, tgt = edge["source"], edge["target"]
            w = edge["weight"]
            if src in adj:
                adj[src].append((tgt, w))
            if tgt in adj:
                adj[tgt].append((src, w))

        return adj

    def _pagerank(
        self,
        concepts: List[str],
        adjacency: Dict[str, List[Tuple[str, float]]],
        damping: float = 0.85,
        max_iter: int = 50,
        tol: float = 1e-6,
    ) -> Dict[str, float]:
        """
        PageRank algorithm for concept importance scoring.
        More connected + more important neighbors = higher score.
        """
        n = len(concepts)
        if n == 0:
            return {}

        # Initialize scores uniformly
        scores = {c: 1.0 / n for c in concepts}

        for _ in range(max_iter):
            new_scores = {}
            for concept in concepts:
                incoming_sum = 0.0
                for neighbor, weight in adjacency.get(concept, []):
                    # Outgoing weight from neighbor
                    out_sum = sum(w for _, w in adjacency.get(neighbor, []))
                    if out_sum > 0:
                        incoming_sum += weight / out_sum * scores.get(neighbor, 0)

                new_scores[concept] = (1 - damping) / n + damping * incoming_sum

            # Check convergence
            diff = sum(abs(new_scores[c] - scores[c]) for c in concepts)
            scores = new_scores
            if diff < tol:
                break

        # Normalize to [0, 1]
        max_score = max(scores.values()) if scores else 1.0
        if max_score > 0:
            scores = {c: s / max_score for c, s in scores.items()}

        return scores

    def _detect_prerequisites(
        self,
        chunks: List[Dict],
        chunk_concepts: Dict[str, List[str]],
        concept_names: List[str],
    ) -> List[str]:
        """
        Detect prerequisite ordering based on concept first-appearance order.

        Heuristic: concepts that appear earlier in the document are likely
        prerequisites for concepts that appear later.
        """
        first_appearance: Dict[str, int] = {}

        for chunk in chunks:
            chunk_id = chunk["chunk_id"]
            position = chunk.get("position", 0)
            concepts = chunk_concepts.get(chunk_id, [])

            for concept in concepts:
                if concept not in first_appearance:
                    first_appearance[concept] = position

        # Sort by first appearance
        ordered = sorted(
            first_appearance.keys(),
            key=lambda c: first_appearance[c],
        )

        return ordered
