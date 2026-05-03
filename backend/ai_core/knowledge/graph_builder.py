"""
NEUROVAULT — Knowledge Graph Builder (White-Box)
Xây dựng đồ thị kiến thức từ chunks + concepts.
"""

from typing import List, Dict, Tuple
from .concept_extractor import ConceptExtractor


class KnowledgeGraphBuilder:
    """
    Build knowledge graph: concept nodes + relationship edges.
    Edges detected via co-occurrence analysis.
    """

    def __init__(self):
        self.extractor = ConceptExtractor(max_concepts=30)

    def build(self, chunks: List[Dict], document_id: str, user_id: str) -> Dict:
        """
        Build knowledge graph from chunks.
        Returns: {"nodes": [...], "edges": [...]}
        """
        # Extract concepts from each chunk
        chunk_concepts: Dict[str, List[str]] = {}
        all_texts = [c["text"] for c in chunks]

        global_concepts = self.extractor.extract(" ".join(all_texts), all_texts)
        concept_names = [c["concept"] for c in global_concepts]

        # Map concepts to chunks (which chunks contain which concepts)
        for chunk in chunks:
            chunk_id = chunk["chunk_id"]
            text_lower = chunk["text"].lower()
            found = [c for c in concept_names if c in text_lower]
            chunk_concepts[chunk_id] = found

        # Build nodes
        nodes = []
        for concept_data in global_concepts:
            related_chunks = [
                cid for cid, concepts in chunk_concepts.items()
                if concept_data["concept"] in concepts
            ]
            nodes.append({
                "user_id": user_id,
                "document_id": document_id,
                "concept": concept_data["concept"],
                "definition": "",
                "related_chunk_ids": related_chunks,
                "centrality_score": concept_data["score"],
            })

        # Build edges via co-occurrence
        edges = []
        for chunk_id, concepts in chunk_concepts.items():
            for i in range(len(concepts)):
                for j in range(i + 1, len(concepts)):
                    edges.append({
                        "source": concepts[i],
                        "target": concepts[j],
                        "relation_type": "related",
                        "weight": 1.0,
                        "evidence_chunk": chunk_id,
                    })

        # Deduplicate and weight edges
        edge_map: Dict[str, Dict] = {}
        for edge in edges:
            key = f"{min(edge['source'], edge['target'])}|{max(edge['source'], edge['target'])}"
            if key in edge_map:
                edge_map[key]["weight"] += 0.2
                edge_map[key]["weight"] = min(edge_map[key]["weight"], 1.0)
            else:
                edge_map[key] = edge

        return {
            "nodes": nodes,
            "edges": list(edge_map.values()),
            "stats": {
                "total_concepts": len(nodes),
                "total_edges": len(edge_map),
                "chunks_analyzed": len(chunks),
            }
        }
