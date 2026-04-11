# 🧩 PHA 3: NLP PIPELINE & KNOWLEDGE GRAPH (Tuần 7-10)

> **Mục tiêu:** Xây pipeline NLP hoàn chỉnh + tự động sinh Knowledge Graph từ tài liệu
> **Trạng thái:** ⚪ Chờ (phụ thuộc Pha 2)
> **Prerequisite:** Pha 2 hoàn thành 100%

---

## 3.1 TỔNG QUAN PIPELINE

```
[Document Text] → Tokenize → POS Tag → NER → Dependency Parse
                                                      ↓
    ┌──────────────────────────────────────────────────┘
    ↓
Noun Phrase Extraction → Concept Candidates → TF-IDF Filter
    ↓
Concept Nodes → Relation Mining (Hearst + Co-occurrence + Dependency)
    ↓
Knowledge Graph → Community Detection (Louvain) → Topic Clusters
    ↓
Per-User Neural Profile (concept mastery tracking)
```

---

## 3.2 POS TAGGER (BiLSTM-CRF)

### Kiến trúc:
```
[Word] → Word Embedding (128d) + Char Embedding (CNN 50d) → BiLSTM (hidden=128) → CRF Layer → [POS Tag]
```

### Training data:
- **Tiếng Anh:** Universal Dependencies English EWT (~25K sentences)
- **Tiếng Việt:** Universal Dependencies Vietnamese VTB (~3.5K sentences) + VLSP POS dataset

### Tagset: Universal POS tags (17 tags)
`ADJ, ADP, ADV, AUX, CCONJ, DET, INTJ, NOUN, NUM, PART, PRON, PROPN, PUNCT, SCONJ, SYM, VERB, X`

```python
class BiLSTMCRFTagger(nn.Module):
    def __init__(self, vocab_size, tagset_size, embedding_dim=128, hidden_dim=128):
        super().__init__()
        self.word_emb = nn.Embedding(vocab_size, embedding_dim)
        
        # Character-level CNN
        self.char_emb = nn.Embedding(256, 30)  # ASCII/Unicode char embedding
        self.char_cnn = nn.Conv1d(30, 50, kernel_size=3, padding=1)
        
        # BiLSTM
        self.lstm = nn.LSTM(
            embedding_dim + 50,  # word + char features
            hidden_dim // 2,
            bidirectional=True,
            batch_first=True,
            num_layers=2,
            dropout=0.3,
        )
        
        # CRF layer
        self.hidden2tag = nn.Linear(hidden_dim, tagset_size)
        self.crf = CRF(tagset_size, batch_first=True)  # tự implement CRF
    
    def forward(self, words, chars, tags=None):
        word_features = self.word_emb(words)
        char_features = self._char_cnn_forward(chars)
        combined = torch.cat([word_features, char_features], dim=-1)
        
        lstm_out, _ = self.lstm(combined)
        emissions = self.hidden2tag(lstm_out)
        
        if tags is not None:
            # Training: return negative log-likelihood
            loss = -self.crf(emissions, tags)
            return loss
        else:
            # Inference: Viterbi decode
            return self.crf.decode(emissions)
```

### CRF Layer (tự implement):
```python
class CRF(nn.Module):
    """Conditional Random Field — tự viết Viterbi decode & forward algorithm"""
    
    def __init__(self, num_tags, batch_first=True):
        super().__init__()
        self.num_tags = num_tags
        self.transitions = nn.Parameter(torch.randn(num_tags, num_tags))
        self.start_transitions = nn.Parameter(torch.randn(num_tags))
        self.end_transitions = nn.Parameter(torch.randn(num_tags))
    
    def forward(self, emissions, tags, mask=None):
        """Compute log-likelihood using forward algorithm"""
        # ... (forward algorithm implementation)
    
    def decode(self, emissions, mask=None):
        """Viterbi decoding for best tag sequence"""
        # ... (Viterbi algorithm implementation)
```

---

## 3.3 NER MODEL (BiLSTM-CRF)

