
import React, { useState, useEffect, useCallback } from 'react';
import { Era, Difficulty, LabState, Vulnerability } from './types';
import { OWASP_2025_LIST } from './constants';
import CodeViewer from './components/CodeViewer';
import { getWalkthrough } from './services/geminiService';

const App: React.FC = () => {
  const [state, setState] = useState<LabState>({
    currentEra: Era.Y2025,
    currentDifficulty: Difficulty.EASY,
    completedVulnerabilities: [],
    foundFlags: []
  });

  const [selectedVuln, setSelectedVuln] = useState<Vulnerability | null>(OWASP_2025_LIST[0]);
  const [walkthrough, setWalkthrough] = useState<string | null>(null);
  const [isLoadingWalkthrough, setIsLoadingWalkthrough] = useState(false);
  const [flagInput, setFlagInput] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const fetchWalkthrough = useCallback(async () => {
    if (!selectedVuln) return;
    setIsLoadingWalkthrough(true);
    setWalkthrough(null);
    const result = await getWalkthrough(selectedVuln.name, state.currentDifficulty, state.currentEra);
    setWalkthrough(result);
    setIsLoadingWalkthrough(false);
  }, [selectedVuln, state.currentDifficulty, state.currentEra]);

  const handleDifficultyChange = (diff: Difficulty) => {
    setState(prev => ({ ...prev, currentDifficulty: diff }));
  };

  const handleEraChange = (era: Era) => {
    setState(prev => ({ ...prev, currentEra: era }));
    // For this prototype, we only have 2025 logic fully mapped
    if (era !== Era.Y2025) {
      setToast({ message: `Era ${era} modules are coming soon in the next update!`, type: 'error' });
    }
  };

  const submitFlag = () => {
    if (selectedVuln && flagInput.trim() === selectedVuln.flag) {
      setToast({ message: "Correct Flag! Module Completed.", type: 'success' });
      setState(prev => ({
        ...prev,
        completedVulnerabilities: [...new Set([...prev.completedVulnerabilities, selectedVuln.id])],
        foundFlags: [...new Set([...prev.foundFlags, flagInput])]
      }));
      setFlagInput('');
    } else {
      setToast({ message: "Invalid Flag. Try harder!", type: 'error' });
    }
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center font-bold text-white">T</div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">
              OWASP-TimeMachine
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden md:flex bg-slate-800 rounded-lg p-1">
              {Object.values(Era).map((era) => (
                <button
                  key={era}
                  onClick={() => handleEraChange(era as Era)}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                    state.currentEra === era
                      ? 'bg-indigo-600 text-white shadow-lg'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {era}
                </button>
              ))}
            </div>
            
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 rounded-full border border-slate-700">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-xs font-mono text-slate-300">USER: PEN-TESTER</span>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sidebar - Vulnerability List */}
        <aside className="lg:col-span-3 space-y-6">
          <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Select Lab Module</h3>
            <div className="space-y-2">
              {(state.currentEra === Era.Y2025 ? OWASP_2025_LIST : []).map((vuln) => (
                <button
                  key={vuln.id}
                  onClick={() => { setSelectedVuln(vuln); setWalkthrough(null); }}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${
                    selectedVuln?.id === vuln.id
                      ? 'bg-indigo-600/10 border-indigo-500 text-indigo-100 shadow-[0_0_15px_-5px_rgba(79,70,229,0.4)]'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono opacity-60">{vuln.rank}</span>
                    {state.completedVulnerabilities.includes(vuln.id) && (
                      <span className="text-[10px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded border border-green-500/30">COMPLETED</span>
                    )}
                  </div>
                  <div className="font-semibold mt-1 truncate">{vuln.name}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 bg-slate-900 rounded-xl border border-slate-800">
            <h4 className="text-sm font-bold text-slate-200 mb-2">Platform Progress</h4>
            <div className="w-full bg-slate-800 rounded-full h-2 mb-4">
              <div 
                className="bg-indigo-500 h-2 rounded-full transition-all duration-1000" 
                style={{ width: `${(state.completedVulnerabilities.length / OWASP_2025_LIST.length) * 100}%` }}
              ></div>
            </div>
            <p className="text-xs text-slate-500">Flags captured: {state.foundFlags.length}</p>
          </div>
        </aside>

        {/* Workspace */}
        <section className="lg:col-span-9 space-y-8">
          {selectedVuln ? (
            <>
              {/* Header Section */}
              <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="px-2 py-1 bg-indigo-500/20 text-indigo-400 rounded text-xs font-mono border border-indigo-500/30">
                        ERA: {selectedVuln.era}
                      </span>
                      <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs font-mono border border-red-500/30">
                        CRITICALITY: HIGH
                      </span>
                    </div>
                    <h2 className="text-3xl font-bold text-white tracking-tight">{selectedVuln.rank}: {selectedVuln.name}</h2>
                    <p className="text-slate-400 mt-2 max-w-2xl">{selectedVuln.description}</p>
                  </div>

                  <div className="flex flex-col gap-3">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Select Security Tier</label>
                    <div className="flex bg-slate-800 rounded-xl p-1 shadow-inner border border-slate-700/50">
                      {Object.values(Difficulty).map((diff) => (
                        <button
                          key={diff}
                          onClick={() => handleDifficultyChange(diff)}
                          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                            state.currentDifficulty === diff
                              ? diff === Difficulty.EASY ? 'bg-red-600 text-white shadow-lg' :
                                diff === Difficulty.INTERMEDIATE ? 'bg-amber-600 text-white shadow-lg' :
                                'bg-emerald-600 text-white shadow-lg'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          {diff.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-sm font-bold text-indigo-400 mb-2 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        Security Theory
                      </h4>
                      <p className="text-sm leading-relaxed text-slate-300 bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                        {selectedVuln.theory}
                      </p>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-amber-400 mb-2 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                        Analyst Hint
                      </h4>
                      <div className="text-sm text-slate-400 italic">
                        "{selectedVuln.exploitHint}"
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-800">
                      <div className="bg-slate-950 p-4 rounded-xl border border-indigo-500/20">
                        <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-3">Capture the Flag</h4>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="TM{FLAG_HERE}"
                            value={flagInput}
                            onChange={(e) => setFlagInput(e.target.value)}
                            className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white font-mono"
                          />
                          <button
                            onClick={submitFlag}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors"
                          >
                            VERIFY
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-slate-400 flex items-center justify-between">
                      <span>Source Logic Snippet</span>
                      <span className="text-[10px] text-slate-600 mono">TS/JS SERVER CONTEXT</span>
                    </h4>
                    <CodeViewer 
                      code={selectedVuln.codeSnippets[state.currentDifficulty]} 
                      difficulty={state.currentDifficulty} 
                    />
                    
                    {state.currentDifficulty !== Difficulty.IMPOSSIBLE && selectedVuln.bypassLogic && (
                      <div className="mt-4 p-4 bg-slate-800/30 rounded-lg border border-slate-700/50">
                        <h5 className="text-xs font-bold text-amber-500 uppercase tracking-widest mb-2">Bypass Analysis</h5>
                        <p className="text-xs text-slate-400 leading-relaxed">{selectedVuln.bypassLogic}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* AI Mentor Section */}
              <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
                <div className="p-4 bg-indigo-600 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">Gemini Penetration Mentor</h3>
                      <p className="text-[10px] text-indigo-100/70 uppercase">On-Demand Exploit Walkthrough</p>
                    </div>
                  </div>
                  <button
                    onClick={fetchWalkthrough}
                    disabled={isLoadingWalkthrough}
                    className="bg-white text-indigo-600 hover:bg-indigo-50 px-4 py-1.5 rounded-lg text-xs font-bold shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    {isLoadingWalkthrough ? (
                      <>
                        <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        ANALYZING...
                      </>
                    ) : 'GET WALKTHROUGH'}
                  </button>
                </div>
                
                <div className="p-6 bg-[#0b1222] min-h-[150px]">
                  {walkthrough ? (
                    <div className="prose prose-invert prose-sm max-w-none text-slate-300 animate-in fade-in slide-in-from-bottom-2 duration-500">
                      <div dangerouslySetInnerHTML={{ __html: walkthrough.replace(/\n/g, '<br/>') }} />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full py-10 text-slate-500">
                      <svg className="w-12 h-12 mb-4 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                      <p className="text-sm">Request an AI-generated walkthrough to understand how to exploit this specific configuration.</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-500">
              <h2 className="text-2xl font-bold mb-2">Initialize Mission</h2>
              <p>Select a vulnerability module from the sidebar to begin testing.</p>
            </div>
          )}
        </section>
      </main>

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-8 right-8 px-6 py-4 rounded-2xl shadow-2xl border flex items-center gap-4 animate-in slide-in-from-right duration-300 z-[100] ${
          toast.type === 'success' ? 'bg-emerald-900/90 border-emerald-500 text-emerald-100' : 'bg-red-900/90 border-red-500 text-red-100'
        }`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${toast.type === 'success' ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
            {toast.type === 'success' ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            )}
          </div>
          <span className="font-bold text-sm tracking-wide">{toast.message}</span>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-12 border-t border-slate-900 bg-slate-950 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row justify-between items-center gap-4 text-slate-500 text-xs">
          <p>© 2025 OWASP-TimeMachine Labs. For educational purposes only.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-indigo-400 transition-colors">Documentation</a>
            <a href="#" className="hover:text-indigo-400 transition-colors">Vulnerability Report</a>
            <a href="#" className="hover:text-indigo-400 transition-colors">Leaderboard</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
