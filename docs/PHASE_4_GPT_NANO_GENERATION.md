# 🧠 PHA 4: GPT-NANO & GENERATION (Tuần 11-15)

> **Mục tiêu:** Tự train Transformer decoder nhỏ (GPT-nano) + xây RAG pipeline hoàn chỉnh
> **Trạng thái:** ⚪ Chờ (phụ thuộc Pha 3)
> **Prerequisite:** Pha 3 hoàn thành 100%
> **⚠️ CRITICAL:** Pha quan trọng nhất, tham vọng nhất — quyết định linh hồn AI của dự án

---

## 4.1 TỔNG QUAN

### Tại sao GPT-nano thay vì dùng model lớn?

| Vấn đề | Giải pháp GPT-nano |
|---|---|
| GPT-4/Claude = API trả phí, black-box | GPT-nano = tự viết, white-box, miễn phí |
| LLaMA 7B = cần 16GB+ VRAM | GPT-nano 6-12M params = chạy được trên GTX 1650 (4GB) |
| Fine-tune model lớn = cần infrastructure | Train từ đầu = hiểu rõ mọi thứ |

### Capabilities của GPT-nano (sau khi train):
- ✅ Sinh câu hỏi từ context passage
- ✅ Sinh tóm tắt ngắn (< 100 tokens)
- ✅ Sinh definition cho concepts
- ✅ Trả lời câu hỏi đơn giản dựa trên context (RAG)
- ✅ Sinh explanation ngắn cho "tại sao?"
- ❌ Long-form essay generation (model quá nhỏ)
- ❌ Complex reasoning (cần model lớn hơn)

---

## 4.2 KIẾN TRÚC MÔ HÌNH

### Config cho 2 phiên bản (tuỳ hardware):

| Config | GPT-nano-S (CPU friendly) | GPT-nano-M (GPU 4GB) |
|---|---|---|
| # Params | ~6M | ~12M |
| Layers | 4 | 6 |
| Heads | 4 | 6 |
| d_model | 256 | 384 |
| d_ff | 1024 | 1536 |
| max_seq_len | 256 | 512 |
| Vocab size | 32000 | 32000 |
| Training time (est.) | 3-5 ngày (CPU) | 2-4 ngày (GTX 1650) |

### Kiến trúc chi tiết (PyTorch thuần):

