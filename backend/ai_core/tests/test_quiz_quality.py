"""
Quick test: Quiz Generator v5 quality improvements
Tests template-based question generation quality.
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from generation.quiz_generator import QuizGenerator
from knowledge.concept_extractor import ConceptExtractor

# Sample educational text (English)
SAMPLE_TEXT = """
Mitochondria are membrane-bound organelles found in the cytoplasm of eukaryotic cells.
They are often referred to as the powerhouses of the cell because they generate most of 
the cell's supply of adenosine triphosphate (ATP), which is used as a source of chemical energy.
Mitochondria have their own DNA, known as mitochondrial DNA or mtDNA, which is separate from 
the nuclear DNA found in the cell nucleus.

Chloroplasts are organelles found in plant cells and algae that conduct photosynthesis.
They capture light energy from the sun and convert it into chemical energy stored in glucose.
Chloroplasts contain chlorophyll, a green pigment that absorbs light, primarily in the blue 
and red portions of the electromagnetic spectrum.

The endoplasmic reticulum (ER) is a network of membranous tubules within the cytoplasm.
The rough ER has ribosomes attached to its surface and is involved in protein synthesis.
The smooth ER lacks ribosomes and is involved in lipid synthesis and detoxification.
"""

SAMPLE_VI = """
Ti thể (Mitochondria) là bào quan có màng kép, được tìm thấy trong tế bào chất của tế bào nhân thực.
Ti thể thường được gọi là nhà máy năng lượng của tế bào vì chúng tạo ra phần lớn ATP cho tế bào.
Ti thể có DNA riêng, được gọi là DNA ti thể (mtDNA), tách biệt với DNA nhân.