### Entity types cho educational domain:
- `CONCEPT` — Khái niệm kỹ thuật/học thuật (ví dụ: "HTML", "quang hợp", "gradient descent")
- `TERM` — Thuật ngữ chuyên ngành
- `PERSON` — Tên người (nhà khoa học, tác giả)
- `FORMULA` — Công thức toán/hóa
- `DEFINITION` — Câu định nghĩa
- `EXAMPLE` — Ví dụ minh họa

### Kiến trúc: Tương tự POS tagger, thêm BIO tagging scheme
```
B-CONCEPT, I-CONCEPT, B-TERM, I-TERM, B-PERSON, I-PERSON, 
B-FORMULA, I-FORMULA, B-DEFINITION, I-DEFINITION, O
```

### Training data (tự tạo + open-source):
1. Annotate thủ công 500 câu từ sách giáo khoa → seed data
2. Dùng pattern-based + dictionary-based NER → auto-annotate thêm 5000 câu
3. Manual review + correction → final training set

---

## 3.4 KEYWORD EXTRACTION (RAKE + TextRank)

### A. RAKE (Rapid Automatic Keyword Extraction)

```python
class RAKEExtractor:
    """Tự implement RAKE algorithm."""
    
    def extract(self, text: str, top_k=20) -> list[tuple[str, float]]:
        # 1. Split text bằng stopwords → candidate phrases
        candidates = self._split_by_stopwords(text)
        
        # 2. Build word co-occurrence matrix
        word_freq, word_degree = self._compute_word_scores(candidates)
        
        # 3. Score = degree(word) / frequency(word)
        word_scores = {w: word_degree[w] / word_freq[w] for w in word_freq}
        
        # 4. Phrase score = sum of word scores
        phrase_scores = {}
        for phrase in candidates:
            words = phrase.lower().split()
            score = sum(word_scores.get(w, 0) for w in words)
            phrase_scores[phrase] = score
        
        # 5. Return top-K
        sorted_phrases = sorted(phrase_scores.items(), key=lambda x: x[1], reverse=True)
        return sorted_phrases[:top_k]
```

### B. TextRank (Graph-based ranking)

```python
class TextRankExtractor:
    """Tự implement TextRank (giống PageRank nhưng cho keywords)."""
    
    def extract(self, text: str, window=4, top_k=20) -> list[tuple[str, float]]:
        # 1. POS tag → giữ lại NOUN, ADJ, PROPN
        words = self._filter_pos(text, keep=['NOUN', 'ADJ', 'PROPN'])
        
        # 2. Build co-occurrence graph (window size)
        graph = defaultdict(lambda: defaultdict(float))
        for i, word in enumerate(words):
            for j in range(i+1, min(i+window, len(words))):
                graph[word][words[j]] += 1
                graph[words[j]][word] += 1
        
        # 3. PageRank iteration
        scores = {w: 1.0 for w in graph}
        damping = 0.85
        
        for _ in range(30):  # convergence after ~20 iterations
            new_scores = {}
            for word in graph:
                rank = (1 - damping)
                for neighbor in graph[word]:
                    total_weight = sum(graph[neighbor].values())
                    rank += damping * (graph[word][neighbor] / total_weight) * scores[neighbor]
                new_scores[word] = rank
            scores = new_scores
        
        sorted_words = sorted(scores.items(), key=lambda x: x[1], reverse=True)
        return sorted_words[:top_k]
```

---

## 3.5 CONCEPT EXTRACTION PIPELINE

