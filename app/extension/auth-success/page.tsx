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
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 99999,
            backgroundColor: '#ffffff',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            padding: '24px'
        }}>
            <div style={{
                maxWidth: '600px',
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
            }}>

                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '24px',
                    marginBottom: '48px'
                }}>
                    <h1 style={{
                        fontSize: '60px',
                        fontWeight: '800',
                        color: '#111827',
                        margin: 0
                    }}>Signed In!</h1>
                    <span style={{
                        fontSize: '80px',
                        animation: 'bounce 1s infinite'
                    }}>✅</span>
                </div>

                <p style={{
                    fontSize: '24px',
                    color: '#4B5563',
                    marginBottom: '64px',
                    lineHeight: '1.6',
                    maxWidth: '500px'
                }}>
                    You have successfully signed in to RushRoost.<br />
                    You can now close this window and return to the extension.
                </p>

                <button
                    onClick={() => {
                        window.close();
                        window.top?.close();
                    }}
                    style={{
                        backgroundColor: '#000000',
                        color: '#ffffff',
                        fontSize: '36px',
                        fontWeight: 'bold',
                        padding: '32px 64px',
                        borderRadius: '24px',
                        border: 'none',
                        cursor: 'pointer',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                        transition: 'transform 0.1s'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                    onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                    Close Window
                </button>
                <div style={{ marginTop: '20px', color: '#ccc', fontSize: '12px' }}>v5 (Inline Styles)</div>
            </div>
        </div>
    );
}