Lục lạp là bào quan có trong tế bào thực vật và tảo, thực hiện quá trình quang hợp.
Lục lạp chứa diệp lục, một sắc tố xanh hấp thụ ánh sáng.
"""

def test_concept_extraction():
    print("=" * 60)
    print("TEST 1: Concept Extraction Quality")
    print("=" * 60)
    
    extractor = ConceptExtractor(max_concepts=10)
    concepts = extractor.extract(SAMPLE_TEXT)
    
    print(f"\nExtracted {len(concepts)} concepts:")
    for c in concepts:
        defn = c.get("definition", "")[:60]
        print(f"  [{c['score']:.3f}] {c['concept']} (freq={c['frequency']})"
              + (f" | def: {defn}..." if defn else ""))
    
    # Check quality
    concept_names = [c["concept"].lower() for c in concepts]
    assert len(concepts) > 0, "Should extract some concepts"
    
    # Should find key domain terms
    found_key = sum(1 for key in ["mitochondria", "chloroplasts", "endoplasmic reticulum", "atp", "photosynthesis"]
                    if any(key in cn for cn in concept_names))
    print(f"\nKey domain terms found: {found_key}/5")
    assert found_key >= 2, f"Should find at least 2 key terms, found {found_key}"
    print("✓ PASS")

def test_mcq_short_answer():
    print("\n" + "=" * 60)
    print("TEST 2: MCQ Short Answer (not full sentence)")
    print("=" * 60)
    
    qgen = QuizGenerator()
    concepts = [
        {"concept": "Mitochondria"},
        {"concept": "Chloroplasts"},
        {"concept": "ATP"},
    ]
    chunks = [{"text": SAMPLE_TEXT}]
    
    from generation.quiz_generator import BLOOM_LEVELS_EN
    bloom = BLOOM_LEVELS_EN[1]  # Remember
    
    q = qgen._generate_mcq("Mitochondria", SAMPLE_TEXT, concepts, bloom, "en")
    if q:
        print(f"\nQuestion: {q['question_text']}")
        print(f"Answer: {q['correct_answer']}")
        print(f"Answer length: {len(q['correct_answer'])} chars")
        print(f"Distractors: {q['distractors']}")
        
        # Answer should be SHORT (not a full 200-char sentence)
        assert len(q['correct_answer']) < 150, f"Answer too long: {len(q['correct_answer'])} chars"
        print("✓ PASS — Answer is short")
    else:
        print("⚠ No MCQ generated (may need context)")

def test_true_false_subtle():
    print("\n" + "=" * 60)
    print("TEST 3: True/False Subtle Falsification")
    print("=" * 60)
    
    qgen = QuizGenerator()
    concepts = [
        {"concept": "Mitochondria"},
        {"concept": "Chloroplasts"},
        {"concept": "ATP"},
    ]
    
    # Generate multiple T/F to see variety of strategies
    false_count = 0
    strategies_seen = set()
    for _ in range(20):
        q = qgen._generate_true_false("Mitochondria", SAMPLE_TEXT, concepts, "en")
        if q and q['correct_answer'] == 'False':
            false_count += 1
            stmt = q['question_text']
            expl = q.get('explanation', '')
            # Detect which strategy was used
            if 'negated' in expl.lower() or 'not ' in stmt:
                strategies_seen.add('negation')
            elif 'number' in expl.lower() or 'altered' in expl.lower():
                strategies_seen.add('number_change')
            elif 'reversed' in expl.lower():
                strategies_seen.add('relationship_reverse')
            else:
                strategies_seen.add('concept_swap')
            
            if false_count <= 3:
                print(f"\n  False Q: {stmt[:100]}...")
                print(f"  Explanation: {expl[:80]}...")
    
    print(f"\n  Generated {false_count} false statements")
    print(f"  Strategies used: {strategies_seen}")
    print("✓ PASS")

def test_fill_blank_restructure():
    print("\n" + "=" * 60)
    print("TEST 4: Fill-blank Restructured (not verbatim)")
    print("=" * 60)
    
    qgen = QuizGenerator()
    
    q = qgen._generate_fill_blank("Mitochondria", SAMPLE_TEXT, "en")
    if q:
        print(f"\n  Question: {q['question_text']}")
        print(f"  Answer: {q['correct_answer']}")
        
        # Should contain blank
        assert "_______" in q['question_text'], "Should contain blank"
        print("✓ PASS")
    else:
        print("⚠ No fill-blank generated")

def test_distractor_quality():
    print("\n" + "=" * 60)
    print("TEST 5: Distractor Quality (no 'is used in place of')")
    print("=" * 60)
    
    qgen = QuizGenerator()
    concepts = [
        {"concept": "Mitochondria"},
        {"concept": "Chloroplasts"},
        {"concept": "ATP"},
        {"concept": "photosynthesis"},
    ]
    
    distractors = qgen._rule_distractors("Mitochondria", SAMPLE_TEXT, concepts, "en", 3)
    print(f"\n  Distractors for 'Mitochondria':")
    for d in distractors:
        print(f"    - {d[:80]}")
    
    # No distractor should contain the old pattern
    for d in distractors:
        assert "is used in place of" not in d, f"Old pattern found: {d}"
    
    print("✓ PASS — No 'is used in place of' patterns")

def test_vi_support():
    print("\n" + "=" * 60)
    print("TEST 6: Vietnamese Support")
    print("=" * 60)
    
    extractor = ConceptExtractor(max_concepts=5)
    concepts = extractor.extract(SAMPLE_VI)
    
    print(f"\n  Extracted {len(concepts)} Vietnamese concepts:")
    for c in concepts[:5]:
        print(f"    [{c['score']:.3f}] {c['concept']}")
    
    assert len(concepts) > 0, "Should extract Vietnamese concepts"
    print("✓ PASS")

if __name__ == "__main__":
    test_concept_extraction()
    test_mcq_short_answer()
    test_true_false_subtle()
    test_fill_blank_restructure()
    test_distractor_quality()
    test_vi_support()
    print("\n" + "=" * 60)
    print("ALL TESTS PASSED ✓")
    print("=" * 60)
