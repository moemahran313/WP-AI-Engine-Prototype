
import React, { useState, useEffect } from 'react';
import { Icons, COLORS } from './constants';
import { PluginConfig, PluginType, UserStats } from './types';
import { createPluginZip } from './services/generatorService';
import { enhancePrompt } from './services/geminiService';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area 
} from 'recharts';

const MOCK_STATS: UserStats = {
  activePlugins: 4,
  totalRequests: 12450,
  tokensUsed: 842000,
  plan: 'pro'
};

const INITIAL_CONFIG: PluginConfig = {
  id: 'plg_' + Math.random().toString(36).substr(2, 9),
  name: 'My AI Assistant',
  slug: 'my-ai-assistant',
  version: '1.0.0',
  type: PluginType.CHATBOT,
  primaryColor: '#3b82f6',
  promptTemplate: 'You are a helpful assistant for this WordPress site. Answer user questions accurately.',
  features: {
    useGutenberg: true,
    useShortcode: true,
    showInMenu: true,
    requireAuth: false
  },
  aiModel: 'gemini-3-flash-preview'
};

const App: React.FC = () => {
  const [view, setView] = useState<'dashboard' | 'builder' | 'analytics'>('dashboard');
  const [plugins, setPlugins] = useState<PluginConfig[]>([]);
  const [currentStep, setCurrentStep] = useState(1);
  const [config, setConfig] = useState<PluginConfig>(INITIAL_CONFIG);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);

  const handleDownload = async () => {
    setIsGenerating(true);
    try {
      const blob = await createPluginZip(config);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${config.slug}.zip`;
      a.click();
      
      if (!plugins.find(p => p.id === config.id)) {
        setPlugins([...plugins, config]);
      }
      setView('dashboard');
    } catch (err) {
      alert("Failed to generate plugin. Make sure JSZip is loaded.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEnhance = async () => {
    setIsEnhancing(true);
    const better = await enhancePrompt(config.promptTemplate, config.type);
    setConfig({ ...config, promptTemplate: better });
    setIsEnhancing(false);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white border-r border-slate-200 flex flex-col">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center text-white font-bold">WP</div>
            <h1 className="font-bold text-xl tracking-tight">AI Engine</h1>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <NavItem active={view === 'dashboard'} icon={<Icons.Layers className="w-5 h-5"/>} label="Dashboard" onClick={() => setView('dashboard')} />
          <NavItem active={view === 'builder'} icon={<Icons.Plus className="w-5 h-5"/>} label="New Plugin" onClick={() => { setConfig(INITIAL_CONFIG); setCurrentStep(1); setView('builder'); }} />
          <NavItem active={view === 'analytics'} icon={<Icons.Zap className="w-5 h-5"/>} label="AI Insights" onClick={() => setView('analytics')} />
          <NavItem active={false} icon={<Icons.Settings className="w-5 h-5"/>} label="Settings" onClick={() => {}} />
        </nav>

        <div className="p-4 border-t border-slate-200">
          <div className="bg-indigo-50 p-4 rounded-lg">
            <p className="text-xs font-semibold text-indigo-600 uppercase mb-1">Current Plan</p>
            <p className="text-sm font-bold text-indigo-900 mb-3 capitalize">{MOCK_STATS.plan} Plan</p>
            <div className="w-full bg-indigo-200 h-1 rounded-full mb-1">
              <div className="bg-indigo-600 h-1 rounded-full w-2/3"></div>
            </div>
            <p className="text-[10px] text-indigo-500">67% of monthly tokens used</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {view === 'dashboard' && <Dashboard plugins={plugins} setView={setView} setConfig={setConfig} setCurrentStep={setCurrentStep} />}
        {view === 'builder' && (
          <Builder 
            config={config} 
            setConfig={setConfig} 
            step={currentStep} 
            setStep={setCurrentStep} 
            onGenerate={handleDownload}
            isGenerating={isGenerating}
            onEnhance={handleEnhance}
            isEnhancing={isEnhancing}
          />
        )}
        {view === 'analytics' && <Analytics />}
      </main>
    </div>
  );
};

const NavItem = ({ active, icon, label, onClick }: { active: boolean, icon: React.ReactNode, label: string, onClick: () => void }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${active ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-sm' : 'text-slate-500 hover:bg-slate-100'}`}
  >
    {icon}
    <span>{label}</span>
  </button>
);

