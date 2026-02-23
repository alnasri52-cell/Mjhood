'use client';

import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, MapPin, Heart, Plus, Filter } from 'lucide-react';
import { useLanguage } from '@/lib/contexts/LanguageContext';

interface HowItWorksModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function HowItWorksModal({ isOpen, onClose }: HowItWorksModalProps) {
    // Force rebuild for guide updates
    const { t, dir } = useLanguage();
    const [step, setStep] = useState(0);

    const steps = [
        {
            title: t('guideWelcomeTitle'),
            text: t('guideWelcomeText'),
            icon: <img src="/mjhood-icon.png" alt="Mjhood Icon" className="w-32 h-32" />,
            color: 'bg-blue-50'
        },
        {
            title: t('guideNeedsVsServicesTitle'),
            text: t('guideNeedsVsServicesText'),
            icon: (
                <div className="flex justify-center gap-4">
                    <MapPin className="w-12 h-12 text-red-500" />
                </div>
            ),
            color: 'bg-red-50'
        },

        {
            title: t('guideMapFiltersTitle'),
            text: t('guideMapFiltersText'),
            icon: <Filter className="w-16 h-16 text-indigo-500" />,
            color: 'bg-indigo-50'
        },
        {
            title: t('guideHowToAddTitle'),
            text: t('guideHowToAddText'),
            icon: <Plus className="w-16 h-16 text-blue-600" />,
            color: 'bg-blue-50'
        }
    ];

    const handleNext = () => {
        if (step < steps.length - 1) {
            setStep(step + 1);
        } else {
            onClose();
            setTimeout(() => setStep(0), 300); // Reset after closing
        }
    };

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
                    <div className="fixed inset-0 bg-black/25 backdrop-blur-sm" />
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
                            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                                <div className="flex justify-between items-center mb-6">
                                    <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                                        {t('howItWorks')}
                                    </Dialog.Title>
                                    <button
                                        onClick={onClose}
                                        className="text-gray-400 hover:text-gray-500 transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="mt-2 flex flex-col items-center text-center">
                                    <div className="mb-6">
                                        {steps[step].icon}
                                    </div>

                                    <h4 className="text-xl font-bold text-gray-900 mb-2">
                                        {steps[step].title}
                                    </h4>
                                    <p className="text-gray-600 mb-8">
                                        {steps[step].text}
                                    </p>

                                    <div className="flex gap-2 mb-6">
                                        {steps.map((_, idx) => (
                                            <div
                                                key={idx}
                                                className={`w-2 h-2 rounded-full transition-colors duration-300 ${idx === step ? 'bg-blue-600' : 'bg-gray-200'}`}
                                            />
                                        ))}
                                    </div>

                                    <button
                                        onClick={handleNext}
                                        className="w-full inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 transition-colors"
                                    >
                                        {step === steps.length - 1 ? t('gotIt') : (dir === 'rtl' ? 'التالي' : 'Next')}
                                    </button>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
