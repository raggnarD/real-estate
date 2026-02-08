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
        <div className="flex flex-col items-center justify-center min-h-screen bg-white text-center p-6">
            <div className="max-w-md w-full">
                <div className="mb-8 text-8xl animate-bounce">
                    ✅
                </div>

                <h1 className="text-3xl font-extrabold text-gray-900 mb-4">Signed In!</h1>
                <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                    You have successfully signed in to RushRoost.<br />
                    You can now close this window and return to the extension.
                </p>

                <button
                    onClick={() => window.close()}
                    className="w-full bg-black hover:bg-gray-800 text-white text-xl font-bold py-4 px-8 rounded-xl shadow-lg transform transition hover:scale-105"
                >
                    Close Window
                </button>
            </div>
        </div>
    );
}
