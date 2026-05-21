"""
NEUROVAULT — Agent Framework Test Script
Chạy: python test_agents.py
"""

import sys
import io

# Windows encoding fix
if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")

sys.path.insert(0, '.')

from agents.agent_message import AgentMessage, MessageType, MessagePriority, MessageChain
from agents.agent_state import AgentState, AgentPhase, InvalidTransitionError
from agents.agent_context import AgentContext, LearnerProfile, DocumentContext
from agents.base_agent import BaseAgent, AgentCapability, ToolDefinition, AgentResult
from agents.registry import AgentRegistry
from agents.orchestrator import AgentOrchestrator, UserIntent

print("=== IMPORT TESTS ===")
print("[OK] All modules imported successfully")

# ─── Message Tests ───
print("\n=== MESSAGE TESTS ===")
msg = AgentMessage(
    type=MessageType.REQUEST,
    sender="user",
    receiver="tutor_agent",
    content={"query": "Explain neural networks"},
)
print(f"[OK] Message created: {msg}")

resp = msg.create_response(content={"text": "Neural networks are..."})
print(f"[OK] Response created: {resp}")

err = msg.create_error("TIMEOUT", "Agent timed out")
print(f"[OK] Error message: {err}")

json_str = msg.to_json()
msg2 = AgentMessage.from_json(json_str)
assert msg2.sender == "user"
assert msg2.receiver == "tutor_agent"
print("[OK] Message serialize/deserialize")

chain = MessageChain("conv123")
chain.add(msg)
chain.add(resp)
chain.add(err)
summary = chain.to_summary()
assert summary["total_messages"] == 3
print(f"[OK] MessageChain: {summary['total_messages']} messages")

# ─── State Machine Tests ───
print("\n=== STATE MACHINE TESTS ===")
state = AgentState("test_agent")
assert state.is_available
assert not state.is_busy
print(f"[OK] Initial state: {state.phase.value}")

state.transition(AgentPhase.THINKING, reason="Processing")
assert state.phase == AgentPhase.THINKING
assert state.is_busy
state.transition(AgentPhase.ACTING, reason="Action")
state.transition(AgentPhase.RESPONDING, reason="Response")
state.transition(AgentPhase.IDLE, reason="Done")
assert state.is_available
stats = state.get_stats()
print(f"[OK] Full lifecycle: {stats['total_transitions']} transitions")

try:
    state2 = AgentState("test2")
    state2.transition(AgentPhase.RESPONDING)
    print("[FAIL] Should have raised InvalidTransitionError")
    sys.exit(1)
except InvalidTransitionError:
    print("[OK] Invalid transition correctly rejected")

# ─── Context Tests ───
print("\n=== CONTEXT TESTS ===")
ctx = AgentContext(
    learner=LearnerProfile(learner_id="user123", language="vi"),
    document=DocumentContext(document_id="doc456", title="AI Textbook"),
)
ctx.set_working("intent", "explain")
assert ctx.get_working("intent") == "explain"
ctx.remember("last_topic", "neural networks")
assert ctx.recall("last_topic") == "neural networks"
ctx.add_turn("user", "What is backpropagation?")
ctx.add_turn("assistant", "Backpropagation is...", agent_id="tutor")
llm_msgs = ctx.get_llm_messages()
assert len(llm_msgs) == 2
print(f"[OK] Context: {len(llm_msgs)} turns, working memory OK")

ctx.cache_tool_result("search", "abc123", {"results": [1, 2, 3]})
cached = ctx.get_cached_tool_result("search", "abc123")
assert cached is not None
assert cached["results"] == [1, 2, 3]
print("[OK] Tool cache working")

# ─── Agent Tests ───
print("\n=== AGENT TESTS ===")

class DummyAgent(BaseAgent):
    def process(self, message, context):
        query = message.content.get("query", "")
        return AgentResult(
            success=True,
            content=f"Processed: {query}",
            data={"test": True},
            suggestions=["Try asking about X", "Learn more about Y"],
        )
    
    def get_system_prompt(self, context):
        return "You are a dummy test agent."
    
    def get_tools(self):
        return []

