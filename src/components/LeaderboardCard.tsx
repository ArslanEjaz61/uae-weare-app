import React from 'react';
import { Heart } from 'lucide-react';

interface LeaderboardCardProps {
    rank: number;
    username: string;
    likesCount: number;
    postUrl: string;
    thumbnailUrl?: string | null;
}

export function LeaderboardCard({ rank, username, likesCount, postUrl }: LeaderboardCardProps) {
    const rankClass = rank <= 3 ? `rank-${rank}` : '';
    const delay = `${rank * 0.1}s`;

    return (
        <div className={`card ${rankClass}`} style={{ animationDelay: delay }}>
            <div className="card-left">
                <div className="rank">#{rank}</div>
                <div className="user-info">
                    <a href={`https://instagram.com/${username}`} target="_blank" rel="noopener noreferrer" className="username">
                        @{username}
                    </a>
                    <a href={postUrl} target="_blank" rel="noopener noreferrer" className="post-link">
                        View Post
                    </a>
                </div>
            </div>
            <div className="likes">
                {likesCount.toLocaleString()}
                <Heart />
            </div>
        </div>
    );
}
