"""
NEUROVAULT — Phase 1 Module Tests
Kiểm tra toàn bộ modules v2 đã implement.
Chạy: python tests/test_phase1.py
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import traceback

PASS = 0
FAIL = 0

def test(name, func):
    global PASS, FAIL
    try:
        func()
        print(f"  ✅ {name}")
        PASS += 1
    except Exception as e:
        print(f"  ❌ {name}: {e}")
        traceback.print_exc()
        FAIL += 1


# ══════════════════════════════════════
# Task 1.4: Vietnamese NLP
# ══════════════════════════════════════
print("\n━━━ Task 1.4: Vietnamese NLP ━━━")

def test_vi_normalize():
    from nlp.vietnamese import VietnameseNLP
    nlp = VietnameseNLP()
    result = nlp.normalize("  Xin   chào\u200b  thế\u00adgiới  ")
    assert "  " not in result.strip()
    assert "\u200b" not in result

def test_vi_segment():
    from nlp.vietnamese import VietnameseNLP
    nlp = VietnameseNLP()
    tokens = nlp.segment("Trí tuệ nhân tạo đang phát triển nhanh")
    assert "trí_tuệ_nhân_tạo" in tokens

def test_vi_tokenize():
    from nlp.vietnamese import VietnameseNLP
    nlp = VietnameseNLP()
    tokens = nlp.tokenize("Học sinh đang học toán học tại trường học")
    # Stopwords should be removed
    assert "đang" not in tokens

def test_vi_diacritics():
    from nlp.vietnamese import VietnameseNLP
    result = VietnameseNLP.remove_diacritics("Xin chào Việt Nam")
    assert result == "Xin chao Viet Nam"

def test_vi_is_vietnamese():
    from nlp.vietnamese import VietnameseNLP
    nlp = VietnameseNLP()
    assert nlp.is_vietnamese("Đây là một câu tiếng Việt") > 0.05
    assert nlp.is_vietnamese("This is English") < 0.01

test("Normalize", test_vi_normalize)
test("Segment compound words", test_vi_segment)
test("Tokenize + stopwords", test_vi_tokenize)
test("Remove diacritics", test_vi_diacritics)
test("Language detection", test_vi_is_vietnamese)


# ══════════════════════════════════════
# Task 1.2: Embedding v2 (Truncated SVD)
# ══════════════════════════════════════
print("\n━━━ Task 1.2: Embedding v2 ━━━")

def test_embed_fit():
    from embedding.embedding_engine import EmbeddingEngine
    engine = EmbeddingEngine(mode="tfidf", dim=64)
    docs = [
        "Machine learning is a subset of artificial intelligence",
        "Deep learning uses neural networks with many layers",
        "Natural language processing deals with text understanding",
        "Computer vision focuses on image and video analysis",
        "Reinforcement learning involves agents and rewards",
    ]
    engine.fit(docs)
    vec = engine.embed("machine learning neural networks")
    assert len(vec) == 64
    assert any(v != 0.0 for v in vec)

def test_embed_similarity():
    from embedding.embedding_engine import EmbeddingEngine
    engine = EmbeddingEngine(mode="tfidf", dim=64)
    docs = [
        "Machine learning trains models from data",
        "Deep learning is a type of machine learning",
        "Cooking recipes involve ingredients and steps",
        "Baking bread requires flour and yeast",
    ]
    engine.fit(docs)
    v1 = engine.embed("machine learning models")
    v2 = engine.embed("deep learning AI")
    v3 = engine.embed("bread baking recipe")
    sim_related = EmbeddingEngine.cosine_similarity(v1, v2)
    sim_unrelated = EmbeddingEngine.cosine_similarity(v1, v3)
    assert sim_related > sim_unrelated, f"Related ({sim_related:.3f}) should > unrelated ({sim_unrelated:.3f})"

test("Fit + Embed", test_embed_fit)
test("Similarity ranking", test_embed_similarity)


# ══════════════════════════════════════
# Task 1.10: FSRS v6
# ══════════════════════════════════════
print("\n━━━ Task 1.10: FSRS v6 ━━━")

def test_fsrs_17_weights():
    from adaptive.spaced_repetition import FSRSv6
    fsrs = FSRSv6()
    assert len(fsrs.get_weights()) == 17

def test_fsrs_initial_review():
    from adaptive.spaced_repetition import FSRSv6
    fsrs = FSRSv6()
    r1 = fsrs.initial_review(1)  # AGAIN
    r3 = fsrs.initial_review(3)  # GOOD
    r4 = fsrs.initial_review(4)  # EASY
    assert r1["interval_days"] < r3["interval_days"]
    assert r3["interval_days"] < r4["interval_days"]
    assert r1["stability"] < r3["stability"]

def test_fsrs_subsequent_review():
    from adaptive.spaced_repetition import FSRSv6
    fsrs = FSRSv6()
    init = fsrs.initial_review(3)
    result = fsrs.review(
        rating=3, stability=init["stability"], difficulty=init["difficulty"],
        elapsed_days=init["interval_days"], review_count=1,
    )
    assert result["stability"] > init["stability"]
    assert result["review_count"] == 2

def test_fsrs_forgetting():
    from adaptive.spaced_repetition import FSRSv6
    fsrs = FSRSv6()
    init = fsrs.initial_review(3)
    # After rating AGAIN, stability should decrease
    result = fsrs.review(
        rating=1, stability=init["stability"], difficulty=init["difficulty"],
        elapsed_days=30, review_count=1,
    )
    assert result["stability"] < init["stability"]

def test_fsrs_retrievability():
    from adaptive.spaced_repetition import FSRSv6
    fsrs = FSRSv6()
    r0 = fsrs.get_retrievability(0, 5.0)
    r10 = fsrs.get_retrievability(10, 5.0)
    r30 = fsrs.get_retrievability(30, 5.0)
    assert r0 > r10 > r30
    assert 0 < r30 < r10 < r0 <= 1.0

def test_fsrs_simulate():
    from adaptive.spaced_repetition import FSRSv6
    fsrs = FSRSv6()
    results = fsrs.simulate_learning(num_reviews=10, rating_pattern=[3, 3, 4, 3, 2])
    assert len(results) == 10
    assert results[-1]["stability"] > results[0]["stability"]

test("17 weights", test_fsrs_17_weights)
test("Initial review ordering", test_fsrs_initial_review)
test("Subsequent review", test_fsrs_subsequent_review)
test("Forgetting (AGAIN)", test_fsrs_forgetting)
test("Retrievability decay", test_fsrs_retrievability)
test("Simulate learning", test_fsrs_simulate)


# ══════════════════════════════════════
# Task 1.11: DKT v2
# ══════════════════════════════════════
print("\n━━━ Task 1.11: DKT v2 ━━━")

def test_dkt_update():
    from adaptive.deep_knowledge_tracer import DeepKnowledgeTracer
    dkt = DeepKnowledgeTracer()
    result = dkt.update("user1", "algebra", True)
    assert result["new_mastery"] > result["old_mastery"]
    assert result["streak"] == 1

def test_dkt_forgetting_curve():
    from adaptive.deep_knowledge_tracer import DeepKnowledgeTracer
    dkt = DeepKnowledgeTracer()
    dkt.update("user1", "calc", True)
    dkt.update("user1", "calc", True)
    curve = dkt.get_forgetting_curve("user1", "calc", days_ahead=7)
    assert len(curve) == 8  # day 0 through day 7
    assert curve[0]["retrievability"] >= curve[-1]["retrievability"]

def test_dkt_weak_concepts():
    from adaptive.deep_knowledge_tracer import DeepKnowledgeTracer
    dkt = DeepKnowledgeTracer()
    dkt.update("user1", "easy", True)
    dkt.update("user1", "easy", True)
    dkt.update("user1", "easy", True)
    dkt.update("user1", "hard", False)
    dkt.update("user1", "hard", False)
    weak = dkt.get_weak_concepts("user1", threshold=0.5)
    weak_names = [w["concept"] for w in weak]
    assert "hard" in weak_names

def test_dkt_summary():
    from adaptive.deep_knowledge_tracer import DeepKnowledgeTracer
    dkt = DeepKnowledgeTracer()
    dkt.update("user1", "a", True)
    dkt.update("user1", "b", False)
    summary = dkt.get_learner_summary("user1")
    assert summary["total_concepts"] == 2
    assert summary["total_interactions"] == 2

test("Update + streak tracking", test_dkt_update)
test("Forgetting curve", test_dkt_forgetting_curve)
test("Weak concepts", test_dkt_weak_concepts)
test("Learner summary", test_dkt_summary)


# ══════════════════════════════════════
# Task 1.6: Knowledge Graph v2
# ══════════════════════════════════════
print("\n━━━ Task 1.6: Knowledge Graph v2 ━━━")

def test_kg_build():
    from knowledge.graph_builder import KnowledgeGraphBuilder
    builder = KnowledgeGraphBuilder()
    chunks = [
        {"chunk_id": "c1", "text": "Machine learning is a subset of artificial intelligence. It uses algorithms to learn from data.", "position": 0},
        {"chunk_id": "c2", "text": "Deep learning is a type of machine learning that uses neural networks.", "position": 1},
        {"chunk_id": "c3", "text": "Natural language processing requires machine learning techniques.", "position": 2},
    ]
    graph = builder.build(chunks, "doc1", "user1")
    assert len(graph["nodes"]) > 0
    assert "stats" in graph
    assert "prerequisite_order" in graph

test("Build knowledge graph", test_kg_build)


# ══════════════════════════════════════
# Task 1.7: Quiz Generator v2
# ══════════════════════════════════════
print("\n━━━ Task 1.7: Quiz Generator v2 ━━━")

def test_quiz_bloom():
    from generation.quiz_generator import QuizGenerator, BLOOM_LEVELS
    qg = QuizGenerator()
    concepts = [
        {"concept": "neural network"},
        {"concept": "deep learning"},
        {"concept": "backpropagation"},
    ]
    chunks = [
        {"text": "Neural network is a computing system inspired by biological neural networks. Deep learning uses neural networks with many layers. Backpropagation is an algorithm for training neural networks.", "chunk_id": "c1"},
    ]
    questions = qg.generate_from_concepts(concepts, chunks, num_questions=5, difficulty=0.3)
    assert len(questions) > 0
    assert all("bloom_level" in q for q in questions)
    assert all("explanation" in q for q in questions)

def test_quiz_types():
    from generation.quiz_generator import QuizGenerator
    qg = QuizGenerator()
    concepts = [
        {"concept": "machine learning"},
        {"concept": "supervised learning"},
        {"concept": "data science"},
    ]
    chunks = [
        {"text": "Machine learning is a branch of artificial intelligence that enables computers to learn from data. Supervised learning uses labeled data to train models. Data science combines statistics and programming.", "chunk_id": "c1"},
    ]
    questions = qg.generate_from_concepts(concepts, chunks, num_questions=6, difficulty=0.5)
    types = {q["question_type"] for q in questions}
    assert len(types) >= 2, f"Should have multiple types, got: {types}"

test("Bloom's taxonomy integration", test_quiz_bloom)
test("Multiple question types", test_quiz_types)


# ══════════════════════════════════════
# Task 1.8: Flashcard Generator v2
# ══════════════════════════════════════
print("\n━━━ Task 1.8: Flashcard Generator v2 ━━━")

def test_flashcard_types():
    from generation.flashcard_generator import FlashcardGenerator
    fg = FlashcardGenerator()
    concepts = [
        {"concept": "neural network"},
        {"concept": "gradient descent"},
    ]
    chunks = [
        {"text": "Neural network is a computing system inspired by biological neurons. Gradient descent is an optimization algorithm used to minimize loss functions.", "chunk_id": "c1"},
    ]
    cards = fg.generate(concepts, chunks, max_cards=10)
    assert len(cards) > 0
    types = {c["card_type"] for c in cards}
    assert "concept" in types
    assert all("fsrs" in c for c in cards)
    assert all("card_id" in c for c in cards)
    assert all("difficulty_estimate" in c for c in cards)

test("Multiple card types + FSRS metadata", test_flashcard_types)


# ══════════════════════════════════════
# Task 1.9: Summary Generator v2
# ══════════════════════════════════════
print("\n━━━ Task 1.9: Summary Generator v2 ━━━")

def test_summary_mmr():
    from generation.summary_generator import SummaryGenerator
    sg = SummaryGenerator()
    text = (
        "Machine learning is a branch of AI. "
        "It enables computers to learn from data. "
        "Deep learning is a subset of machine learning. "
        "Neural networks have multiple layers. "
        "Training requires large datasets. "
        "Optimization algorithms improve model performance. "
        "Gradient descent is commonly used for optimization. "
        "Backpropagation computes gradients efficiently. "
        "Transfer learning reuses pretrained models. "
        "Data augmentation increases training data diversity."
    )
    result = sg.summarize(text, num_sentences=3, use_mmr=True)
    assert len(result["key_sentences"]) <= 3
    assert result["compression_ratio"] < 1.0
    assert len(result["keywords"]) > 0

test("MMR summarization + keywords", test_summary_mmr)


# ══════════════════════════════════════
# Task 1.12: Learning Path Optimizer
# ══════════════════════════════════════
print("\n━━━ Task 1.12: Learning Path Optimizer ━━━")

def test_path_optimizer():
    from learning.path_optimizer import LearningPathOptimizer
    opt = LearningPathOptimizer()
    concepts = [
        {"concept": "algebra", "centrality_score": 0.8},
        {"concept": "calculus", "centrality_score": 0.7},
        {"concept": "addition", "centrality_score": 0.5},
    ]
    edges = [
        {"source": "addition", "target": "algebra", "relation_type": "prerequisite"},
        {"source": "algebra", "target": "calculus", "relation_type": "prerequisite"},
    ]
    mastery = {"addition": 0.9, "algebra": 0.4, "calculus": 0.1}
    path = opt.optimize_path(concepts, edges, mastery)
    assert len(path) == 3
    # First should be most actionable
    assert all("action" in p for p in path)
    assert all("priority" in p for p in path)

def test_next_concepts():
    from learning.path_optimizer import LearningPathOptimizer
    opt = LearningPathOptimizer()
    concepts = [
        {"concept": "basics", "centrality_score": 0.5},
        {"concept": "intermediate", "centrality_score": 0.6},
        {"concept": "advanced", "centrality_score": 0.7},
    ]
    edges = [
        {"source": "basics", "target": "intermediate", "relation_type": "prerequisite"},
        {"source": "intermediate", "target": "advanced", "relation_type": "prerequisite"},
    ]
    mastery = {"basics": 0.3, "intermediate": 0.1, "advanced": 0.0}
    recs = opt.get_next_concepts(concepts, edges, mastery, n=3)
    assert len(recs) > 0
    # Advanced should not be first (prerequisites not met)
    first_concept = recs[0]["concept"]
    assert first_concept != "advanced"

def test_study_plan():
    from learning.path_optimizer import LearningPathOptimizer
    opt = LearningPathOptimizer(daily_target=5)
    concepts = [{"concept": f"topic_{i}", "centrality_score": 0.5} for i in range(20)]
    edges = []
    mastery = {f"topic_{i}": i * 0.05 for i in range(20)}
    plan = opt.generate_study_plan(concepts, edges, mastery, days=3)
    assert len(plan) == 3
    assert all("date" in day for day in plan)
    assert all("estimated_time_min" in day for day in plan)

test("Optimize path", test_path_optimizer)
test("Next concepts recommendation", test_next_concepts)
test("Study plan generation", test_study_plan)


# ══════════════════════════════════════
# RESULTS
# ══════════════════════════════════════
print(f"\n{'═' * 50}")
print(f"  PHASE 1 TEST RESULTS")
print(f"  ✅ Passed: {PASS}")
print(f"  ❌ Failed: {FAIL}")
print(f"  Total:    {PASS + FAIL}")
print(f"{'═' * 50}")

sys.exit(1 if FAIL > 0 else 0)
