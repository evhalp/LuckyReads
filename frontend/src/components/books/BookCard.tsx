import "./BookCard.css";
import type { DisplayBook } from "../../services/books";

type BookCardProps = {
    book: DisplayBook;
    onClick?: () => void;
};

export default function BookCard({ book, onClick }: BookCardProps) {
    return (
        <article
            className="home-book-card"
            onClick={onClick}
            role={onClick ? "button" : undefined}
            tabIndex={onClick ? 0 : undefined}
            style={{ cursor: onClick ? "pointer" : undefined }}
            onKeyPress={onClick ? (event) => {
                if (event.key === "Enter" || event.key === " ") {
                    onClick();
                }
            } : undefined}
        >
            <div className="home-book-card__media">
                {book.coverUrl ? (
                    <img
                        className="home-book-card__image"
                        src={book.coverUrl}
                        alt={`Cover of ${book.title}`}
                    />
                ) : (
                    <div
                        className="home-book-card__image home-book-card__image--fallback"
                        aria-hidden="true"
                    >
                        <span>{book.title}</span>
                    </div>
                )}

                {book.matchPercentage ? (
                    <span className="home-book-card__match-badge">
                        {book.matchPercentage}% Match
                    </span>
                ) : null}
            </div>

            <div className="home-book-card__body">
                <h3 className="home-book-card__title">{book.title}</h3>
                <p className="home-book-card__author">{book.author}</p>
            </div>
        </article>
    );
}
