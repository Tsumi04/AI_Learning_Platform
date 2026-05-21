"""
NEUROVAULT — Task 1.1 + 1.3 Tests
Test LLM Engine v3 + BPE Tokenizer.
"""
import sys, os, io, traceback
if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

PASS = 0
FAIL = 0

def test(name, func):
    global PASS, FAIL
    try:
        func()
        print(f"  \u2705 {name}")
        PASS += 1
    except Exception as e:
        print(f"  \u274c {name}: {e}")
        traceback.print_exc()
        FAIL += 1


# ==========================================
# Task 1.1: LLM Engine v3
# ==========================================
print("\n\u2501\u2501\u2501 Task 1.1: LLM Engine v3 \u2501\u2501\u2501")

def test_llm_init():
    from inference.llm_engine import LLMEngine
    engine = LLMEngine(base_url="http://127.0.0.1:11434", model="gemma4:e4b")
    assert engine.model == "gemma4:e4b"
    assert engine.max_retries == 3

def test_llm_circuit_breaker():
    from inference.llm_engine import LLMEngine, CircuitState
    engine = LLMEngine(circuit_breaker_threshold=3)
    assert engine._cb_state == CircuitState.CLOSED
    # Simulate failures
    for _ in range(3):
        engine._cb_record_failure()
    assert engine._cb_state == CircuitState.OPEN
    assert engine._cb_check() == False
    # Reset
    engine.reset_circuit_breaker()
    assert engine._cb_state == CircuitState.CLOSED
    assert engine._cb_check() == True

def test_llm_metrics():
    from inference.llm_engine import LLMEngine
    engine = LLMEngine()
    metrics = engine.get_metrics()
    assert "total_requests" in metrics
    assert "success_rate" in metrics
    assert "avg_latency_ms" in metrics
    assert metrics["total_requests"] == 0

def test_llm_token_estimation():
    from inference.llm_engine import LLMEngine
    # English: ~4 chars/token
    assert LLMEngine.estimate_tokens("Hello world") > 0
    # Vietnamese: ~2 chars/token (more dense)
    en_tokens = LLMEngine.estimate_tokens("Hello world test")
    vi_tokens = LLMEngine.estimate_tokens("Xin chào thế giới")
    assert vi_tokens >= en_tokens  # Vietnamese should have more tokens

def test_llm_thinking_parse():
    from inference.llm_engine import LLMEngine
    engine = LLMEngine()
    raw = "<think>Step 1: analyze\nStep 2: solve</think>\nThe answer is 42."
    result = engine._parse_thinking_response(raw)
    assert "Step 1" in result["thinking"]
    assert "42" in result["answer"]

def test_llm_strip_thinking():
    from inference.llm_engine import LLMEngine
    engine = LLMEngine()
    text = "Prefix <think>internal reasoning</think> Final answer here."
    stripped = engine._strip_thinking(text)
    assert "internal reasoning" not in stripped
    assert "Final answer here" in stripped

def test_llm_health_check():
    from inference.llm_engine import LLMEngine
    engine = LLMEngine()
    health = engine.health_check()
    assert "server_running" in health
    assert "model" in health
    assert "circuit_breaker" in health
    assert "metrics" in health
    assert health["circuit_breaker"] == "closed"

def test_llm_offline_generate():
    from inference.llm_engine import LLMEngine
    engine = LLMEngine(max_retries=1)
    # Should return error gracefully, not crash
    result = engine.generate("test prompt")
    assert "[ERROR]" in result

def test_llm_offline_chat():
    from inference.llm_engine import LLMEngine
    engine = LLMEngine(max_retries=1)
    result = engine.chat([{"role": "user", "content": "hello"}])
    assert "[ERROR]" in result

def test_llm_offline_stream():
    from inference.llm_engine import LLMEngine
    engine = LLMEngine(max_retries=1)
    tokens = list(engine.chat_stream([{"role": "user", "content": "hello"}]))
    assert len(tokens) >= 1
    assert "[ERROR]" in tokens[0]

def test_llm_offline_json():
    from inference.llm_engine import LLMEngine
    engine = LLMEngine(max_retries=1)
    result = engine.generate_json("test")
    assert result is None

def test_llm_offline_tools():
    from inference.llm_engine import LLMEngine
    engine = LLMEngine(max_retries=1)
    result = engine.call_with_tools(
        [{"role": "user", "content": "hello"}],
        tools=[{"type": "function", "function": {"name": "test", "parameters": {}}}],
    )
    assert result["type"] == "error"

test("Init + config", test_llm_init)
test("Circuit breaker", test_llm_circuit_breaker)
test("Metrics tracking", test_llm_metrics)
test("Token estimation", test_llm_token_estimation)
test("Thinking parse", test_llm_thinking_parse)
test("Strip thinking", test_llm_strip_thinking)
test("Health check", test_llm_health_check)
test("Graceful offline generate", test_llm_offline_generate)
test("Graceful offline chat", test_llm_offline_chat)
test("Graceful offline stream", test_llm_offline_stream)
test("Graceful offline JSON", test_llm_offline_json)
test("Graceful offline tools", test_llm_offline_tools)


