import React, { useState, useEffect } from 'react';
import { useAppStore } from '../store';
import { Settings, Layout, Save, Image, Type, Menu, ArrowUp, ArrowDown, ChevronRight, Hash, Building2, Fingerprint, CheckCircle, Calendar } from 'lucide-react';

const ICON_OPTIONS = ['LayoutDashboard', 'Users', 'FileEdit', 'Vote', 'ScrollText', 'BarChart', 'Settings', 'Upload', 'Shield', 'Fingerprint', 'Activity', 'ClipboardList', 'Calendar', 'Briefcase', 'Sparkles', 'CalendarClock'];

const SettingsTab: React.FC = () => {
  const { settings, updateSettings, isSaving } = useAppStore();
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Estado local para campos de texto para evitar lag de digitação
  const [localTexts, setLocalTexts] = useState({
    companyName: settings.companyName,
    portalTitle: settings.portalTitle,
    portalSubtitle: settings.portalSubtitle,
    votingScreenTitle: settings.votingScreenTitle
  });

  // Sincroniza estado local quando as configurações são carregadas ou mudam externamente
  useEffect(() => {
    if (!isSaving) {
      setLocalTexts({
        companyName: settings.companyName,
        portalTitle: settings.portalTitle,
        portalSubtitle: settings.portalSubtitle,
        votingScreenTitle: settings.votingScreenTitle
      });
    }
  }, [settings.companyName, settings.portalTitle, settings.portalSubtitle, settings.votingScreenTitle, isSaving]);

  // Debounce para salvar automaticamente após parar de digitar
  useEffect(() => {
    const timer = setTimeout(() => {
      const hasChanged = 
        localTexts.companyName !== settings.companyName ||
        localTexts.portalTitle !== settings.portalTitle ||
        localTexts.portalSubtitle !== settings.portalSubtitle ||
        localTexts.votingScreenTitle !== settings.votingScreenTitle;
        
      if (hasChanged) {
        updateSettings(localTexts);
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [localTexts, settings, updateSettings]);

  const handleTextChange = (field: keyof typeof localTexts, value: string) => {
    setLocalTexts(prev => ({ ...prev, [field]: value }));
  };

  const handleUpdateField = (field: string, value: any) => {
    updateSettings({ [field]: value });
  };

  const handleManualSave = async () => {
    await updateSettings(localTexts);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'logoBase64' | 'votingScreenLogoBase64') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => handleUpdateField(field, reader.result);
      reader.readAsDataURL(file);
    }
  };

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const newOrder = [...settings.menuOrder];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex >= 0 && targetIndex < newOrder.length) {
      [newOrder[index], newOrder[targetIndex]] = [newOrder[targetIndex], newOrder[index]];
      handleUpdateField('menuOrder', newOrder);
    }
  };

  const inputClass = "w-full bg-white border-2 border-slate-200 rounded-xl px-5 py-4 text-black font-bold text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all uppercase placeholder:text-slate-300";

  return (
    <div className="max-w-5xl mx-auto space-y-12 animate-fadeIn pb-32">
      <header className="border-b border-slate-200 pb-8"><h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Estúdio de Customização</h1></header>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-6 space-y-10">
          <section className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm space-y-8">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-3"><Image className="w-5 h-5 text-blue-600" /> Logotipo & Interface</h2>
            <div className="flex flex-col items-center gap-6 p-8 bg-slate-50 rounded-[32px] border-2 border-dashed border-slate-200 group relative transition-all hover:bg-white">
              <div className="w-24 h-24 bg-white rounded-[24px] shadow-lg flex items-center justify-center overflow-hidden border border-slate-100">{settings.logoBase64 ? <img src={settings.logoBase64} alt="Preview" className="w-full h-full object-contain p-2" /> : <Settings className="w-10 h-10 text-slate-200" />}</div>
              <label className="bg-slate-900 text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest cursor-pointer hover:bg-blue-700 shadow-xl">Substituir Logotipo<input type="file" className="hidden" accept="image/*" onChange={(e) => handleLogoUpload(e, 'logoBase64')} /></label>
            </div>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] ml-1 flex items-center gap-2"><Building2 className="w-3 h-3" /> Nome da Empresa</label>
                <input 
                  type="text" 
                  className={inputClass} 
                  value={localTexts.companyName} 
                  onChange={(e) => handleTextChange('companyName', e.target.value)} 
                />
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] ml-1 flex items-center gap-2"><Type className="w-3 h-3" /> Título Principal</label>
                <input 
                  type="text" 
                  className={inputClass} 
                  value={localTexts.portalTitle} 
                  onChange={(e) => handleTextChange('portalTitle', e.target.value)} 
                />
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] ml-1 flex items-center gap-2"><Hash className="w-3 h-3" /> Subtítulo</label>
                <input 
                  type="text" 
                  className={inputClass} 
                  value={localTexts.portalSubtitle} 
                  onChange={(e) => handleTextChange('portalSubtitle', e.target.value)} 
                />
              </div>
            </div>
          </section>
        </div>
        <div className="lg:col-span-6 space-y-10">
          <section className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm space-y-8">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-3"><Fingerprint className="w-5 h-5 text-blue-600" /> Tela de Votação</h2>
            
            <div className="flex flex-col items-center gap-6 p-8 bg-slate-50 rounded-[32px] border-2 border-dashed border-slate-200 group relative transition-all hover:bg-white mb-6">
              <div className="w-24 h-24 bg-white rounded-[24px] shadow-lg flex items-center justify-center overflow-hidden border border-slate-100">
                {settings.votingScreenLogoBase64 ? <img src={settings.votingScreenLogoBase64} alt="Preview" className="w-full h-full object-contain p-2" /> : <Fingerprint className="w-10 h-10 text-slate-200" />}
              </div>
              <label className="bg-slate-900 text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest cursor-pointer hover:bg-blue-700 shadow-xl">
                Logotipo da Urna
                <input type="file" className="hidden" accept="image/*" onChange={(e) => handleLogoUpload(e, 'votingScreenLogoBase64')} />
              </label>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] ml-1">Título da Urna</label>
                <input 
                  type="text" 
                  className={inputClass} 
                  value={localTexts.votingScreenTitle} 
                  onChange={(e) => handleTextChange('votingScreenTitle', e.target.value)} 
                />
              </div>
            </div>
          </section>
          <section className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm space-y-8">
            <div className="flex items-center justify-between"><h2 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-3"><Menu className="w-5 h-5 text-emerald-600" /> Menu</h2></div>
            <div className="space-y-3">
              {settings.menuOrder.map((tabId, index) => (
                <div key={tabId} className="flex items-center gap-4 p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                  <div className="flex flex-col gap-1">
                    <button onClick={() => moveItem(index, 'up')} disabled={index === 0} className="p-1 text-slate-300 hover:text-blue-600 disabled:opacity-30"><ArrowUp className="w-3.5 h-3.5" /></button>
                    <button onClick={() => moveItem(index, 'down')} disabled={index === settings.menuOrder.length - 1} className="p-1 text-slate-300 hover:text-blue-600 disabled:opacity-30"><ArrowDown className="w-3.5 h-3.5" /></button>
                  </div>
                  <div className="flex-1"><span className="text-[10px] font-black text-slate-900 uppercase tracking-[0.1em]">{tabId}</span></div>
                  <div className="relative">
                    <select className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-[9px] font-black uppercase text-slate-500 outline-none pr-8" value={settings.tabIcons[tabId]} onChange={(e) => handleUpdateField('tabIcons', { ...settings.tabIcons, [tabId]: e.target.value })}>{ICON_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}</select>
                    <ChevronRight className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 rotate-90 text-slate-300 pointer-events-none" />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
      <div className="fixed bottom-10 right-10 z-[60]">
        <button onClick={handleManualSave} className={`flex items-center gap-4 px-10 py-5 rounded-[24px] transition-all font-black uppercase text-xs tracking-[0.2em] shadow-[0_20px_40px_rgba(0,0,0,0.15)] transform hover:-translate-y-1 active:scale-95 ${saveSuccess ? 'bg-emerald-600 text-white' : 'bg-[#1e40af] text-white'}`}>
          {saveSuccess ? <><CheckCircle className="w-5 h-5 animate-pulse" /> Tudo Persistido!</> : <><Save className="w-5 h-5" /> Confirmar Layout</>}
        </button>
      </div>
    </div>
  );
};
export default SettingsTab;