```python
class ConceptExtractor:
    """
    Pipeline trích xuất concepts từ document.
    Hybrid: NER + Noun Phrase + Keyword + Embedding Clustering
    """
    
    def extract(self, chunks: list[str], nlp_pipeline) -> list[Concept]:
        all_candidates = []
        
        for chunk in chunks:
            # Source 1: NER entities (type=CONCEPT, TERM)
            entities = nlp_pipeline.ner(chunk)
            ner_concepts = [e for e in entities if e.type in ('CONCEPT', 'TERM')]
            
            # Source 2: Noun phrases (custom grammar)
            noun_phrases = nlp_pipeline.extract_noun_phrases(chunk)
            
            # Source 3: Keywords (RAKE + TextRank)
            keywords = nlp_pipeline.extract_keywords(chunk)
            
            all_candidates.extend(ner_concepts + noun_phrases + keywords)
        
        # Deduplicate bằng embedding similarity
        unique_concepts = self._deduplicate_by_embedding(all_candidates, threshold=0.85)
        
        # Filter: loại bỏ quá chung (TF-IDF < threshold) hoặc quá hiếm (freq < 2)
        filtered = self._filter_by_importance(unique_concepts, min_tfidf=0.1, min_freq=2)
        
        # Thêm definitions: tìm câu "X is/là..." gần concept
        for concept in filtered:
            concept.definition = self._extract_definition(concept.text, chunks)
        
        return filtered
```

---

## 3.6 KNOWLEDGE GRAPH CONSTRUCTION

```python
class KnowledgeGraphBuilder:
    """
    Builds a Knowledge Graph from extracted concepts.
    Uses NetworkX for graph operations (local, no API).
    """
    
    def build(self, concepts: list[Concept], chunks: list[str]) -> nx.DiGraph:
        G = nx.DiGraph()
        
        # Add nodes
        for concept in concepts:
            G.add_node(concept.id, 
                       label=concept.text, 
                       definition=concept.definition,
                       frequency=concept.frequency,
                       embedding=concept.embedding.tolist())
        
        # Add edges (relations)
        relations = self.relation_miner.mine(concepts, chunks)
        for rel in relations:
            G.add_edge(rel.source_id, rel.target_id,
                      relation_type=rel.type,  # prerequisite, related, part_of, example_of
                      weight=rel.weight,
                      evidence=rel.evidence_text)
        
        return G
    
    def detect_communities(self, G: nx.DiGraph) -> dict:
        """Louvain community detection → topic clusters"""
        G_undirected = G.to_undirected()
        communities = community.best_partition(G_undirected)  # Louvain
        return communities  # {node_id: community_id}
    
    def get_core_concepts(self, G: nx.DiGraph, top_k=10) -> list:
        """PageRank centrality → core concepts"""
        centrality = nx.pagerank(G)
        sorted_nodes = sorted(centrality.items(), key=lambda x: x[1], reverse=True)
        return sorted_nodes[:top_k]
```

### Relation Mining — 3 phương pháp hybrid:

| Phương pháp | Pattern | Relation Type |
|---|---|---|
| **Hearst Patterns** | "X is a Y", "X such as Y", "X including Y" | `is_a`, `example_of` |
| **Co-occurrence** | X và Y xuất hiện trong cùng chunk | `related` (weight = PMI) |
| **Dependency Path** | Subject-Verb-Object paths trong parse tree | `causes`, `requires`, `part_of` |

---

## 3.7 FRONTEND: KNOWLEDGE GRAPH VISUALIZATION

### Công nghệ: D3.js Force-Directed Graph

```javascript
// KnowledgeExplorer.jsx — sẽ implement ở Pha 3
// Features:
// - Force-directed layout (nodes repel, edges attract)
// - Node size = concept importance (PageRank)
// - Node color = mastery level (red → yellow → green)
// - Edge thickness = relation weight
// - Click node → popup with definition + related chunks
// - Search → highlight + zoom to node
// - Community clusters → distinct color groups
```

---

## 3.8 ACCEPTANCE CRITERIA

- [ ] POS Tagger accuracy > 90% trên UD test set
- [ ] NER F1 score > 80% trên educational domain test data
- [ ] Keyword extraction top-20 có > 60% relevance (human eval)
- [ ] Knowledge Graph sinh ra có ý nghĩa (human eval on 5 documents)
- [ ] Graph visualization render được > 200 nodes smoothly
- [ ] Community detection nhóm đúng topic clusters
- [ ] API trả về concepts + relations trong < 500ms per document