# ==========================================
# Task 1.3: BPE Tokenizer
# ==========================================
print("\n\u2501\u2501\u2501 Task 1.3: BPE Tokenizer \u2501\u2501\u2501")

def test_bpe_train():
    from tokenizer.bpe_tokenizer import BPETokenizer
    tok = BPETokenizer(vocab_size=200)
    corpus = [
        "machine learning is a branch of artificial intelligence",
        "deep learning uses neural networks with many layers",
        "natural language processing deals with text and speech",
        "machine learning and deep learning are popular fields",
        "neural networks are the foundation of deep learning",
    ] * 10  # Repeat for enough frequency
    stats = tok.train(corpus)
    assert stats["vocab_size"] > 20
    assert stats["num_merges"] > 0
    assert tok._trained

def test_bpe_encode_decode():
    from tokenizer.bpe_tokenizer import BPETokenizer
    tok = BPETokenizer(vocab_size=300)
    corpus = [
        "hello world hello world",
        "machine learning is great",
        "deep learning neural networks",
    ] * 20
    tok.train(corpus)
    ids = tok.encode("hello world")
    assert len(ids) > 0
    assert all(isinstance(i, int) for i in ids)
    # Decode should roughly reconstruct
    text = tok.decode(ids)
    assert len(text) > 0

def test_bpe_special_tokens():
    from tokenizer.bpe_tokenizer import BPETokenizer, SPECIAL_TOKENS
    tok = BPETokenizer(vocab_size=200)
    tok.train(["hello world test"] * 20)
    ids = tok.encode("hello", add_special=True)
    assert ids[0] == SPECIAL_TOKENS["[BOS]"]
    assert ids[-1] == SPECIAL_TOKENS["[EOS]"]

def test_bpe_vietnamese():
    from tokenizer.bpe_tokenizer import BPETokenizer
    tok = BPETokenizer(vocab_size=300)
    corpus = [
        "hoc sinh dang hoc toan hoc tai truong hoc",
        "tri tue nhan tao dang phat trien nhanh chong",
        "khoa hoc may tinh la nganh hoc quan trong",
    ] * 20
    tok.train(corpus)
    ids = tok.encode("hoc sinh dang hoc")
    assert len(ids) > 0
    decoded = tok.decode(ids)
    assert "hoc" in decoded

def test_bpe_save_load():
    import tempfile
    from tokenizer.bpe_tokenizer import BPETokenizer
    tok = BPETokenizer(vocab_size=200)
    tok.train(["hello world test machine learning"] * 20)
    ids_before = tok.encode("hello world")

    # Save
    path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "_test_bpe.json")
    tok.save(path)
    assert os.path.exists(path)

    # Load
    tok2 = BPETokenizer.load(path)
    ids_after = tok2.encode("hello world")
    assert ids_before == ids_after

    # Cleanup
    os.remove(path)

def test_bpe_tokenize():
    from tokenizer.bpe_tokenizer import BPETokenizer
    tok = BPETokenizer(vocab_size=200)
    tok.train(["hello world test"] * 20)
    tokens = tok.tokenize("hello world")
    assert len(tokens) > 0
    assert all(isinstance(t, str) for t in tokens)

def test_bpe_properties():
    from tokenizer.bpe_tokenizer import BPETokenizer
    tok = BPETokenizer(vocab_size=200)
    assert tok.pad_id == 0
    assert tok.unk_id == 1
    assert tok.bos_id == 2
    assert tok.eos_id == 3

def test_bpe_vocab_access():
    from tokenizer.bpe_tokenizer import BPETokenizer
    tok = BPETokenizer(vocab_size=200)
    tok.train(["hello world"] * 20)
    vocab = tok.get_vocab()
    assert "[PAD]" in vocab
    assert "[UNK]" in vocab
    assert tok.vocab_size_actual() > 9  # special + chars

test("Train BPE", test_bpe_train)
test("Encode + Decode", test_bpe_encode_decode)
test("Special tokens", test_bpe_special_tokens)
test("Vietnamese corpus", test_bpe_vietnamese)
test("Save + Load", test_bpe_save_load)
test("Tokenize (string output)", test_bpe_tokenize)
test("Special token IDs", test_bpe_properties)
test("Vocab access", test_bpe_vocab_access)


# ==========================================
# RESULTS
# ==========================================
print(f"\n{'=' * 50}")
print(f"  TASK 1.1 + 1.3 TEST RESULTS")
print(f"  \u2705 Passed: {PASS}")
print(f"  \u274c Failed: {FAIL}")
print(f"  Total:    {PASS + FAIL}")
print(f"{'=' * 50}")

sys.exit(1 if FAIL > 0 else 0)
