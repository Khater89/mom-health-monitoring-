
import React, { useState, useRef, useEffect } from 'react';
import { startChat } from '../geminiService';

const ChatMentor: React.FC = () => {
  const [useThinking, setUseThinking] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'model'; text: string }[]>([
    { role: 'model', text: 'أهلاً بك! أنا رفيق "أمان" الذكي. يمكنني تحليل التقارير، الإجابة عن أسئلتك الطبية، أو مجرد الدردشة معك. كيف أساعدك اليوم؟' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [chat, setChat] = useState(() => startChat(false));

  useEffect(() => {
    setChat(startChat(useThinking));
  }, [useThinking]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userText = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userText }]);
    setLoading(true);

    try {
      const result = await chat.sendMessage({ message: userText });
      setMessages(prev => [...prev, { role: 'model', text: result.text || "عذراً، لم أستطع الرد." }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'model', text: "حدث خطأ في الاتصال." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-14rem)] flex flex-col bg-white rounded-[3rem] shadow-2xl border border-slate-100 overflow-hidden animate-fadeIn text-right">
      <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-white">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white text-xl shadow-lg">
            <i className="fas fa-brain"></i>
          </div>
          <div>
            <h3 className="font-black text-slate-800">مساعد أمان الذكي</h3>
            <span className="text-[10px] text-emerald-500 font-black flex items-center gap-1">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span> Gemini 3 Pro النشط
            </span>
          </div>
        </div>
        
        {/* مفتاح التفكير العميق */}
        <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-2xl">
           <span className="text-xs font-black text-slate-400">نمط التفكير</span>
           <button 
             onClick={() => setUseThinking(!useThinking)}
             className={`w-12 h-6 rounded-full transition-all relative ${useThinking ? 'bg-blue-600' : 'bg-slate-200'}`}
           >
             <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${useThinking ? 'right-7' : 'right-1'}`}></div>
           </button>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-6 bg-slate-50/30">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-start flex-row-reverse' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-5 rounded-[2rem] text-sm font-bold shadow-sm ${
              msg.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none'
            }`}>
              {msg.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
             <div className="bg-white p-5 rounded-[2rem] rounded-tl-none shadow-sm flex items-center gap-2">
                <div className="flex gap-1">
                   <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"></div>
                   <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                   <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                </div>
                <span className="text-[10px] text-slate-400 font-black">أمان يحلل الآن...</span>
             </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSend} className="p-6 bg-white border-t border-slate-50 flex gap-4">
        <input 
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="اسأل أي شيء..."
          className="flex-1 p-5 bg-slate-50 rounded-2xl border-none font-bold focus:ring-2 focus:ring-blue-600 outline-none"
        />
        <button disabled={loading} className="w-16 h-16 bg-blue-600 text-white rounded-2xl shadow-xl flex items-center justify-center hover:bg-blue-700 disabled:opacity-50">
          <i className="fas fa-paper-plane text-xl"></i>
        </button>
      </form>
    </div>
  );
};

export default ChatMentor;
