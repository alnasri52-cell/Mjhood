'use client';

import { useLanguage } from '@/lib/contexts/LanguageContext';
import { Mail, Phone, MapPin } from 'lucide-react';

export default function ContactPage() {
    const { t, dir } = useLanguage();

    return (
        <div className="max-w-4xl mx-auto px-4 py-12">
            <h1 className="text-3xl font-bold mb-8">{t('contactTitle')}</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div>
                    <p className="text-gray-600 mb-8">
                        {t('contactText')}
                    </p>

                    <div className="space-y-6">
                        <div className="flex items-start">
                            <Mail className={`w-6 h-6 text-blue-600 mt-1 ${dir === 'rtl' ? 'ml-4' : 'mr-4'}`} />
                            <div>
                                <h3 className="font-semibold text-gray-900">{t('emailLabel')}</h3>
                                <p className="text-gray-600">support@mjhood.com</p>
                            </div>
                        </div>

                        <div className="flex items-start">
                            <Phone className={`w-6 h-6 text-blue-600 mt-1 ${dir === 'rtl' ? 'ml-4' : 'mr-4'}`} />
                            <div>
                                <h3 className="font-semibold text-gray-900">{t('phoneLabel')}</h3>
                                <p className="text-gray-600">+966 50 000 0000</p>
                            </div>
                        </div>

                        <div className="flex items-start">
                            <MapPin className={`w-6 h-6 text-blue-600 mt-1 ${dir === 'rtl' ? 'ml-4' : 'mr-4'}`} />
                            <div>
                                <h3 className="font-semibold text-gray-900">{t('officeLabel')}</h3>
                                <p className="text-gray-600">Riyadh, Saudi Arabia</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <form className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">{t('nameLabel')}</label>
                            <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-black" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">{t('emailLabel')}</label>
                            <input type="email" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-black" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">{t('messageLabel')}</label>
                            <textarea rows={4} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-black"></textarea>
                        </div>
                        <button type="button" className="w-full py-2 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition">
                            {t('sendMessage')}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
