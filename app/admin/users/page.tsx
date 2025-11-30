'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/database/supabase';
import { Search, Filter, MoreVertical, Shield, Ban, CheckCircle } from 'lucide-react';

interface UserProfile {
    id: string;
    full_name: string;
    email?: string; // Email is in auth.users, not profiles usually, but we might have it or mock it
    role: string;
    created_at?: string;
    updated_at?: string;
    status?: 'active' | 'suspended' | 'banned'; // Mocked for now
    reputation_score?: number; // Mocked
}

export default function UserManagementPage() {
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState('all');
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const [roleChangeUser, setRoleChangeUser] = useState<UserProfile | null>(null);
    const [newRole, setNewRole] = useState<string>('');
    const [updating, setUpdating] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchUsers = async () => {
            // Fetch profiles
            const { data: profiles, error } = await supabase
                .from('profiles')
                .select('*');

            if (error) {
                console.error('Error fetching users:', error);
                setLoading(false);
                return;
            }

            // Fetch emails from our API route
            try {
                const response = await fetch('/api/admin/users');
                const { emailMap } = await response.json();

                console.log('Email map from API:', emailMap);

                // Use real email from auth or contact_email field
                const enrichedUsers = profiles.map((profile: any) => {
                    const authEmail = emailMap[profile.id];
                    console.log(`Profile ${profile.full_name}:`, {
                        profileId: profile.id,
                        authEmail,
                        contactEmail: profile.contact_email
                    });
                    return {
                        ...profile,
                        email: authEmail || profile.contact_email || `${profile.full_name?.toLowerCase().replace(/\s/g, '.') || 'user'}@example.com`,
                        status: profile.banned ? 'banned' : 'active',
                        reputation_score: Math.floor(Math.random() * 100)
                    };
                });

                setUsers(enrichedUsers);
            } catch (err) {
                console.error('Error fetching emails:', err);
                // Fallback to profiles without auth emails
                const enrichedUsers = profiles.map((profile: any) => ({
                    ...profile,
                    email: profile.contact_email || `${profile.full_name?.toLowerCase().replace(/\s/g, '.') || 'user'}@example.com`,
                    status: profile.banned ? 'banned' : 'active',
                    reputation_score: Math.floor(Math.random() * 100)
                }));
                setUsers(enrichedUsers);
            }

            setLoading(false);
        };

        fetchUsers();
    }, []);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setOpenMenuId(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredUsers = users.filter(user => {
        const matchesSearch = user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = filterRole === 'all' || user.role === filterRole;
        return matchesSearch && matchesRole;
    });

    const handleRoleChange = async () => {
        if (!roleChangeUser || !newRole) return;

        setUpdating(true);
        try {
            const response = await fetch('/api/admin/users/role', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: roleChangeUser.id,
                    newRole: newRole,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to update role');
            }

            // Update local state
            setUsers(users.map(u =>
                u.id === roleChangeUser.id ? { ...u, role: newRole } : u
            ));

            setRoleChangeUser(null);
            setNewRole('');
            alert(`Successfully changed ${roleChangeUser.full_name}'s role to ${newRole}`);
        } catch (error: any) {
            console.error('Error updating role:', error);
            alert('Failed to update role: ' + error.message);
        } finally {
            setUpdating(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'bg-green-100 text-green-700';
            case 'suspended': return 'bg-yellow-100 text-yellow-700';
            case 'banned': return 'bg-red-100 text-red-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
                    <p className="text-gray-500">View and manage all registered users.</p>
                </div>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
                    Export CSV
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 justify-between">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search users..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-3">
                    <select
                        className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        value={filterRole}
                        onChange={(e) => setFilterRole(e.target.value)}
                    >
                        <option value="all">All Roles</option>
                        <option value="client">Clients</option>
                        <option value="talent">Talents</option>
                        <option value="admin">Admins</option>
                    </select>
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Reputation</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Joined</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">Loading users...</td>
                                </tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">No users found.</td>
                                </tr>
                            ) : (
                                filteredUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-gray-50 transition">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold">
                                                    {user.full_name?.charAt(0) || '?'}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900">{user.full_name || 'Unknown'}</p>
                                                    <p className="text-xs text-gray-500">{user.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                                                user.role === 'talent' ? 'bg-blue-100 text-blue-700' :
                                                    'bg-gray-100 text-gray-700'
                                                }`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(user.status || 'active')}`}>
                                                {user.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1">
                                                <Shield className="w-4 h-4 text-green-500" />
                                                <span className="font-medium text-gray-700">{user.reputation_score || 95}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {user.created_at ? new Date(user.created_at).toLocaleDateString() : (user.updated_at ? new Date(user.updated_at).toLocaleDateString() : 'N/A')}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="relative" ref={openMenuId === user.id ? menuRef : null}>
                                                <button
                                                    onClick={() => setOpenMenuId(openMenuId === user.id ? null : user.id)}
                                                    className="text-gray-400 hover:text-gray-600"
                                                >
                                                    <MoreVertical className="w-5 h-5" />
                                                </button>
                                                {openMenuId === user.id && (
                                                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                                                        <button
                                                            onClick={() => {
                                                                window.location.href = `/profile/${user.id}`;
                                                                setOpenMenuId(null);
                                                            }}
                                                            className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm text-gray-700 flex items-center gap-2"
                                                        >
                                                            <CheckCircle className="w-4 h-4" />
                                                            View Profile
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setRoleChangeUser(user);
                                                                setNewRole(user.role);
                                                                setOpenMenuId(null);
                                                            }}
                                                            className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm text-gray-700 flex items-center gap-2"
                                                        >
                                                            <Shield className="w-4 h-4" />
                                                            Change Role
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                if (confirm(`Are you sure you want to ban ${user.full_name}?`)) {
                                                                    alert('Ban User functionality coming soon');
                                                                }
                                                                setOpenMenuId(null);
                                                            }}
                                                            className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm text-red-600 flex items-center gap-2"
                                                        >
                                                            <Ban className="w-4 h-4" />
                                                            Ban User
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Role Change Modal */}
            {roleChangeUser && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4">
                        <div className="p-6 border-b border-gray-100">
                            <h3 className="text-xl font-bold text-gray-900">Change User Role</h3>
                            <p className="text-sm text-gray-500 mt-1">Update role for {roleChangeUser.full_name}</p>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Select New Role</label>
                                <select
                                    value={newRole}
                                    onChange={(e) => setNewRole(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="client">Client</option>
                                    <option value="talent">Talent</option>
                                    <option value="admin">Admin</option>
                                    <option value="moderator">Moderator</option>
                                </select>
                            </div>

                            <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                                <p className="text-xs text-blue-700">
                                    <strong>Current Role:</strong> {roleChangeUser.role}
                                </p>
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-100 flex gap-3">
                            <button
                                onClick={() => {
                                    setRoleChangeUser(null);
                                    setNewRole('');
                                }}
                                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                                disabled={updating}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleRoleChange}
                                disabled={updating || newRole === roleChangeUser.role}
                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {updating ? 'Updating...' : 'Update Role'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
