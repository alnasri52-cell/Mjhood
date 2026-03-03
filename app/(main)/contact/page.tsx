'use client';

import { useState } from 'react';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import { Mail, Send, CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/database/supabase';

export default function ContactPage() {
    const { t, dir } = useLanguage();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !email.trim() || !message.trim()) return;

        setLoading(true);
        try {
            // Save to Supabase
            await supabase.from('contact_messages').insert({
                name: name.trim(),
                email: email.trim(),
                message: message.trim(),
            });

            // Send email notification
            await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: name.trim(), email: email.trim(), message: message.trim() }),
            });

            setSent(true);
        } catch (err) {
            console.error('Contact form error:', err);
            alert(dir === 'rtl' ? 'حدث خطأ. حاول مرة أخرى.' : 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (sent) {
        return (
            <div className="max-w-2xl mx-auto px-4 py-20 text-center">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-6" />
                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                    {dir === 'rtl' ? 'تم إرسال رسالتك!' : 'Message Sent!'}
                </h1>
                <p className="text-gray-600 text-lg">
                    {dir === 'rtl'
                        ? 'شكراً لك! سنرد عليك في أقرب وقت ممكن.'
                        : 'Thank you! We\'ll get back to you as soon as possible.'
                    }
                </p>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto px-4 py-12">
            <div className="text-center mb-10">
                <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Mail className="w-7 h-7 text-blue-600" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-3">{t('contactTitle')}</h1>
                <p className="text-gray-600 text-lg max-w-md mx-auto">
                    {t('contactText')}
                </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            {dir === 'rtl' ? 'الاسم' : 'Name'}
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400 transition"
                            placeholder={dir === 'rtl' ? 'اسمك الكامل' : 'Your full name'}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            {dir === 'rtl' ? 'البريد الإلكتروني' : 'Email'}
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400 transition"
                            placeholder={dir === 'rtl' ? 'بريدك الإلكتروني' : 'your@email.com'}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            {dir === 'rtl' ? 'الرسالة' : 'Message'}
                        </label>
                        <textarea
                            rows={5}
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400 transition resize-none"
                            placeholder={dir === 'rtl' ? 'اكتب رسالتك هنا...' : 'Write your message here...'}
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <>
                                <Send className="w-4 h-4" />
                                {dir === 'rtl' ? 'إرسال' : 'Send Message'}
                            </>
                        )}
                    </button>
                </form>
            </div>

            <p className="text-center text-gray-400 text-sm mt-6">
                {dir === 'rtl' ? 'أو راسلنا مباشرة على' : 'Or email us directly at'}{' '}
                <a href="mailto:ab@mjhood.com" className="text-blue-600 hover:underline">ab@mjhood.com</a>
            </p>
        </div>
    );
}
