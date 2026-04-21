import { useEffect, useMemo, useState } from "react";
import Navbar from "../../components/Navbar/Navbar";
import {
  addBuddy,
  fetchBuddyRecommendations,
  checkBuddyStatus,
  fetchBuddies,
  fetchCurrentUser,
  removeBuddy,
  searchUserByUsername,
  type BuddyRecommendation,
  type BuddyRelationship,
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

function getDisplayName(user: PublicUser) {
  return user.username?.trim() || "Reader";
}

function getInitials(user: PublicUser) {
  const source = getDisplayName(user);
  const parts = source.split(/\s+/).filter(Boolean);
  const initials = parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return initials || "LR";
}

function ReaderCard({
  user,
  status,
  actionLoading,
  note,
  onToggleBuddy,
}: {
  user: PublicUser;
  status: "self" | "buddy" | "not_buddy";
  actionLoading: boolean;
  note?: string;
  onToggleBuddy: (user: PublicUser, isBuddy: boolean) => void;
}) {
  const displayName = getDisplayName(user);
  const buttonLabel =
    status === "self" ? "This is you" : status === "buddy" ? "Remove buddy" : "Add buddy";
  const disabled = status === "self" || actionLoading;

  return (
    <article className="reader-card">
      <div className="reader-card__content">
        <div className="reader-card__avatar">{getInitials(user)}</div>
        <div className="reader-card__body">
          <p className="reader-card__eyebrow">@{user.username}</p>
          <h3 className="reader-card__name">{displayName}</h3>
          {note ? <p className="reader-card__note">{note}</p> : null}
          <p className="reader-card__bio">
            {user.bio?.trim() || "This reader has not added a bio yet."}
          </p>
        </div>
      </div>
      <button
        type="button"
        className={
          status === "buddy"
            ? "reader-card__action reader-card__action--secondary"
            : "reader-card__action"
        }
        disabled={disabled}
        onClick={() => onToggleBuddy(user, status === "buddy")}
      >
        {actionLoading
          ? status === "buddy"
            ? "Removing..."
            : "Adding..."
          : buttonLabel}
      </button>
    </article>
  );
}

export default function FindReaders() {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [buddies, setBuddies] = useState<BuddyRelationship[]>([]);
  const [recommendations, setRecommendations] = useState<BuddyRecommendation[]>([]);
  const [searchResult, setSearchResult] = useState<PublicUser | null>(null);
  const [buddyStatus, setBuddyStatus] = useState<"self" | "buddy" | "not_buddy">("not_buddy");
  const [loadingBuddies, setLoadingBuddies] = useState(true);
  const [loadingRecommendations, setLoadingRecommendations] = useState(true);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [actionUserId, setActionUserId] = useState<number | null>(null);
  const [error, setError] = useState("");

  const trimmedQuery = searchQuery.trim();
  const hasSearchQuery = debouncedQuery.length > 0;

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedQuery(trimmedQuery);
    }, 350);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [trimmedQuery]);

  useEffect(() => {
    let cancelled = false;

    async function loadPageData() {
      setLoadingBuddies(true);
      setLoadingRecommendations(true);
      setError("");

      try {
        const user = await fetchCurrentUser();
        const [buddyRelationships, buddyRecommendations] = await Promise.all([
          fetchBuddies(user.id),
          fetchBuddyRecommendations(),
        ]);

        if (!cancelled) {
          setCurrentUserId(user.id);
          setBuddies(buddyRelationships);
          setRecommendations(buddyRecommendations);
        }
      } catch (requestError) {
        if (!cancelled) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Could not load your buddy list right now.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingBuddies(false);
          setLoadingRecommendations(false);
        }
      }
    }

    loadPageData();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!debouncedQuery) {
      setLoadingSearch(false);
      setSearchResult(null);
      setBuddyStatus("not_buddy");
      setError("");
      return;
    }

    let cancelled = false;

    async function runSearch() {
      setLoadingSearch(true);
      setSearchResult(null);
      setError("");

      try {
        const user = await searchUserByUsername(debouncedQuery);
        if (!cancelled) {
          setSearchResult(user);
        }
      } catch (requestError) {
        if (!cancelled) {
          setSearchResult(null);
          if (isAxiosApiError(requestError) && requestError.response?.status === 404) {
            setError(`No reader found for "${debouncedQuery}".`);
          } else {
            setError(getApiErrorMessage(requestError));
          }
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

  useEffect(() => {
    if (!currentUserId || !searchResult) {
      return;
    }

    const viewerUserId = currentUserId;
    const searchedUserId = searchResult.id;

    if (searchedUserId === viewerUserId) {
      setBuddyStatus("self");
      return;
    }

    let cancelled = false;

    async function loadBuddyStatus() {
      setCheckingStatus(true);

      try {
        const areBuddies = await checkBuddyStatus(viewerUserId, searchedUserId);
        if (!cancelled) {
          setBuddyStatus(areBuddies ? "buddy" : "not_buddy");
        }
      } catch {
        if (!cancelled) {
          const isKnownBuddy = buddies.some(
            (relationship) => relationship.buddy.id === searchedUserId,
          );
          setBuddyStatus(isKnownBuddy ? "buddy" : "not_buddy");
        }
      } finally {
        if (!cancelled) {
          setCheckingStatus(false);
        }
      }
    }

    loadBuddyStatus();

    return () => {
      cancelled = true;
    };
  }, [buddies, currentUserId, searchResult]);

  const buddyCards = useMemo(() => buddies.map((relationship) => relationship.buddy), [buddies]);
  const buddyIds = useMemo(() => new Set(buddyCards.map((buddy) => buddy.id)), [buddyCards]);
  const recommendedReaders = useMemo(
    () =>
      recommendations.filter((recommendation) => {
        const user = recommendation.to_user;
        if (!user || !user.id) {
          return false;
        }

        if (currentUserId !== null && user.id === currentUserId) {
          return false;
        }

        return !buddyIds.has(user.id);
      }),
    [buddyIds, currentUserId, recommendations],
  );

  const heading = hasSearchQuery ? "Search Result" : "Your Book Buddies";
  const subtitle = hasSearchQuery
    ? `Showing the closest match for "${debouncedQuery}"`
    : "People you already follow can be managed here.";

  const handleToggleBuddy = async (user: PublicUser, isBuddy: boolean) => {
    setActionUserId(user.id);
    setError("");

    try {
      if (isBuddy) {
        await removeBuddy(user.id);
        setBuddies((current) =>
          current.filter((relationship) => relationship.buddy.id !== user.id),
        );
        if (searchResult?.id === user.id) {
          setBuddyStatus("not_buddy");
        }
      } else {
        const relationship = await addBuddy(user.id);
        setBuddies((current) => {
          const existing = current.some(
            (currentRelationship) => currentRelationship.buddy.id === relationship.buddy.id,
          );
          return existing ? current : [relationship, ...current];
        });
        if (searchResult?.id === user.id) {
          setBuddyStatus("buddy");
        }
      }
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setActionUserId(null);
    }
  };

  const showSearchState = hasSearchQuery;

  const formatMatchNote = (score?: number | null) => {
    if (typeof score !== "number") {
      return undefined;
    }

    const percentage = Math.max(
      0,
      Math.min(100, score <= 1 ? Math.round(score * 100) : Math.round(score)),
    );

    return `${percentage}% taste match`;
  };

  return (
    <div className="find-readers-page">
      <Navbar />

      <section className="find-readers-hero">
        <div className="find-readers-shell">
          <div className="find-readers-hero__content">
            <h1 className="find-readers-hero__title">Find Your Book Buddies</h1>
            <p className="find-readers-hero__subtitle">
              Search by username, see whether you are already connected, and add or
              remove buddies without leaving the page.
            </p>
            <section className="find-readers-search-section">
              <label className="find-readers-search-box" aria-label="Search readers by username">
                <SearchIcon />
                <input
                  type="search"
                  className="find-readers-search__input"
                  placeholder="Search by exact username..."
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                />
              </label>
            </section>
          </div>
        </div>
      </section>

      <main className="find-readers-shell find-readers-main">
        {!showSearchState ? (
          <section className="find-readers-results">
            <div className="find-readers-results__header">
              <div>
                <h2 className="find-readers-results__title">Readers You May Like</h2>
                <p className="find-readers-results__subtitle">
                  Suggested buddies based on similar reading taste.
                </p>
              </div>
              <p className="find-readers-results__count">
                {recommendedReaders.length} recommendation
                {recommendedReaders.length === 1 ? "" : "s"}
              </p>
            </div>

            {loadingRecommendations ? (
              <div className="readers-grid" aria-hidden="true">
                {Array.from({ length: 3 }, (_, index) => (
                  <div key={index} className="reader-card reader-card--skeleton" />
                ))}
              </div>
            ) : null}

            {!loadingRecommendations && recommendedReaders.length > 0 ? (
              <div className="readers-grid">
                {recommendedReaders.map((recommendation) => (
                  <ReaderCard
                    key={recommendation.id}
                    user={recommendation.to_user}
                    status="not_buddy"
                    note={formatMatchNote(recommendation.score)}
                    actionLoading={actionUserId === recommendation.to_user.id}
                    onToggleBuddy={handleToggleBuddy}
                  />
                ))}
              </div>
            ) : null}

            {!loadingRecommendations && recommendedReaders.length === 0 && !error ? (
              <div className="find-readers-state">
                <p>No buddy recommendations yet.</p>
                <p>Rate more books to help LuckyReads find stronger reading matches.</p>
              </div>
            ) : null}
          </section>
        ) : null}

        <section className="find-readers-results">
          <div className="find-readers-results__header">
            <div>
              <h2 className="find-readers-results__title">{heading}</h2>
              <p className="find-readers-results__subtitle">{subtitle}</p>
            </div>
            {!showSearchState ? (
              <p className="find-readers-results__count">
                {buddyCards.length} {buddyCards.length === 1 ? "buddy" : "buddies"}
              </p>
            ) : null}
          </div>

          {error ? (
            <div className="find-readers-state find-readers-state--error" role="alert">
              <p>{error}</p>
            </div>
          ) : null}

          {showSearchState && (loadingSearch || checkingStatus) ? (
            <div className="readers-grid" aria-hidden="true">
              <div className="reader-card reader-card--skeleton" />
            </div>
          ) : null}

          {showSearchState && !loadingSearch && !checkingStatus && searchResult ? (
            <div className="readers-grid">
              <ReaderCard
                user={searchResult}
                status={buddyStatus}
                actionLoading={actionUserId === searchResult.id}
                note={undefined}
                onToggleBuddy={handleToggleBuddy}
              />
            </div>
          ) : null}

          {showSearchState && !loadingSearch && !checkingStatus && !searchResult && !error ? (
            <div className="find-readers-state">
              <p>Start typing a username to look up a reader.</p>
            </div>
          ) : null}

          {!showSearchState && loadingBuddies ? (
            <div className="readers-grid" aria-hidden="true">
              {Array.from({ length: 3 }, (_, index) => (
                <div key={index} className="reader-card reader-card--skeleton" />
              ))}
            </div>
          ) : null}

          {!showSearchState && !loadingBuddies && buddyCards.length > 0 ? (
            <div className="readers-grid">
              {buddyCards.map((buddy) => (
                <ReaderCard
                  key={buddy.id}
                  user={buddy}
                  status="buddy"
                  actionLoading={actionUserId === buddy.id}
                  note={undefined}
                  onToggleBuddy={handleToggleBuddy}
                />
              ))}
            </div>
          ) : null}

          {!showSearchState && !loadingBuddies && buddyCards.length === 0 && !error ? (
            <div className="find-readers-state">
              <p>You have not added any book buddies yet.</p>
              <p>Search for a username above to add your first one.</p>
            </div>
          ) : null}
        </section>
      </main>
    </div>
  );
}
