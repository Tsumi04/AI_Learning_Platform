"""
NEUROVAULT — BPE Tokenizer Training Script
Train BPE vocab từ sample bilingual corpus (EN/VI) và lưu vào data/bpe_vocab.json.

Usage:
    cd backend/ai_core
    python scripts/train_bpe.py
"""

import sys
import os

# Fix imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from tokenizer.bpe_tokenizer import BPETokenizer


# ── Bilingual Training Corpus (EN/VI) ──
# Đủ lớn để BPE học được subword patterns phổ biến

TRAINING_CORPUS = [
    # ── English: Computer Science ──
    """Machine learning is a subset of artificial intelligence that focuses on building systems
    that learn from data. Deep learning, a further subset, uses neural networks with multiple layers.
    Supervised learning uses labeled data to train models, while unsupervised learning finds patterns
    in unlabeled data. Reinforcement learning trains agents through rewards and penalties.
    Common algorithms include linear regression, decision trees, random forests, support vector machines,
    and neural networks. Gradient descent is the primary optimization technique used to minimize loss functions.
    Backpropagation computes gradients through the chain rule of calculus.
    Convolutional neural networks are particularly effective for image recognition tasks.
    Recurrent neural networks and transformers excel at sequential data processing.
    The transformer architecture, introduced in the 'Attention is All You Need' paper,
    revolutionized natural language processing with self-attention mechanisms.""",

    # ── English: Mathematics ──
    """Calculus is the mathematical study of continuous change. Differential calculus concerns
    instantaneous rates of change and slopes of curves. Integral calculus concerns accumulation
    of quantities and areas under curves. The fundamental theorem of calculus links these two branches.
    Linear algebra deals with vector spaces and linear mappings between such spaces.
    Matrices are rectangular arrays of numbers used to represent linear transformations.
    Probability theory is the branch of mathematics concerned with analysis of random phenomena.
    Statistics involves collecting, analyzing, interpreting, and presenting data.
    Discrete mathematics includes combinatorics, graph theory, and number theory.
    Algorithms and data structures form the foundation of computer science.
    Time complexity measures how the running time of an algorithm increases with input size.""",

    # ── English: Biology ──
    """Biology is the scientific study of life and living organisms. Cells are the basic structural
    and functional units of all living organisms. DNA contains the genetic instructions for development.
    Photosynthesis converts light energy into chemical energy in plants and other organisms.
    Evolution by natural selection is the process by which organisms change over successive generations.
    The human body consists of multiple organ systems including cardiovascular, respiratory, digestive,
    nervous, muscular, skeletal, and immune systems. Proteins are large molecules composed of amino acids
    that perform a vast array of functions within organisms. Enzymes are biological catalysts that
    accelerate chemical reactions. The cell membrane regulates the passage of substances in and out of cells.
    Mitosis is a type of cell division that results in two daughter cells each having the same number
    of chromosomes as the parent cell.""",

    # ── Vietnamese: Khoa học máy tính ──
    """Học máy là một nhánh của trí tuệ nhân tạo tập trung vào việc xây dựng các hệ thống
    có khả năng học từ dữ liệu. Học sâu sử dụng mạng nơ-ron nhiều tầng để giải quyết các bài toán phức tạp.
    Thuật toán là một tập hợp các bước hướng dẫn được định nghĩa rõ ràng để giải quyết một vấn đề.
    Cấu trúc dữ liệu bao gồm mảng, danh sách liên kết, cây, đồ thị, bảng băm và hàng đợi.
    Lập trình hướng đối tượng là một mô hình lập trình dựa trên khái niệm đối tượng.
    Python là ngôn ngữ lập trình phổ biến trong lĩnh vực khoa học dữ liệu và trí tuệ nhân tạo.
    JavaScript được sử dụng rộng rãi trong phát triển web cả phía máy khách và máy chủ.
    Cơ sở dữ liệu quan hệ sử dụng bảng để lưu trữ dữ liệu có cấu trúc.
    Mạng máy tính kết nối các thiết bị để chia sẻ tài nguyên và thông tin.
    An ninh mạng bảo vệ hệ thống khỏi các cuộc tấn công và truy cập trái phép.""",

    # ── Vietnamese: Toán học ──
    """Giải tích nghiên cứu sự thay đổi liên tục thông qua đạo hàm và tích phân.
    Đại số tuyến tính nghiên cứu không gian vectơ và phép biến đổi tuyến tính.
    Ma trận là mảng số hình chữ nhật được sử dụng trong nhiều lĩnh vực toán học.
    Xác suất và thống kê phân tích dữ liệu và dự đoán kết quả của các sự kiện ngẫu nhiên.
    Hình học giải tích kết hợp đại số với hình học để giải quyết các bài toán không gian.
    Số học nghiên cứu các tính chất của số nguyên và các phép toán cơ bản.
    Lý thuyết đồ thị nghiên cứu cấu trúc các đối tượng được kết nối bởi các cạnh.
    Tối ưu hóa tìm kiếm giá trị cực đại hoặc cực tiểu của hàm số với các ràng buộc.
    Phương trình vi phân mô tả mối quan hệ giữa hàm số và đạo hàm của nó.
    Giải thuật sắp xếp và tìm kiếm là nền tảng của khoa học máy tính.""",

    # ── Vietnamese: Sinh học ──
    """Sinh học nghiên cứu sự sống và các sinh vật sống trên Trái Đất.
    Tế bào là đơn vị cơ bản của sự sống, bao gồm màng tế bào, nhân và tế bào chất.
    ADN chứa thông tin di truyền quyết định đặc điểm của sinh vật.
    Quang hợp chuyển đổi năng lượng ánh sáng thành năng lượng hóa học trong thực vật.
    Tiến hóa là quá trình thay đổi đặc tính di truyền qua các thế hệ.
    Hệ thống tuần hoàn vận chuyển máu và chất dinh dưỡng đến các cơ quan.
    Hệ thống thần kinh điều khiển và phối hợp các hoạt động của cơ thể.
    Hệ tiêu hóa phân giải thức ăn thành chất dinh dưỡng cơ thể có thể hấp thụ.
    Hệ miễn dịch bảo vệ cơ thể khỏi vi khuẩn, vi rút và các tác nhân gây bệnh.
    Sinh thái học nghiên cứu mối quan hệ giữa các sinh vật và môi trường sống.""",

    # ── English: General Education ──
    """Education is the process of facilitating learning, acquiring knowledge, skills, values, and habits.
    Pedagogy refers to the theory and practice of education. Cognitive development theory by Jean Piaget
    describes how children construct mental models of the world. Bloom's Taxonomy categorizes educational
    objectives into six levels: remembering, understanding, applying, analyzing, evaluating, and creating.
    Spaced repetition is a learning technique that incorporates increasing intervals of time between
    subsequent review of previously learned material. Active recall involves stimulating memory during
    the learning process. The zone of proximal development represents the difference between what a learner
    can do without help and what they can achieve with guidance. Formative assessment provides ongoing
    feedback during instruction. Summative assessment evaluates student learning at the end of a unit.
    Metacognition is awareness and understanding of one's own thought processes.""",

    # ── Vietnamese: Giáo dục ──
    """Giáo dục là quá trình truyền đạt và tiếp nhận kiến thức, kỹ năng, giá trị và thói quen.
    Phương pháp Socratic khuyến khích tư duy phản biện thông qua việc đặt câu hỏi dẫn dắt.
    Học tập tích cực yêu cầu người học tham gia chủ động vào quá trình tiếp nhận kiến thức.
    Đánh giá hình thành cung cấp phản hồi liên tục trong quá trình giảng dạy.
    Lý thuyết đa trí tuệ của Howard Gardner cho rằng có nhiều loại trí thông minh khác nhau.
    Kỹ năng tư duy bậc cao bao gồm phân tích, đánh giá và sáng tạo theo thang Bloom.
    Học tập cá nhân hóa điều chỉnh nội dung và tốc độ học theo nhu cầu từng người.
    Ôn tập ngắt quãng giúp tăng cường khả năng ghi nhớ dài hạn hiệu quả.
    Trí tuệ nhân tạo trong giáo dục hỗ trợ cá nhân hóa trải nghiệm học tập.
    Đánh giá tổng kết đo lường kết quả học tập cuối kỳ hoặc cuối khóa học.""",

    # ── Additional mixed content for better coverage ──
    """The quick brown fox jumps over the lazy dog. Hello world, this is a test.
    Programming languages include Python, JavaScript, TypeScript, Java, C++, Rust, and Go.
    Web development frameworks like React, Vue, Angular, Next.js, and Express.js are widely used.
    Database systems include MongoDB, PostgreSQL, MySQL, Redis, and SQLite.
    Cloud computing services are provided by AWS, Google Cloud, Microsoft Azure.
    Version control with Git and GitHub enables collaborative software development.
    API design follows REST principles with HTTP methods GET, POST, PUT, DELETE.
    Containerization with Docker and orchestration with Kubernetes simplify deployment.
    Continuous integration and continuous deployment automate the software delivery pipeline.
    Testing methodologies include unit testing, integration testing, and end-to-end testing.""",

    """Việt Nam là quốc gia nằm ở Đông Nam Á với diện tích khoảng 331 nghìn km vuông.
    Hà Nội là thủ đô và thành phố Hồ Chí Minh là trung tâm kinh tế lớn nhất.
    Tiếng Việt sử dụng chữ cái Latin với các dấu thanh điệu đặc trưng.
    Nền giáo dục Việt Nam bao gồm các cấp mầm non, tiểu học, trung học và đại học.
    Công nghệ thông tin là ngành phát triển nhanh tại Việt Nam với nhiều cơ hội việc làm.
    Trí tuệ nhân tạo và học máy đang được ứng dụng rộng rãi trong nhiều lĩnh vực.
    Phát triển phần mềm là nghề nghiệp phổ biến với mức thu nhập hấp dẫn.
    Khởi nghiệp công nghệ tại Việt Nam đang phát triển mạnh mẽ với nhiều startup thành công.
    Chuyển đổi số giúp doanh nghiệp nâng cao hiệu quả hoạt động và khả năng cạnh tranh.
    An toàn thông tin là mối quan tâm hàng đầu trong kỷ nguyên số hóa.""",
]


