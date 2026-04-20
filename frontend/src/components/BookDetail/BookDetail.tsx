import React from "react";
import "./BookDetail.css";

export interface BookDetailData {
    id: string;
    title: string;
    author: string;
    coverUrl?: string;
    rating?: number;
    matchPercentage?: number;
    genres?: string[];
    pages?: number;
    published?: string;
    isbn?: string;
    about?: string;
    reviews?: Review[];
    similarBooks?: DisplayBookPreview[];
}

export interface Review {
    id: string;
    author: string;
    rating: number;
    text: string;
}

export interface DisplayBookPreview {
    id: string;
    title: string;
    author: string;
    coverUrl?: string;
}

interface BookDetailProps {
    book: BookDetailData;
    onClose: () => void;
    onAddToShelf?: (bookId: string) => void;
    onWriteReview?: (bookId: string) => void;
    isOpen: boolean;
}

export default function BookDetail({
    book,
    onClose,
    onAddToShelf,
    onWriteReview,
    isOpen,
}: BookDetailProps) {
    if (!isOpen) return null;

    const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div className="book-detail-overlay" onClick={handleBackdropClick}>
            <div className="book-detail-modal">
                <button
                    className="book-detail-close"
                    onClick={onClose}
                    aria-label="Close book details"
                >
                    ✕
                </button>

                <div className="book-detail-container">
                    {/* Left Column - Cover and Actions */}
                    <div className="book-detail-left">
                        <div className="book-detail-cover">
                            {book.coverUrl ? (
                                <img
                                    src={book.coverUrl}
                                    alt={`Cover of ${book.title}`}
                                    className="book-detail-image"
                                />
                            ) : (
                                <div className="book-detail-image-fallback">
                                    <span>{book.title}</span>
                                </div>
                            )}
                        </div>

                        <div className="book-detail-actions">
                            <button
                                className="book-detail-btn book-detail-btn--primary"
                                onClick={() => onAddToShelf?.(book.id)}
                            >
                                Add to Shelf
                            </button>
                            <button
                                className="book-detail-btn book-detail-btn--secondary"
                                onClick={() => onWriteReview?.(book.id)}
                            >
                                Write Review
                            </button>
                        </div>
                    </div>

                    {/* Right Column - Details */}
                    <div className="book-detail-right">
                        {/* Header */}
                        <div className="book-detail-header">
                            <h1 className="book-detail-title">{book.title}</h1>
                            <p className="book-detail-author">by {book.author}</p>
                        </div>

                        {/* Rating and Match */}
                        <div className="book-detail-meta-top">
                            {book.rating && (
                                <div className="book-detail-rating">
                                    <span className="rating-value">
                                        {book.rating}
                                    </span>
                                    <span className="rating-stars">★★★★☆</span>
                                </div>
                            )}
                            {book.matchPercentage && (
                                <div className="book-detail-match">
                                    {book.matchPercentage}% match for your
                                    reading tastes
                                </div>
                            )}
                        </div>

                        {/* Genres */}
                        {book.genres && book.genres.length > 0 && (
                            <div className="book-detail-genres">
                                {book.genres.map((genre) => (
                                    <span key={genre} className="genre-badge">
                                        {genre}
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* Book Info */}
                        <div className="book-detail-info">
                            {book.pages && (
                                <div className="info-item">
                                    <span className="info-label">Pages:</span>
                                    <span className="info-value">
                                        {book.pages}
                                    </span>
                                </div>
                            )}
                            {book.published && (
                                <div className="info-item">
                                    <span className="info-label">Published:</span>
                                    <span className="info-value">
                                        {book.published}
                                    </span>
                                </div>
                            )}
                            {book.isbn && (
                                <div className="info-item">
                                    <span className="info-label">ISBN:</span>
                                    <span className="info-value">
                                        {book.isbn}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* About */}
                        {book.about && (
                            <div className="book-detail-section">
                                <h2 className="section-title">About this book</h2>
                                <p className="section-content">{book.about}</p>
                            </div>
                        )}

                        {/* Reviews */}
                        {book.reviews && book.reviews.length > 0 && (
                            <div className="book-detail-section">
                                <h2 className="section-title">Reviews</h2>
                                <div className="reviews-list">
                                    {book.reviews.map((review) => (
                                        <div
                                            key={review.id}
                                            className="review-item"
                                        >
                                            <div className="review-header">
                                                <span className="review-author">
                                                    {review.author}
                                                </span>
                                                <span className="review-rating">
                                                    {"★".repeat(review.rating)}
                                                </span>
                                            </div>
                                            <p className="review-text">
                                                {review.text}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Similar Books */}
                        {book.similarBooks && book.similarBooks.length > 0 && (
                            <div className="book-detail-section">
                                <h2 className="section-title">Similar Books</h2>
                                <div className="similar-books-grid">
                                    {book.similarBooks.map((similarBook) => (
                                        <div
                                            key={similarBook.id}
                                            className="similar-book-item"
                                        >
                                            {similarBook.coverUrl ? (
                                                <img
                                                    src={similarBook.coverUrl}
                                                    alt={`Cover of ${similarBook.title}`}
                                                    className="similar-book-cover"
                                                />
                                            ) : (
                                                <div className="similar-book-cover-fallback">
                                                    <span>
                                                        {similarBook.title}
                                                    </span>
                                                </div>
                                            )}
                                            <h4 className="similar-book-title">
                                                {similarBook.title}
                                            </h4>
                                            <p className="similar-book-author">
                                                {similarBook.author}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