dummy = DummyAgent(
    agent_id="dummy_1",
    name="Dummy Agent",
    description="Test agent for framework validation",
    capabilities=[AgentCapability.CHAT, AgentCapability.TUTORING],
)
print(f"[OK] Agent created: {dummy}")

info = dummy.get_info()
assert info["agent_id"] == "dummy_1"
assert "chat" in info["capabilities"]
print(f"[OK] Agent info: {info['name']}")

# Handle message
test_msg = AgentMessage(
    type=MessageType.REQUEST,
    sender="orchestrator",
    receiver="dummy_1",
    content={"query": "test query"},
)
response = dummy.handle_message(test_msg, ctx)
assert response.type == MessageType.RESPONSE
assert "Processed: test query" in response.content.get("text", "")
print(f"[OK] Agent handle_message: response received")

# ─── Registry Tests ───
print("\n=== REGISTRY TESTS ===")
registry = AgentRegistry()
registry.register(dummy)
assert "dummy_1" in registry
print(f"[OK] Agent registered: {registry}")

found = registry.find_best_agent(AgentCapability.CHAT)
assert found is not None
assert found.agent_id == "dummy_1"
print("[OK] Agent found by capability: CHAT")

found2 = registry.find_best_agent(AgentCapability.TUTORING)
assert found2 is not None
print("[OK] Agent found by capability: TUTORING")

not_found = registry.find_best_agent(AgentCapability.SAFETY)
assert not_found is None
print("[OK] No agent for SAFETY (correct)")

health = registry.health_check()
assert health["total_agents"] == 1
assert health["available"] == 1
print(f"[OK] Health check: {health['total_agents']} agents, {health['available']} available")

# ─── Orchestrator Tests ───
print("\n=== ORCHESTRATOR TESTS ===")
orchestrator = AgentOrchestrator(registry=registry, llm_engine=None)
print(f"[OK] Orchestrator created: {orchestrator}")

status = orchestrator.get_status()
assert status["registry"]["total_agents"] == 1
print(f"[OK] Status: {status['active_conversations']} conversations")

# Intent classification
intent1 = orchestrator._classify_intent("Create a quiz about Machine Learning", ctx)
print(f"[OK] Intent '{intent1}' for 'Create a quiz about ML'")

intent2 = orchestrator._classify_intent("Explain backpropagation step by step", ctx)
print(f"[OK] Intent '{intent2}' for 'Explain backpropagation'")

intent3 = orchestrator._classify_intent("Summarize this document", ctx)
print(f"[OK] Intent '{intent3}' for 'Summarize this document'")

intent4 = orchestrator._classify_intent("What should I study next?", ctx)
print(f"[OK] Intent '{intent4}' for 'What should I study next?'")

intent5 = orchestrator._classify_intent("Tạo thẻ nhớ về chủ đề này", ctx)
print(f"[OK] Intent '{intent5}' for 'Tạo thẻ nhớ' (VI)")

# Process request
result = orchestrator.process_user_request(
    query="Hello, can you help me learn?",
    learner_id="test_user",
)
assert result["success"] == True
print(f"[OK] Process request: success={result['success']}, agent={result['agent_id']}, intent={result['intent']}")

# ─── Summary ───
print("\n" + "=" * 60)
print("  ALL TESTS PASSED — Agent Orchestrator Framework v1.0")
print("  Files created:")
print("    - agents/__init__.py")
print("    - agents/agent_message.py  (Message passing)")
print("    - agents/agent_state.py    (State machine)")
print("    - agents/agent_context.py  (Shared context)")
print("    - agents/base_agent.py     (Abstract base agent)")
print("    - agents/registry.py       (Agent registry)")
print("    - agents/orchestrator.py   (Supervisor orchestrator)")
print("=" * 60)
