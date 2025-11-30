'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

type AuthView = 'login' | 'signup';

interface AuthContextType {
    isOpen: boolean;
    view: AuthView;
    openModal: (view?: AuthView) => void;
    closeModal: () => void;
    setView: (view: AuthView) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthModalProvider({ children }: { children: ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const [view, setView] = useState<AuthView>('login');

    const openModal = (initialView: AuthView = 'login') => {
        setView(initialView);
        setIsOpen(true);
    };

    const closeModal = () => {
        setIsOpen(false);
    };

    return (
        <AuthContext.Provider value={{ isOpen, view, openModal, closeModal, setView }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuthModal() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuthModal must be used within an AuthModalProvider');
    }
    return context;
}
