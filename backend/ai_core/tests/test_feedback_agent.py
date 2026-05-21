import pytest
from typing import Dict, Any

from agents.agent_message import AgentMessage
from agents.agent_context import AgentContext, LearnerProfile
from agents.feedback_agent import FeedbackAgent
from agents.base_agent import AgentCapability

class MockDKT:
    def get_learner_summary(self, learner_id: str) -> Dict[str, Any]:
        return {
            "total_concepts": 10,
            "mastered_concepts": 4,
            "average_mastery": 0.65,
            "study_time_minutes": 120,
            "current_streak": 3
        }
        
    def get_weak_concepts(self, learner_id: str, threshold: float = 0.7) -> list:
        return [
            {"concept": "Gradient Descent", "mastery": 0.4},
            {"concept": "Backpropagation", "mastery": 0.3}
        ]

class MockLLMEngine:
    def __init__(self):
        self.call_count = 0

    def call_with_tools(self, messages, tools, temperature, auto_execute, tool_handlers):
        self.call_count += 1
        if self.call_count == 1:
            # Simulate returning tool results
            if tool_handlers and "get_learner_summary" in tool_handlers:
                res = tool_handlers["get_learner_summary"]("test_user_1")
                return {
                    "type": "tool_results",
                    "tool_calls": [{"function": {"name": "get_learner_summary", "arguments": {"learner_id": "test_user_1"}}}],
                    "results": [{"function": "get_learner_summary", "result": res}]
                }
            return {"type": "text", "content": "Đây là phân tích kết quả học tập của bạn..."}
            
    def chat(self, messages, temperature, max_tokens, thinking, json_mode):
        return "Đây là phân tích kết quả học tập của bạn..."

@pytest.fixture
def agent():
    dkt = MockDKT()
    llm = MockLLMEngine()
    return FeedbackAgent(llm_engine=llm, dkt=dkt)

@pytest.fixture
def context():
    learner = LearnerProfile(learner_id="test_user_1", language="vi")
    ctx = AgentContext(conversation_id="session_1", learner=learner)
    return ctx

def test_feedback_agent_initialization(agent):
    assert agent.agent_id == "feedback_agent"
    assert AgentCapability.FEEDBACK in agent.capabilities
    assert len(agent.get_tools()) == 2

def test_feedback_agent_tools(agent):
    tools = agent.get_tools()
    tool_names = [t.name for t in tools]
    assert "get_learner_summary" in tool_names
    assert "get_weak_concepts" in tool_names
    
    # Test tool execution
    summary_result = agent._tool_get_learner_summary("user1")
    assert summary_result["status"] == "success"
    assert "summary" in summary_result
    
    weak_result = agent._tool_get_weak_concepts("user1")
    assert weak_result["status"] == "success"
    assert len(weak_result["weak_concepts"]) == 2

def test_feedback_agent_offline_fallback():
    agent = FeedbackAgent(llm_engine=None)
    learner = LearnerProfile(learner_id="test_user_1", language="vi")
    ctx = AgentContext(conversation_id="session_1", learner=learner)
    msg = AgentMessage(type="chat", sender="user", receiver="feedback_agent", content={"query": "Đánh giá tôi đi"})
    
    result_msg = agent.handle_message(msg, ctx)
    assert result_msg.content.get("data", {}).get("offline") is True
    assert "ngoại tuyến" in result_msg.content.get("text", "") or "offline" in result_msg.content.get("text", "")

def test_feedback_agent_empty_query():
    agent = FeedbackAgent(llm_engine=MockLLMEngine())
    learner = LearnerProfile(learner_id="test_user_1", language="vi")
    ctx = AgentContext(conversation_id="session_1", learner=learner)
    msg = AgentMessage(type="chat", sender="user", receiver="feedback_agent", content={"query": "   "})
    
    result = agent.process(msg, ctx)
    assert result.success is False
    assert result.data.get("error") == "empty_query"

def test_feedback_agent_process(agent, context):
    msg = AgentMessage(type="chat", sender="user", receiver="feedback_agent", content={"query": "Cho tôi lời khuyên"})
    result_msg = agent.handle_message(msg, context)
    
    assert "Đây là phân tích" in result_msg.content.get("text", "")