def main():
    """Train BPE tokenizer và save vocabulary."""
    print("=" * 60)
    print("  NEUROVAULT — BPE Tokenizer Training")
    print("=" * 60)

    # Output path
    output_dir = os.path.join(os.path.dirname(__file__), "..", "data")
    os.makedirs(output_dir, exist_ok=True)
    output_path = os.path.join(output_dir, "bpe_vocab.json")

    # Train
    tokenizer = BPETokenizer(vocab_size=8192, min_frequency=2)
    stats = tokenizer.train(TRAINING_CORPUS, verbose=True)

    print(f"\n📊 Training Stats:")
    print(f"   Vocab size:    {stats['vocab_size']}")
    print(f"   Num merges:    {stats['num_merges']}")
    print(f"   Initial chars: {stats['initial_chars']}")
    print(f"   Unique words:  {stats['unique_words']}")
    print(f"   Corpus size:   {stats['corpus_size']:,} chars")

    # Save
    tokenizer.save(output_path)
    file_size = os.path.getsize(output_path)
    print(f"\n💾 Saved to: {output_path}")
    print(f"   File size: {file_size:,} bytes")

    # Verify
    print(f"\n🔍 Verification:")
    loaded = BPETokenizer.load(output_path)

    test_cases = [
        "Machine learning is a subset of artificial intelligence.",
        "Học máy là một nhánh của trí tuệ nhân tạo.",
        "Spaced repetition improves long-term memory retention.",
        "Ôn tập ngắt quãng giúp ghi nhớ dài hạn hiệu quả.",
        "The transformer architecture uses self-attention mechanisms.",
    ]

    for text in test_cases:
        ids = loaded.encode(text)
        decoded = loaded.decode(ids)
        tokens = loaded.tokenize(text)
        # Count UNKs
        unk_count = sum(1 for t in tokens if t == "[UNK]")
        print(f"   IN:  {text[:60]}...")
        print(f"   IDs: {len(ids)} tokens, {unk_count} UNKs")
        print(f"   OUT: {decoded[:60]}...")
        print()

    print("✅ BPE Tokenizer training complete!")


if __name__ == "__main__":
    main()
