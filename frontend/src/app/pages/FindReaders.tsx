import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar/Navbar";
import {
    fetchAllUsers,
    searchBuddyByUsername,
    type PublicUser,
} from "../../api/users";
import { getApiErrorMessage, isAxiosApiError } from "../../api/client";
import "./FindReaders.css";

function SearchIcon() {
    return (
        <svg
            aria-hidden="true"
            className="find-readers-search__icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
        </svg>
    );
}

interface Reader {
    id: string;
    name: string;
    avatar?: string;
    bio?: string;
}

export default function FindReaders() {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState("");
    const [readers, setReaders] = useState<Reader[]>([]);
    const [searchResult, setSearchResult] = useState<Reader | null>(null);
    const [loading, setLoading] = useState(true);
    const [searching, setSearching] = useState(false);
    const [error, setError] = useState("");
    const [searchError, setSearchError] = useState("");

    function mapPublicUserToReader(user: PublicUser): Reader {
        return {
            id: user.id,
            name: user.username,
            avatar: user.avatar_url,
            bio: user.bio,
        };
    }

    useEffect(() => {
        async function loadReaders() {
            setLoading(true);
            setError("");

            try {
                const data = await fetchAllUsers();
                const mappedReaders: Reader[] = data.map((user: PublicUser) =>
                    mapPublicUserToReader(user),
                );
                setReaders(mappedReaders);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Could not load readers.");
            } finally {
                setLoading(false);
            }
        }

        loadReaders();
    }, []);

    useEffect(() => {
        const username = searchQuery.trim();

        if (!username) {
            setSearchResult(null);
            setSearchError("");
            return;
        }

        let cancelled = false;
        const timeoutId = window.setTimeout(async () => {
            setSearching(true);
            setSearchError("");

            try {
                const user = await searchBuddyByUsername(username);
                if (cancelled) {
                    return;
                }

                setSearchResult(mapPublicUserToReader(user));
            } catch (err) {
                if (cancelled) {
                    return;
                }

                setSearchResult(null);
                if (isAxiosApiError(err) && err.response?.status === 404) {
                    setSearchError("No reader found with that username.");
                } else {
                    setSearchError(getApiErrorMessage(err));
                }
            } finally {
                if (!cancelled) {
                    setSearching(false);
                }
            }
        }, 300);

        return () => {
            cancelled = true;
            window.clearTimeout(timeoutId);
        };
    }, [searchQuery]);

    const trimmedQuery = searchQuery.trim();
    const visibleReaders = trimmedQuery ? (searchResult ? [searchResult] : []) : readers;

    return (
        <div className="find-readers-page">
            <Navbar />
            <div className="find-readers-shell">
                <section className="find-readers-hero">
                    <div className="find-readers-hero__content">
                        <h1 className="find-readers-hero__title">
                            Find Your Book Buddies
                        </h1>
                        <p className="find-readers-hero__subtitle">
                            Connect with readers who share your taste in books
                        </p>
                    </div>
                </section>

                <section className="find-readers-search-section">
                    <div className="find-readers-search-box">
                        <SearchIcon />
                        <input
                            type="text"
                            className="find-readers-search__input"
                            placeholder="Search for readers..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </section>

                <section className="find-readers-results">
                    <h2 className="find-readers-results__title">
                        {trimmedQuery ? "Search Results" : "Readers You Might Like"}
                    </h2>
                    {loading ? (
                        <div className="find-readers-loading">
                            <p>Loading readers...</p>
                        </div>
                    ) : error ? (
                        <div className="find-readers-error">
                            <p>{error}</p>
                        </div>
                    ) : searching ? (
                        <div className="find-readers-loading">
                            <p>Searching for readers...</p>
                        </div>
                    ) : searchError ? (
                        <div className="find-readers-empty-state">
                            <p>{searchError}</p>
                        </div>
                    ) : visibleReaders.length > 0 ? (
                        <div className="readers-grid">
                            {visibleReaders.map((reader) => (
                                <div key={reader.id} className="reader-card">
                                    <div className="reader-card__avatar">
                                        {reader.avatar ? (
                                            <img src={reader.avatar} alt={`${reader.name}'s avatar`} />
                                        ) : (
                                            reader.name.charAt(0).toUpperCase()
                                        )}
                                    </div>
                                    <h3 className="reader-card__name">
                                        {reader.name}
                                    </h3>
                                    {reader.bio && (
                                        <p className="reader-card__bio">
                                            {reader.bio}
                                        </p>
                                    )}
                                    <button
                                        className="reader-card__follow-btn"
                                        type="button"
                                        onClick={() => navigate(`/readers/${reader.id}`)}
                                    >
                                        View Profile
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="find-readers-empty-state">
                            <p>No readers are available yet.</p>
                            <p>Try refining your search or check back later.</p>
                        </div>
                    )}

                </section>
            </div>
        </div>
    );
}
