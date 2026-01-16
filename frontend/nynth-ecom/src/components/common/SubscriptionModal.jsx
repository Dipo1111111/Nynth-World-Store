import React from 'react';
import { CheckCircle, X } from 'lucide-react';

export default function SubscriptionModal({ isOpen, onClose, email }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Overlay */}
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                >
                    <X size={24} />
                </button>

                <div className="text-center">
                    <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                        <CheckCircle className="text-green-600" size={32} />
                    </div>

                    <h3 className="font-space text-2xl font-bold mb-2">
                        You're on the list! 🎉
                    </h3>

                    <p className="text-gray-600 mb-6">
                        We'll keep you updated on new drops and exclusive releases at{' '}
                        <span className="font-medium text-black">{email}</span>
                    </p>

                    <button
                        onClick={onClose}
                        className="btn-primary w-full"
                    >
                        I'll be waiting
                    </button>

                    <p className="text-xs text-gray-500 mt-4">
                        Check your inbox for a confirmation email.
                    </p>
                </div>
            </div>
        </div>
    );
}
