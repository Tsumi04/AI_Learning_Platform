"""
NEUROVAULT — Test Assessment Agent
Verify rubric evaluation, tool handlers, offline fallback, and system prompt.
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from agents.assessment_agent import AssessmentAgent, AssessmentPhase
from agents.agent_message import AgentMessage, MessageType, MessagePriority
from agents.agent_context import AgentContext, LearnerProfile, DocumentContext

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
        receiver="assessment_agent",
        content={"query": query, "language": lang},
        priority=MessagePriority.HIGH,
    )

class MockDKT:
    def update(self, learner_id, concept, is_correct):
        return {"mastery": 0.8 if is_correct else 0.2}
    def get_weak_concepts(self, learner_id, threshold=0.6):
        return [{"concept": "weak_concept_1", "mastery": 0.3}, {"concept": "weak_concept_2", "mastery": 0.4}]

class MockQuizGenerator:
    def generate_from_concepts(self, concepts, chunks, num_questions, difficulty):
        return [{"question": f"Q about {concepts[0]['concept']}", "options": ["A", "B", "C", "D"], "answer": "A"}]

def mock_doc_store(doc_id):
    if doc_id == "doc123":
        return {"chunks": ["chunk1", "chunk2"]}
    return None

def test_assessment_init():
    agent = AssessmentAgent()
    assert agent.agent_id == "assessment_agent"
    assert agent.name == "Assessment Agent"
    assert agent.thinking_mode is True
    print("✅ test_assessment_init")

def test_system_prompt_bilingual():
    agent = AssessmentAgent()
    ctx_en = make_context(lang="en", doc_id="doc_en_1")
    prompt_en = agent.get_system_prompt(ctx_en)
    assert "You are NeuroVault Assessment" in prompt_en
    assert "ALWAYS call `update_mastery`" in prompt_en
    
    ctx_vi = make_context(lang="vi", doc_id="doc_vi_1")
    prompt_vi = agent.get_system_prompt(ctx_vi)
    assert "Bạn là NeuroVault Assessment" in prompt_vi
    assert "LUÔN LUÔN gọi `update_mastery`" in prompt_vi
    print("✅ test_system_prompt_bilingual")

def test_offline_fallback():
    agent = AssessmentAgent()
    ctx = make_context(lang="vi")
    msg = make_message("kiểm tra bài", lang="vi")
    result = agent.process(msg, ctx)
    assert result.success is True
    assert "ngoại tuyến" in result.content.lower()
    assert result.data.get("offline") is True
    print("✅ test_offline_fallback")

def test_process_empty_query():
    agent = AssessmentAgent()
    ctx = make_context(lang="en")
    msg = make_message("   ")
    result = agent.process(msg, ctx)
    assert result.success is False
    assert "Please provide" in result.content
    assert result.data.get("error") == "empty_query"
    print("✅ test_process_empty_query")

def test_tool_get_weak_concepts():
    dkt = MockDKT()
    agent = AssessmentAgent(dkt=dkt)
    res = agent._tool_get_weak_concepts("user1")
    assert res["status"] == "success"
    assert "weak_concept_1" in res["weak_concepts"]
    print("✅ test_tool_get_weak_concepts")

def test_tool_update_mastery():
    dkt = MockDKT()
    agent = AssessmentAgent(dkt=dkt)
    res_correct = agent._tool_update_mastery("user1", "math", True)
    assert res_correct["status"] == "success"
    assert res_correct["new_mastery"] == 0.8
    assert res_correct["concept"] == "math"
    
    res_incorrect = agent._tool_update_mastery("user1", "math", False)
    assert res_incorrect["new_mastery"] == 0.2
    print("✅ test_tool_update_mastery")

def test_tool_generate_quiz():
    qg = MockQuizGenerator()
    agent = AssessmentAgent(quiz_generator=qg, doc_store_func=mock_doc_store)
    
    # Missing doc
    res_nodoc = agent._tool_generate_quiz("invalid_doc", ["c1"])
    assert res_nodoc["status"] == "document_not_found"
    
    # Valid doc
    res_valid = agent._tool_generate_quiz("doc123", ["c1"], 3)
    assert res_valid["status"] == "success"
    assert len(res_valid["questions"]) == 1
    assert "c1" in res_valid["questions"][0]["question"]
    print("✅ test_tool_generate_quiz")

if __name__ == "__main__":
    tests = [
        test_assessment_init,
        test_system_prompt_bilingual,
        test_offline_fallback,
        test_process_empty_query,
        test_tool_get_weak_concepts,
        test_tool_update_mastery,
        test_tool_generate_quiz,
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
