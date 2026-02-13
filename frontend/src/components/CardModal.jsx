import React, { useState, useEffect, useRef } from 'react';
import { updateCard, analyzeCard, addMessage, addChecklistItem, updateChecklistItem, deleteChecklistItem } from '../api';
import { X, Sparkles, Brain, Save, MessageSquare, ListTodo, Send, User, Bot, CheckCircle, Circle, Trash2, Plus } from 'lucide-react';

const CardModal = ({ card, onClose, onUpdate }) => {
  const [formData, setFormData] = useState({ ...card });
  const [activeTab, setActiveTab] = useState('details'); // 'details' | 'chat'
  const [analysis, setAnalysis] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  
  // Chat state
  const [messages, setMessages] = useState(card.messages || []);
  const [newMessage, setNewMessage] = useState('');
  const chatEndRef = useRef(null);

  // Checklist state
  const [checklist, setChecklist] = useState(card.checklist || []);
  const [newChecklistItem, setNewChecklistItem] = useState('');

  useEffect(() => {
    setFormData({ ...card });
    setMessages(card.messages || []);
    setChecklist(card.checklist || []);
    setAnalysis(null);
  }, [card]);

  useEffect(() => {
    if (activeTab === 'chat') {
      scrollToBottom();
    }
  }, [messages, activeTab]);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      const updated = await updateCard(card.id, formData);
      onUpdate(updated.data); // Assuming backend returns updated card
      onClose();
    } catch (error) {
      console.error("Error updating card", error);
    }
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      const response = await analyzeCard(formData);
      setAnalysis(response.data);
    } catch (error) {
      console.error("Error analyzing card", error);
    } finally {
      setAnalyzing(false);
    }
  };

  // --- Chat Logic ---
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const authorType = user.role || 'user';
      const authorName = user.name || 'Você';

      const msgData = {
        content: newMessage,
        authorType,
        authorName
      };
      const response = await addMessage(card.id, msgData);
      setMessages([...messages, response.data]);
      setNewMessage('');
    } catch (error) {
      console.error("Error sending message", error);
    }
  };

  // --- Checklist Logic ---
  const handleAddChecklist = async (e) => {
    e.preventDefault();
    if (!newChecklistItem.trim()) return;

    try {
      const response = await addChecklistItem(card.id, { content: newChecklistItem });
      setChecklist([...checklist, response.data]);
      setNewChecklistItem('');
    } catch (error) {
      console.error("Error adding checklist item", error);
    }
  };

  const handleToggleChecklist = async (item) => {
    try {
      const updatedItem = { ...item, isCompleted: !item.isCompleted };
      await updateChecklistItem(item.id, { isCompleted: updatedItem.isCompleted });
      setChecklist(checklist.map(i => i.id === item.id ? updatedItem : i));
    } catch (error) {
      console.error("Error toggling checklist item", error);
    }
  };

  const handleDeleteChecklist = async (itemId) => {
    try {
      await deleteChecklistItem(itemId);
      setChecklist(checklist.filter(i => i.id !== itemId));
    } catch (error) {
      console.error("Error deleting checklist item", error);
    }
  };

  if (!card) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-in fade-in duration-300">
      <div className="bg-[#181818] rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col border border-zinc-800">
        
        {/* Header */}
        <div className="flex justify-between items-start p-6 border-b border-zinc-800 bg-zinc-900/50">
          <div className="flex-1 mr-8">
            <input
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="text-3xl font-bold text-white w-full bg-transparent focus:outline-none placeholder-zinc-600 mb-2"
                placeholder="Título do Cartão"
            />
             <div className="flex items-center gap-4 text-sm">
                <select 
                    name="type" 
                    value={formData.type || 'generic'} 
                    onChange={handleChange}
                    className="bg-zinc-800 text-zinc-300 border border-zinc-700 rounded px-2 py-1 text-xs uppercase font-bold tracking-wider focus:outline-none focus:border-blue-500"
                >
                    <option value="generic">Geral</option>
                    <option value="produto">Produto</option>
                    <option value="cliente">Cliente</option>
                    <option value="projeto">Projeto</option>
                    <option value="decisao">Decisão</option>
                </select>
                <span className="text-zinc-500">Criado em {new Date(card.createdAt).toLocaleDateString()}</span>
             </div>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white bg-zinc-800/50 hover:bg-zinc-700 rounded-full p-2 transition">
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-zinc-800 bg-zinc-900/30 px-6">
            <button 
                onClick={() => setActiveTab('details')}
                className={`py-4 px-6 text-sm font-bold uppercase tracking-wider border-b-2 transition flex items-center gap-2 ${activeTab === 'details' ? 'border-blue-500 text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
            >
                <ListTodo size={16} /> Detalhes
            </button>
            <button 
                onClick={() => setActiveTab('chat')}
                className={`py-4 px-6 text-sm font-bold uppercase tracking-wider border-b-2 transition flex items-center gap-2 ${activeTab === 'chat' ? 'border-blue-500 text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
            >
                <MessageSquare size={16} /> Conversas <span className="bg-zinc-800 text-zinc-300 px-2 rounded-full text-[10px]">{messages.length}</span>
            </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden flex">
            
            {/* DETAILS TAB */}
            {activeTab === 'details' && (
                <div className="flex-1 overflow-y-auto p-8 grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                     {/* Left Column (Main Content) - 2/3 width */}
                    <div className="lg:col-span-2 space-y-8">
                        
                        {/* Checklist Section */}
                        <section className="bg-zinc-900/30 p-6 rounded-xl border border-zinc-800/50">
                            <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
                                <CheckCircle size={16} className="text-emerald-500" /> Checklist
                            </h3>
                            
                            {/* Progress Bar */}
                            {checklist.length > 0 && (
                                <div className="mb-4">
                                    <div className="flex justify-between text-xs text-zinc-400 mb-1">
                                        <span>Progresso</span>
                                        <span>{Math.round((checklist.filter(i => i.isCompleted).length / checklist.length) * 100)}%</span>
                                    </div>
                                    <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                                        <div 
                                            className="bg-emerald-500 h-full transition-all duration-500" 
                                            style={{ width: `${(checklist.filter(i => i.isCompleted).length / checklist.length) * 100}%` }}
                                        ></div>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-2 mb-4">
                                {checklist.map(item => (
                                    <div key={item.id} className="flex items-center gap-3 group hover:bg-zinc-800/50 p-2 rounded transition">
                                        <button onClick={() => handleToggleChecklist(item)} className="text-zinc-500 hover:text-emerald-500 transition">
                                            {item.isCompleted ? <CheckCircle size={20} className="text-emerald-500" /> : <Circle size={20} />}
                                        </button>
                                        <span className={`flex-1 text-sm ${item.isCompleted ? 'text-zinc-500 line-through' : 'text-zinc-200'}`}>
                                            {item.content}
                                        </span>
                                        <button onClick={() => handleDeleteChecklist(item.id)} className="text-zinc-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                            
                            <form onSubmit={handleAddChecklist} className="flex gap-2">
                                <input 
                                    type="text" 
                                    value={newChecklistItem}
                                    onChange={(e) => setNewChecklistItem(e.target.value)}
                                    placeholder="Adicionar item..." 
                                    className="flex-1 bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 placeholder-zinc-600"
                                />
                                <button type="submit" className="bg-zinc-800 hover:bg-zinc-700 text-white px-3 rounded transition">
                                    <Plus size={16} />
                                </button>
                            </form>
                        </section>

                        <section>
                        <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                            Contexto & Objetivos
                        </h3>
                        <div className="space-y-4">
                            <div>
                            <label className="block text-xs font-bold text-zinc-500 mb-2 uppercase tracking-wider">Contexto Geral</label>
                            <textarea
                                name="menteeContext"
                                value={formData.menteeContext || ''}
                                onChange={handleChange}
                                rows="3"
                                className="w-full p-4 bg-zinc-900 border border-zinc-800 rounded text-zinc-300 focus:border-blue-600 focus:outline-none transition text-sm leading-relaxed"
                                placeholder="Descreva o cenário atual..."
                            />
                            </div>
                            <div>
                            <label className="block text-xs font-bold text-zinc-500 mb-2 uppercase tracking-wider">Objetivo Principal</label>
                            <textarea
                                name="menteeGoal"
                                value={formData.menteeGoal || ''}
                                onChange={handleChange}
                                rows="2"
                                className="w-full p-4 bg-zinc-900 border border-zinc-800 rounded text-zinc-300 focus:border-blue-600 focus:outline-none transition text-sm leading-relaxed"
                                placeholder="Qual a meta principal?"
                            />
                            </div>
                        </div>
                        </section>

                        <section>
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-white font-bold text-lg">Leitura do Mentor</h3>
                                <button 
                                onClick={handleAnalyze}
                                disabled={analyzing}
                                className="flex items-center gap-2 text-xs font-bold bg-white text-black px-4 py-2 rounded hover:bg-blue-600 hover:text-white transition disabled:opacity-50 uppercase tracking-wider"
                                >
                                <Sparkles size={14} /> {analyzing ? 'Processando...' : 'IA Copilot'}
                                </button>
                            </div>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-zinc-500 mb-2 uppercase tracking-wider">Percepções</label>
                                    <textarea
                                        name="mentorPerception"
                                        value={formData.mentorPerception || ''}
                                        onChange={handleChange}
                                        rows="4"
                                        className="w-full p-3 bg-zinc-900 border border-zinc-800 rounded text-zinc-300 focus:border-blue-600 focus:outline-none text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-zinc-500 mb-2 uppercase tracking-wider">Resistências</label>
                                    <textarea
                                        name="mentorResistance"
                                        value={formData.mentorResistance || ''}
                                        onChange={handleChange}
                                        rows="4"
                                        className="w-full p-3 bg-zinc-900 border border-zinc-800 rounded text-zinc-300 focus:border-blue-600 focus:outline-none text-sm"
                                    />
                                </div>
                            </div>
                        </div>
                        </section>

                        <section>
                        <h3 className="text-white font-bold text-lg mb-4">Decisões & Reflexões</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-zinc-500 mb-2 uppercase tracking-wider">Decisões Tomadas</label>
                                <textarea
                                    name="decisionsTaken"
                                    value={formData.decisionsTaken || ''}
                                    onChange={handleChange}
                                    rows="2"
                                    className="w-full p-3 bg-zinc-900 border border-zinc-800 rounded text-zinc-300 focus:border-blue-600 focus:outline-none text-sm"
                                    placeholder="O que ficou decidido?"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-zinc-500 mb-2 uppercase tracking-wider">Decisões em Aberto</label>
                                    <textarea
                                        name="decisionsOpen"
                                        value={formData.decisionsOpen || ''}
                                        onChange={handleChange}
                                        rows="3"
                                        className="w-full p-3 bg-zinc-900 border border-zinc-800 rounded text-zinc-300 focus:border-blue-600 focus:outline-none text-sm"
                                        placeholder="O que precisa ser decidido?"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-zinc-500 mb-2 uppercase tracking-wider">Reflexões Importantes</label>
                                    <textarea
                                        name="reflections"
                                        value={formData.reflections || ''}
                                        onChange={handleChange}
                                        rows="3"
                                        className="w-full p-3 bg-zinc-900 border border-zinc-800 rounded text-zinc-300 focus:border-blue-600 focus:outline-none text-sm"
                                        placeholder="Insights e observações..."
                                    />
                                </div>
                            </div>
                        </div>
                        </section>
                        
                        {/* AI Analysis Result */}
                        {analysis && (
                        <section className="bg-gradient-to-r from-blue-900/20 to-black p-6 rounded border border-blue-900/30 animate-in slide-in-from-bottom-4 duration-500">
                            <div className="flex items-center gap-2 mb-4 text-blue-500 font-bold uppercase tracking-widest text-sm">
                            <Brain size={16} />
                            <h3>Análise Cognitiva</h3>
                            </div>
                            <p className="text-zinc-300 mb-6 leading-relaxed font-light">{analysis.analysis}</p>
                            
                            <h4 className="text-xs font-bold text-white mb-3 uppercase tracking-wider">Sugestões Estratégicas</h4>
                            <ul className="space-y-2">
                                {analysis.suggestions.map((s, i) => (
                                    <li key={i} className="flex gap-3 text-sm text-zinc-400 items-start">
                                        <span className="text-blue-600 mt-1">▶</span>
                                        {s}
                                    </li>
                                ))}
                            </ul>
                        </section>
                        )}
                    </div>

                    {/* Right Column (Meta Data) - 1/3 width */}
                    <div className="space-y-6 text-sm">
                        <div className="bg-zinc-900 p-4 rounded border border-zinc-800">
                            <label className="block text-xs font-bold text-zinc-500 mb-2 uppercase tracking-wider">Mentorado</label>
                            <input
                                name="menteeName"
                                value={formData.menteeName || ''}
                                onChange={handleChange}
                                className="w-full bg-transparent border-b border-zinc-700 pb-2 text-white focus:outline-none focus:border-blue-600 transition"
                            />
                        </div>

                        <div className="bg-zinc-900 p-4 rounded border border-zinc-800 space-y-4">
                            <h4 className="text-zinc-400 uppercase text-xs font-bold tracking-wider mb-4">Níveis de Energia</h4>
                            
                            <div>
                            <div className="flex justify-between text-xs mb-1">
                                <span className="text-zinc-500">Mentorado</span>
                                <span className="text-emerald-400 font-bold">{formData.energyMentee || 0}/10</span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="10"
                                name="energyMentee"
                                value={formData.energyMentee || 0}
                                onChange={handleChange}
                                className="w-full accent-emerald-500 h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer"
                            />
                            </div>
                            <div>
                            <div className="flex justify-between text-xs mb-1">
                                <span className="text-zinc-500">Mentor</span>
                                <span className="text-blue-400 font-bold">{formData.energyMentor || 0}/10</span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="10"
                                name="energyMentor"
                                value={formData.energyMentor || 0}
                                onChange={handleChange}
                                className="w-full accent-blue-500 h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer"
                            />
                            </div>
                        </div>
                        
                        <div className="pt-8">
                            <button onClick={handleSave} className="w-full bg-blue-600 text-white py-3 rounded font-bold hover:bg-blue-700 transition flex items-center justify-center gap-2 uppercase tracking-widest text-xs">
                                <Save size={16} /> Salvar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* CHAT TAB */}
            {activeTab === 'chat' && (
                <div className="flex flex-col flex-1 bg-zinc-950/50 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        {messages.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-full text-zinc-600">
                                <MessageSquare size={48} className="mb-4 opacity-20" />
                                <p className="text-sm">Nenhuma mensagem ainda.</p>
                                <p className="text-xs">Comece a conversa sobre este card.</p>
                            </div>
                        )}
                        {messages.map((msg, idx) => {
                            const isUser = msg.authorType === 'user';
                            return (
                                <div key={idx} className={`flex gap-4 ${isUser ? 'flex-row-reverse' : ''}`}>
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isUser ? 'bg-blue-600' : 'bg-zinc-700'}`}>
                                        {isUser ? <User size={14} className="text-white" /> : <Bot size={14} className="text-zinc-300" />}
                                    </div>
                                    <div className={`max-w-[70%] space-y-1 ${isUser ? 'items-end flex flex-col' : ''}`}>
                                        <div className="flex items-center gap-2 text-xs">
                                            <span className="font-bold text-zinc-400">{msg.authorName}</span>
                                            <span className="text-zinc-600">{new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                        </div>
                                        <div className={`p-4 rounded-2xl text-sm leading-relaxed ${isUser ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-zinc-800 text-zinc-300 rounded-tl-none'}`}>
                                            {msg.content}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={chatEndRef} />
                    </div>
                    <div className="p-4 bg-zinc-900 border-t border-zinc-800">
                        <form onSubmit={handleSendMessage} className="flex gap-2">
                            <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                className="flex-1 bg-zinc-950 border border-zinc-800 rounded-full px-6 py-3 text-white focus:outline-none focus:border-blue-600 transition placeholder-zinc-600"
                                placeholder="Digite sua mensagem..."
                            />
                            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full transition flex-shrink-0">
                                <Send size={20} />
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default CardModal;