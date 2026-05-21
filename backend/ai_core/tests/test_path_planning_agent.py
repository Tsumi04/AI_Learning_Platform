import pytest
from typing import Dict, Any

from agents.agent_message import AgentMessage
from agents.agent_context import AgentContext, LearnerProfile, DocumentContext
from agents.path_planning_agent import PathPlanningAgent
from agents.base_agent import AgentCapability

class MockDKT:
    def predict_mastery(self, learner_id: str, concept: str) -> float:
        return 0.5

class MockGraphBuilder:
    def build(self, chunks, document_id, learner_id):
        return {
            "nodes": [{"id": 1, "concept": "Concept A"}, {"id": 2, "concept": "Concept B"}],
            "edges": []
        }

class MockPathOptimizer:
    def get_next_concepts(self, concepts, edges, mastery, n):
        return [{"concept": "Concept A", "reason": "Next step"}]

    def generate_study_plan(self, concepts, edges, mastery, days):
        return {"Day 1": ["Concept A"]}

class MockLLMEngine:
    def __init__(self):
        self.call_count = 0

    def call_with_tools(self, messages, tools, temperature, auto_execute, tool_handlers):
        self.call_count += 1
        return {"type": "text", "content": "Đây là lộ trình học tập của bạn..."}
            
    def chat(self, messages, temperature, max_tokens, thinking, json_mode):
        return "Đây là lộ trình học tập của bạn..."

def mock_doc_store(document_id: str):
    return {"chunks": ["Chunk 1"]}

@pytest.fixture
def agent():
    return PathPlanningAgent(
        llm_engine=MockLLMEngine(),
        path_optimizer=MockPathOptimizer(),
        dkt=MockDKT(),
        graph_builder=MockGraphBuilder(),
        doc_store_func=mock_doc_store
    )

@pytest.fixture
def context():
    learner = LearnerProfile(learner_id="test_user_1", language="vi")
    doc = DocumentContext(document_id="doc_123")
    ctx = AgentContext(conversation_id="session_1", learner=learner, document=doc)
    return ctx

def test_path_planning_agent_initialization(agent):
    assert agent.agent_id == "path_planning_agent"
    assert AgentCapability.PATH_PLANNING in agent.capabilities
    assert agent.thinking_mode is True
    assert len(agent.get_tools()) == 2

def test_path_planning_agent_tools(agent):
    tools = agent.get_tools()
    tool_names = [t.name for t in tools]
    assert "get_next_concepts" in tool_names
    assert "generate_study_plan" in tool_names
    
    # Test tool execution
    recs_result = agent._tool_get_next_concepts("user1", "doc_123", 2)
    assert "recommendations" in recs_result
    
    plan_result = agent._tool_generate_study_plan("user1", "doc_123", 3)
    assert "study_plan" in plan_result

def test_path_planning_agent_offline_fallback():
    agent = PathPlanningAgent(llm_engine=None)
    learner = LearnerProfile(learner_id="test_user_1", language="vi")
    ctx = AgentContext(conversation_id="session_1", learner=learner)
    msg = AgentMessage(type="chat", sender="user", receiver="path_planning_agent", content={"query": "Lên lịch học"})
    
    result_msg = agent.handle_message(msg, ctx)
    assert result_msg.content.get("data", {}).get("offline") is True
    assert "ngoại tuyến" in result_msg.content.get("text", "") or "offline" in result_msg.content.get("text", "")

def test_path_planning_agent_empty_query():
    agent = PathPlanningAgent(llm_engine=MockLLMEngine())
    learner = LearnerProfile(learner_id="test_user_1", language="vi")
    ctx = AgentContext(conversation_id="session_1", learner=learner)
    msg = AgentMessage(type="chat", sender="user", receiver="path_planning_agent", content={"query": "   "})
    
    result = agent.process(msg, ctx)
    assert result.success is False
    assert result.data.get("error") == "empty_query"

def test_path_planning_agent_process(agent, context):
    msg = AgentMessage(type="chat", sender="user", receiver="path_planning_agent", content={"query": "Gợi ý lộ trình"})
    result_msg = agent.handle_message(msg, context)
    
    assert "Đây là lộ trình" in result_msg.content.get("text", "")
