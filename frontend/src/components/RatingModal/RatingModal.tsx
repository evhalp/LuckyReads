import { useEffect, useState } from "react";
import "./RatingModal.css";

type RatingModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (rating: number, review: string) => Promise<void>;
    bookTitle: string;
    initialRating?: number;
    initialReview?: string;
};

export default function RatingModal(props: RatingModalProps) {
    const [rating, setRating] = useState(0);
    const [hoveredRating, setHoveredRating] = useState(0);
    const [review, setReview] = useState("");

    useEffect(() => {
        if (props.isOpen) {
            setRating(props.initialRating || 0);
            setHoveredRating(0);
            setReview(props.initialReview || "");
        }
    }, [props.isOpen, props.initialRating, props.initialReview]);

    if (!props.isOpen) {
        return null;
    }

    async function handleSubmit() {
        if (rating === 0) return;
        try {
            await props.onSubmit(rating, review);
        } catch (error) {
            console.error("Failed to submit rating:", error);
        }
    }

    function getStar(star: number) {
        if (star <= (hoveredRating || rating)) {
            return "star-button filled";
        }
        return "star-button";
    }

    return (
        <div className="rating-modal" onClick={props.onClose}>
            <div
                className="rating-modal-content"
                onClick={(e) => e.stopPropagation()}
            >
                <h2 className="rating-modal-title">Rate Book</h2>
                <p className="rating-modal-book">{props.bookTitle}</p>

                <div className="rating-stars">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            key={star}
                            type="button"
                            className={getStar(star)}
                            onClick={() => setRating(star)}
                            onMouseEnter={() => setHoveredRating(star)}
                            onMouseLeave={() => setHoveredRating(0)}
                            aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
                        >
                            ★
                        </button>
                    ))}
                </div>

                <p className="helper-text">
                    {rating === 0
                        ? "Please select a star rating."
                        : `Your rating: ${rating}/5`}
                </p>

                <label htmlFor="review-text" className="rating-review-label">
                    Review (optional)
                </label>
                <textarea
                    id="review-text"
                    className="rating-review-input"
                    placeholder="Write your review here..."
                    value={review}
                    onChange={(e) => setReview(e.target.value)}
                />

                <div className="rating-modal-buttons">
                    <button
                        type="button"
                        className="cancel-button"
                        onClick={props.onClose}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        className="submit-button"
                        onClick={handleSubmit}
                        disabled={rating === 0}
                    >
                        Submit Rating
                    </button>
                </div>
            </div>
        </div>
    );
}