const Dashboard = ({ plugins, setView, setConfig, setCurrentStep }: any) => {
  return (
    <div className="p-8 max-w-6xl mx-auto">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Your AI Plugins</h2>
          <p className="text-slate-500">Manage and monitor your active WordPress extensions.</p>
        </div>
        <button 
          onClick={() => { setConfig(INITIAL_CONFIG); setCurrentStep(1); setView('builder'); }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg font-semibold flex items-center gap-2 transition shadow-md"
        >
          <Icons.Plus className="w-4 h-4" />
          Create New Plugin
        </button>
      </header>

      {plugins.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-slate-300 p-20 text-center">
          <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Icons.Layers className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-700">No plugins yet</h3>
          <p className="text-slate-500 mb-6">Start by creating your first AI-powered WordPress plugin.</p>
          <button 
            onClick={() => setView('builder')}
            className="text-indigo-600 font-semibold hover:underline"
          >
            Launch Plugin Builder &rarr;
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plugins.map((p: PluginConfig) => (
            <div key={p.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white" style={{ backgroundColor: p.primaryColor }}>
                    <Icons.Zap className="w-5 h-5" />
                  </div>
                  <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase px-2 py-1 rounded">Active</span>
                </div>
                <h3 className="font-bold text-lg mb-1">{p.name}</h3>
                <p className="text-slate-500 text-sm mb-4">Type: {p.type.replace('_', ' ')}</p>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span className="flex items-center gap-1"><Icons.ExternalLink className="w-3 h-3"/> 2 sites</span>
                  <span className="flex items-center gap-1"><Icons.Zap className="w-3 h-3"/> 1.2k calls</span>
                </div>
              </div>
              <div className="bg-slate-50 px-6 py-4 flex justify-between border-t border-slate-100">
                <button className="text-slate-600 text-sm font-medium hover:text-indigo-600 transition">Settings</button>
                <button className="text-indigo-600 text-sm font-bold hover:underline">Download ZIP</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const Builder = ({ config, setConfig, step, setStep, onGenerate, isGenerating, onEnhance, isEnhancing }: any) => {
  const steps = [
    { n: 1, title: 'Basics', desc: 'Identify your plugin' },
    { n: 2, title: 'Type', desc: 'Functionality' },
    { n: 3, title: 'AI Config', desc: 'Prompt engineering' },
    { n: 4, title: 'Export', desc: 'Generate & download' }
  ];

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-10 flex justify-between items-center">
        {steps.map((s) => (
          <div key={s.n} className={`flex-1 relative ${s.n !== 4 ? 'after:content-[""] after:h-[2px] after:bg-slate-200 after:absolute after:top-5 after:left-1/2 after:w-full after:-z-10' : ''}`}>
            <div className="flex flex-col items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold mb-2 transition-all ${step >= s.n ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-white border-2 border-slate-200 text-slate-400'}`}>
                {s.n}
              </div>
              <p className={`text-xs font-bold uppercase ${step >= s.n ? 'text-indigo-600' : 'text-slate-400'}`}>{s.title}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200 overflow-hidden">
        <div className="p-8">
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <h2 className="text-xl font-bold">Plugin Identity</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold mb-2">Plugin Name</label>
                  <input 
                    type="text" 
                    value={config.name} 
                    onChange={e => setConfig({...config, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, '-')})}
                    className="w-full border-2 border-slate-100 rounded-lg p-3 focus:border-indigo-500 outline-none transition"
                    placeholder="e.g. Smart Content Assistant"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Namespace Slug</label>
                  <input 
                    type="text" 
                    value={config.slug}
                    readOnly
                    className="w-full border-2 border-slate-100 bg-slate-50 rounded-lg p-3 text-slate-400 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Version</label>
                  <input 
                    type="text" 
                    value={config.version} 
                    onChange={e => setConfig({...config, version: e.target.value})}
                    className="w-full border-2 border-slate-100 rounded-lg p-3 focus:border-indigo-500 outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Primary Color</label>
                  <div className="flex gap-2">
                    <input 
                      type="color" 
                      value={config.primaryColor} 
                      onChange={e => setConfig({...config, primaryColor: e.target.value})}
                      className="h-12 w-12 rounded-lg cursor-pointer border-none"
                    />
                    <input type="text" value={config.primaryColor} readOnly className="flex-1 border-2 border-slate-100 rounded-lg p-3 bg-slate-50" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <h2 className="text-xl font-bold">What will this plugin do?</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { type: PluginType.CHATBOT, icon: <Icons.Shield />, label: 'AI Chatbot', desc: 'Interact with site visitors in real-time.' },
                  { type: PluginType.CONTENT_GEN, icon: <Icons.Zap />, label: 'Content Generator', desc: 'Generate blog posts and SEO meta.' },
                  { type: PluginType.SEO_OPTIMIZER, icon: <Icons.BarChart />, label: 'SEO Optimizer', desc: 'Auto-optimize page content for search.' },
                  { type: PluginType.CUSTOM_TOOL, icon: <Icons.Wrench />, label: 'Custom Tool', desc: 'Define your own AI workflow.' }
                ].map((item) => (
                  <button 
                    key={item.type}
                    onClick={() => setConfig({...config, type: item.type})}
                    className={`flex items-start gap-4 p-5 rounded-xl border-2 transition text-left ${config.type === item.type ? 'border-indigo-600 bg-indigo-50' : 'border-slate-100 hover:border-slate-200'}`}
                  >
                    <div className={`p-3 rounded-lg ${config.type === item.type ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                      {item.icon}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">{item.label}</p>
                      <p className="text-xs text-slate-500 mt-1">{item.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">Configure AI Engine</h2>
                <button 
                  onClick={onEnhance}
                  disabled={isEnhancing}
                  className="text-xs flex items-center gap-1.5 font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full hover:bg-indigo-100 disabled:opacity-50"
                >
                  {isEnhancing ? 'Improving...' : <><Icons.Zap className="w-3 h-3"/> AI Enhance Prompt</>}
                </button>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Base System Prompt</label>
                <textarea 
                  rows={6}
                  value={config.promptTemplate}
                  onChange={e => setConfig({...config, promptTemplate: e.target.value})}
                  className="w-full border-2 border-slate-100 rounded-lg p-4 focus:border-indigo-500 outline-none transition font-mono text-sm"
                  placeholder="Define how the AI should behave..."
                />
                <p className="text-xs text-slate-400 mt-2">Use tags like {`{input}`} to represent user data.</p>
              </div>
              <div className="p-4 bg-amber-50 rounded-lg border border-amber-100 flex gap-3">
                <Icons.Shield className="w-5 h-5 text-amber-600 shrink-0" />
                <div>
                  <p className="text-sm font-bold text-amber-900">Security Note</p>
                  <p className="text-xs text-amber-800 leading-relaxed">This prompt is stored securely in our SaaS. It is never exposed in the client-side WordPress code.</p>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300 text-center py-8">
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mx-auto mb-6">
                <Icons.Download className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-bold">Ready for Production!</h2>
              <p className="text-slate-500 max-w-md mx-auto">Your plugin is generated with namespaced PHP, REST API endpoints, and automatic connection logic to your dashboard.</p>
              
              <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 text-left max-w-sm mx-auto">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center text-white font-bold text-xs uppercase">Zip</div>
                  <div>
                    <p className="text-sm font-bold">{config.slug}.zip</p>
                    <p className="text-xs text-slate-400">Production Build v{config.version}</p>
                  </div>
                </div>
                <ul className="text-xs space-y-2 text-slate-600">
                  <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span> Secure API Connectivity</li>
                  <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span> GPLv2 Licensed</li>
                  <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span> WP.org Standard Ready</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        <div className="bg-slate-50 p-6 flex justify-between items-center border-t border-slate-200">
          <button 
            disabled={step === 1}
            onClick={() => setStep(step - 1)}
            className="text-slate-600 font-semibold px-6 py-2 hover:bg-slate-200 rounded-lg transition disabled:opacity-0"
          >
            Back
          </button>
          
          {step < 4 ? (
            <button 
              onClick={() => setStep(step + 1)}
              className="bg-indigo-600 text-white font-bold px-8 py-3 rounded-lg hover:bg-indigo-700 transition shadow-lg shadow-indigo-100"
            >
              Continue &rarr;
            </button>
          ) : (
            <button 
              onClick={onGenerate}
              disabled={isGenerating}
              className="bg-emerald-600 text-white font-bold px-8 py-3 rounded-lg hover:bg-emerald-700 transition shadow-lg shadow-emerald-100 flex items-center gap-2"
            >
              {isGenerating ? 'Generating...' : <><Icons.Download className="w-5 h-5"/> Download Plugin ZIP</>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const Analytics = () => {
  const data = [
    { name: 'Mon', requests: 400, tokens: 2400 },
    { name: 'Tue', requests: 300, tokens: 1398 },
    { name: 'Wed', requests: 200, tokens: 9800 },
    { name: 'Thu', requests: 278, tokens: 3908 },
    { name: 'Fri', requests: 189, tokens: 4800 },
    { name: 'Sat', requests: 239, tokens: 3800 },
    { name: 'Sun', requests: 349, tokens: 4300 },
  ];

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <header>
        <h2 className="text-2xl font-bold text-slate-800">Platform Analytics</h2>
        <p className="text-slate-500">Global usage statistics across all your deployed plugins.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Total AI Calls" value="12,450" change="+12%" />
        <StatCard title="Avg Response Time" value="1.2s" change="-5%" />
        <StatCard title="Tokens Consumed" value="842.1k" change="+18%" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="font-bold mb-6">Request Volume (Weekly)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorReq" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <Tooltip />
                <Area type="monotone" dataKey="requests" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorReq)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="font-bold mb-6">Token Usage by Plugin</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <Tooltip />
                <Bar dataKey="tokens" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, change }: any) => (
  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
    <p className="text-slate-500 text-sm font-medium mb-1">{title}</p>
    <div className="flex items-baseline gap-2">
      <h4 className="text-2xl font-bold text-slate-900">{value}</h4>
      <span className={`text-xs font-bold ${change.startsWith('+') ? 'text-emerald-500' : 'text-rose-500'}`}>{change}</span>
    </div>
  </div>
);

export default App;
