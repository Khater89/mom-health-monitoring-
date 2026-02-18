
import React, { useState, useRef, useEffect } from 'react';
import { startChat } from '../services/geminiService';

const ChatMentor: React.FC = () => {
  const [messages, setMessages] = useState<{ role: 'user' | 'model'; text: string }[]>([
    { role: 'model', text: 'Hi Sarah! I’m your MomHealthy Mentor. How are you feeling today?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [chatInstance] = useState(() => startChat());

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setLoading(true);

    try {
      const response = await chatInstance.sendMessage({ message: userMessage });
      const botText = response.text || "I'm sorry, I couldn't process that. Could you rephrase?";
      setMessages(prev => [...prev, { role: 'model', text: botText }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'model', text: "Error connecting to mentor. Please check your connection." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-12rem)] flex flex-col bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden animate-fadeIn">
      {/* Chat Header */}
      <div className="p-4 border-b border-gray-50 flex items-center gap-4 bg-white sticky top-0 z-10">
        <div className="w-12 h-12 bg-[#e89b93] rounded-2xl flex items-center justify-center text-white text-xl">
          <i className="fas fa-heart"></i>
        </div>
        <div>
          <h3 className="font-bold text-gray-800">Your Health Mentor</h3>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">AI Assistant Online</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-6 bg-gradient-to-b from-white to-[#fcfaf8]"
      >
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-4 rounded-3xl text-sm leading-relaxed shadow-sm ${
              msg.role === 'user' 
                ? 'bg-[#e89b93] text-white rounded-tr-none' 
                : 'bg-white text-gray-700 border border-gray-100 rounded-tl-none'
            }`}>
              {msg.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-100 p-4 rounded-3xl rounded-tl-none shadow-sm flex items-center gap-2">
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:0.4s]"></div>
              </div>
              <span className="text-xs text-gray-400 font-medium">Mentor is typing...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-4 bg-white border-t border-gray-50 flex items-center gap-3">
        <button type="button" className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-[#e89b93] transition-colors">
          <i className="fas fa-plus-circle text-xl"></i>
        </button>
        <input 
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about nutrition, recovery, or just vent..."
          className="flex-1 bg-gray-50 border-none rounded-2xl px-5 py-3 text-sm focus:ring-2 focus:ring-[#e89b93] focus:ring-opacity-20 outline-none"
        />
        <button 
          type="submit"
          disabled={loading || !input.trim()}
          className="w-12 h-12 bg-[#e89b93] text-white rounded-2xl flex items-center justify-center hover:bg-opacity-90 disabled:opacity-50 transition-all shadow-md"
        >
          <i className="fas fa-paper-plane"></i>
        </button>
      </form>
    </div>
  );
};

export default ChatMentor;
