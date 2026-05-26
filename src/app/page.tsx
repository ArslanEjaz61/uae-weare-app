import { prisma } from '@/lib/prisma';
import { LeaderboardCard } from '@/components/LeaderboardCard';
import { AutoSync } from '@/components/AutoSync';

// Revalidate every 60 seconds
export const revalidate = 60;

export default async function Home() {
    let posts: any[] = [];
    let dbError = false;

    try {
        posts = await prisma.post.findMany({
            orderBy: {
                likesCount: 'desc'
            },
            take: 50 // Show top 50
        });
    } catch (error) {
        console.error("Database error. Please configure DATABASE_URL in .env file.");
        dbError = true;
    }

    return (
        <main className="container">
            <AutoSync />
            <div className="header">
                <h1>UAE We Are</h1>
                <p>Eid in Dubai 2026 · Top participants</p>
                <div className="hashtag-group">
                    <div className="hashtag">#MyEidInUAE</div>
                    <div className="hashtag secondary">@uae.weare</div>
                </div>
                <p className="eid-dates">
                    🌙 Eid: May 26 – May 29, 2026 · Winner: May 30th Night
                </p>
            </div>

            <div className="leaderboard">
                {dbError ? (
                    <div style={{ textAlign: 'center', color: '#f43f5e', marginTop: '2rem', padding: '2rem', background: 'rgba(244, 63, 94, 0.1)', borderRadius: '1rem' }}>
                        <h3>Database Not Connected</h3>
                        <p style={{ marginTop: '0.5rem' }}>Please add your MongoDB connection string in the <code>.env</code> file to see the leaderboard.</p>
                    </div>
                ) : posts.length === 0 ? (
                    <div style={{ textAlign: 'center', color: 'var(--text-secondary)', marginTop: '2rem' }}>
                        No entries found yet. Be the first to use the hashtag!
                    </div>
                ) : (
                    posts.map((post, index) => (
                        <LeaderboardCard 
                            key={post.id}
                            rank={index + 1}
                            username={post.username}
                            likesCount={post.likesCount}
                            postUrl={post.postUrl}
                            thumbnailUrl={post.thumbnailUrl}
                        />
                    ))
                )}
            </div>
        </main>
    );
}
