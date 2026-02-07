"use client";

import { useEffect, useState } from "react";

export default function AuthSuccessPage() {
    const [countdown, setCountdown] = useState(1);

    useEffect(() => {
        // Function to attempt closing the window
        const attemptClose = () => {
            try {
                window.close();
            } catch (e) { console.log('window.close failed', e); }

            try {
                self.close();
            } catch (e) { console.log('self.close failed', e); }

            try {
                window.top?.close();
            } catch (e) { console.log('top.close failed', e); }
        };

        // Try immediately
        attemptClose();

        // Try repeatedly
        const timer = setInterval(() => {
            attemptClose();
            setCountdown((prev) => Math.max(0, prev - 1));
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 text-center p-4">
            <div className="bg-white p-8 rounded-2xl shadow-lg max-w-sm w-full">
                <div className="mb-6 flex justify-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                        <svg
                            className="w-10 h-10 text-green-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={3}
                                d="M5 13l4 4L19 7"
                            />
                        </svg>
                    </div>
                </div>

                <h1 className="text-2xl font-bold text-gray-900 mb-2">Signed In!</h1>
                <p className="text-gray-600 mb-6">
                    You have successfully signed in to RushRoost. You can now close this tab and return to the extension.
                </p>

                <div className="space-y-3">
                    <button
                        onClick={() => window.close()}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
                    >
                        Close Tab
                    </button>

                    <p className="text-xs text-gray-400">
                        Auto-closing in {countdown}s...
                    </p>
                </div>
            </div>
        </div>
    );
}
