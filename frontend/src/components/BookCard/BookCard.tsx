import "./BookCard.css";

type BookStatus = "want_to_read" | "currently_reading" | "read";

type BookCardProps = {
    title: string;
    author: string;
    coverUrl?: string;
    onRateClick?: () => void;
    status: string;
    onStatusChange: (newStatus: BookStatus) => void;
    onDelete?: () => void;
    onClick?: () => void;
    rating?: number;
};

export default function BookCard(props: BookCardProps) {
    function renderStars() {
        return (
            <div className="book-card-rating">
                {[1, 2, 3, 4, 5].map((star) => (
                    <span
                        key={star}
                        className={
                            star <= (props.rating || 0)
                                ? "book-star filled"
                                : "book-star"
                        }
                    >
                        ★
                    </span>
                ))}
            </div>
        );
    }
    return (
        <div
            className="book-card"
            onClick={props.onClick}
            role={props.onClick ? "button" : undefined}
            tabIndex={props.onClick ? 0 : undefined}
            style={{ cursor: props.onClick ? "pointer" : "default" }}
            onKeyDown={
                props.onClick
                    ? (e) => {
                          if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              props.onClick?.();
                          }
                      }
                    : undefined
            }
        >
            <div className="book-card-cover-wrapper">
                <img
                    className="book-card-cover-bg"
                    src={props.coverUrl || "placeholder"}
                    alt=""
                />
                <img
                    className="book-card-cover"
                    src={props.coverUrl || "placeholder"}
                    alt={`${props.title} cover`}
                />
                {props.onDelete && (
                    <button
                        className="book-card-delete"
                        onClick={(e) => {
                            e.stopPropagation();
                            props.onDelete?.();
                        }}
                        aria-label="Remove book"
                    >
                        <span className="book-card-delete-icon">x</span>
                    </button>
                )}
            </div>
            <div className="book-card-info">
                <h3 className="book-card-title">{props.title}</h3>
                <p className="book-card-author">{props.author}</p>
                <div className="book-card-rating-row">
                    <button
                        className="rate-button"
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            props.onRateClick?.();
                        }}
                    >
                        Rate
                    </button>
                    {renderStars()}
                </div>
                <select
                    value={props.status}
                    className="book-card-status"
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => {
                        e.stopPropagation();
                        props.onStatusChange(e.target.value as BookStatus);
                    }}
                >
                    <option value="want_to_read">Want to Read</option>
                    <option value="currently_reading">Reading</option>
                    <option value="read">Read</option>
                </select>
            </div>
        </div>
    );
}