```python
class GPTNanoConfig:
    """Configuration tuỳ chỉnh dựa trên hardware available."""
    
    # Sẽ detect hardware runtime để chọn config phù hợp
    @classmethod
    def for_hardware(cls, vram_gb=0, ram_gb=16):
        if vram_gb >= 4:
            return cls(
                n_layers=6, n_heads=6, d_model=384, d_ff=1536,
                max_seq_len=512, vocab_size=32000, dropout=0.1
            )
        else:
            # CPU-only: dùng model nhỏ hơn
            return cls(
                n_layers=4, n_heads=4, d_model=256, d_ff=1024,
                max_seq_len=256, vocab_size=32000, dropout=0.1
            )


class RMSNorm(nn.Module):
    """Root Mean Square Layer Normalization (hiệu quả hơn LayerNorm)."""
    
    def __init__(self, dim, eps=1e-6):
        super().__init__()
        self.eps = eps
        self.weight = nn.Parameter(torch.ones(dim))
    
    def forward(self, x):
        norm = x.float().pow(2).mean(-1, keepdim=True).add(self.eps).rsqrt()
        return (x.float() * norm).type_as(x) * self.weight


class RotaryPositionalEncoding(nn.Module):
    """
    RoPE (Rotary Positional Encoding) — hiện đại hơn absolute positional encoding.
    Được dùng trong LLaMA, Qwen, v.v.
    """
    
    def __init__(self, dim, max_seq_len=512):
        super().__init__()
        inv_freq = 1.0 / (10000 ** (torch.arange(0, dim, 2).float() / dim))
        self.register_buffer('inv_freq', inv_freq)
        
        t = torch.arange(max_seq_len)
        freqs = torch.outer(t, inv_freq)
        self.register_buffer('cos_cached', freqs.cos())
        self.register_buffer('sin_cached', freqs.sin())
    
    def forward(self, x, seq_len):
        cos = self.cos_cached[:seq_len]
        sin = self.sin_cached[:seq_len]
        return apply_rotary_emb(x, cos, sin)


class MultiHeadSelfAttention(nn.Module):
    """
    Grouped-Query Attention (GQA) — tiết kiệm memory hơn standard MHA.
    Hoặc standard MHA nếu n_kv_heads == n_heads.
    """
    
    def __init__(self, config):
        super().__init__()
        self.n_heads = config.n_heads
        self.d_k = config.d_model // config.n_heads
        
        self.W_q = nn.Linear(config.d_model, config.d_model, bias=False)
        self.W_k = nn.Linear(config.d_model, config.d_model, bias=False)
        self.W_v = nn.Linear(config.d_model, config.d_model, bias=False)
        self.W_o = nn.Linear(config.d_model, config.d_model, bias=False)
        
        self.rope = RotaryPositionalEncoding(self.d_k, config.max_seq_len)
        self.dropout = nn.Dropout(config.dropout)
    
    def forward(self, x, mask=None):
        B, T, C = x.size()
        
        q = self.W_q(x).view(B, T, self.n_heads, self.d_k).transpose(1, 2)
        k = self.W_k(x).view(B, T, self.n_heads, self.d_k).transpose(1, 2)
        v = self.W_v(x).view(B, T, self.n_heads, self.d_k).transpose(1, 2)
        
        # Apply RoPE
        q = self.rope(q, T)
        k = self.rope(k, T)
        
        # Scaled dot-product attention
        attn_scores = (q @ k.transpose(-2, -1)) / math.sqrt(self.d_k)
        
        # Causal mask
        if mask is None:
            mask = torch.triu(torch.ones(T, T, device=x.device), diagonal=1).bool()
        attn_scores.masked_fill_(mask, float('-inf'))
        
        attn_weights = F.softmax(attn_scores, dim=-1)
        attn_weights = self.dropout(attn_weights)
        
        output = (attn_weights @ v).transpose(1, 2).contiguous().view(B, T, C)
        return self.W_o(output)


class FeedForward(nn.Module):
    """SwiGLU Feed-Forward (hiện đại hơn ReLU standard)."""
    
    def __init__(self, config):
        super().__init__()
        self.w1 = nn.Linear(config.d_model, config.d_ff, bias=False)
        self.w2 = nn.Linear(config.d_ff, config.d_model, bias=False)
        self.w3 = nn.Linear(config.d_model, config.d_ff, bias=False)
        self.dropout = nn.Dropout(config.dropout)
    
    def forward(self, x):
        # SwiGLU: w2(SiLU(w1(x)) * w3(x))
        return self.dropout(self.w2(F.silu(self.w1(x)) * self.w3(x)))


class TransformerBlock(nn.Module):
    """Pre-norm Transformer block with RMSNorm + SwiGLU."""
    
    def __init__(self, config):
        super().__init__()
        self.norm1 = RMSNorm(config.d_model)
        self.attn = MultiHeadSelfAttention(config)
        self.norm2 = RMSNorm(config.d_model)
        self.ff = FeedForward(config)
    
    def forward(self, x):
        x = x + self.attn(self.norm1(x))
        x = x + self.ff(self.norm2(x))
        return x


class GPTNano(nn.Module):
    """
    Complete GPT-nano model.
    Tính năng hiện đại: RoPE, RMSNorm, SwiGLU, Weight Tying.
    """
    
    def __init__(self, config):
        super().__init__()
        self.config = config
        self.token_emb = nn.Embedding(config.vocab_size, config.d_model)
        self.blocks = nn.ModuleList([TransformerBlock(config) for _ in range(config.n_layers)])
        self.norm_f = RMSNorm(config.d_model)
        self.head = nn.Linear(config.d_model, config.vocab_size, bias=False)
        
        # Weight tying
        self.head.weight = self.token_emb.weight
        
        # Initialize weights
        self.apply(self._init_weights)
    
    def _init_weights(self, module):
        if isinstance(module, nn.Linear):
            nn.init.normal_(module.weight, mean=0.0, std=0.02)
            if module.bias is not None:
                nn.init.zeros_(module.bias)
        elif isinstance(module, nn.Embedding):
            nn.init.normal_(module.weight, mean=0.0, std=0.02)
    
    def forward(self, idx, targets=None):
        B, T = idx.size()
        x = self.token_emb(idx)
        
        for block in self.blocks:
            x = block(x)
        
        x = self.norm_f(x)
        logits = self.head(x)
        
        loss = None
        if targets is not None:
            loss = F.cross_entropy(
                logits.view(-1, logits.size(-1)),
                targets.view(-1),
                ignore_index=-1,  # padding token
            )
        return logits, loss
    
    @torch.no_grad()
    def generate(self, idx, max_new_tokens=128, temperature=0.8, top_k=40):
        """Autoregressive generation with top-k sampling."""
        for _ in range(max_new_tokens):
            # Crop to max_seq_len
            idx_cond = idx[:, -self.config.max_seq_len:]
            logits, _ = self(idx_cond)
            logits = logits[:, -1, :] / temperature
            
            # Top-k filtering
            if top_k > 0:
                v, _ = torch.topk(logits, min(top_k, logits.size(-1)))
                logits[logits < v[:, [-1]]] = float('-inf')
            
            probs = F.softmax(logits, dim=-1)
            idx_next = torch.multinomial(probs, num_samples=1)
            idx = torch.cat([idx, idx_next], dim=1)
            
            # Stop at EOS token
            if idx_next.item() == self.config.eos_token_id:
                break
        
        return idx
    
    def count_parameters(self):
        return sum(p.numel() for p in self.parameters() if p.requires_grad)
```

