import { useState } from "react";
import { getApiErrorMessage } from "../../api/client";
import { searchOpenLibraryBooks } from "../../services/books";
import "./AddBookModal.css";

type BookStatus = "want_to_read" | "currently_reading" | "read";

type SearchResult = {
    openlibrary_key: string;
    title: string;
    authors?: string[];
    cover_url?: string;
};

function toSearchResult(book: Awaited<ReturnType<typeof searchOpenLibraryBooks>>[number]): SearchResult {
    return {
        openlibrary_key: book.openLibraryKey || book.id,
        title: book.title,
        authors: book.author ? book.author.split(", ").filter(Boolean) : [],
        cover_url: book.coverUrl,
    };
}

type AddBookModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onAddBook: (book: SearchResult, status: BookStatus) => Promise<void>;
};

export default function AddBookModal(props: AddBookModalProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [searching, setSearching] = useState(false);
    const [submittingKey, setSubmittingKey] = useState<string | null>(null);
    const [error, setError] = useState("");
    const [selectedStatus, setSelectedStatus] =
        useState<BookStatus>("want_to_read");

    if (!props.isOpen) {
        return null;
    }

    async function handleSearch() {
        if (!searchQuery.trim()) return;

        try {
            setSearching(true);
            setError("");
            const results = await searchOpenLibraryBooks(searchQuery);
            setSearchResults(results.map((result) => toSearchResult(result)));
        } catch (error) {
            setError(getApiErrorMessage(error));
        } finally {
            setSearching(false);
        }
    }

    async function handleAddClick(book: SearchResult) {
        try {
            setSubmittingKey(book.openlibrary_key);
            setError("");
            await props.onAddBook(book, selectedStatus);
            resetModal();
            props.onClose();
        } catch (error) {
            setError(getApiErrorMessage(error));
        } finally {
            setSubmittingKey(null);
        }
    }

    function resetModal() {
        setSearchQuery("");
        setSearchResults([]);
        setSelectedStatus("want_to_read");
    }

    function handleClose() {
        resetModal();
        props.onClose();
    }

    return (
        <div className="modal">
            <div className="modal-content">
                <h2 className="modal-title">Add a Book</h2>
                <div className="modal-row">
                    <input
                        type="text"
                        placeholder="Search by title or ISBN"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="modal-row">
                    <label htmlFor="book-status">Add to:</label>
                    <select
                        id="book-status"
                        value={selectedStatus}
                        onChange={(event) =>
                            setSelectedStatus(event.target.value as BookStatus)
                        }
                    >
                        <option value="want_to_read">Want to Read</option>
                        <option value="currently_reading">Currently Reading</option>
                        <option value="read">Read</option>
                    </select>
                </div>
                <div className="modal-buttons">
                    <button
                        className="search-button"
                        onClick={handleSearch}
                        disabled={searching}
                    >
                        {searching ? "Searching..." : "Search"}
                    </button>
                    <button className="close-button" onClick={handleClose}>
                        Close
                    </button>
                </div>

                {error ? <p className="modal-error">{error}</p> : null}

                <div className="search-results">
                    {searchResults.map((result) => (
                        <div
                            key={result.openlibrary_key}
                            className="search-result-card"
                        >
                            <div className="book-card-cover-wrapper">
                                <img
                                    className="book-card-cover-bg"
                                    src={result.cover_url || "placeholder"}
                                    alt=""
                                />
                                <img
                                    className="book-card-cover"
                                    src={result.cover_url || "placeholder"}
                                    alt={`${result.cover_url} cover`}
                                />
                            </div>
                            <div className="search-result-info">
                                <h3 className="search-result-title">
                                    {result.title}
                                </h3>
                                <p className="search-result-author">
                                    {result.authors?.join(", ") ||
                                        "Unknown author"}
                                </p>
                                <button
                                    className="add-to-shelf-button"
                                    disabled={submittingKey === result.openlibrary_key}
                                    onClick={() => handleAddClick(result)}
                                >
                                    {submittingKey === result.openlibrary_key
                                        ? "Adding..."
                                        : "Add to Shelf"}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
