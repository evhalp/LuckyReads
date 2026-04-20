import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../../components/Navbar/Navbar";
import { fetchPublicUserProfile, type PublicUser } from "../../api/users";
import { getApiErrorMessage } from "../../api/client";
import "./ReaderProfile.css";

type Review = {
  id: string;
  book_title: string;
  book_openlibrary_key?: string;
  book_isbn?: string;
  book_cover_url?: string;
  book_authors?: string[];
  book_average_rating?: number;
  rating: number;
  review_text: string;
  created_at: string;
};

export default function ReaderProfile() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [user, setUser] = useState<PublicUser | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) {
      setError("Missing reader id.");
      setLoading(false);
      return;
    }

    const userId = id;

    let cancelled = false;

    async function loadReaderProfile() {
      setLoading(true);
      setError("");

      try {
        const data = await fetchPublicUserProfile(userId);
        if (cancelled) {
          return;
        }

        setUser(data);
        setReviews(data.reviews ?? []);
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
  }, [id]);

  return (
    <div className="reader-profile-page">
      <Navbar />
      <main className="reader-profile-shell">
        <button
          className="reader-profile-back"
          type="button"
          onClick={() => navigate("/find-readers")}
        >
          Back to Find Readers
        </button>

        {loading ? (
          <p>Loading profile...</p>
        ) : error ? (
          <p className="reader-profile-error">{error}</p>
        ) : user ? (
          <section className="reader-profile-card">
            <header className="reader-profile-header">
              <h1>{user.name ?? user.username}</h1>
              <p>{user.email ?? "No email available"}</p>
            </header>

            <div className="reader-profile-bio">
              <h2>Bio</h2>
              <p>{user.bio?.trim() ? user.bio : "No bio available yet."}</p>
            </div>

            <div className="reader-profile-reviews">
              <h2>Reviews</h2>
              {reviews.length > 0 ? (
                <ul>
                  {reviews.map((review) => (
                    <li key={review.id} className="reader-profile-review-item">
                      <h3>{review.book_title}</h3>
                      <p>Rating: {review.rating}/5</p>
                      <p>
                        {review.review_text?.trim()
                          ? review.review_text
                          : "No written review."}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>This reader has not posted reviews yet.</p>
              )}
            </div>
          </section>
        ) : null}
      </main>
    </div>
  );
}
