# 🔢 PHA 2: EMBEDDING & RETRIEVAL (Tuần 4-6)

> **Mục tiêu:** Xây hệ thống vector embedding + text retrieval hoàn toàn từ đầu
> **Trạng thái:** ⚪ Chờ (phụ thuộc Pha 1)
> **Prerequisite:** Pha 1 hoàn thành 100%

---

## 2.1 TỔNG QUAN

```
[User Query] → BPE Tokenize → [tokens]
                                  ↓
              ┌─────────────────────────────────────┐
              │         HYBRID RETRIEVAL             │
              │                                      │
              │  ┌──────────┐    ┌───────────────┐  │
              │  │  BM25    │    │ Dense Vector  │  │
              │  │ (Sparse) │    │  (MiniLM)     │  │
              │  └────┬─────┘    └──────┬────────┘  │
              │       │                 │            │
              │       └────────┬────────┘            │
              │                ↓                     │
              │     Reciprocal Rank Fusion            │
              │                ↓                     │
              │        [Top-K Chunks]                │
              └─────────────────────────────────────┘
```

---

## 2.2 BPE TOKENIZER (Tự viết 100%)

### Thuật toán: Byte-Pair Encoding

**Bước 1:** Tính frequency của mỗi từ trong corpus
**Bước 2:** Split mỗi từ thành characters + end token (`▁`)
**Bước 3:** Đếm frequency của mọi cặp character liên tiếp
**Bước 4:** Merge cặp có frequency cao nhất thành 1 token mới
**Bước 5:** Lặp lại bước 3-4 cho tới khi đạt vocab_size mong muốn

```python
class BPETokenizer:
    def __init__(self, vocab_size=32000):
        self.vocab_size = vocab_size
        self.merges = []  # list of (pair, new_token)
        self.vocab = {}
    
    def train(self, corpus: list[str]):
        """Train BPE trên corpus. Tự implement 100%."""
        # Khởi tạo: split tất cả words thành characters
        word_freqs = self._count_word_frequencies(corpus)
        splits = {word: list(word) + ['▁'] for word in word_freqs}
        
        while len(self.vocab) < self.vocab_size:
            # Đếm pair frequencies
            pair_freqs = self._count_pair_frequencies(splits, word_freqs)
            if not pair_freqs:
                break
            
            # Merge best pair
            best_pair = max(pair_freqs, key=pair_freqs.get)
            new_token = best_pair[0] + best_pair[1]
            self.merges.append((best_pair, new_token))
            
            # Update splits
            splits = self._apply_merge(splits, best_pair, new_token)
            self.vocab[new_token] = len(self.vocab)
    
    def encode(self, text: str) -> list[int]:
        """Tokenize text → list of token IDs"""
        tokens = list(text) + ['▁']
        for (pair, new_token) in self.merges:
            tokens = self._apply_merge_to_sequence(tokens, pair, new_token)
        return [self.vocab[t] for t in tokens]
    
    def decode(self, ids: list[int]) -> str:
        """Token IDs → text"""
        inv_vocab = {v: k for k, v in self.vocab.items()}
        return ''.join(inv_vocab[i] for i in ids).replace('▁', '')
```

### Dữ liệu training:
- **Vietnamese:** Wikipedia dump (`viwiki-latest-pages-articles.xml.bz2`) ~2GB raw
- **English:** Wikipedia dump subset (lấy 5GB) hoặc OpenWebText subset
- **Mixed training:** 50% Vietnamese + 50% English → balanced multilingual tokenizer

---

## 2.3 CUSTOM WORD2VEC (NumPy thuần)

### Thuật toán: Skip-gram + Negative Sampling

**Tại sao tự viết thay vì dùng gensim?**
→ White-box: hiểu rõ từng gradient, từng update rule. Không có black-box.

