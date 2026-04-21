import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../../components/Navbar/Navbar";
import { fetchUserProfile, type PublicUserProfile } from "../../api/users";
import { getApiErrorMessage } from "../../api/client";
import "./ReaderProfile.css";

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return (
    parts
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? "")
      .join("") || "LR"
  );
}

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="rp-stars" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={i < rating ? "rp-star rp-star--filled" : "rp-star"}>
          ★
        </span>
      ))}
    </span>
  );
}

export default function ReaderProfile() {
  const navigate = useNavigate();
  const { userId } = useParams<{ userId: string }>();

  const [user, setUser] = useState<PublicUserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!userId) {
      setError("Missing reader id.");
      setLoading(false);
      return;
    }

    const parsedUserId = Number(userId);
    if (!Number.isFinite(parsedUserId)) {
      setError("Invalid reader id.");
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function loadReaderProfile() {
      setLoading(true);
      setError("");

      try {
        const data = await fetchUserProfile(parsedUserId);
        if (cancelled) {
          return;
        }

        setUser(data);
      } catch (requestError) {
        if (!cancelled) {
          setError(getApiErrorMessage(requestError));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadReaderProfile();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const reviews = user?.reviews ?? [];

  return (
    <div className="rp-page">
      <Navbar />

      <div className="rp-hero">
        <div className="rp-shell">
          <button
            className="rp-back"
            type="button"
            onClick={() => navigate("/find-readers")}
          >
            ← Back to Find Readers
          </button>

          {user ? (
            <div className="rp-hero__body">
              <div className="rp-avatar">{getInitials(user.name)}</div>
              <div>
                <h1 className="rp-hero__name">{user.name}</h1>
                <p className="rp-hero__email">{user.email ?? "No email available"}</p>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <main className="rp-shell rp-main">
        {loading ? (
          <div className="rp-state">
            <p>Loading profile…</p>
          </div>
        ) : error ? (
          <div className="rp-state rp-state--error" role="alert">
            <p>{error}</p>
          </div>
        ) : user ? (
          <div className="rp-content">
            <section className="rp-card">
              <h2 className="rp-card__title">About</h2>
              <p className="rp-bio">
                {user.bio?.trim()
                  ? user.bio
                  : "This reader has not added a bio yet."}
              </p>
            </section>

            <section className="rp-card">
              <div className="rp-reviews__header">
                <h2 className="rp-card__title">Reviews</h2>
                <span className="rp-reviews__count">
                  {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
                </span>
              </div>

              {reviews.length > 0 ? (
                <ul className="rp-reviews">
                  {reviews.map((review) => (
                    <li key={review.id} className="rp-review">
                      <div className="rp-review__top">
                        <h3 className="rp-review__title">{review.book_title}</h3>
                        <StarRating rating={review.rating} />
                      </div>
                      <p
                        className={
                          review.review_text?.trim()
                            ? "rp-review__text"
                            : "rp-review__text rp-review__text--muted"
                        }
                      >
                        {review.review_text?.trim()
                          ? review.review_text
                          : "No written review."}
                      </p>
                      <time className="rp-review__date">
                        {new Date(review.created_at).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </time>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="rp-empty">
                  This reader has not posted any reviews yet.
                </p>
              )}
            </section>
          </div>
        ) : null}
      </main>
    </div>
  );
}