import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import { Camera, User, Mail, Lock, Shield, LogOut } from 'lucide-react';

export default function Profile() {
  const { user, login, logout } = useAuthStore();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    currentPassword: '',
    newPassword: '',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSave = (e) => {
    e.preventDefault();
    login({ ...user, name: formData.name, email: formData.email, avatar: formData.name.charAt(0).toUpperCase() });
    alert('Profile updated successfully!');
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
        <p className="text-gray-500 mt-1">Manage your account details and preferences.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Avatar & Quick Info */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center">
            <div className="relative group cursor-pointer mb-4">
              <div className="w-24 h-24 rounded-full bg-primary flex items-center justify-center text-white text-3xl font-semibold shadow-inner group-hover:opacity-90 transition-opacity">
                {user?.avatar || 'A'}
              </div>
              <div className="absolute inset-0 bg-black/40 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                <Camera size={20} className="text-white mb-1" />
                <span className="text-xs text-white font-medium">Upload</span>
              </div>
            </div>
            <h3 className="font-semibold text-lg text-gray-800">{user?.name || 'User Name'}</h3>
            <p className="text-sm text-gray-500">{user?.email || 'user@example.com'}</p>
            
            <div className="w-full h-px bg-gray-100 my-4"></div>
            
            <div className="w-full flex items-center justify-center gap-2 text-sm font-medium text-emerald-600 bg-emerald-50 py-2.5 rounded-xl border border-emerald-100/50">
                <Shield size={16} />
                <span>Pro Member</span>
            </div>

            <button 
                onClick={handleLogout}
                className="w-full mt-2 flex items-center justify-center gap-2 text-sm font-medium text-red-600 bg-red-50 py-2.5 rounded-xl border border-red-100/50 hover:bg-red-100 transition-colors focus:outline-none focus:ring-2 focus:ring-red-200"
            >
                <LogOut size={16} />
                <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Right Column: Form */}
        <div className="lg:col-span-2 space-y-6">
          <form className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6" onSubmit={handleSave}>
            <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Personal Information</h3>
                <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                            <User size={18} className="text-gray-400" />
                        </div>
                        <input name="name" value={formData.name} onChange={handleChange} type="text" className="pl-10 block w-full border border-gray-200 rounded-xl shadow-sm focus:ring-primary focus:border-primary sm:text-sm py-2.5 transition-colors bg-gray-50/50 hover:bg-gray-50" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                            <Mail size={18} className="text-gray-400" />
                        </div>
                        <input name="email" value={formData.email} onChange={handleChange} type="email" className="pl-10 block w-full border border-gray-200 rounded-xl shadow-sm focus:ring-primary focus:border-primary sm:text-sm py-2.5 transition-colors bg-gray-50/50 hover:bg-gray-50" />
                      </div>
                    </div>
                </div>
            </div>

            <div className="w-full h-px bg-gray-100"></div>

            <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Change Password</h3>
                <div className="space-y-4">
                     <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Current Password</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                            <Lock size={18} className="text-gray-400" />
                        </div>
                        <input name="currentPassword" value={formData.currentPassword} onChange={handleChange} type="password" placeholder="••••••••" className="pl-10 block w-full border border-gray-200 rounded-xl shadow-sm focus:ring-primary focus:border-primary sm:text-sm py-2.5 transition-colors bg-gray-50/50 hover:bg-gray-50" />
                      </div>
                    </div>
                     <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">New Password</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                            <Lock size={18} className="text-gray-400" />
                        </div>
                        <input name="newPassword" value={formData.newPassword} onChange={handleChange} type="password" placeholder="••••••••" className="pl-10 block w-full border border-gray-200 rounded-xl shadow-sm focus:ring-primary focus:border-primary sm:text-sm py-2.5 transition-colors bg-gray-50/50 hover:bg-gray-50" />
                      </div>
                    </div>
                </div>
            </div>

            <div className="flex justify-end pt-2">
                <button type="submit" className="px-6 py-2.5 bg-primary text-white rounded-xl font-medium shadow-sm hover:shadow-primary/20 hover:bg-primary/90 hover:-translate-y-0.5 transition-all focus:ring-2 focus:ring-offset-2 focus:ring-primary">
                    Save Changes
                </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
