'use client';

import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, MapPin, Briefcase, GraduationCap, Languages, Award, Link as LinkIcon, Download, MessageCircle, Mail, Phone, FileText } from 'lucide-react';
import { useLanguage } from '@/lib/contexts/LanguageContext';

interface CVDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    cv: any; // Using any to avoid strict type dependency issues for now, but should match CV interface
}

export default function CVDetailModal({ isOpen, onClose, cv }: CVDetailModalProps) {
    const { t, dir } = useLanguage();

    if (!cv) return null;

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-[2000]" onClose={onClose} dir={dir}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white text-left align-middle shadow-xl transition-all flex flex-col max-h-[90vh]">
                                {/* Header */}
                                <div className="relative bg-gradient-to-r from-green-600 to-teal-600 p-6 text-white shrink-0">
                                    <button
                                        onClick={onClose}
                                        className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors bg-black/10 hover:bg-black/20 rounded-full p-1"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>

                                    <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                                        <div className="relative">
                                            {cv.avatar_url ? (
                                                <img
                                                    src={cv.avatar_url}
                                                    alt={cv.full_name}
                                                    className="w-24 h-24 rounded-full border-4 border-white/30 object-cover shadow-lg"
                                                />
                                            ) : (
                                                <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center text-white text-3xl font-bold border-4 border-white/30 shadow-lg">
                                                    {cv.full_name?.charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                        </div>
                                        <div className="text-center md:text-left rtl:md:text-right flex-1">
                                            <h2 className="text-2xl font-bold mb-1">{cv.full_name}</h2>
                                            <p className="text-green-100 font-medium text-lg mb-3">{cv.job_title}</p>

                                            <div className="flex flex-wrap justify-center md:justify-start rtl:md:justify-end gap-3 text-sm text-white/90">
                                                {cv.phone && (
                                                    <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full">
                                                        <Phone className="w-3.5 h-3.5" />
                                                        <span dir="ltr">{cv.phone}</span>
                                                    </div>
                                                )}
                                                {cv.email && (
                                                    <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full">
                                                        <Mail className="w-3.5 h-3.5" />
                                                        <span>{cv.email}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Scrollable Content */}
                                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                                    {/* Summary */}
                                    {cv.summary && (
                                        <section>
                                            <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                                                <FileText className="w-5 h-5 text-green-600" />
                                                {t('professionalSummary' as any)}
                                            </h3>
                                            <p className="text-gray-600 leading-relaxed bg-gray-50 p-4 rounded-xl border border-gray-100">
                                                {cv.summary}
                                            </p>
                                        </section>
                                    )}

                                    {/* Work Experience */}
                                    {cv.work_experience && cv.work_experience.length > 0 && (
                                        <section>
                                            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                                <Briefcase className="w-5 h-5 text-green-600" />
                                                {t('workExperience' as any)}
                                            </h3>
                                            <div className="space-y-4">
                                                {cv.work_experience.map((exp: any, idx: number) => (
                                                    <div key={idx} className="relative pl-4 border-l-2 border-green-100 rtl:pl-0 rtl:pr-4 rtl:border-l-0 rtl:border-r-2">
                                                        <div className="absolute -left-[5px] top-2 w-2.5 h-2.5 rounded-full bg-green-500 rtl:-right-[5px]" />
                                                        <h4 className="font-bold text-gray-900">{exp.jobTitle}</h4>
                                                        <div className="text-sm text-green-700 font-medium mb-1">{exp.company}</div>
                                                        <div className="text-xs text-gray-500 mb-2">
                                                            {exp.startDate} - {exp.current ? t('present' as any) : exp.endDate}
                                                        </div>
                                                        {exp.description && (
                                                            <p className="text-sm text-gray-600">{exp.description}</p>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </section>
                                    )}

                                    {/* Education */}
                                    {cv.education && cv.education.length > 0 && (
                                        <section>
                                            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                                <GraduationCap className="w-5 h-5 text-green-600" />
                                                {t('education' as any)}
                                            </h3>
                                            <div className="grid gap-4 sm:grid-cols-2">
                                                {cv.education.map((edu: any, idx: number) => (
                                                    <div key={idx} className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                                        <h4 className="font-bold text-gray-900">{edu.degree}</h4>
                                                        <div className="text-sm text-gray-700">{edu.institution}</div>
                                                        <div className="text-xs text-gray-500 mt-1">{edu.year}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </section>
                                    )}

                                    {/* Skills */}
                                    {cv.skills && cv.skills.length > 0 && (
                                        <section>
                                            <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                                                <Award className="w-5 h-5 text-green-600" />
                                                {t('skills' as any)}
                                            </h3>
                                            <div className="flex flex-wrap gap-2">
                                                {cv.skills.map((skill: string, idx: number) => (
                                                    <span key={idx} className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm font-medium border border-green-100">
                                                        {skill}
                                                    </span>
                                                ))}
                                            </div>
                                        </section>
                                    )}

                                    {/* Languages */}
                                    {cv.languages && cv.languages.length > 0 && (
                                        <section>
                                            <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                                                <Languages className="w-5 h-5 text-green-600" />
                                                {t('languages' as any)}
                                            </h3>
                                            <div className="grid gap-2 sm:grid-cols-2">
                                                {cv.languages.map((lang: any, idx: number) => (
                                                    <div key={idx} className="flex justify-between items-center bg-gray-50 px-4 py-2 rounded-lg border border-gray-100">
                                                        <span className="font-medium text-gray-900">{lang.language}</span>
                                                        <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded border border-gray-200">
                                                            {t(lang.proficiency as any) || lang.proficiency}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </section>
                                    )}

                                    {/* CV File Preview */}
                                    {cv.cv_file_url && (
                                        <section>
                                            <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                                                <FileText className="w-5 h-5 text-green-600" />
                                                {t('cvDocument' as any) || 'CV Document'}
                                            </h3>
                                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                                {cv.cv_file_url.match(/\.(jpeg|jpg|png|gif)$/i) ? (
                                                    <div className="relative group cursor-pointer" onClick={() => window.open(cv.cv_file_url, '_blank')}>
                                                        <img
                                                            src={cv.cv_file_url}
                                                            alt="CV Preview"
                                                            className="w-full h-auto max-h-[500px] object-contain rounded-lg shadow-sm border border-gray-200 hover:opacity-95 transition"
                                                        />
                                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition bg-black/30 rounded-lg">
                                                            <span className="text-white font-bold bg-black/50 px-4 py-2 rounded-full backdrop-blur-sm">
                                                                {t('clickToExpand' as any) || 'Click to Expand'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="w-full h-[500px] rounded-lg overflow-hidden border border-gray-200 shadow-sm bg-white">
                                                        <iframe
                                                            src={`${cv.cv_file_url}#toolbar=0&navpanes=0`}
                                                            className="w-full h-full"
                                                            title="CV PDF"
                                                        />
                                                    </div>
                                                )}
                                                <div className="mt-3 flex justify-end">
                                                    <a
                                                        href={cv.cv_file_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center gap-2 text-sm text-green-600 hover:text-green-700 font-medium hover:underline"
                                                    >
                                                        <Download className="w-4 h-4" />
                                                        {t('downloadCV' as any)}
                                                    </a>
                                                </div>
                                            </div>
                                        </section>
                                    )}

                                    {/* Portfolio */}
                                    {cv.portfolio_urls && cv.portfolio_urls.length > 0 && (
                                        <section>
                                            <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                                                <LinkIcon className="w-5 h-5 text-green-600" />
                                                {t('portfolio' as any)}
                                            </h3>
                                            <div className="space-y-2">
                                                {cv.portfolio_urls.map((url: string, idx: number) => (
                                                    <a
                                                        key={idx}
                                                        href={url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center gap-2 text-blue-600 hover:underline bg-blue-50 p-3 rounded-lg transition-colors hover:bg-blue-100"
                                                    >
                                                        <LinkIcon className="w-4 h-4 shrink-0" />
                                                        <span className="truncate">{url}</span>
                                                    </a>
                                                ))}
                                            </div>
                                        </section>
                                    )}
                                </div>

                                {/* Footer Actions */}
                                <div className="p-6 border-t border-gray-100 bg-gray-50 shrink-0 flex flex-col sm:flex-row gap-3">
                                    {cv.phone && (
                                        <a
                                            href={`https://wa.me/${cv.phone.replace(/\D/g, '')}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white font-bold py-3 rounded-xl hover:bg-green-700 transition shadow-sm shadow-green-200"
                                        >
                                            <MessageCircle className="w-5 h-5" />
                                            {t('contactCandidate' as any)}
                                        </a>
                                    )}
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
