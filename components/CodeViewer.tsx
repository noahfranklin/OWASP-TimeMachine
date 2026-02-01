
import React from 'react';
import { Difficulty } from '../types';

interface CodeViewerProps {
  code: string;
  difficulty: Difficulty;
}

const CodeViewer: React.FC<CodeViewerProps> = ({ code, difficulty }) => {
  const getHeaderColor = () => {
    switch (difficulty) {
      case Difficulty.EASY: return 'bg-red-900/40 border-red-500/50 text-red-400';
      case Difficulty.INTERMEDIATE: return 'bg-amber-900/40 border-amber-500/50 text-amber-400';
      case Difficulty.IMPOSSIBLE: return 'bg-emerald-900/40 border-emerald-500/50 text-emerald-400';
      default: return 'bg-slate-800 border-slate-700 text-slate-400';
    }
  };

  return (
    <div className={`rounded-lg border overflow-hidden ${getHeaderColor()}`}>
      <div className="px-4 py-2 border-b flex justify-between items-center bg-black/20">
        <span className="text-xs font-bold uppercase tracking-wider">{difficulty} Level Implementation</span>
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/50"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500/50"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/50"></div>
        </div>
      </div>
      <pre className="p-4 overflow-x-auto text-sm leading-relaxed mono text-slate-300 bg-[#0b1222]">
        <code>{code}</code>
      </pre>
    </div>
  );
};

export default CodeViewer;
