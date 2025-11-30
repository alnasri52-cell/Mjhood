'use client';

import { useState } from 'react';
import { Plus, X, DollarSign } from 'lucide-react';
import { SERVICE_CATEGORIES } from '@/lib/constants';

export interface ServiceCategory {
    id?: string;
    category: string;
    title: string;
    description: string;
    price_type?: 'fixed' | 'range' | 'negotiable' | null;
    price_min?: number | null;
    price_max?: number | null;
    price_currency?: string;
}

interface ServiceCategorySelectorProps {
    categories: ServiceCategory[];
    onChange: (categories: ServiceCategory[]) => void;
    disabled?: boolean;
}

export default function ServiceCategorySelector({
    categories,
    onChange,
    disabled = false
}: ServiceCategorySelectorProps) {
    const [isAdding, setIsAdding] = useState(false);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);

    // Form state
    const [formCategory, setFormCategory] = useState('');
    const [formTitle, setFormTitle] = useState('');
    const [formDescription, setFormDescription] = useState('');
    const [formPriceType, setFormPriceType] = useState<'fixed' | 'range' | 'negotiable' | ''>('');
    const [formPriceMin, setFormPriceMin] = useState('');
    const [formPriceMax, setFormPriceMax] = useState('');

    const resetForm = () => {
        setFormCategory('');
        setFormTitle('');
        setFormDescription('');
        setFormPriceType('');
        setFormPriceMin('');
        setFormPriceMax('');
        setIsAdding(false);
        setEditingIndex(null);
    };

    const handleAdd = () => {
        if (!formCategory || !formTitle) return;

        const newCategory: ServiceCategory = {
            category: formCategory,
            title: formTitle,
            description: formDescription,
            price_type: formPriceType || null,
            price_min: formPriceMin ? parseFloat(formPriceMin) : null,
            price_max: formPriceMax ? parseFloat(formPriceMax) : null,
            price_currency: 'SAR'
        };

        if (editingIndex !== null) {
            // Update existing
            const updated = [...categories];
            updated[editingIndex] = { ...updated[editingIndex], ...newCategory };
            onChange(updated);
        } else {
            // Add new
            onChange([...categories, newCategory]);
        }

        resetForm();
    };

    const handleEdit = (index: number) => {
        const cat = categories[index];
        setFormCategory(cat.category);
        setFormTitle(cat.title);
        setFormDescription(cat.description);
        setFormPriceType(cat.price_type || '');
        setFormPriceMin(cat.price_min?.toString() || '');
        setFormPriceMax(cat.price_max?.toString() || '');
        setEditingIndex(index);
        setIsAdding(true);
    };

    const handleRemove = (index: number) => {
        onChange(categories.filter((_, i) => i !== index));
    };

    const startAdding = () => {
        resetForm();
        setIsAdding(true);
    };

    return (
        <div className="space-y-4">
            {/* Existing Categories */}
            <div className="space-y-2">
                {categories.map((cat, index) => (
                    <div
                        key={index}
                        className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200"
                    >
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs font-medium rounded">
                                    {cat.category}
                                </span>
                                {cat.price_type && (
                                    <span className="flex items-center gap-1 text-xs text-gray-600">
                                        <DollarSign className="w-3 h-3" />
                                        {cat.price_type === 'fixed' && cat.price_min && `${cat.price_min} SAR`}
                                        {cat.price_type === 'range' && `${cat.price_min}-${cat.price_max} SAR`}
                                        {cat.price_type === 'negotiable' && 'Negotiable'}
                                    </span>
                                )}
                            </div>
                            <h4 className="font-medium text-gray-900">{cat.title}</h4>
                            {cat.description && (
                                <p className="text-sm text-gray-600 mt-1">{cat.description}</p>
                            )}
                        </div>
                        {!disabled && (
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleEdit(index)}
                                    className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={() => handleRemove(index)}
                                    className="text-red-600 hover:text-red-700"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Add/Edit Form */}
            {isAdding ? (
                <div className="p-4 bg-white border-2 border-indigo-200 rounded-lg space-y-4">
                    <h4 className="font-medium text-gray-900">
                        {editingIndex !== null ? 'Edit Service' : 'Add New Service'}
                    </h4>

                    {/* Category Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Category *
                        </label>
                        <select
                            value={formCategory}
                            onChange={(e) => setFormCategory(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            required
                        >
                            <option value="">Select a category</option>
                            {SERVICE_CATEGORIES.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>

                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Service Title *
                        </label>
                        <input
                            type="text"
                            value={formTitle}
                            onChange={(e) => setFormTitle(e.target.value)}
                            placeholder="e.g., Professional Plumbing Services"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            required
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Description
                        </label>
                        <textarea
                            value={formDescription}
                            onChange={(e) => setFormDescription(e.target.value)}
                            placeholder="Describe your service..."
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>

                    {/* Pricing */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Pricing
                        </label>
                        <select
                            value={formPriceType}
                            onChange={(e) => setFormPriceType(e.target.value as any)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 mb-2"
                        >
                            <option value="">No pricing info</option>
                            <option value="fixed">Fixed Price</option>
                            <option value="range">Price Range</option>
                            <option value="negotiable">Negotiable</option>
                        </select>

                        {formPriceType === 'fixed' && (
                            <input
                                type="number"
                                value={formPriceMin}
                                onChange={(e) => setFormPriceMin(e.target.value)}
                                placeholder="Price (SAR)"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        )}

                        {formPriceType === 'range' && (
                            <div className="grid grid-cols-2 gap-2">
                                <input
                                    type="number"
                                    value={formPriceMin}
                                    onChange={(e) => setFormPriceMin(e.target.value)}
                                    placeholder="Min (SAR)"
                                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                />
                                <input
                                    type="number"
                                    value={formPriceMax}
                                    onChange={(e) => setFormPriceMax(e.target.value)}
                                    placeholder="Max (SAR)"
                                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                        <button
                            onClick={handleAdd}
                            disabled={!formCategory || !formTitle}
                            className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                        >
                            {editingIndex !== null ? 'Update' : 'Add'} Service
                        </button>
                        <button
                            onClick={resetForm}
                            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            ) : (
                <button
                    onClick={startAdding}
                    disabled={disabled}
                    className="w-full px-4 py-3 border-2 border-dashed border-gray-300 text-gray-600 rounded-lg hover:border-indigo-500 hover:text-indigo-600 transition-colors flex items-center justify-center gap-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Plus className="w-5 h-5" />
                    Add Another Service
                </button>
            )}

            {categories.length === 0 && !isAdding && (
                <p className="text-sm text-gray-500 text-center py-4">
                    No services added yet. Click "Add Another Service" to get started.
                </p>
            )}
        </div>
    );
}