---

## 4.3 TRAINING PIPELINE

### Data Preparation:

```python
class TextDataset(Dataset):
    def __init__(self, data_path, tokenizer, max_length=512):
        self.tokenizer = tokenizer
        self.max_length = max_length
        self.data = self._load_and_tokenize(data_path)
    
    def _load_and_tokenize(self, path):
        """Load text data, tokenize, split into chunks of max_length."""
        with open(path, 'r', encoding='utf-8') as f:
            text = f.read()
        
        token_ids = self.tokenizer.encode(text)
        # Split into chunks
        chunks = []
        for i in range(0, len(token_ids) - self.max_length, self.max_length):
            chunk = token_ids[i:i + self.max_length + 1]
            chunks.append(chunk)
        return chunks
    
    def __getitem__(self, idx):
        chunk = self.data[idx]
        x = torch.tensor(chunk[:-1], dtype=torch.long)   # input
        y = torch.tensor(chunk[1:], dtype=torch.long)     # target (shifted by 1)
        return x, y
```

### Training Loop:

```python
class GPTNanoTrainer:
    def __init__(self, model, config):
        self.model = model
        self.config = config
        self.optimizer = torch.optim.AdamW(
            model.parameters(),
            lr=3e-4,
            betas=(0.9, 0.95),
            weight_decay=0.1,
        )
        # Cosine annealing with warmup
        self.scheduler = self._create_scheduler()
        
        # Mixed precision (giảm VRAM usage ~50%)
        self.scaler = torch.cuda.amp.GradScaler(enabled=config.use_amp)
        
        # Gradient accumulation (simulate larger batch size)
        self.grad_accum_steps = config.grad_accum_steps  # 4-8 for GTX 1650
    
    def train(self, train_loader, val_loader, epochs=10):
        best_val_loss = float('inf')
        
        for epoch in range(epochs):
            self.model.train()
            total_loss = 0
            
            for step, (x, y) in enumerate(train_loader):
                x, y = x.to(self.device), y.to(self.device)
                
                with torch.cuda.amp.autocast(enabled=self.config.use_amp):
                    logits, loss = self.model(x, y)
                    loss = loss / self.grad_accum_steps
                
                self.scaler.scale(loss).backward()
                
                if (step + 1) % self.grad_accum_steps == 0:
                    self.scaler.unscale_(self.optimizer)
                    torch.nn.utils.clip_grad_norm_(self.model.parameters(), 1.0)
                    self.scaler.step(self.optimizer)
                    self.scaler.update()
                    self.optimizer.zero_grad()
                    self.scheduler.step()
                
                total_loss += loss.item() * self.grad_accum_steps
                
                if step % 100 == 0:
                    print(f"Epoch {epoch+1}, Step {step}, Loss: {loss.item():.4f}, LR: {self.scheduler.get_last_lr()[0]:.6f}")
            
            # Validation
            val_loss = self._validate(val_loader)
            print(f"Epoch {epoch+1} — Train Loss: {total_loss/len(train_loader):.4f}, Val Loss: {val_loss:.4f}")
            
            # Save best model
            if val_loss < best_val_loss:
                best_val_loss = val_loss
                self._save_checkpoint(epoch, val_loss)
```

### Ước tính training:

| Config | Batch size | Grad Accum | Effective Batch | Tokens/step | Est. Time |
|---|---|---|---|---|---|
| GPU (GTX 1650 4GB) | 4 | 8 | 32 | 16K | 2-4 ngày |
| CPU (i5-11320H) | 2 | 16 | 32 | 8K | 5-10 ngày |

### Corpus training (~500MB text):
- Vietnamese Wikipedia: ~200MB clean text
- English Wikipedia subset: ~200MB clean text
- Educational textbooks (open-source): ~100MB

---

## 4.4 AI ORCHESTRATOR

