import React, { useState } from 'react';
import { funnelIntro, funnels } from '../data/funnels';
import { X, ChevronRight, BookOpen, AlertTriangle, Target, Layers } from 'lucide-react';
import { Link } from 'react-router-dom';

const FunnelLibrary = () => {
  const [selectedFunnel, setSelectedFunnel] = useState(null);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-8 font-sans">
      {/* Header */}
      <header className="flex items-center justify-between mb-12 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <BookOpen className="text-blue-500" />
            {funnelIntro.title}
          </h1>
          <p className="text-blue-400 font-medium uppercase tracking-widest text-sm mt-1">{funnelIntro.subtitle}</p>
        </div>
        <Link to="/boards" className="text-slate-400 hover:text-white transition flex items-center gap-2">
          Voltar para Quadros <ChevronRight size={16} />
        </Link>
      </header>

      {/* Intro Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
        <div className="lg:col-span-2 bg-slate-900/50 p-8 rounded-2xl border border-slate-800 backdrop-blur-sm">
          <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
            <Layers className="text-blue-500" size={20} /> Introdução
          </h2>
          <div className="space-y-4 text-slate-300 leading-relaxed">
            {funnelIntro.description.map((paragraph, index) => (
              <p key={index} className={paragraph.startsWith('•') ? 'pl-4 font-medium text-white' : ''}>
                {paragraph}
              </p>
            ))}
          </div>
        </div>

        <div className="bg-blue-900/20 p-8 rounded-2xl border border-blue-900/50 backdrop-blur-sm">
          <h2 className="text-xl font-semibold text-blue-100 mb-6 flex items-center gap-2">
            <Target className="text-blue-400" size={20} /> Propósito
          </h2>
          <ul className="space-y-4">
            {funnelIntro.purpose.map((item, index) => (
              <li key={index} className="flex items-start gap-3 text-blue-200">
                <span className="mt-1.5 w-1.5 h-1.5 bg-blue-500 rounded-full flex-shrink-0"></span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Grid of Funnels */}
      <h3 className="text-2xl font-bold text-white mb-8 border-l-4 border-blue-600 pl-4">Biblioteca Estrutural</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {funnels.map((funnel) => (
          <div 
            key={funnel.id}
            onClick={() => setSelectedFunnel(funnel)}
            className="group bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-blue-500/50 hover:bg-slate-800/80 transition cursor-pointer relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition">
              <BookOpen size={64} />
            </div>
            <h4 className="text-lg font-bold text-white mb-2 group-hover:text-blue-400 transition">{funnel.title}</h4>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">{funnel.level}</p>
            <p className="text-sm text-slate-400 line-clamp-3">{funnel.whenToUse}</p>
            
            <div className="mt-6 flex items-center text-blue-500 text-sm font-medium opacity-0 group-hover:opacity-100 transition transform translate-y-2 group-hover:translate-y-0">
              Ver detalhes <ChevronRight size={16} />
            </div>
          </div>
        ))}
      </div>

      {/* Modal Details */}
      {selectedFunnel && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedFunnel(null)}>
          <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="bg-slate-800 p-6 flex justify-between items-center border-b border-slate-700">
              <h3 className="text-2xl font-bold text-white">{selectedFunnel.title}</h3>
              <button onClick={() => setSelectedFunnel(null)} className="text-slate-400 hover:text-white transition">
                <X size={24} />
              </button>
            </div>
            <div className="p-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h4 className="text-xs font-bold text-blue-500 uppercase tracking-wider mb-2">Quando Usar</h4>
                  <p className="text-slate-300">{selectedFunnel.whenToUse}</p>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-purple-500 uppercase tracking-wider mb-2">Nível Ideal</h4>
                  <p className="text-slate-300">{selectedFunnel.level}</p>
                </div>
              </div>

              <div className="bg-slate-950/50 p-6 rounded-xl border border-slate-800">
                <h4 className="text-xs font-bold text-emerald-500 uppercase tracking-wider mb-2">Produto Ideal</h4>
                <p className="text-white text-lg font-medium">{selectedFunnel.idealProduct}</p>
              </div>

              <div className="bg-red-900/10 p-6 rounded-xl border border-red-900/30 flex gap-4">
                <AlertTriangle className="text-red-500 flex-shrink-0" size={24} />
                <div>
                  <h4 className="text-xs font-bold text-red-500 uppercase tracking-wider mb-1">Risco de Uso Incorreto</h4>
                  <p className="text-red-200/80 text-sm">{selectedFunnel.risk}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FunnelLibrary;