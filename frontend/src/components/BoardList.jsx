import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getBoards, createBoard } from '../api';
import { PlusCircle, Trello, Search, Bell } from 'lucide-react';

const BoardList = () => {
  const [boards, setBoards] = useState([]);
  const [newBoardTitle, setNewBoardTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchBoards();
  }, []);

  const fetchBoards = async () => {
    try {
      const response = await getBoards();
      setBoards(response.data);
    } catch (error) {
      console.error('Error fetching boards:', error);
      // Try to migrate if boards fail (first run fix)
      if (error.response && error.response.status === 500) {
          try {
              console.log('Attempting auto-migration...');
              await api.get('/migrate');
              // Retry fetching boards
              const retryResponse = await getBoards();
              setBoards(retryResponse.data);
              return;
          } catch (migrateError) {
              console.error('Auto-migration failed:', migrateError);
          }
      }
      const errorMessage = error.response?.data?.error || error.message || 'Erro ao carregar quadros.';
      setError(`Erro: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBoard = async (e) => {
    e.preventDefault();
    if (!newBoardTitle) return;
    
    setCreating(true);
    setError(null);

    try {
      await createBoard({ title: newBoardTitle, description: '' });
      setNewBoardTitle('');
      fetchBoards();
    } catch (error) {
      console.error('Error creating board:', error);
      // More detailed error message
      const errorMessage = error.response?.data?.error || 'Erro ao criar quadro. Tente novamente.';
      setError(errorMessage);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="animate-in fade-in duration-700 pt-32 px-12">
      {/* Header */}
      <header className="fixed top-0 left-0 w-full z-50 bg-gradient-to-b from-black/90 via-black/60 to-transparent p-6 px-12 transition-all duration-300">
        <div className="flex justify-between items-center">
           <div className="flex items-center gap-8">
              <h1 className="text-2xl font-bold text-white tracking-tight cursor-pointer">GMOS Mentoria</h1>
              <nav className="hidden md:flex gap-6 text-sm font-medium text-gray-300">
                 <a href="#" className="text-white hover:text-gray-300 transition">Início</a>
                 <Link to="/funnels" className="hover:text-white transition">Matriz de Conversão</Link>
                 <a href="#" className="hover:text-white transition">Minha Lista</a>
              </nav>
           </div>
           <div className="flex gap-4 items-center">
              <Search className="w-5 h-5 text-white cursor-pointer" />
              <Bell className="w-5 h-5 text-white cursor-pointer" />
              <div className="w-8 h-8 rounded bg-blue-600 cursor-pointer hover:ring-2 ring-white flex items-center justify-center text-xs font-bold">M</div>
           </div>
        </div>
      </header>
      
      {error && (
        <div className="mb-6 p-4 bg-red-900/50 border border-red-500 text-red-200 rounded">
            {error}
        </div>
      )}

      <h2 className="text-2xl font-bold mb-4 text-white uppercase tracking-wider">Quadros de Mentoria</h2>
      
      {/* Create Board Row */}
      <div className="mb-12">
        <form onSubmit={handleCreateBoard} className="flex gap-4 items-center mb-6">
            <input
            type="text"
            placeholder="Título do novo quadro..."
            className="bg-transparent border-b border-zinc-700 p-2 text-white focus:outline-none focus:border-red-600 transition w-full max-w-md placeholder-zinc-500"
            value={newBoardTitle}
            onChange={(e) => setNewBoardTitle(e.target.value)}
            disabled={creating}
            />
            <button 
            type="submit" 
            disabled={creating}
            className="text-white bg-red-600 hover:bg-red-700 px-6 py-2 rounded font-bold uppercase text-sm tracking-wide transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
            {creating ? 'Criando...' : 'Criar'}
            </button>
        </form>
      </div>

      {loading ? (
        <div className="flex gap-4">
            {[1,2,3].map(i => <div key={i} className="w-64 h-36 bg-zinc-800 rounded animate-pulse"></div>)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {boards.map((board) => (
            <Link 
              key={board.id} 
              to={`/board/${board.id}`}
              className="relative group bg-zinc-800 aspect-video rounded overflow-hidden transition-all duration-300 hover:scale-105 hover:z-10 hover:shadow-2xl ring-1 ring-white/10 hover:ring-white/50"
            >
                {/* Placeholder Image/Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"></div>
                <div className="absolute inset-0 bg-zinc-800 -z-10 group-hover:bg-zinc-700 transition"></div>
                
                {/* Content */}
                <div className="absolute bottom-0 left-0 p-4 w-full">
                    <h3 className="text-lg font-bold text-white group-hover:text-red-500 transition mb-1">{board.title}</h3>
                    <div className="flex items-center justify-between text-xs text-zinc-400">
                        <span>{new Date(board.createdAt).toLocaleDateString()}</span>
                        <div className="flex gap-1">
                             <div className="w-2 h-2 rounded-full bg-red-600"></div>
                             <div className="w-2 h-2 rounded-full bg-zinc-600"></div>
                        </div>
                    </div>
                </div>
            </Link>
          ))}
          {boards.length === 0 && (
             <p className="text-zinc-500 text-sm">Nenhum conteúdo disponível. Comece criando um quadro.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default BoardList;