```python
class Word2VecTrainer:
    def __init__(self, vocab_size, embedding_dim=128, window=5, neg_samples=5):
        scale = np.sqrt(2.0 / (vocab_size + embedding_dim))
        self.W_center = np.random.randn(vocab_size, embedding_dim) * scale
        self.W_context = np.random.randn(vocab_size, embedding_dim) * scale
        self.neg_samples = neg_samples
        self.window = window
    
    def train(self, corpus_token_ids: list[list[int]], epochs=5, lr=0.025):
        """
        Training loop:
        - Duyệt qua từng câu, từng từ
        - Với mỗi center word: lấy context words trong window
        - Positive pair: (center, context)
        - Negative pairs: (center, random_word) × neg_samples
        - Update weights bằng SGD
        """
        word_freqs = self._compute_word_frequencies(corpus_token_ids)
        neg_table = self._build_negative_sampling_table(word_freqs)
        
        for epoch in range(epochs):
            total_loss = 0
            lr_current = lr * (1 - epoch / epochs)  # Linear decay
            
            for sentence in corpus_token_ids:
                for i, center in enumerate(sentence):
                    # Dynamic window
                    w = random.randint(1, self.window)
                    context_indices = sentence[max(0,i-w):i] + sentence[i+1:i+1+w]
                    
                    for ctx in context_indices:
                        neg_indices = self._sample_negatives(neg_table, self.neg_samples)
                        loss = self._train_step(center, ctx, neg_indices, lr_current)
                        total_loss += loss
            
            print(f"Epoch {epoch+1}/{epochs}, Loss: {total_loss:.4f}")
    
    def _train_step(self, center, context, negatives, lr):
        """Single SGD step — NumPy only."""
        h = self.W_center[center]
        
        # Positive
        v_pos = self.W_context[context]
        dot_pos = np.dot(h, v_pos)
        sig_pos = 1 / (1 + np.exp(-np.clip(dot_pos, -10, 10)))
        
        # Negatives
        v_neg = self.W_context[negatives]
        dots_neg = v_neg @ h
        sig_neg = 1 / (1 + np.exp(-np.clip(dots_neg, -10, 10)))
        
        # Gradients
        grad_h = (sig_pos - 1) * v_pos + (sig_neg[:, None] * v_neg).sum(0)
        
        # Update
        self.W_center[center] -= lr * grad_h
        self.W_context[context] -= lr * (sig_pos - 1) * h
        self.W_context[negatives] -= lr * sig_neg[:, None] * h
        
        loss = -np.log(sig_pos + 1e-7) - np.log(1 - sig_neg + 1e-7).sum()
        return loss
    
    def get_embedding(self, word_id: int) -> np.ndarray:
        return self.W_center[word_id]
    
    def most_similar(self, word_id: int, top_k=10) -> list:
        vec = self.W_center[word_id]
        sims = self.W_center @ vec / (np.linalg.norm(self.W_center, axis=1) * np.linalg.norm(vec))
        top_ids = np.argsort(sims)[-top_k-1:-1][::-1]
        return [(idx, sims[idx]) for idx in top_ids]
```

### Ước tính thời gian training:
- Corpus: ~500MB text (Wikipedia VI + EN subset)
- Vocab: ~50K words
- Embedding dim: 128
- Epochs: 5
- **Ước tính: 2-4 giờ trên i5-11320H** (CPU only, NumPy optimized)

---

## 2.4 SENTENCE EMBEDDING (ONNX Local)

### Model: `all-MiniLM-L6-v2` hoặc `paraphrase-multilingual-MiniLM-L12-v2`

**Tại sao dùng pre-trained?**
→ Sentence embedding cần training trên corpus cực lớn (>1B sentences). Tự train từ đầu là không khả thi với 16GB RAM + GTX 1650. Nhưng chúng ta load + chạy **100% local** bằng ONNX Runtime, **KHÔNG gọi bất kỳ API nào**.

```python
class SentenceEmbedder:
    def __init__(self, model_dir="models/minilm-multilingual/"):
        self.session = ort.InferenceSession(
            os.path.join(model_dir, "model.onnx"),
            providers=['CPUExecutionProvider']  # hoặc CUDAExecutionProvider nếu có GPU
        )
        self.tokenizer = self._load_tokenizer(model_dir)
        self.max_length = 256
    
    def encode(self, texts: list[str]) -> np.ndarray:
        # Batch tokenize
        encoded = self.tokenizer(
            texts, padding=True, truncation=True, 
            max_length=self.max_length, return_tensors='np'
        )
        
        # ONNX inference
        outputs = self.session.run(
            None,
            {
                'input_ids': encoded['input_ids'].astype(np.int64),
                'attention_mask': encoded['attention_mask'].astype(np.int64),
            }
        )
        
        # Mean pooling
        token_embeddings = outputs[0]  # (batch, seq_len, hidden)
        mask = encoded['attention_mask'][:, :, None]
        summed = (token_embeddings * mask).sum(axis=1)
        counts = mask.sum(axis=1).clip(min=1e-9)
        embeddings = summed / counts
        
        # L2 normalize
        norms = np.linalg.norm(embeddings, axis=1, keepdims=True)
        return embeddings / norms
```

### Cách download model (tự convert):
```bash
pip install transformers onnx onnxruntime
python -c "
from transformers import AutoModel, AutoTokenizer
model = AutoModel.from_pretrained('sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2')
tokenizer = AutoTokenizer.from_pretrained('sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2')
model.save_pretrained('models/minilm-multilingual')
tokenizer.save_pretrained('models/minilm-multilingual')
"
# Convert to ONNX
python -m onnxruntime.transformers.optimizer --model_type bert \
  --input models/minilm-multilingual --output models/minilm-multilingual/model.onnx
```

---

## 2.5 CUSTOM BM25 (Tự viết 100%)

### Thuật toán: Okapi BM25

