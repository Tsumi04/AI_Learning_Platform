import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import { Mail, Lock, User, ArrowRight, Sparkles } from 'lucide-react';

export default function Register() {
  const { register, isLoading, error, clearError } = useAuthStore();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleRegister = async (e) => {
    e.preventDefault();
    clearError();
    const result = await register(name, email, password);
    if (result.success) {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-white flex">
      {/* Left Form */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-24 bg-white relative z-10">
        <div className="mx-auto w-full max-w-sm lg:max-w-md">
           {/* Mobile logo */}
          <div className="lg:hidden w-12 h-12 bg-primary rounded-xl flex items-center justify-center mb-8 shadow-sm">
            <Sparkles className="text-white w-6 h-6" />
          </div>

          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Create an account</h2>
          <p className="mt-2 text-sm text-gray-500">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-primary hover:text-primary/80 transition-colors">
              Sign in instead
            </Link>
          </p>

          {/* Error display */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
              {error}
            </div>
          )}

          <form className="mt-8 space-y-5" onSubmit={handleRegister}>
             <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <User size={18} className="text-gray-400" />
                </div>
                <input 
                  type="text" 
                  required 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-10 block w-full rounded-xl border border-gray-200 py-3 px-4 text-gray-900 placeholder-gray-400 focus:border-primary focus:ring-primary sm:text-sm transition-all hover:border-gray-300"
                  placeholder="John Doe"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Mail size={18} className="text-gray-400" />
                </div>
                <input 
                  type="email" 
                  required 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 block w-full rounded-xl border border-gray-200 py-3 px-4 text-gray-900 placeholder-gray-400 focus:border-primary focus:ring-primary sm:text-sm transition-all hover:border-gray-300"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                 <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock size={18} className="text-gray-400" />
                </div>
                <input 
                  type="password" 
                  required 
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 block w-full rounded-xl border border-gray-200 py-3 px-4 text-gray-900 placeholder-gray-400 focus:border-primary focus:ring-primary sm:text-sm transition-all hover:border-gray-300"
                  placeholder="Min. 6 characters"
                />
              </div>
            </div>

            <div className="pt-2">
              <button 
                type="submit" 
                disabled={isLoading}
                className="group relative w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl text-sm font-semibold text-white bg-primary hover:bg-primary/90 hover:shadow-lg hover:-translate-y-0.5 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Creating account...' : 'Create account'}
                {!isLoading && <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
              </button>
            </div>
             
             <p className="text-xs text-center text-gray-500 mt-4">
               By signing up, you agree to our <a href="#" className="underline hover:text-gray-800">Terms of Service</a> and <a href="#" className="underline hover:text-gray-800">Privacy Policy</a>.
             </p>
          </form>
        </div>
      </div>

       {/* Right Decoration */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gray-900 items-center justify-center overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-primary/30 blur-[120px]"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/20 blur-[120px]"></div>
        
        <div className="relative z-10 p-12 max-w-xl text-center">
          <div className="mx-auto w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 mb-8 shadow-xl">
            <Sparkles className="text-white w-8 h-8" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">100% White-Box AI</h2>
          <p className="text-gray-300 text-lg leading-relaxed">
            Every algorithm is built from scratch. No external APIs. Complete transparency in how your learning is powered.
          </p>
           <div className="mt-8 grid grid-cols-3 gap-4 text-center">
             <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4">
               <div className="text-2xl font-bold text-white">0</div>
               <div className="text-xs text-gray-400 mt-1">External APIs</div>
             </div>
             <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4">
               <div className="text-2xl font-bold text-primary">100%</div>
               <div className="text-xs text-gray-400 mt-1">White-Box</div>
             </div>
             <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4">
               <div className="text-2xl font-bold text-white">AI</div>
               <div className="text-xs text-gray-400 mt-1">From Scratch</div>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
}
