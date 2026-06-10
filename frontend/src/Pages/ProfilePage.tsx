import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useAuthStore } from '../store/authstore';
import { authService } from '../services/authService';
import { useAuth } from '../hooks/useAuth';

export default function ProfilePage() {
  const { user, updateUser } = useAuthStore();
  const { logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Local state to store and show image preview before submitting to server
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.avatar || null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const profileForm = useForm({ defaultValues: { name: user?.name || '' } });
  const passwordForm = useForm<{ currentPassword: string; newPassword: string; confirmNew: string }>();

  // Handle local image file selection & convert to a preview URL
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit example
        setError('Image size must be less than 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfileUpdate = async (data: { name: string }) => {
    setLoading(true); setMessage(''); setError('');
    try {
      // Use FormData if your backend service accepts multipart/form-data for files
      const formData = new FormData();
      formData.append('name', data.name);
      
      if (fileInputRef.current?.files?.[0]) {
        formData.append('avatar', fileInputRef.current.files[0]);
      }

      // Note: If your API service specifically requires plain JSON base64 string layout instead:
      // const payload = { name: data.name, avatar: avatarPreview };
      // const res = await authService.updateProfile(payload);

      const res = await authService.updateProfile(formData);
      updateUser(res.data.data.user);
      setMessage('Profile updated successfully');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (data: { currentPassword: string; newPassword: string; confirmNew: string }) => {
    if (data.newPassword !== data.confirmNew) {
      setError("New passwords don't match");
      return;
    }
    setLoading(true); setMessage(''); setError('');
    try {
      await authService.changePassword({ currentPassword: data.currentPassword, newPassword: data.newPassword });
      setMessage('Password changed successfully');
      passwordForm.reset();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Password change failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 selection:bg-indigo-500 selection:text-white relative overflow-hidden">
      {/* Decorative Background Lighting Layer */}
      <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-indigo-900/10 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-violet-900/10 blur-[130px] pointer-events-none" />

      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl shadow-black/40 overflow-hidden relative z-10">
        
        {/* Header Section */}
        <div className="p-8 border-b border-slate-800 bg-slate-950/40 flex flex-col sm:flex-row items-center gap-6">
          <div className="relative">
            {avatarPreview ? (
              <img 
                src={avatarPreview} 
                alt={user?.name} 
                className="w-20 h-20 rounded-full object-cover ring-4 ring-slate-800 shadow-md"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center text-3xl font-bold text-white shadow-md ring-4 ring-slate-800">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          
          <div className="text-center sm:text-left">
            <h1 className="text-2xl font-bold text-white tracking-tight">{user?.name || 'User Profile'}</h1>
            <p className="text-slate-400 text-sm mt-0.5">{user?.email}</p>
          </div>

          <button
            onClick={logout}
            className="sm:ml-auto w-full sm:w-auto text-sm font-semibold text-rose-400 hover:text-white border border-rose-500/20 hover:bg-rose-600 px-5 py-2.5 rounded-xl transition-all duration-200 active:scale-95"
          >
            Sign Out
          </button>
        </div>

        {/* Dynamic Navigation Tabs */}
        <div className="px-8 pt-4">
          <div className="flex gap-4 border-b border-slate-800/60">
            {(['profile', 'password'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); setMessage(''); setError(''); }}
                className={`pb-4 text-sm font-semibold border-b-2 transition-all duration-200 px-1 capitalize ${
                  activeTab === tab
                    ? 'border-indigo-500 text-indigo-400'
                    : 'border-transparent text-slate-500 hover:text-slate-300'
                }`}
              >
                {tab === 'profile' ? 'Edit Profile' : 'Change Password'}
              </button>
            ))}
          </div>
        </div>

        {/* Form Modules Area */}
        <div className="p-8">
          {/* Global Messaging Toasts */}
          {message && (
            <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium px-4 py-3.5 rounded-xl mb-6 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              {message}
            </div>
          )}
          {error && (
            <div className="flex items-center gap-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm font-medium px-4 py-3.5 rounded-xl mb-6 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              {error}
            </div>
          )}

          {/* Profile Tab Component */}
          {activeTab === 'profile' && (
            <form onSubmit={profileForm.handleSubmit(handleProfileUpdate)} className="space-y-6">
              
              {/* File Uploader Drop Zone Layout */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Profile Picture</label>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="group border-2 border-dashed border-slate-800 hover:border-indigo-500/50 bg-slate-950/40 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all duration-200"
                >
                  <input 
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                  />
                  <div className="w-12 h-12 rounded-lg bg-slate-900 flex items-center justify-center text-xl mb-3 border border-slate-800 group-hover:border-indigo-500/30 group-hover:text-indigo-400 text-slate-400 transition-colors">
                    📷
                  </div>
                  <p className="text-sm font-semibold text-slate-200">Click to upload image file</p>
                  <p className="text-xs text-slate-500 mt-1">PNG, JPG, or WEBP up to 2MB</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Full Name</label>
                <input
                  {...profileForm.register('name')}
                  placeholder="John Doe"
                  className="w-full border border-slate-800 bg-slate-950 rounded-xl px-4 py-3 text-sm font-medium text-slate-100 placeholder:text-slate-600 transition-all focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-150 active:scale-[0.99] disabled:opacity-50 shadow-lg shadow-indigo-600/20"
                >
                  {loading ? 'Saving Changes...' : 'Save Changes'}
                </button>
              </div>
            </form>
          )}

          {/* Password Tab Component */}
          {activeTab === 'password' && (
            <form onSubmit={passwordForm.handleSubmit(handlePasswordChange)} className="space-y-5">
              <div className="space-y-5">
                {['currentPassword', 'newPassword', 'confirmNew'].map((field, i) => (
                  <div key={field}>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                      {['Current Password', 'New Password', 'Confirm New Password'][i]}
                    </label>
                    <input
                      {...passwordForm.register(field as any)}
                      type="password"
                      placeholder="••••••••"
                      className="w-full border border-slate-800 bg-slate-950 rounded-xl px-4 py-3 text-sm font-medium text-slate-100 placeholder:text-slate-600 transition-all focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                    />
                  </div>
                ))}
              </div>
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-150 active:scale-[0.99] disabled:opacity-50 shadow-lg shadow-indigo-600/20"
                >
                  {loading ? 'Updating Password...' : 'Update Password'}
                </button>
              </div>
            </form>
          )}  
        </div>
      </div>
    </div>
  );
}