import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import toast from 'react-hot-toast';
import BadgeIcon from '../components/BadgeIcon';

// ─────────────────────────────────────────────────────────────────────────────
// TASK 3: Full Profile Management
//   • Update display name (full_name)
//   • Upload & update profile picture (Supabase Storage → 'avatars' bucket)
//   • Change password (supabase.auth.updateUser)
//   • Link to Forgot Password flow
// ─────────────────────────────────────────────────────────────────────────────

const Section = ({ title, children }) => (
  <div className="card mb-4">
    <h2 className="font-display text-base font-bold text-city-text mb-5 pb-3 border-b border-city-border">{title}</h2>
    {children}
  </div>
);

const ProfileSettings = () => {
  const { user, profile, refreshProfile, updatePassword } = useAuth();

  // Profile info state
  const [fullName,   setFullName]   = useState(profile?.full_name  || '');
  const [username,   setUsername]   = useState(profile?.username   || '');
  const [savingInfo, setSavingInfo] = useState(false);

  // Avatar state
  const [avatarPreview, setAvatarPreview] = useState(profile?.avatar_url || null);

  // Hydrate form fields when profile loads asynchronously
  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setUsername(profile.username || '');
    }
  }, [profile]);
  const [avatarFile,    setAvatarFile]    = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef(null);

  // Password state
  const [newPassword,     setNewPassword]     = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword,  setSavingPassword]  = useState(false);
  const [showPassFields,  setShowPassFields]  = useState(false);

  // ── Update display name / username ─────────────────────────────────────────
  const handleSaveInfo = async (e) => {
    e.preventDefault();
    if (!fullName.trim()) { toast.error('Full name is required.'); return; }
    if (!username.trim() || username.length < 3) {
      toast.error('Username must be at least 3 characters.'); return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      toast.error('Username: letters, numbers, underscores only.'); return;
    }

    setSavingInfo(true);
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName.trim(), username: username.trim() })
      .eq('id', user.id);

    if (error) {
      toast.error(error.message || 'Failed to update profile.');
    } else {
      // Keep auth metadata in sync
      await supabase.auth.updateUser({ data: { full_name: fullName.trim() } });
      await refreshProfile();
      toast.success('Profile updated!');
    }
    setSavingInfo(false);
  };

  // ── Avatar: preview on file pick ───────────────────────────────────────────
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file.'); return;
    }
    if (file.size > 3 * 1024 * 1024) {
      toast.error('Image must be under 3 MB.'); return;
    }

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  // ── Avatar: upload to Supabase Storage ─────────────────────────────────────
  const handleUploadAvatar = async () => {
    if (!avatarFile) return;
    setUploadingAvatar(true);

    try {
      const ext  = avatarFile.name.split('.').pop();
      const path = `${user.id}/avatar.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, avatarFile, { upsert: true, contentType: avatarFile.type });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);

      // Update profiles table
      const { error: dbError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (dbError) throw dbError;

      // Keep auth metadata in sync
      await supabase.auth.updateUser({ data: { avatar_url: publicUrl } });
      await refreshProfile();

      setAvatarFile(null);
      toast.success('Profile picture updated!');
    } catch (err) {
      toast.error(err.message || 'Upload failed.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  // ── Change password ─────────────────────────────────────────────────────────
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      toast.error('New password must be at least 8 characters.'); return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match.'); return;
    }

    setSavingPassword(true);
    const { error } = await updatePassword(newPassword);
    if (error) {
      toast.error(error.message || 'Failed to change password.');
    } else {
      toast.success('Password changed successfully!');
      setNewPassword('');
      setConfirmPassword('');
      setShowPassFields(false);
    }
    setSavingPassword(false);
  };

  const initials = (profile?.full_name || profile?.username || 'U')
    .split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div className="page-container max-w-2xl mx-auto">

      {/* Page header */}
      <div className="mb-8 animate-fade-in">
        <div className="flex items-center gap-2 mb-2">
          <div className="orange-dot" />
          <span className="font-mono text-xs text-city-orange tracking-widest uppercase">Account</span>
        </div>
        <h1 className="font-display text-3xl font-bold text-city-text">Profile Settings</h1>
        <p className="font-body text-sm text-city-subtext mt-1">Manage your account details and security.</p>
      </div>

      {/* Current stats card */}
      <div className="card mb-6 flex items-center gap-5 animate-fade-in">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          {avatarPreview ? (
            <img src={avatarPreview} alt="Avatar" className="w-16 h-16 rounded-xl object-cover border border-city-border" />
          ) : (
            <div className="w-16 h-16 rounded-xl bg-city-orange/20 border border-city-orange/30 flex items-center justify-center">
              <span className="font-display font-bold text-xl text-city-orange">{initials}</span>
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-display font-bold text-city-text">{profile?.full_name || profile?.username}</p>
          <p className="font-body text-sm text-city-muted">@{profile?.username}</p>
          <div className="flex items-center gap-3 mt-2">
            <span className="font-mono text-xs text-city-orange">{profile?.points ?? 0} pts</span>
            <BadgeIcon badge={profile?.badge || 'none'} size="sm" showLabel />
          </div>
        </div>
      </div>

      {/* ── Section 1: Profile Info ─────────────────────────────────────── */}
      <Section title="Profile Information">
        <form onSubmit={handleSaveInfo} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-body text-xs font-medium text-city-subtext uppercase tracking-wider mb-1.5">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="Jane Smith"
                className="input-field"
              />
            </div>
            <div>
              <label className="block font-body text-xs font-medium text-city-subtext uppercase tracking-wider mb-1.5">Username</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-city-muted font-mono text-sm">@</span>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="jane_smith"
                  className="input-field pl-7"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block font-body text-xs font-medium text-city-subtext uppercase tracking-wider mb-1.5">Email</label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className="input-field opacity-50 cursor-not-allowed"
            />
            <p className="font-mono text-xs text-city-muted mt-1">Email cannot be changed here.</p>
          </div>

          <button type="submit" disabled={savingInfo} className="btn-primary flex items-center gap-2">
            {savingInfo
              ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving…</>
              : 'Save Changes'}
          </button>
        </form>
      </Section>

      {/* ── Section 2: Profile Picture ─────────────────────────────────────── */}
      <Section title="Profile Picture">
        <div className="flex items-start gap-5">
          {/* Preview */}
          <div className="flex-shrink-0">
            {avatarPreview ? (
              <img src={avatarPreview} alt="Preview" className="w-20 h-20 rounded-xl object-cover border border-city-border" />
            ) : (
              <div className="w-20 h-20 rounded-xl bg-city-orange/20 border border-city-orange/30 flex items-center justify-center">
                <span className="font-display font-bold text-2xl text-city-orange">{initials}</span>
              </div>
            )}
          </div>

          <div className="flex-1 space-y-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="btn-secondary w-full text-sm"
            >
              Choose Image
            </button>

            {avatarFile && (
              <button
                type="button"
                onClick={handleUploadAvatar}
                disabled={uploadingAvatar}
                className="btn-primary w-full flex items-center justify-center gap-2 text-sm"
              >
                {uploadingAvatar
                  ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Uploading…</>
                  : 'Upload & Save'}
              </button>
            )}

            <p className="font-mono text-xs text-city-muted">JPG, PNG, GIF · max 3 MB</p>
          </div>
        </div>
      </Section>

      {/* ── Section 3: Change Password ─────────────────────────────────────── */}
      <Section title="Security">
        {!showPassFields ? (
          <div className="space-y-3">
            <p className="font-body text-sm text-city-subtext">Manage your account password.</p>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setShowPassFields(true)}
                className="btn-secondary text-sm"
              >
                Change Password
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleChangePassword} className="space-y-4">
            <p className="font-body text-xs text-city-muted">
              Note: Supabase doesn't re-verify your current password. Use Forgot Password if locked out.
            </p>

            <div>
              <label className="block font-body text-xs font-medium text-city-subtext uppercase tracking-wider mb-1.5">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Min. 8 characters"
                className="input-field"
                autoComplete="new-password"
                required
              />
            </div>

            <div>
              <label className="block font-body text-xs font-medium text-city-subtext uppercase tracking-wider mb-1.5">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Repeat new password"
                className="input-field"
                autoComplete="new-password"
                required
              />
            </div>

            <div className="flex items-center gap-3">
              <button type="submit" disabled={savingPassword} className="btn-primary flex items-center gap-2">
                {savingPassword
                  ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Changing…</>
                  : 'Update Password'}
              </button>
              <button
                type="button"
                onClick={() => { setShowPassFields(false); setNewPassword(''); setConfirmPassword(''); }}
                className="btn-ghost text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </Section>
    </div>
  );
};

export default ProfileSettings;
