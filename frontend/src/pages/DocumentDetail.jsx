import { useState } from 'react';
import ChatBox from '../components/chat/ChatBox';

export default function DocumentDetail() {
  const [activeTab, setActiveTab] = useState('Chat');

  const tabs = ['Content', 'Chat', 'AI Actions', 'Flashcards', 'Quizzes'];

  return (
    <div className="max-w-6xl mx-auto h-full flex flex-col">
      <h1 className="text-3xl font-semibold text-gray-900 mb-6">Ultimate HTML Guide</h1>
      
      {/* Tabs */}
      <div className="flex space-x-8 border-b border-gray-200 mb-6 px-1">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 text-sm font-medium transition-colors relative ${
              activeTab === tab
                ? 'text-primary'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab}
            {activeTab === tab && (
              <span className="absolute bottom-[-1px] left-0 w-full h-[2px] bg-primary rounded-t-lg"></span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 bg-gray-50/50 rounded-xl overflow-hidden flex flex-col">
          {activeTab === 'Chat' && <ChatBox />}
          {activeTab !== 'Chat' && (
            <div className="p-8 text-center text-gray-500 flex-1 flex items-center justify-center">
              Content for {activeTab} is under construction.
            </div>
          )}
      </div>
    </div>
  );
}
