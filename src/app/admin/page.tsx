'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function AdminPage() {
    const [password, setPassword] = useState('');
    const [cookiesText, setCookiesText] = useState('');
    const [status, setStatus] = useState<{ type: 'idle' | 'loading' | 'success' | 'error'; message: string }>({
        type: 'idle',
        message: ''
    });
    const [testStatus, setTestStatus] = useState<{ type: 'idle' | 'loading' | 'success' | 'error'; message: string }>({
        type: 'idle',
        message: ''
    });

    const handleUpdateCookies = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!password) {
            setStatus({ type: 'error', message: 'Please enter the admin password.' });
            return;
        }
        if (!cookiesText) {
            setStatus({ type: 'error', message: 'Please paste your cookies.' });
            return;
        }

        setStatus({ type: 'loading', message: 'Saving cookies...' });

        try {
            const res = await fetch('/api/admin/update-cookies', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ password, cookiesText })
            });
            const data = await res.json();
            if (data.success) {
                setStatus({ type: 'success', message: data.message });
            } else {
                setStatus({ type: 'error', message: data.error || 'Failed to update cookies.' });
            }
        } catch (err: any) {
            setStatus({ type: 'error', message: err.message || 'An error occurred.' });
        }
    };

    const handleTestScraper = async () => {
        setTestStatus({ type: 'loading', message: 'Testing scraper (this takes ~15 seconds)...' });

        try {
            const res = await fetch('/api/sync-likes', { method: 'POST' });
            const data = await res.json();
            if (data.success) {
                setTestStatus({ type: 'success', message: `Scraper works! Response: ${data.message}` });
            } else {
                setTestStatus({ type: 'error', message: `Scraper failed: ${data.error || 'Unknown error'}` });
            }
        } catch (err: any) {
            setTestStatus({ type: 'error', message: err.message || 'Network error occurred.' });
        }
    };

    return (
        <main className="container" style={{ maxWidth: '650px', paddingTop: '5rem' }}>
            <div className="header" style={{ marginBottom: '2.5rem' }}>
                <Link href="/" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', marginBottom: '1rem' }}>
                    ← Back to Leaderboard
                </Link>
                <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Admin Settings</h1>
                <p>Refresh Instagram Cookies Session</p>
            </div>

            <div style={{
                background: 'var(--card-bg)',
                border: '1px solid var(--card-border)',
                borderRadius: '1rem',
                backdropFilter: 'blur(10px)',
                padding: '2rem',
                marginBottom: '2rem'
            }}>
                <form onSubmit={handleUpdateCookies}>
                    {/* Password input */}
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                            Admin Password
                        </label>
                        <input
                            type="password"
                            placeholder="Enter admin password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '0.8rem 1rem',
                                background: 'rgba(0,0,0,0.3)',
                                border: '1px solid var(--card-border)',
                                borderRadius: '0.5rem',
                                color: '#fff',
                                outline: 'none',
                                fontFamily: 'inherit'
                            }}
                        />
                    </div>

                    {/* Instructions */}
                    <div style={{ 
                        background: 'rgba(56, 189, 248, 0.05)', 
                        border: '1px solid rgba(56, 189, 248, 0.15)', 
                        borderRadius: '0.5rem', 
                        padding: '1rem', 
                        marginBottom: '1.5rem',
                        fontSize: '0.85rem',
                        color: '#cbd5e1',
                        lineHeight: '1.4rem'
                    }}>
                        <strong style={{ color: '#38bdf8', display: 'block', marginBottom: '0.3rem' }}>How to copy cookies:</strong>
                        1. Go to <a href="https://www.instagram.com" target="_blank" rel="noreferrer" style={{ color: '#38bdf8', textDecoration: 'underline' }}>instagram.com</a> and log in.<br />
                        2. Open Developer Tools (F12) → <strong>Network</strong> tab.<br />
                        3. Refresh page, click any request (e.g. <code>/api/v1/</code> or <code>web_info</code>).<br />
                        4. Scroll to <strong>Request Headers</strong> and copy the full <strong><code>cookie</code></strong> text.<br />
                        5. Paste the copied text below.
                    </div>

                    {/* Cookies Text Area */}
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                            Cookies JSON Array or Raw Cookie String
                        </label>
                        <textarea
                            rows={8}
                            placeholder="Paste either raw cookie string (e.g. sessionid=...; csrftoken=...) or cookies.json JSON array content"
                            value={cookiesText}
                            onChange={(e) => setCookiesText(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '0.8rem 1rem',
                                background: 'rgba(0,0,0,0.3)',
                                border: '1px solid var(--card-border)',
                                borderRadius: '0.5rem',
                                color: '#fff',
                                outline: 'none',
                                resize: 'vertical',
                                fontSize: '0.85rem',
                                fontFamily: 'monospace',
                                lineHeight: '1.2rem'
                            }}
                        />
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={status.type === 'loading'}
                        style={{
                            width: '100%',
                            padding: '0.9rem 1rem',
                            background: 'var(--accent)',
                            border: 'none',
                            borderRadius: '0.5rem',
                            color: '#fff',
                            fontWeight: 'bold',
                            fontSize: '1rem',
                            cursor: status.type === 'loading' ? 'not-allowed' : 'pointer',
                            opacity: status.type === 'loading' ? 0.7 : 1,
                            boxShadow: '0 4px 12px var(--accent-glow)',
                            transition: 'all 0.2s'
                        }}
                    >
                        {status.type === 'loading' ? 'Saving...' : 'Update Session Cookies'}
                    </button>
                </form>

                {/* Status Message */}
                {status.type !== 'idle' && (
                    <div style={{
                        marginTop: '1rem',
                        padding: '0.8rem 1rem',
                        borderRadius: '0.5rem',
                        fontSize: '0.9rem',
                        fontWeight: 600,
                        background: status.type === 'error' ? 'rgba(244, 63, 94, 0.1)' : 
                                    status.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255,255,255,0.05)',
                        border: `1px solid ${status.type === 'error' ? 'rgba(244, 63, 94, 0.3)' : 
                                             status.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'var(--card-border)'}`,
                        color: status.type === 'error' ? '#f43f5e' : 
                               status.type === 'success' ? '#10b981' : '#fff',
                    }}>
                        {status.message}
                    </div>
                )}
            </div>

            {/* Test Scraper Card */}
            <div style={{
                background: 'var(--card-bg)',
                border: '1px solid var(--card-border)',
                borderRadius: '1rem',
                backdropFilter: 'blur(10px)',
                padding: '2rem'
            }}>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Test Scraper</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                    Run a sync query now to verify if the newly updated cookies are working and connecting to Instagram successfully.
                </p>

                <button
                    onClick={handleTestScraper}
                    disabled={testStatus.type === 'loading'}
                    style={{
                        padding: '0.6rem 1.2rem',
                        background: 'rgba(255,255,255,0.1)',
                        border: '1px solid var(--card-border)',
                        borderRadius: '0.5rem',
                        color: '#fff',
                        fontWeight: 600,
                        cursor: testStatus.type === 'loading' ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s'
                    }}
                >
                    {testStatus.type === 'loading' ? 'Running Test...' : 'Test Scraper Connection'}
                </button>

                {testStatus.type !== 'idle' && (
                    <div style={{
                        marginTop: '1rem',
                        padding: '0.8rem 1rem',
                        borderRadius: '0.5rem',
                        fontSize: '0.85rem',
                        lineHeight: '1.2rem',
                        background: testStatus.type === 'error' ? 'rgba(244, 63, 94, 0.1)' : 
                                    testStatus.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255,255,255,0.05)',
                        border: `1px solid ${testStatus.type === 'error' ? 'rgba(244, 63, 94, 0.3)' : 
                                             testStatus.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'var(--card-border)'}`,
                        color: testStatus.type === 'error' ? '#f43f5e' : 
                               testStatus.type === 'success' ? '#10b981' : '#fff',
                    }}>
                        {testStatus.message}
                    </div>
                )}
            </div>
        </main>
    );
}
