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
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white !bg-white text-center p-6">
            <div className="max-w-2xl w-full flex flex-col items-center">

                <div className="flex items-center justify-center gap-6 mb-12">
                    <h1 className="text-6xl font-extrabold text-gray-900">Signed In!</h1>
                    <span className="text-8xl animate-bounce">✅</span>
                </div>

                <p className="text-2xl text-gray-600 mb-16 leading-relaxed max-w-xl">
                    You have successfully signed in to RushRoost.<br />
                    You can now close this window and return to the extension.
                </p>

                <button
                    onClick={() => window.close()}
                    className="bg-black hover:bg-gray-800 text-white text-4xl font-bold py-8 px-16 rounded-3xl shadow-2xl transform transition hover:scale-105 active:scale-95"
                >
                    Close Window
                </button>
            </div>
        </div>
    );
}
