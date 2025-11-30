'use client';

import { useState } from 'react';
import { Save, Shield, Bell, CreditCard, ToggleLeft, Globe } from 'lucide-react';

export default function AdminSettingsPage() {
    const [loading, setLoading] = useState(false);
    const [settings, setSettings] = useState({
        platformFee: 10,
        maintenanceMode: false,
        allowNewRegistrations: true,
        emailNotifications: true,
        autoApproveServices: false,
        supportEmail: 'support@example.com',
        sessionTimeout: 30
    });

    const handleSave = () => {
        setLoading(true);
        // Simulate API call
        setTimeout(() => {
            setLoading(false);
            alert('Settings saved successfully!');
        }, 1000);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Platform Settings</h1>
                    <p className="text-gray-500">Manage global configurations and preferences.</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={loading}
                    className="bg-gray-900 text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition font-medium flex items-center gap-2 disabled:opacity-50"
                >
                    {loading ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                        <Save className="w-4 h-4" />
                    )}
                    Save Changes
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* General Configuration */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center gap-2 mb-6">
                        <Globe className="w-5 h-5 text-blue-600" />
                        <h2 className="font-bold text-gray-900 text-lg">General Configuration</h2>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Support Email</label>
                            <input
                                type="email"
                                value={settings.supportEmail}
                                onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                            />
                        </div>

                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div>
                                <h3 className="font-medium text-gray-900">Maintenance Mode</h3>
                                <p className="text-xs text-gray-500">Disable access for non-admin users</p>
                            </div>
                            <button
                                onClick={() => setSettings({ ...settings, maintenanceMode: !settings.maintenanceMode })}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.maintenanceMode ? 'bg-blue-600' : 'bg-gray-200'}`}
                            >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.maintenanceMode ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div>
                                <h3 className="font-medium text-gray-900">New User Registrations</h3>
                                <p className="text-xs text-gray-500">Allow new users to sign up</p>
                            </div>
                            <button
                                onClick={() => setSettings({ ...settings, allowNewRegistrations: !settings.allowNewRegistrations })}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.allowNewRegistrations ? 'bg-blue-600' : 'bg-gray-200'}`}
                            >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.allowNewRegistrations ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Financial Settings */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center gap-2 mb-6">
                        <CreditCard className="w-5 h-5 text-green-600" />
                        <h2 className="font-bold text-gray-900 text-lg">Financial Settings</h2>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Platform Commission Fee (%)</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    value={settings.platformFee}
                                    onChange={(e) => setSettings({ ...settings, platformFee: Number(e.target.value) })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">%</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">Applied to all service transactions.</p>
                        </div>
                    </div>
                </div>

                {/* Security & Access */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center gap-2 mb-6">
                        <Shield className="w-5 h-5 text-red-600" />
                        <h2 className="font-bold text-gray-900 text-lg">Security & Access</h2>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Admin Session Timeout (Minutes)</label>
                            <input
                                type="number"
                                value={settings.sessionTimeout}
                                onChange={(e) => setSettings({ ...settings, sessionTimeout: Number(e.target.value) })}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                            />
                        </div>

                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div>
                                <h3 className="font-medium text-gray-900">Auto-Approve Services</h3>
                                <p className="text-xs text-gray-500">Skip manual review for new listings</p>
                            </div>
                            <button
                                onClick={() => setSettings({ ...settings, autoApproveServices: !settings.autoApproveServices })}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.autoApproveServices ? 'bg-blue-600' : 'bg-gray-200'}`}
                            >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.autoApproveServices ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Notifications */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center gap-2 mb-6">
                        <Bell className="w-5 h-5 text-orange-600" />
                        <h2 className="font-bold text-gray-900 text-lg">Notifications</h2>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div>
                                <h3 className="font-medium text-gray-900">Email Alerts</h3>
                                <p className="text-xs text-gray-500">Receive emails for critical system events</p>
                            </div>
                            <button
                                onClick={() => setSettings({ ...settings, emailNotifications: !settings.emailNotifications })}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.emailNotifications ? 'bg-blue-600' : 'bg-gray-200'}`}
                            >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.emailNotifications ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
