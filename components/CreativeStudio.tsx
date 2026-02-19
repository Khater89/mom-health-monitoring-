
import React, { useState, useRef } from 'react';
import { generateImage, editImage, generateVideo } from '../geminiService';

const CreativeStudio: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'image' | 'video' | 'edit'>('image');
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [imageSize, setImageSize] = useState<'1K' | '2K' | '4K'>('1K');
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAction = async () => {
    if (!prompt.trim() && activeTab !== 'edit') return;
    setLoading(true);
    setResult(null);
    try {
      if (activeTab === 'image') {
        const url = await generateImage(prompt, imageSize, aspectRatio);
        setResult(url);
      } else if (activeTab === 'video') {
        const url = await generateVideo(prompt, selectedFile?.split(',')[1], aspectRatio as any);
        setResult(url);
      } else if (activeTab === 'edit' && selectedFile) {
        const url = await editImage(selectedFile.split(',')[1], 'image/png', prompt);
        setResult(url);
      }
    } catch (err) {
      alert("فشل التوليد، يرجى المحاولة لاحقاً.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setSelectedFile(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fadeIn text-right">
      <div className="flex gap-4 p-2 bg-white rounded-3xl border border-slate-100 shadow-sm w-fit mx-auto">
        {(['image', 'edit', 'video'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab); setResult(null); }}
            className={`px-8 py-3 rounded-2xl font-black transition-all ${activeTab === tab ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}
          >
            {tab === 'image' ? 'توليد صور' : tab === 'edit' ? 'تحرير صور' : 'توليد فيديو'}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-slate-50 space-y-6 h-fit">
          <h3 className="text-xl font-black">إعدادات الإبداع</h3>
          <textarea 
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder={activeTab === 'edit' ? "ما هو التعديل المطلوب؟ (مثلاً: أضف فلتر سينمائي)" : "اكتب وصفك هنا..."}
            className="w-full h-32 p-4 bg-slate-50 rounded-2xl border-none font-bold focus:ring-2 focus:ring-blue-600 outline-none"
          />

          {(activeTab === 'edit' || activeTab === 'video') && (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-4 border-dashed border-slate-100 rounded-3xl p-8 text-center cursor-pointer hover:bg-blue-50 transition-all"
            >
              {selectedFile ? (
                <img src={selectedFile} className="h-32 mx-auto rounded-xl object-cover" />
              ) : (
                <div className="space-y-2">
                  <i className="fas fa-cloud-upload-alt text-3xl text-blue-200"></i>
                  <p className="text-xs font-black text-slate-400">ارفع صورة لبدء العمل</p>
                </div>
              )}
              <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 mr-2 uppercase">نسبة العرض</label>
              <select value={aspectRatio} onChange={e => setAspectRatio(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold">
                {['1:1', '3:4', '4:3', '9:16', '16:9'].map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            {activeTab === 'image' && (
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 mr-2 uppercase">الدقة</label>
                <select value={imageSize} onChange={e => setImageSize(e.target.value as any)} className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold">
                  <option value="1K">1K</option>
                  <option value="2K">2K</option>
                  <option value="4K">4K</option>
                </select>
              </div>
            )}
          </div>

          <button 
            onClick={handleAction}
            disabled={loading}
            className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black shadow-2xl hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-3"
          >
            {loading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-magic"></i>}
            {loading ? 'جاري السحر...' : 'ابدأ التوليد'}
          </button>
        </div>

        <div className="bg-slate-900 rounded-[3rem] p-4 flex items-center justify-center min-h-[400px] shadow-2xl relative">
          {loading ? (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-blue-400 font-black animate-pulse">Gemini يبدع الآن...</p>
            </div>
          ) : result ? (
            activeTab === 'video' ? (
              <video src={result} controls className="w-full h-full rounded-2xl" autoPlay loop />
            ) : (
              <img src={result} className="w-full h-full object-contain rounded-2xl shadow-inner" />
            )
          ) : (
            <div className="text-slate-700 text-center">
              <i className="fas fa-sparkles text-6xl opacity-10 mb-4"></i>
              <p className="font-black text-sm uppercase tracking-widest opacity-30">سيظهر إبداعك هنا</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreativeStudio;