```python
class BM25:
    """
    BM25 scoring tự implement.
    Không dùng rank_bm25 hay bất kỳ library nào.
    """
    
    def __init__(self, k1=1.5, b=0.75):
        self.k1 = k1
        self.b = b
        self.inverted_index = {}   # {term: [(doc_id, tf), ...]}
        self.doc_lengths = {}      # {doc_id: length}
        self.avg_doc_length = 0
        self.N = 0                 # total documents
        self.idf_cache = {}
    
    def index(self, documents: dict[str, list[str]]):
        """
        Build inverted index.
        documents: {doc_id: [token1, token2, ...]}
        """
        self.N = len(documents)
        total_length = 0
        
        for doc_id, tokens in documents.items():
            self.doc_lengths[doc_id] = len(tokens)
            total_length += len(tokens)
            
            tf_counts = Counter(tokens)
            for term, tf in tf_counts.items():
                if term not in self.inverted_index:
                    self.inverted_index[term] = []
                self.inverted_index[term].append((doc_id, tf))
        
        self.avg_doc_length = total_length / max(self.N, 1)
        self._compute_idf()
    
    def _compute_idf(self):
        for term, postings in self.inverted_index.items():
            df = len(postings)
            self.idf_cache[term] = math.log((self.N - df + 0.5) / (df + 0.5) + 1)
    
    def search(self, query_tokens: list[str], top_k=10) -> list[tuple]:
        """Return [(doc_id, score), ...] sorted by relevance"""
        scores = defaultdict(float)
        
        for term in query_tokens:
            if term not in self.inverted_index:
                continue
            
            idf = self.idf_cache[term]
            for doc_id, tf in self.inverted_index[term]:
                dl = self.doc_lengths[doc_id]
                tf_norm = (tf * (self.k1 + 1)) / (tf + self.k1 * (1 - self.b + self.b * dl / self.avg_doc_length))
                scores[doc_id] += idf * tf_norm
        
        sorted_results = sorted(scores.items(), key=lambda x: x[1], reverse=True)
        return sorted_results[:top_k]
```

---

## 2.6 FAISS LOCAL VECTOR STORE

```python
class VectorStore:
    """Wrapper cho FAISS local. Không API, chạy trên CPU."""
    
    def __init__(self, dimension=384):
        self.dimension = dimension
        self.index = faiss.IndexFlatIP(dimension)  # Inner Product (cosine sim on normalized vectors)
        self.id_map = {}  # faiss_id → (doc_id, chunk_id)
        self._counter = 0
    
    def add(self, doc_id: str, chunk_id: str, vector: np.ndarray):
        vector = vector.reshape(1, -1).astype('float32')
        self.index.add(vector)
        self.id_map[self._counter] = (doc_id, chunk_id)
        self._counter += 1
    
    def search(self, query_vector: np.ndarray, top_k=10):
        query = query_vector.reshape(1, -1).astype('float32')
        scores, indices = self.index.search(query, top_k)
        
        results = []
        for score, idx in zip(scores[0], indices[0]):
            if idx >= 0 and idx in self.id_map:
                doc_id, chunk_id = self.id_map[idx]
                results.append({'doc_id': doc_id, 'chunk_id': chunk_id, 'score': float(score)})
        return results
    
    def save(self, path: str):
        faiss.write_index(self.index, path + '.faiss')
        with open(path + '.map.json', 'w') as f:
            json.dump(self.id_map, f)
    
    def load(self, path: str):
        self.index = faiss.read_index(path + '.faiss')
        with open(path + '.map.json') as f:
            self.id_map = {int(k): v for k, v in json.load(f).items()}
```

---

## 2.7 HYBRID RANKER (Reciprocal Rank Fusion)

```python
class HybridRanker:
    """
    Merge Dense retrieval (FAISS) + Sparse retrieval (BM25)
    bằng Reciprocal Rank Fusion.
    
    RRF score = Σ 1/(k + rank_i)
    """
    
    def __init__(self, k=60):
        self.k = k
    
    def fuse(self, dense_results: list, sparse_results: list, top_k=10) -> list:
        scores = defaultdict(float)
        
        # Dense rankings
        for rank, result in enumerate(dense_results):
            key = (result['doc_id'], result['chunk_id'])
            scores[key] += 1.0 / (self.k + rank + 1)
        
        # Sparse rankings
        for rank, (chunk_id, _) in enumerate(sparse_results):
            # BM25 returns (doc_id, score), need to match format
            scores[chunk_id] += 1.0 / (self.k + rank + 1)
        
        sorted_results = sorted(scores.items(), key=lambda x: x[1], reverse=True)
        return sorted_results[:top_k]
```

---

## 2.8 ACCEPTANCE CRITERIA

- [ ] BPE Tokenizer train thành công trên 500MB+ corpus
- [ ] Word2Vec embeddings có chất lượng (king - man + woman ≈ queen)
- [ ] Sentence embedding chạy local, encode 100 sentences < 2 giây
- [ ] BM25 search trả về kết quả relevant cho keyword queries
- [ ] FAISS search trả về kết quả relevant cho semantic queries
- [ ] Hybrid search > BM25-only và > Dense-only (measured by MRR)
- [ ] API endpoint `/search` hoạt động end-to-end