```python
class AIOrchestrator:
    """
    Bộ não trung tâm. Nhận query → phân loại intent → route → trả response.
    """
    
    def __init__(self, gpt_nano, embedder, retriever, knowledge_graph):
        self.gpt_nano = gpt_nano
        self.embedder = embedder
        self.retriever = retriever
        self.kg = knowledge_graph
        self.intent_classifier = IntentClassifier()
    
    async def process(self, query: str, user_id: str, doc_id: str) -> Response:
        # 1. Classify intent
        intent = self.intent_classifier.classify(query)
        
        # 2. Retrieve relevant context (Hybrid RAG)
        context_chunks = self.retriever.hybrid_search(query, doc_id, top_k=5)
        
        # 3. Route based on intent
        if intent == 'definition':
            return await self._handle_definition(query, context_chunks)
        elif intent == 'summarize':
            return await self._handle_summary(context_chunks)
        elif intent == 'quiz':
            return await self._handle_quiz(user_id, doc_id)
        elif intent == 'explain':
            return await self._handle_explain(query, context_chunks)
        else:
            return await self._handle_qa(query, context_chunks)
    
    async def _handle_qa(self, query: str, context: list) -> Response:
        """RAG: Retrieve → Augment → Generate"""
        # Build prompt
        context_text = "\n".join([c.text for c in context])
        prompt = f"Context:\n{context_text}\n\nQuestion: {query}\nAnswer:"
        
        # Generate with GPT-nano
        input_ids = self.tokenizer.encode(prompt)
        output_ids = self.gpt_nano.generate(
            torch.tensor([input_ids]),
            max_new_tokens=128,
            temperature=0.7,
        )
        response_text = self.tokenizer.decode(output_ids[0][len(input_ids):])
        
        # Fact-check against Knowledge Graph
        claims = self._extract_claims(response_text)
        verified = self._verify_claims(claims, self.kg)
        
        return Response(
            text=response_text,
            sources=[c.chunk_id for c in context],
            confidence=verified.confidence_score,
            intent='qa',
        )
```

### Intent Classifier:

```python
class IntentClassifier:
    """
    Lightweight BiLSTM classifier cho intent detection.
    Intents: definition, summarize, quiz, explain, compare, general_qa
    """
    
    # Training data format:
    # "what is HTML?" → definition
    # "summarize this chapter" → summarize  
    # "quiz me on this topic" → quiz
    # "why does X happen?" → explain
    # "how does X compare to Y?" → compare
    # "tell me about..." → general_qa
    
    # Model: Embedding(128) → BiLSTM(64) → Linear(num_intents) → Softmax
    # Ước tính ~5MB, train 5 phút trên CPU
```

---

## 4.5 WEBSOCKET STREAMING

```python
# FastAPI WebSocket endpoint cho streaming response

@app.websocket("/ws/chat/{user_id}")
async def chat_stream(websocket: WebSocket, user_id: str):
    await websocket.accept()
    
    while True:
        data = await websocket.receive_json()
        query = data['query']
        doc_id = data.get('document_id')
        
        # Stream tokens as they're generated
        async for token in orchestrator.stream_response(query, user_id, doc_id):
            await websocket.send_json({
                'type': 'token',
                'content': token,
            })
        
        # Send completion signal with metadata
        await websocket.send_json({
            'type': 'complete',
            'sources': [...],
            'confidence': 0.85,
        })
```

---

## 4.6 ONNX EXPORT CHO INFERENCE

```python
def export_to_onnx(model, config, output_path):
    """Export trained model sang ONNX cho inference nhanh."""
    model.eval()
    dummy_input = torch.randint(0, config.vocab_size, (1, config.max_seq_len))
    
    torch.onnx.export(
        model,
        dummy_input,
        output_path,
        input_names=['input_ids'],
        output_names=['logits'],
        dynamic_axes={'input_ids': {0: 'batch', 1: 'seq_len'},
                      'logits': {0: 'batch', 1: 'seq_len'}},
        opset_version=17,
    )
    
    # Verify
    import onnxruntime as ort
    session = ort.InferenceSession(output_path)
    onnx_out = session.run(None, {'input_ids': dummy_input.numpy()})
    torch_out = model(dummy_input)[0].detach().numpy()
    assert np.allclose(onnx_out[0], torch_out, atol=1e-4)
    print(f"✅ ONNX export verified: {output_path}")
```

---

## 4.7 ACCEPTANCE CRITERIA

- [ ] GPT-nano forward pass hoạt động (random input → output logits)
- [ ] Training loop chạy ổn định 100+ steps không crash
- [ ] Perplexity trên validation set < 50 (target < 30)
- [ ] Generate coherent text dài > 50 tokens
- [ ] RAG pipeline: query → retrieve → generate → response có ý nghĩa
- [ ] Streaming response qua WebSocket hoạt động
- [ ] ONNX export thành công + inference nhanh hơn PyTorch 2x
- [ ] Frontend ChatBox hiển thị streaming tokens real-time
