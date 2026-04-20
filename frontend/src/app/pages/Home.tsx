import { useEffect, useState } from "react";
import Navbar from "../../components/Navbar/Navbar";
import BookCard from "../../components/books/BookCard";
import BookDetail, { type BookDetailData } from "../../components/BookDetail/BookDetail";
import {
    fetchRecommendations,
    searchBooks,
    type DisplayBook,
} from "../../services/books";
import "./Home.css";

const SKELETON_COUNT = 6;

function SearchIcon() {
    return (
        <svg
            aria-hidden="true"
            className="home-search__icon"
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

export default function Home() {
    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedQuery, setDebouncedQuery] = useState("");
    const [recommendations, setRecommendations] = useState<DisplayBook[]>([]);
    const [searchResults, setSearchResults] = useState<DisplayBook[]>([]);
    const [loadingRecommendations, setLoadingRecommendations] = useState(true);
    const [loadingSearch, setLoadingSearch] = useState(false);
    const [error, setError] = useState("");
    const [selectedBook, setSelectedBook] = useState<BookDetailData | null>(null);
    const [isBookDetailOpen, setIsBookDetailOpen] = useState(false);

    const trimmedQuery = searchQuery.trim();
    const hasSearchQuery = debouncedQuery.length > 0;

    useEffect(() => {
        let cancelled = false;

        async function loadRecommendations() {
            setLoadingRecommendations(true);
            setError("");

            try {
                const data = await fetchRecommendations();
                if (!cancelled) {
                    setRecommendations(data);
                }
            } catch (requestError) {
                if (!cancelled) {
                    setRecommendations([]);
                    setError(
                        requestError instanceof Error
                            ? requestError.message
                            : "Could not load recommendations right now.",
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoadingRecommendations(false);
                }
            }
        }

        loadRecommendations();

        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            setDebouncedQuery(trimmedQuery);
        }, 350);

        return () => {
            window.clearTimeout(timeoutId);
        };
    }, [trimmedQuery]);

    useEffect(() => {
        if (!debouncedQuery) {
            setLoadingSearch(false);
            setSearchResults([]);
            setError("");
            return;
        }

        let cancelled = false;

        async function runSearch() {
            setLoadingSearch(true);
            setError("");

            try {
                const data = await searchBooks(debouncedQuery);
                if (!cancelled) {
                    setSearchResults(data);
                }
            } catch (requestError) {
                if (!cancelled) {
                    setSearchResults([]);
                    setError(
                        requestError instanceof Error
                            ? requestError.message
                            : "Search is unavailable right now.",
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoadingSearch(false);
                }
            }
        }

        runSearch();

        return () => {
            cancelled = true;
        };
    }, [debouncedQuery]);

    const heading = hasSearchQuery ? "Search Results" : "Recommended For You";
    const cards = hasSearchQuery ? searchResults : recommendations;
    const isLoading = hasSearchQuery ? loadingSearch : loadingRecommendations;
    const showInlineWarning = Boolean(error) && cards.length > 0;

    const handleBookClick = (book: DisplayBook) => {
        setSelectedBook({
            id: book.id,
            title: book.title,
            author: book.author,
            coverUrl: book.coverUrl,
            matchPercentage: book.matchPercentage,
        });
        setIsBookDetailOpen(true);
    };

    return (
        <div className="home-page">
            <Navbar />

            <section className="home-hero">
                <div className="home-shell">
                    <div className="home-hero__content">
                        <h1 className="home-hero__title">
                            What will you read next?
                        </h1>

                        <label className="home-search" aria-label="Search books">
                            <SearchIcon />
                            <input
                                type="search"
                                value={searchQuery}
                                onChange={(event) =>
                                    setSearchQuery(event.target.value)
                                }
                                placeholder="Search for books or authors..."
                            />
                        </label>
                    </div>
                </div>
            </section>

            <main className="home-content">
                <div className="home-shell">
                    <section className="home-results">
                        <div className="home-results__header">
                            <h2 className="home-results__title">{heading}</h2>

                            {hasSearchQuery ? (
                                <p className="home-results__subtitle">
                                    Showing results for "{debouncedQuery}"
                                </p>
                            ) : null}
                        </div>

                        {error && !showInlineWarning ? (
                            <div className="home-state home-state--error" role="alert">
                                <p>{error}</p>
                            </div>
                        ) : null}

                        {showInlineWarning ? (
                            <div className="home-inline-warning" role="status">
                                <p>{error}</p>
                            </div>
                        ) : null}

                        {isLoading ? (
                            <div className="home-grid" aria-hidden="true">
                                {Array.from({ length: SKELETON_COUNT }, (_, index) => (
                                    <div key={index} className="home-card-skeleton" />
                                ))}
                            </div>
                        ) : null}

                        {!showInlineWarning && !error && !isLoading && cards.length === 0 ? (
                            <div className="home-state home-state--empty">
                                <p>No results found.</p>
                                <p>Try a different title, author, or keyword.</p>
                            </div>
                        ) : null}

                        {!isLoading && cards.length > 0 ? (
                            <div className="home-grid">
                                {cards.map((book) => (
                                    <BookCard
                                        key={book.id}
                                        book={book}
                                        onClick={() => handleBookClick(book)}
                                    />
                                ))}
                            </div>
                        ) : null}
                    </section>
                </div>
            </main>

            {selectedBook && (
                <BookDetail
                    book={selectedBook}
                    isOpen={isBookDetailOpen}
                    onClose={() => setIsBookDetailOpen(false)}
                />
            )}
        </div>
    );
}
