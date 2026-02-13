import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user'); // 'user', 'mentor'
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    // Mock login - accept any input for Beta
    if (email && password) {
      const userData = {
        email,
        name: email.split('@')[0], // Derive name from email
        role
      };
      localStorage.setItem('user', JSON.stringify(userData));
      navigate('/boards');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black bg-opacity-90 relative overflow-hidden">
      {/* Background Overlay */}
      <div className="absolute inset-0 bg-[url('/background.jpg')] bg-cover bg-center z-0"></div>
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] z-10"></div>

      <div className="bg-white/10 backdrop-blur-md p-12 rounded-2xl shadow-2xl w-full max-w-md z-20 border border-white/20">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">GMOS Mentoria</h1>
          <p className="text-slate-200 text-sm uppercase tracking-widest">Sistema Operacional de Governo</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-2 uppercase tracking-wider">Email Corporativo</label>
            <input
              type="email"
              className="w-full p-4 rounded-lg bg-black/20 border border-white/10 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-2 uppercase tracking-wider">Senha</label>
            <input
              type="password"
              className="w-full p-4 rounded-lg bg-black/20 border border-white/10 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          
          <div>
             <label className="block text-xs font-bold text-slate-300 mb-2 uppercase tracking-wider">Perfil de Acesso</label>
             <div className="grid grid-cols-2 gap-4">
                <button
                    type="button"
                    onClick={() => setRole('user')}
                    className={`p-3 rounded border text-sm font-bold transition ${role === 'user' ? 'bg-blue-600 border-blue-600 text-white' : 'bg-transparent border-white/20 text-slate-400 hover:text-white'}`}
                >
                    MENTORADO
                </button>
                <button
                    type="button"
                    onClick={() => setRole('mentor')}
                    className={`p-3 rounded border text-sm font-bold transition ${role === 'mentor' ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-transparent border-white/20 text-slate-400 hover:text-white'}`}
                >
                    MENTOR
                </button>
             </div>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-700 hover:bg-blue-600 text-white font-bold py-4 rounded-lg transition shadow-lg shadow-blue-900/50 uppercase tracking-widest text-sm"
          >
            Acessar Plataforma
          </button>
        </form>

        <div className="mt-8 pt-8 border-t border-white/10">
            <p className="text-center text-zinc-500 text-xs uppercase tracking-widest mb-4">Acesso Rápido (Ambiente de Teste)</p>
            <div className="grid grid-cols-2 gap-4">
                <button
                    onClick={() => {
                        localStorage.setItem('user', JSON.stringify({
                            email: 'admin@mentorado.com',
                            name: 'Mentorado Admin',
                            role: 'user'
                        }));
                        navigate('/boards');
                    }}
                    className="p-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-xs font-bold uppercase tracking-wider transition border border-zinc-700 hover:border-zinc-500"
                >
                    Admin Mentorado
                </button>
                <button
                    onClick={() => {
                        localStorage.setItem('user', JSON.stringify({
                            email: 'admin@mentor.com',
                            name: 'Mentor Admin',
                            role: 'mentor'
                        }));
                        navigate('/boards');
                    }}
                    className="p-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-xs font-bold uppercase tracking-wider transition border border-zinc-700 hover:border-zinc-500"
                >
                    Admin Mentor
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
