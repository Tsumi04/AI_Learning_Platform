import pytest
import os
import json
from agents.agent_memory import WorkingMemory, ShortTermMemory, EpisodicMemory, LongTermMemory, MemoryManager, MEMORY_DIR

@pytest.fixture
def clean_memory_dir():
    # Ensure memory dir exists
    os.makedirs(MEMORY_DIR, exist_ok=True)
    yield
    # Cleanup memory files created during tests
    for f in os.listdir(MEMORY_DIR):
        if f.startswith("episodic_test_") or f.startswith("semantic_test_"):
            try:
                os.remove(os.path.join(MEMORY_DIR, f))
            except Exception:
                pass

def test_working_memory():
    wm = WorkingMemory()
    assert wm.get("key1") is None
    
    wm.set("key1", "value1")
    assert wm.get("key1") == "value1"
    assert wm.get("key2", "default2") == "default2"
    
    wm.clear()
    assert wm.get("key1") is None

def test_short_term_memory():
    stm = ShortTermMemory(max_turns=3)
    
    stm.add_turn("system", "sys prompt")
    stm.add_turn("user", "msg 1")
    stm.add_turn("assistant", "resp 1")
    
    assert len(stm.turns) == 3
    assert stm.turns[0]["role"] == "system"
    
    # Adding a 4th turn should drop the oldest non-system prompt
    stm.add_turn("user", "msg 2")
    assert len(stm.turns) == 3
    assert stm.turns[0]["role"] == "system"
    assert stm.turns[1]["role"] == "assistant"
    assert stm.turns[1]["content"] == "resp 1"
    assert stm.turns[2]["role"] == "user"
    assert stm.turns[2]["content"] == "msg 2"
    
    stm.set_scratch("tool_1", {"result": "ok"})
    assert stm.get_scratch("tool_1") == {"result": "ok"}

def test_episodic_memory(clean_memory_dir):
    learner_id = "test_learner_1"
    em = EpisodicMemory(learner_id)
    
    em.record_episode("session_end", {"score": 95, "topic": "Math"})
    em.record_episode("session_end", {"score": 80, "topic": "Physics"})
    
    episodes = em.retrieve_recent_episodes(1)
    assert len(episodes) == 1
    assert episodes[0]["details"]["topic"] == "Physics"
    
    # Reload should read from file
    em2 = EpisodicMemory(learner_id)
    assert len(em2.episodes) == 2
    assert em2.episodes[0]["details"]["topic"] == "Math"

def test_long_term_memory(clean_memory_dir):
    learner_id = "test_learner_2"
    ltm = LongTermMemory(learner_id)
    
    ltm.update_fact("preferences", "theme", "dark")
    ltm.update_fact("general", "weakness", "calculus")
    
    assert ltm.get_fact("preferences", "theme") == "dark"
    assert ltm.get_fact("general", "weakness") == "calculus"
    assert ltm.get_fact("general", "unknown", "fallback") == "fallback"
    
    cat = ltm.get_category("preferences")
    assert "theme" in cat
    assert cat["theme"] == "dark"
    
    # Reload from file
    ltm2 = LongTermMemory(learner_id)
    assert ltm2.get_fact("preferences", "theme") == "dark"

def test_memory_manager(clean_memory_dir):
    learner_id = "test_learner_3"
    mm = MemoryManager(learner_id)
    
    # Working
    mm.working.set("active_task", "quiz")
    
    # Short term
    mm.short_term.add_turn("user", "hello")
    
    # Episodic
    mm.archive_session("Learned about AI", {"duration": 3600})
    
    # Long term
    mm.learn_fact("User is a beginner", category="profile")
    
    context = mm.retrieve_context()
    assert "active_task" in context["working_memory_keys"]
    assert context["recent_turns_count"] == 1
    assert len(context["recent_episodes"]) == 1
    assert context["recent_episodes"][0]["details"]["summary"] == "Learned about AI"
    assert context["learner_facts"] == {} # "profile" category != "general" category, default retrieve context fetches general
    
    assert mm.long_term.get_fact("profile", list(mm.long_term.facts["profile"].keys())[0]) == "User is a beginner"
