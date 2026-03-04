'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/database/supabase';
import { Search, X, MapPin, Calendar, Shield, Ban, ChevronRight } from 'lucide-react';
import { useToast } from '@/components/admin/AdminToast';

interface UserProfile {
    id: string;
    full_name: string;
    role: string;
    contact_email: string | null;
    gender: string | null;
    employment_status: string | null;
    year_of_birth: number | null;
    avatar_url: string | null;
    updated_at: string;
    country: string | null;
    phone: string | null;
    deactivated_at: string | null;
}

interface UserNeed {
    id: string;
    title: string;
    category: string;
    upvotes: number;
    created_at: string;
}

export default function UsersPage() {
    const { toast } = useToast();
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState<string>('all');
    const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
    const [userNeeds, setUserNeeds] = useState<UserNeed[]>([]);
    const [loadingNeeds, setLoadingNeeds] = useState(false);
    const [authEmails, setAuthEmails] = useState<Record<string, string>>({});

    useEffect(() => { fetchUsers(); }, []);

    const fetchUsers = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('profiles')
            .select('id, full_name, role, contact_email, gender, employment_status, year_of_birth, avatar_url, updated_at, country, phone, deactivated_at')
            .order('updated_at', { ascending: false });

        if (data) setUsers(data);

        // Fetch auth emails
        try {
            const res = await fetch('/api/admin/users');
            const { emailMap } = await res.json();
            setAuthEmails(emailMap || {});
        } catch { }

        setLoading(false);
    };

    const selectUser = async (user: UserProfile) => {
        setSelectedUser(user);
        setLoadingNeeds(true);
        const { data } = await supabase
            .from('local_needs')
            .select('id, title, category, upvotes, created_at')
            .eq('user_id', user.id)
            .is('deleted_at', null)
            .order('created_at', { ascending: false });
        setUserNeeds(data || []);
        setLoadingNeeds(false);
    };

    const changeRole = async (userId: string, newRole: string) => {
        const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', userId);
        if (error) {
            toast('Failed to update role', 'error');
        } else {
            toast(`Role updated to ${newRole}`, 'success');
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
            if (selectedUser?.id === userId) setSelectedUser({ ...selectedUser, role: newRole });
        }
    };

    const banUser = async (userId: string) => {
        if (!confirm('Ban this user? This will hide all their content.')) return;
        const { error } = await supabase.from('profiles').update({ deactivated_at: new Date().toISOString() }).eq('id', userId);
        if (error) {
            toast('Failed to ban user', 'error');
        } else {
            toast('User banned', 'success');
            fetchUsers();
            setSelectedUser(null);
        }
    };

    const unbanUser = async (userId: string) => {
        const { error } = await supabase.from('profiles').update({ deactivated_at: null }).eq('id', userId);
        if (error) {
            toast('Failed to unban user', 'error');
        } else {
            toast('User unbanned', 'success');
            fetchUsers();
            setSelectedUser(null);
        }
    };

    const filtered = users.filter(u => {
        const matchSearch = !search ||
            u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
            u.contact_email?.toLowerCase().includes(search.toLowerCase()) ||
            authEmails[u.id]?.toLowerCase().includes(search.toLowerCase());
        const matchRole = roleFilter === 'all' || u.role === roleFilter;
        return matchSearch && matchRole;
    });

    const getRoleBadge = (role: string) => {
        const colors: Record<string, string> = {
            admin: 'bg-blue-500/20 text-blue-400',
            moderator: 'bg-purple-500/20 text-purple-400',
            client: 'bg-gray-500/20 text-gray-400',
        };
        return colors[role] || colors.client;
    };

    return (
        <div className="admin-animate-in space-y-5">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Users</h1>
                    <p className="text-sm text-gray-500 mt-1">{filtered.length} users found</p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex gap-3">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="admin-input pl-10"
                    />
                </div>
                <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="admin-select">
                    <option value="all">All Roles</option>
                    <option value="admin">Admin</option>
                    <option value="moderator">Moderator</option>
                    <option value="client">Client</option>
                </select>
            </div>

            <div className="flex gap-4">
                {/* Users Table */}
                <div className={`admin-card flex-1 overflow-hidden ${selectedUser ? 'max-w-[60%]' : ''}`}>
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent" />
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>User</th>
                                        <th>Email</th>
                                        <th>Role</th>
                                        <th>Gender</th>
                                        <th>Employment</th>
                                        <th>Joined</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map(user => (
                                        <tr
                                            key={user.id}
                                            onClick={() => selectUser(user)}
                                            className={`cursor-pointer ${selectedUser?.id === user.id ? '!bg-white/[0.08]' : ''} ${user.deactivated_at ? 'opacity-50' : ''}`}
                                        >
                                            <td>
                                                <div className="flex items-center gap-3">
                                                    {user.avatar_url ? (
                                                        <img src={user.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                                                    ) : (
                                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white text-xs font-bold">
                                                            {user.full_name?.charAt(0)?.toUpperCase() || '?'}
                                                        </div>
                                                    )}
                                                    <div>
                                                        <span className="font-medium text-white">{user.full_name || '—'}</span>
                                                        {user.deactivated_at && <span className="ml-2 text-[10px] text-red-400 font-bold">BANNED</span>}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="text-gray-400 text-xs">{authEmails[user.id] || user.contact_email || '—'}</td>
                                            <td><span className={`admin-tag ${getRoleBadge(user.role)}`}>{user.role}</span></td>
                                            <td className="text-gray-400 text-sm capitalize">{user.gender?.replace('_', ' ') || '—'}</td>
                                            <td className="text-gray-400 text-sm capitalize">{user.employment_status?.replace('_', ' ') || '—'}</td>
                                            <td className="text-gray-500 text-xs">{new Date(user.updated_at).toLocaleDateString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* User Detail Panel */}
                {selectedUser && (
                    <div className="admin-card admin-slide-in w-[40%] flex-shrink-0 space-y-5">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold text-white">User Details</h3>
                            <button onClick={() => setSelectedUser(null)} className="text-gray-500 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Profile Header */}
                        <div className="flex items-center gap-4 p-4 rounded-lg bg-white/[0.03]">
                            {selectedUser.avatar_url ? (
                                <img src={selectedUser.avatar_url} alt="" className="w-14 h-14 rounded-full object-cover" />
                            ) : (
                                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white text-xl font-bold">
                                    {selectedUser.full_name?.charAt(0)?.toUpperCase()}
                                </div>
                            )}
                            <div>
                                <p className="font-bold text-white text-lg">{selectedUser.full_name}</p>
                                <p className="text-sm text-gray-400">{authEmails[selectedUser.id] || selectedUser.contact_email || 'No email'}</p>
                                <span className={`admin-tag mt-1 ${getRoleBadge(selectedUser.role)}`}>{selectedUser.role}</span>
                            </div>
                        </div>

                        {/* Demographics */}
                        <div className="grid grid-cols-2 gap-3">
                            <InfoBlock label="Gender" value={selectedUser.gender?.replace('_', ' ') || '—'} />
                            <InfoBlock label="Birth Year" value={selectedUser.year_of_birth?.toString() || '—'} />
                            <InfoBlock label="Employment" value={selectedUser.employment_status?.replace('_', ' ') || '—'} />
                            <InfoBlock label="Country" value={selectedUser.country || '—'} />
                        </div>

                        {/* Actions */}
                        <div className="space-y-2">
                            <h4 className="admin-section-title">Actions</h4>
                            <div className="flex flex-wrap gap-2">
                                <select
                                    value={selectedUser.role}
                                    onChange={e => changeRole(selectedUser.id, e.target.value)}
                                    className="admin-select text-sm"
                                >
                                    <option value="client">Client</option>
                                    <option value="moderator">Moderator</option>
                                    <option value="admin">Admin</option>
                                </select>
                                {selectedUser.deactivated_at ? (
                                    <button onClick={() => unbanUser(selectedUser.id)} className="admin-btn admin-btn-success">
                                        <Shield className="w-4 h-4" /> Unban
                                    </button>
                                ) : (
                                    <button onClick={() => banUser(selectedUser.id)} className="admin-btn admin-btn-danger">
                                        <Ban className="w-4 h-4" /> Ban User
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* User's Needs */}
                        <div>
                            <h4 className="admin-section-title">Dropped Pins ({userNeeds.length})</h4>
                            {loadingNeeds ? (
                                <div className="flex justify-center py-4">
                                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-500 border-t-transparent" />
                                </div>
                            ) : userNeeds.length > 0 ? (
                                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                                    {userNeeds.map(need => (
                                        <div key={need.id} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
                                            <MapPin className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm text-white truncate">{need.title}</p>
                                                <p className="text-xs text-gray-500">{need.category}</p>
                                            </div>
                                            <span className="text-xs text-cyan-400 font-bold">{need.upvotes}↑</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-600 italic">No needs dropped yet</p>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
    return (
        <div className="p-3 rounded-lg bg-white/[0.03]">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">{label}</p>
            <p className="text-sm text-white capitalize">{value}</p>
        </div>
    );
}
