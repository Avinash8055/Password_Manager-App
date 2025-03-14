import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit, Key, LogOut, Settings, Search, Copy, RefreshCw, Download, Menu, X, Eye, EyeOff } from 'lucide-react';
import type { Folder as FolderType, PasswordEntry } from '../types';
import { generateSecurePassword, encryptData, decryptData } from '../utils/crypto';
import { checkPasswordStrength } from '../utils/passwordStrength';

interface PasswordManagerProps {
  folders: FolderType[];
  onAddFolder: (name: string) => void;
  onDeleteFolder: (id: string) => void;
  onAddEntry: (folderId: string, entry: Omit<PasswordEntry, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateEntry: (folderId: string, entry: PasswordEntry) => void;
  onDeleteEntry: (folderId: string, entryId: string) => void;
  onChangePassword: (newPassword: string) => void;
  onLogout: () => void;
}

const AUTO_LOGOUT_TIME = 5 * 60 * 1000; // 5 minutes

function PasswordManager({
  folders,
  onAddFolder,
  onDeleteFolder,
  onAddEntry,
  onUpdateEntry,
  onDeleteEntry,
  onChangePassword,
  onLogout,
}: PasswordManagerProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [isAddingFolder, setIsAddingFolder] = useState(false);
  const [isAddingEntry, setIsAddingEntry] = useState(false);
  const [editingEntry, setEditingEntry] = useState<PasswordEntry | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newMasterPassword, setNewMasterPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleCredentials, setVisibleCredentials] = useState<Record<string, boolean>>({});
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, feedback: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [entryForm, setEntryForm] = useState({
    title: '',
    username: '',
    password: '',
    notes: '',
  });

  useEffect(() => {
    const checkActivity = setInterval(() => {
      if (Date.now() - lastActivity > AUTO_LOGOUT_TIME) {
        onLogout();
      }
    }, 1000);

    return () => clearInterval(checkActivity);
  }, [lastActivity, onLogout]);

  useEffect(() => {
    const updateActivity = () => setLastActivity(Date.now());
    window.addEventListener('mousemove', updateActivity);
    window.addEventListener('keydown', updateActivity);
    return () => {
      window.removeEventListener('mousemove', updateActivity);
      window.removeEventListener('keydown', updateActivity);
    };
  }, []);

