
import React, { useState, useRef, useEffect } from 'react';
import { startChat } from '../services/geminiService';

const ChatMentor: React.FC = () => {
  const [messages, setMessages] = useState<{ role: 'user' | 'model'; text: string }[]>([
    { role: 'model', text: 'أهلاً بك! أنا رفيق "أمان" الذكي. كيف يمكنني مساعدتك اليوم في رعاية الوالدة؟' }
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
      const botText = response.text || "عذراً، لم أتمكن من معالجة طلبك حالياً.";
      setMessages(prev => [...prev, { role: 'model', text: botText }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'model', text: "حدث خطأ في الاتصال. يرجى المحاولة مرة أخرى." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-14rem)] flex flex-col bg-white rounded-[3rem] shadow-2xl border border-slate-100 overflow-hidden animate-fadeIn text-right">
      {/* Chat Header */}
      <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-white sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white text-2xl shadow-xl shadow-blue-100">
            <i className="fas fa-robot"></i>
          </div>
          <div>
            <h3 className="font-black text-slate-800 text-lg">مساعد أمان الذكي</h3>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Gemini 3 Pro Online</span>
            </div>
          </div>
        </div>
        <button className="text-slate-300 hover:text-blue-600 transition-colors">
          <i className="fas fa-ellipsis-h text-xl"></i>
        </button>
      </div>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-8 space-y-6 bg-slate-50/30"
      >
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-start flex-row-reverse' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-5 rounded-[2rem] text-sm font-bold leading-relaxed shadow-sm ${
              msg.role === 'user' 
                ? 'bg-blue-600 text-white rounded-tr-none' 
                : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none'
            }`}>
              {msg.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-100 p-5 rounded-[2rem] rounded-tl-none shadow-sm flex items-center gap-3">
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce [animation-delay:0.4s]"></div>
              </div>
              <span className="text-[10px] text-slate-400 font-black uppercase">أمان يفكر الآن...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-6 bg-white border-t border-slate-50 flex items-center gap-4">
        <button type="button" className="w-12 h-12 flex items-center justify-center text-slate-300 hover:text-blue-600 transition-colors rounded-2xl hover:bg-slate-50">
          <i className="fas fa-image text-xl"></i>
        </button>
        <input 
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="اسأل أي شيء عن التقارير، الأدوية، أو نصائح التغذية..."
          className="flex-1 bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-blue-600 focus:ring-opacity-20 outline-none"
        />
        <button 
          type="submit"
          disabled={loading || !input.trim()}
          className="w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center hover:bg-blue-700 disabled:opacity-50 transition-all shadow-xl shadow-blue-100"
        >
          <i className="fas fa-paper-plane text-lg"></i>
        </button>
      </form>
    </div>
  );
};

export default ChatMentor;
