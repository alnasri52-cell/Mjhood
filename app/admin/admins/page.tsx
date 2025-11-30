'use client';

import { useState, useEffect } from 'react';
import { Shield, UserPlus, Trash2, Check, X, Search, MoreVertical } from 'lucide-react';
import { supabase } from '@/lib/database/supabase';

type AdminUser = {
    id: string;
    full_name: string;
    email: string;
    role: 'admin' | 'moderator' | 'user';
    created_at: string;
    last_sign_in_at?: string;
    permissions?: string[];
};

export default function AdminManagementPage() {
    const [admins, setAdmins] = useState<AdminUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [newAdminEmail, setNewAdminEmail] = useState('');
    const [adding, setAdding] = useState(false);

    useEffect(() => {
        fetchAdmins();
    }, []);

    const fetchAdmins = async () => {
        setLoading(true);

        // Fetch only admins/moderators - now with permissions since migration is run
        const { data: profiles, error } = await supabase
            .from('profiles')
            .select('id, full_name, role, contact_email, phone, permissions')
            .in('role', ['admin', 'moderator']);

        console.log('Fetching admins/moderators...');
        console.log('Error:', error);
        console.log('Profiles data:', profiles);
        console.log('Number of profiles:', profiles?.length);

        if (profiles) {
            // Fetch emails from auth system via API
            try {
                const response = await fetch('/api/admin/users');
                const { emailMap } = await response.json();

                // Map to include email from auth or contact_email
                const adminsWithEmail = profiles.map(p => ({
                    ...p,
                    email: emailMap[p.id] || p.contact_email || 'No email',
                    created_at: new Date().toISOString(), // Mock value since column doesn't exist
                    permissions: p.permissions || [] // Use actual permissions from DB
                }));
                setAdmins(adminsWithEmail as AdminUser[]);
            } catch (err) {
                console.error('Error fetching emails:', err);
                // Fallback to contact_email only
                const adminsWithEmail = profiles.map(p => ({
                    ...p,
                    email: p.contact_email || 'No email',
                    created_at: new Date().toISOString(), // Mock value since column doesn't exist
                    permissions: p.permissions || [] // Use actual permissions from DB
                }));
                setAdmins(adminsWithEmail as AdminUser[]);
            }
        }
        setLoading(false);
    };

    const handleAddAdmin = async () => {
        setAdding(true);
        try {
            // 1. Find user by email (This is tricky client-side without an Edge Function)
            // For now, we will assume we can search by exact email in profiles if it exists,
            // OR we ask for User ID. Let's ask for User ID for safety if email isn't in profiles.
            // Actually, let's try to find a profile with that email if we stored it.
            // If not, we'll have to ask for UUID.

            // Let's assume for this UI we search by email in profiles (if you added it) 
            // or we just simulate it for the "Add" flow if we can't really do it client-side.

            // REAL IMPLEMENTATION:
            // We need to update the profile.role to 'admin'.

            // For this demo, let's assume we        try {
            // Search for user by email
            const { data: user, error: searchError } = await supabase
                .from('profiles')
                .select('id, full_name, contact_email, role')
                .eq('contact_email', newAdminEmail) // Use newAdminEmail here
                .single();

            if (searchError || !user) { // Use searchError here
                alert('User not found. Please ensure the user has a profile and the email is correct.');
                setAdding(false);
                return; // Added return here
            }
            // Update user role to admin via API
            const response = await fetch('/api/admin/update-role', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id, role: 'admin' })
            });

            const result = await response.json();
            if (!response.ok || result.error) {
                throw new Error(result.error || 'Failed to update role');
            }

            // Removed `if (updateError) throw updateError;` as it's not applicable here.

            setShowAddModal(false);
            setNewAdminEmail('');
            fetchAdmins();
            alert('Admin added successfully!');

        } catch (error) {
            console.error('Error adding admin:', error);
            alert('Failed to add admin.');
        } finally {
            setAdding(false);
        }
    };

    const handleRemoveAdmin = async (id: string) => {
        if (!confirm('Are you sure you want to remove this admin? They will lose all access to the dashboard.')) return;

        try {
            const response = await fetch('/api/admin/update-role', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: id, role: 'user' })
            });

            const result = await response.json();
            if (!response.ok || result.error) {
                throw new Error(result.error || 'Failed to remove admin');
            }

            fetchAdmins();
        } catch (error) {
            console.error('Error removing admin:', error);
            alert('Failed to remove admin.');
        }
    };

    const handleUpdateRole = async (id: string, newRole: 'admin' | 'moderator') => {
        console.log('Updating role for user:', id, 'to:', newRole);

        try {
            const response = await fetch('/api/admin/update-role', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: id, role: newRole })
            });

            const result = await response.json();
            console.log('Update result:', result);

            if (!response.ok || result.error) {
                console.error('Error updating role:', result.error);
                alert('Failed to update role: ' + (result.error || 'Unknown error'));
                return;
            }

            console.log('Role updated successfully, refetching admins...');
            await fetchAdmins();
        } catch (error) {
            console.error('Error updating role:', error);
            alert('Failed to update role');
        }
    };

    const handleTogglePermission = async (userId: string, permission: string) => {
        try {
            // Find the current admin
            const admin = admins.find(a => a.id === userId);
            if (!admin) return;

            // Toggle the permission
            const currentPermissions = admin.permissions || [];
            const newPermissions = currentPermissions.includes(permission)
                ? currentPermissions.filter(p => p !== permission)
                : [...currentPermissions, permission];

            // Update via API route
            const response = await fetch('/api/admin/update-permissions', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, permissions: newPermissions })
            });

            const result = await response.json();

            if (!response.ok || result.error) {
                console.error('Error updating permissions:', result.error);
                alert('Failed to update permissions: ' + (result.error || 'Unknown error'));
                return;
            }

            // Update local state
            setAdmins(admins.map(a =>
                a.id === userId ? { ...a, permissions: newPermissions } : a
            ));
        } catch (error) {
            console.error('Error updating permissions:', error);
            alert('Failed to update permissions');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Team Management</h1>
                    <p className="text-gray-500">Manage admins, moderators, and their permissions.</p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition flex items-center gap-2"
                >
                    <UserPlus className="w-4 h-4" />
                    Add New Admin
                </button>
            </div>

            {/* Admins List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex items-center gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search admins..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 text-gray-900"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 font-semibold">User</th>
                                <th className="px-6 py-3 font-semibold">Role</th>
                                <th className="px-6 py-3 font-semibold">Permissions</th>
                                <th className="px-6 py-3 font-semibold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">Loading team members...</td>
                                </tr>
                            ) : admins.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">No admins found.</td>
                                </tr>
                            ) : (
                                admins.filter(a => a.full_name?.toLowerCase().includes(searchTerm.toLowerCase())).map((admin) => (
                                    <tr key={admin.id} className="hover:bg-gray-50 transition">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                                                    {admin.full_name?.[0]?.toUpperCase() || 'U'}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-gray-900">{admin.full_name || 'Unknown User'}</div>
                                                    <div className="text-xs text-gray-500">{admin.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <select
                                                value={admin.role}
                                                onChange={(e) => handleUpdateRole(admin.id, e.target.value as 'admin' | 'moderator')}
                                                className="bg-white border border-gray-200 text-gray-900 text-xs rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-1.5"
                                            >
                                                <option value="admin">Admin</option>
                                                <option value="moderator">Moderator</option>
                                            </select>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-wrap gap-2">
                                                {admin.role === 'admin' ? (
                                                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">Full Access</span>
                                                ) : (
                                                    <div className="flex flex-wrap gap-2">
                                                        {['users', 'services', 'needs', 'trust', 'trash'].map((permission) => {
                                                            const hasPermission = admin.permissions?.includes(permission);
                                                            const labels: Record<string, string> = {
                                                                users: 'Users',
                                                                services: 'Services',
                                                                needs: 'Needs',
                                                                trust: 'Trust & Safety',
                                                                trash: 'Trash'
                                                            };

                                                            return (
                                                                <label
                                                                    key={permission}
                                                                    className={`flex items-center gap-1 px-2 py-1 rounded text-xs cursor-pointer transition ${hasPermission
                                                                        ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                                                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                                                        }`}
                                                                >
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={hasPermission}
                                                                        onChange={() => handleTogglePermission(admin.id, permission)}
                                                                        className="w-3 h-3 rounded border-gray-300"
                                                                    />
                                                                    <span className="font-medium">{labels[permission]}</span>
                                                                </label>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => handleRemoveAdmin(admin.id)}
                                                className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded-lg transition"
                                                title="Remove Admin Access"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add Admin Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-gray-900">Add New Admin</h3>
                            <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">User Email</label>
                                <input
                                    type="email"
                                    placeholder="Enter user's email address"
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                                    value={newAdminEmail}
                                    onChange={(e) => setNewAdminEmail(e.target.value)}
                                />
                                <p className="text-xs text-gray-500 mt-1">The user must already have an account on the platform.</p>
                            </div>

                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    onClick={() => setShowAddModal(false)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleAddAdmin}
                                    disabled={adding || !newAdminEmail}
                                    className="bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition disabled:opacity-50 flex items-center gap-2"
                                >
                                    {adding ? 'Adding...' : 'Add Admin'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
