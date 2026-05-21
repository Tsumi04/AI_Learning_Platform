"""
NEUROVAULT — Test Tutor Agent
Verify Socratic tutoring: phase detection, frustration, effort-gate,
scaffolding, suggestions, offline fallback, tool handlers.
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from agents.tutor_agent import TutorAgent, SocraticPhase, SCAFFOLDING_CONFIG
from agents.agent_message import AgentMessage, MessageType, MessagePriority
from agents.agent_context import AgentContext, LearnerProfile, DocumentContext
from agents.registry import AgentRegistry
from agents.orchestrator import AgentOrchestrator


def make_context(lang="en", mastery=None, doc_id=""):
    learner = LearnerProfile(learner_id="test_user", language=lang)
    if mastery:
        learner.mastery_snapshot = mastery
    doc = DocumentContext(document_id=doc_id) if doc_id else None
    return AgentContext(learner=learner, document=doc)


def make_message(query, lang="en"):
    return AgentMessage(
        type=MessageType.REQUEST,
        sender="orchestrator",
        receiver="tutor_agent",
        content={"query": query, "language": lang},
        priority=MessagePriority.HIGH,
    )


class MockDKT:
    def predict_mastery(self, learner_id, concept):
        return 0.5
    def get_weak_concepts(self, learner_id, threshold=0.5):
        return [{"concept": "test_concept", "mastery": 0.3}]


def test_tutor_init():
    agent = TutorAgent()
    assert agent.agent_id == "tutor_agent"
    assert agent.name == "Socratic Tutor"
    print("✅ test_tutor_init")


def test_scaffolding_levels():
    agent = TutorAgent()
    ctx = make_context(mastery={"a": 0.1})
    assert agent._get_scaffolding_level(ctx) == "novice"
    ctx2 = make_context(mastery={"a": 0.5})
    assert agent._get_scaffolding_level(ctx2) == "intermediate"
    ctx3 = make_context(mastery={"a": 0.7})
    assert agent._get_scaffolding_level(ctx3) == "advanced"
    ctx4 = make_context(mastery={"a": 0.9})
    assert agent._get_scaffolding_level(ctx4) == "expert"
    print("✅ test_scaffolding_levels")


def test_frustration_detection():
    agent = TutorAgent()
    ctx = make_context()
    assert agent._detect_frustration("hello", ctx) == 0.0
    assert agent._detect_frustration("i give up", ctx) >= 0.4
    assert agent._detect_frustration("too hard, i give up", ctx) >= 0.6
    assert agent._detect_frustration("không hiểu", ctx) >= 0.2
    print("✅ test_frustration_detection")


def test_direct_answer_detection():
    agent = TutorAgent()
    assert agent._is_direct_answer_request("give me the answer") is True
    assert agent._is_direct_answer_request("cho tôi đáp án") is True
    assert agent._is_direct_answer_request("explain photosynthesis") is False
    print("✅ test_direct_answer_detection")


def test_effort_gate():
    agent = TutorAgent()
    result_en = agent._effort_gate_response("answer?", "en")
    assert result_en.success is True
    assert "already know" in result_en.content
    result_vi = agent._effort_gate_response("đáp án?", "vi")
    assert "đã biết" in result_vi.content
    print("✅ test_effort_gate")


def test_socratic_phase_detection():
    agent = TutorAgent()
    ctx = make_context()
    # First message → ELICITING
    assert agent._detect_socratic_phase("hello", ctx) == SocraticPhase.ELICITING
    # Confusion → GUIDING
    assert agent._detect_socratic_phase("I don't understand", ctx) == SocraticPhase.GUIDING
    # Explanation → PROBING
    ctx.add_turn(role="user", content="test")
    ctx.add_turn(role="assistant", content="test")
    ctx.set_scratch("tutor_agent", "socratic_phase", SocraticPhase.ELICITING)
    assert agent._detect_socratic_phase("because I think X is Y", ctx) == SocraticPhase.PROBING
    print("✅ test_socratic_phase_detection")


def test_system_prompt_bilingual():
    agent = TutorAgent()
    ctx_en = make_context(lang="en")
    prompt_en = agent.get_system_prompt(ctx_en)
    assert "NEVER give direct answers" in prompt_en
    ctx_vi = make_context(lang="vi")
    prompt_vi = agent.get_system_prompt(ctx_vi)
    assert "TUYỆT ĐỐI KHÔNG" in prompt_vi
    print("✅ test_system_prompt_bilingual")


def test_suggestions():
    agent = TutorAgent()
    s_en = agent._generate_suggestions("test", SocraticPhase.ELICITING, "en")
    assert len(s_en) == 3
    s_vi = agent._generate_suggestions("test", SocraticPhase.RECONCILING, "vi")
    assert any("chủ đề tiếp" in s for s in s_vi)
    print("✅ test_suggestions")


def test_offline_fallback():
    agent = TutorAgent()
    ctx = make_context(lang="vi")
    result = agent._generate_offline_response("test", ctx, SocraticPhase.ELICITING)
    assert result.success is True
    assert "offline" in result.content.lower() or "Ollama" in result.content
    print("✅ test_offline_fallback")


def test_process_empty_query():
    agent = TutorAgent()
    ctx = make_context()
    msg = make_message("")
    result = agent.process(msg, ctx)
    assert result.success is False
    print("✅ test_process_empty_query")


def test_process_with_effort_gate():
    agent = TutorAgent()
    ctx = make_context()
    msg = make_message("give me the answer")
    result = agent.process(msg, ctx)
    assert result.success is True
    assert result.data.get("effort_gated") is True
    print("✅ test_process_with_effort_gate")


def test_tool_handlers():
    dkt = MockDKT()
    agent = TutorAgent(dkt=dkt)
    result = agent._tool_check_mastery("test_concept", "user1")
    assert result["status"] == "ok"
    assert 0 <= result["mastery"] <= 1
    weak = agent._tool_get_weak_concepts("user1")
    assert weak["status"] == "ok"
    print("✅ test_tool_handlers")


def test_registry_integration():
    agent = TutorAgent()
    registry = AgentRegistry()
    registry.register(agent)
    from agents.base_agent import AgentCapability
    found = registry.find_best_agent(AgentCapability.TUTORING)
    assert found is not None
    assert found.agent_id == "tutor_agent"
    print("✅ test_registry_integration")


def test_orchestrator_intent_routing():
    agent = TutorAgent()
    registry = AgentRegistry()
    registry.register(agent)
    orch = AgentOrchestrator(registry=registry, enable_safety=False)
    ctx = make_context()
    intent = orch._classify_intent("dạy tôi về photosynthesis", ctx)
    assert intent in ("tutor", "explain")
    intent2 = orch._classify_intent("teach me step by step", ctx)
    assert intent2 in ("tutor", "explain")
    print("✅ test_orchestrator_intent_routing")


def test_session_note():
    agent = TutorAgent()
    ctx = make_context(lang="vi")
    ctx.set_scratch("tutor_agent", "turn_count", 10)
    ctx.set_scratch("tutor_agent", "hint_count", 4)
    note = agent._build_session_note(ctx, frustration=0.7, lang="vi")
    assert "thất vọng" in note
    assert "gợi ý" in note
    assert "Session dài" in note
    print("✅ test_session_note")


if __name__ == "__main__":
    tests = [
        test_tutor_init,
        test_scaffolding_levels,
        test_frustration_detection,
        test_direct_answer_detection,
        test_effort_gate,
        test_socratic_phase_detection,
        test_system_prompt_bilingual,
        test_suggestions,
        test_offline_fallback,
        test_process_empty_query,
        test_process_with_effort_gate,
        test_tool_handlers,
        test_registry_integration,
        test_orchestrator_intent_routing,
        test_session_note,
    ]
    passed = 0
    failed = 0
    for t in tests:
        try:
            t()
            passed += 1
        except Exception as e:
            print(f"❌ {t.__name__}: {e}")
            failed += 1
    print(f"\n{'='*50}")
    print(f"Results: {passed} passed, {failed} failed, {passed+failed} total")
    print(f"{'='*50}")
