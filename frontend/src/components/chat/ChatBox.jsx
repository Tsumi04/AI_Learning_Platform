import { useState } from 'react';
import { Send, Sparkles } from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';

export default function ChatBox() {
  const { user } = useAuthStore();
  const [inputText, setInputText] = useState('');
  
  // Mock Messages Array
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: 'user',
      content: 'What is HTML'
    },
    {
      id: 2,
      role: 'ai',
      content: 'HTML, or HyperText Markup Language, is the standard markup language used to create and structure content on web pages. It defines elements like headings, paragraphs, links, images, forms, and multimedia. HTML provides the structure of web pages, which browsers interpret and display to users.'
    }
  ]);

  const handleSend = () => {
    if (!inputText.trim()) return;
    
    // Add user message
    const newMessage = {
      id: Date.now(),
      role: 'user',
      content: inputText
    };
    
    setMessages(prev => [...prev, newMessage]);
    setInputText('');

    // Simulate AI typing delay
    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'ai',
        content: `Mô phỏng trả lời cho câu hỏi: "${newMessage.content}". Vì bạn sẽ tự viết thuật toán Local AI, dữ liệu này hiện là mock. Tương lai sẽ thay bằng API call thực tế của bạn.`
      }]);
    }, 1000);
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-gray-100/50 relative px-4">
      
      {/* Chat Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} items-end gap-3`}>
            
            {/* AI Avatar */}
            {msg.role === 'ai' && (
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white shrink-0 shadow-sm shadow-primary/20">
                <Sparkles size={20} className="stroke-[2]" />
              </div>
            )}

            {/* Message Bubble */}
            <div 
              className={`max-w-[70%] text-[15px] leading-relaxed p-4 shadow-sm ${
                msg.role === 'user' 
                  ? 'bg-primary text-white rounded-2xl rounded-br-sm' 
                  : 'bg-white border border-gray-200/80 text-gray-700 rounded-2xl rounded-bl-sm'
              }`}
            >
              {msg.content}
            </div>

            {/* User Avatar */}
            {msg.role === 'user' && (
              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 shrink-0 font-medium text-sm">
                {user?.avatar || 'A'}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Chat Input Area */}
      <div className="p-4 bg-white mt-auto sticky bottom-0">
        <div className="relative flex items-center bg-transparent">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask a follow-up question..."
            className="w-full pl-6 pr-14 py-4 rounded-full border border-gray-200/80 text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 shadow-sm transition-all"
          />
          <button 
            onClick={handleSend}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white hover:bg-primary/90 transition-colors shadow-sm shadow-primary/20"
          >
            <Send size={18} className="mr-0.5 mt-0.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