  const filteredFolders = folders.filter(folder =>
    folder.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const generatePassword = () => {
    const newPassword = generateSecurePassword(16);
    setEntryForm(prev => ({ ...prev, password: newPassword }));
    const strength = checkPasswordStrength(newPassword);
    setPasswordStrength(strength);
  };

  const handlePasswordChange = (password: string) => {
    setEntryForm(prev => ({ ...prev, password }));
    const strength = checkPasswordStrength(password);
    setPasswordStrength(strength);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const toggleCredentials = (entryId: string) => {
    setVisibleCredentials(prev => ({
      ...prev,
      [entryId]: !prev[entryId]
    }));
  };

  const handleAddFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (newFolderName.trim()) {
      onAddFolder(newFolderName.trim());
      setNewFolderName('');
      setIsAddingFolder(false);
    }
  };

  const handleAddEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFolder && entryForm.title && entryForm.username && entryForm.password) {
      onAddEntry(selectedFolder, entryForm);
      setEntryForm({ title: '', username: '', password: '', notes: '' });
      setIsAddingEntry(false);
    }
  };

  const handleUpdateEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFolder && editingEntry) {
      onUpdateEntry(selectedFolder, {
        ...editingEntry,
        ...entryForm,
        updatedAt: new Date().toISOString(),
      });
      setEntryForm({ title: '', username: '', password: '', notes: '' });
      setEditingEntry(null);
    }
  };

  const startEditEntry = (entry: PasswordEntry) => {
    setEditingEntry(entry);
    setEntryForm({
      title: entry.title,
      username: entry.username,
      password: entry.password,
      notes: entry.notes || '',
    });
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    const storedPassword = localStorage.getItem('masterPassword') || '123';
    
    if (oldPassword !== storedPassword) {
      setPasswordError('Current password is incorrect');
      return;
    }
    
    if (newMasterPassword.length >= 3) {
      onChangePassword(newMasterPassword);
      setOldPassword('');
      setNewMasterPassword('');
      setPasswordError('');
      setShowSettings(false);
    }
  };

  const downloadData = () => {
    const data = {
      folders: folders.map(folder => ({
        id: folder.id,
        name: folder.name,
        entries: folder.entries.map(entry => ({
          id: entry.id,
          title: entry.title,
          username: entry.username,
          password: entry.password,
          notes: entry.notes,
          createdAt: entry.createdAt,
          updatedAt: entry.updatedAt
        }))
      }))
    };

    const jsonString = JSON.stringify(data, null, 2);
    
    const blob = new Blob([jsonString], { 
      type: 'application/json;charset=utf-8'
    });
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `password-safe-backup-${timestamp}.json`;

    try {
      if (navigator.userAgent.match(/android|iphone|ipad|mobile/i)) {
        const tempLink = document.createElement('a');
        tempLink.href = URL.createObjectURL(blob);
        tempLink.download = filename;
        tempLink.style.display = 'none';
        
        document.body.appendChild(tempLink);
        tempLink.click();
        
        setTimeout(() => {
          document.body.removeChild(tempLink);
          URL.revokeObjectURL(tempLink.href);
        }, 100);
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Download failed:', error);
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(jsonString);
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', filename);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    }
  };

  const renderCredentials = (entry: PasswordEntry, isInline: boolean) => {
    if (!visibleCredentials[entry.id]) return null;

    const credentialsContent = (
      <>
        <div className="flex items-center gap-2">
          <button
            onClick={() => copyToClipboard(entry.username)}
            className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-gray-700 rounded-full transition-colors"
          >
            <Copy className="w-4 h-4" />
          </button>
          <span className="text-gray-300">{entry.username}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => copyToClipboard(entry.password)}
            className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-gray-700 rounded-full transition-colors"
          >
            <Copy className="w-4 h-4" />
          </button>
          <span className="text-gray-300">{entry.password}</span>
        </div>
      </>
    );

    if (isInline) {
      return (
        <div className="flex-1 flex items-center gap-4 ml-4">
          {credentialsContent}
        </div>
      );
    }

    return (
      <div className="mt-2 p-3 bg-gray-700/50 rounded-lg space-y-2">
        {credentialsContent}
      </div>
    );
  };

  const renderEntries = () => {
    const currentFolder = folders.find((f) => f.id === selectedFolder);
    if (!currentFolder) return null;

    const sortedEntries = [...currentFolder.entries].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );

    return sortedEntries.map((entry, index) => {
      const isLastTwo = index >= sortedEntries.length - 2;

      return (
        <div
          key={entry.id}
          className="bg-gray-800 rounded-lg border border-gray-700"
        >
          <div className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 flex-1">
                <button
                  onClick={() => toggleCredentials(entry.id)}
                  className={`p-2 rounded-full transition-colors ${
                    visibleCredentials[entry.id]
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'text-gray-400 hover:text-emerald-400 hover:bg-gray-700'
                  }`}
                >
                  <Key className="w-5 h-5" />
                </button>
                <span className="font-medium">{entry.title}</span>
                {isLastTwo && renderCredentials(entry, true)}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => startEditEntry(entry)}
                  className="p-2 text-gray-400 hover:text-blue-400 hover:bg-gray-700 rounded-full transition-colors"
                >
                  <Edit className="w-5 h-5" />
                </button>
                <button
                  onClick={() => onDeleteEntry(selectedFolder, entry.id)}
                  className="p-2 text-gray-400 hover:text-rose-400 hover:bg-gray-700 rounded-full transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
            {!isLastTwo && renderCredentials(entry, false)}
          </div>
        </div>
      );
    });
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <div className="bg-gray-800 text-white p-4 sticky top-0 z-10 border-b border-gray-700">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 hover:bg-gray-700 rounded-full text-gray-400 hover:text-gray-300 transition-colors"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <h1 className="text-xl font-semibold">Password Safe</h1>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 hover:bg-gray-700 rounded-full text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              <Settings className="w-5 h-5" />
            </button>
            <button
              onClick={onLogout}
              className="p-2 hover:bg-gray-700 rounded-full text-rose-400 hover:text-rose-300 transition-colors"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-4rem)]">
        <aside 
          className={`
            fixed md:static inset-y-0 left-0 z-20
            w-72 bg-gray-800 border-r border-gray-700
            transform transition-transform duration-200 ease-in-out
            ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
            md:translate-x-0
          `}
        >
          <div className="h-full flex flex-col">
            <div className="p-4 border-b border-gray-700">
              <div className="relative mb-4">
                <Search className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search categories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-gray-700 text-gray-100 pl-10 pr-4 py-2 rounded-lg border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold">Categories</h2>
                <button
                  onClick={() => setIsAddingFolder(true)}
                  className="p-2 text-violet-400 hover:text-violet-300 hover:bg-gray-700 rounded-full transition-colors"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {isAddingFolder && (
                <div className="p-4 border-b border-gray-700">
                  <form onSubmit={handleAddFolder}>
                    <input
                      type="text"
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      className="w-full bg-gray-700 text-gray-100 px-3 py-2 rounded-lg border border-gray-600 mb-2"
                      placeholder="Category name"
                    />
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        className="flex-1 bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700"
                      >
                        Add
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsAddingFolder(false)}
                        className="flex-1 bg-gray-700 text-gray-300 px-3 py-1 rounded-lg hover:bg-gray-600"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}

              <div className="p-2 space-y-1">
                {filteredFolders.map((folder) => (
                  <div
                    key={folder.id}
                    className={`flex items-center justify-between p-2 rounded-lg cursor-pointer ${
                      selectedFolder === folder.id ? 'bg-violet-500/20 text-violet-300' : 'hover:bg-gray-700'
                    }`}
                    onClick={() => {
                      setSelectedFolder(folder.id);
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    <span>{folder.name}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteFolder(folder.id);
                      }}
                      className="text-gray-400 hover:text-rose-400 p-1 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </aside>

        <main className="flex-1 overflow-hidden flex flex-col">
          {selectedFolder && (
            <>
              <div className="p-4 border-b border-gray-700">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold">
                    {folders.find((f) => f.id === selectedFolder)?.name}
                  </h2>
                  <button
                    onClick={() => setIsAddingEntry(true)}
                    className="flex items-center gap-2 bg-violet-600 text-white px-4 py-2 rounded-lg hover:bg-violet-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add Entry
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                {(isAddingEntry || editingEntry) && (
                  <div className="mb-6 bg-gray-800 p-4 rounded-lg border border-gray-700">
                    <form onSubmit={editingEntry ? handleUpdateEntry : handleAddEntry}>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">Title</label>
                          <input
                            type="text"
                            value={entryForm.title}
                            onChange={(e) => setEntryForm(prev => ({ ...prev, title: e.target.value }))}
                            className="w-full bg-gray-700 text-gray-100 px-3 py-2 rounded-lg border border-gray-600"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Username</label>
                          <input
                            type="text"
                            value={entryForm.username}
                            onChange={(e) => setEntryForm(prev => ({ ...prev, username: e.target.value }))}
                            className="w-full bg-gray-700 text-gray-100 px-3 py-2 rounded-lg border border-gray-600"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Password</label>
                          <div className="relative">
                            <input
                              type={showPassword ? "text" : "password"}
                              value={entryForm.password}
                              onChange={(e) => handlePasswordChange(e.target.value)}
                              className="w-full bg-gray-700 text-gray-100 px-3 py-2 pr-20 rounded-lg border border-gray-600"
                              required
                            />
                            <div className="absolute right-2 top-2 flex gap-2">
                              <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="text-gray-400 hover:text-blue-400"
                                title={showPassword ? "Hide password" : "Show password"}
                              >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                              <button
                                type="button"
                                onClick={generatePassword}
                                className="text-gray-400 hover:text-blue-400"
                                title="Generate password"
                              >
                                <RefreshCw className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          <div className="mt-2">
                            <div className="h-1 w-full bg-gray-700 rounded-full overflow-hidden">
                              <div
                                className={`h-full transition-all duration-300 ${
                                  passwordStrength.score >= 4
                                    ? 'bg-green-500'
                                    : passwordStrength.score >= 3
                                    ? 'bg-blue-400'
                                    : passwordStrength.score >= 2
                                    ? 'bg-yellow-500'
                                    : 'bg-red-500'
                                }`}
                                style={{ width: `${(passwordStrength.score / 4) * 100}%` }}
                              />
                            </div>
                            {passwordStrength.feedback && (
                              <p className="text-sm text-gray-400 mt-1">{passwordStrength.feedback}</p>
                            )}
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Notes</label>
                          <input
                            type="text"
                            value={entryForm.notes}
                            onChange={(e) => setEntryForm(prev => ({ ...prev, notes: e.target.value }))}
                            className="w-full bg-gray-700 text-gray-100 px-3 py-2 rounded-lg border border-gray-600"
                          />
                        </div>
                      </div>
                      <div className="mt-4 flex gap-2">
                        <button
                          type="submit"
                          className="flex-1 bg-blue-600 text-white rounded-lg py-2 hover:bg-blue-700"
                        >
                          {editingEntry ? 'Update' : 'Add'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsAddingEntry(false);
                            setEditingEntry(null);
                            setEntryForm({ title: '', username: '', password: '', notes: '' });
                          }}
                          className="flex-1 bg-gray-700 text-gray-300 rounded-lg py-2 hover:bg-gray-600"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                <div className="space-y-2">
                  {renderEntries()}
                </div>
              </div>
            </>
          )}
        </main>
      </div>

      {showSettings && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-20">
          <div className="bg-gray-800 rounded-lg w-full max-w-md p-6 border border-gray-700">
            <h2 className="text-xl font-semibold mb-4">Change Master Password</h2>
            <form onSubmit={handleChangePassword}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    className="w-full bg-gray-700 text-gray-100 px-3 py-2 rounded-lg border border-gray-600"
                    placeholder="Enter current password"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newMasterPassword}
                    onChange={(e) => setNewMasterPassword(e.target.value)}
                    className="w-full bg-gray-700 text-gray-100 px-3 py-2 rounded-lg border border-gray-600"
                    placeholder="Enter new password"
                    minLength={3}
                    required
                  />
                </div>
                {passwordError && (
                  <p className="text-rose-400 text-sm">{passwordError}</p>
                )}
              </div>
              <div className="flex gap-2 mt-6">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white rounded-lg py-2 hover:bg-blue-700"
                >
                  Change Password
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowSettings(false);
                    setOldPassword('');
                    setNewMasterPassword('');
                    setPasswordError('');
                  }}
                  className="flex-1 bg-gray-700 text-gray-300 rounded-lg py-2 hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default PasswordManager;