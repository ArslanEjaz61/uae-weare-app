'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export function AutoSync() {
    const [lastSync, setLastSync] = useState<string | null>(null);
    const [syncing, setSyncing] = useState(false);
    const router = useRouter();

    const doSync = async () => {
        setSyncing(true);
        try {
            const res = await fetch('/api/sync-likes', { method: 'POST' });
            const data = await res.json();
            if (data.success) {
                setLastSync(new Date().toLocaleTimeString());
                // Refresh server components data without full page reload
                router.refresh();
            }
        } catch (err) {
            console.error('Auto-sync failed:', err);
        }
        setSyncing(false);
    };

    useEffect(() => {
        // Initial sync on page load
        doSync();

        // Auto sync every 1 minute
        const syncInterval = setInterval(() => {
            doSync();
        }, 60 * 1000);

        return () => {
            clearInterval(syncInterval);
        };
    }, []);

    return (
        <div className="auto-sync-bar">
            {syncing ? (
                <span className="sync-status syncing">
                    <span className="sync-spinner"></span>
                    Syncing live data...
                </span>
            ) : (
                <span className="sync-status">
                    {lastSync ? `Last synced: ${lastSync}` : 'Auto-updates enabled'}
                </span>
            )}
        </div>
    );
}
