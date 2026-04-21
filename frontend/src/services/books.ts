import { apiClient } from "../api/client";

type ApiAuthor = {
    name?: string | null;
};

type ApiBook = {
    id?: number | string;
    openlibrary_key?: string | null;
    title?: string | null;
    authors?: ApiAuthor[] | null;
    cover_url?: string | null;
    isbn?: string | null;
    average_rating?: number | null;
    reviews?: ApiBookReview[] | null;
};

type ApiBookReview = {
    id?: number | string;
    author?: string | null;
    rating?: number | null;
    text?: string | null;
};

type ApiRecommendation = {
    id?: number | string;
    book?: ApiBook | null;
    score?: number | null;
};

type OpenLibrarySearchResult = {
    openlibrary_key?: string | null;
    title?: string | null;
    authors?: string[] | null;
    cover_url?: string | null;
};

type PaginatedResponse<T> = {
    results?: T[] | null;
};

export type DisplayBook = {
    id: string;
    title: string;
    author: string;
    coverUrl?: string;
    matchPercentage?: number;
    openLibraryKey?: string;
    isbn?: string;
    averageRating?: number;
    reviews?: {
        id: string;
        author: string;
        rating: number;
        text: string;
    }[];
};

export type OpenLibraryBookDetails = {
    pages?: number;
    published?: string;
    genres?: string[];
    about?: string;
    isbn?: string;
};

function toTitleCase(value: string): string {
    return value
        .toLowerCase()
        .split(/\s+/)
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
}

function normalizeGenres(subjects: string[] | undefined): string[] {
    if (!Array.isArray(subjects) || subjects.length === 0) {
        return [];
    }

    const blockedWords = new Set([
        "fiction",
        "novel",
        "book",
        "general",
        "literature",
    ]);

    const cleaned = subjects
        .map((subject) => subject.trim())
        .filter((subject) => subject.length >= 3 && subject.length <= 28)
        .filter((subject) => !subject.includes("--"))
        .filter((subject) => !/\d/.test(subject))
        .map((subject) => subject.replace(/[.,;:!?()\[\]{}]/g, "").trim())
        .filter((subject) => subject.length >= 3)
        .filter((subject) => !blockedWords.has(subject.toLowerCase()))
        .map((subject) => toTitleCase(subject));

    return Array.from(new Set(cleaned)).slice(0, 6);
}

function mapBook(book: ApiBook, recommendation?: ApiRecommendation): DisplayBook {
    const authors = Array.isArray(book.authors)
        ? book.authors
              .map((author) => author.name?.trim())
              .filter((name): name is string => Boolean(name))
        : [];
    const rawScore = recommendation?.score;
    const matchPercentage =
        typeof rawScore === "number"
            ? Math.max(
                  0,
                  Math.min(
                      100,
                      rawScore <= 1 ? Math.round(rawScore * 100) : Math.round(rawScore),
                  ),
              )
            : undefined;

    return {
        id: String(
            recommendation?.id ??
                book.id ??
                book.openlibrary_key ??
                book.title ??
                "book-card",
        ),
        title: book.title?.trim() || "Untitled book",
        author: authors.join(", ") || "Unknown author",
        coverUrl: book.cover_url?.trim() || undefined,
        matchPercentage,
        openLibraryKey: book.openlibrary_key?.trim() || undefined,
        isbn: book.isbn?.trim() || undefined,
        averageRating:
            typeof book.average_rating === "number" ? book.average_rating : undefined,
        reviews: Array.isArray(book.reviews)
            ? book.reviews.reduce<
                  {
                      id: string;
                      author: string;
                      rating: number;
                      text: string;
                  }[]
              >((acc, review, index) => {
                  if (typeof review.rating !== "number") {
                      return acc;
                  }

                  acc.push({
                      id: String(review.id ?? `${book.id ?? "book"}-review-${index}`),
                      author: review.author?.trim() || "Anonymous",
                      rating: review.rating,
                      text: review.text?.trim() || "",
                  });

                  return acc;
              }, [])
            : undefined,
    };
}

function mapOpenLibraryBook(result: OpenLibrarySearchResult): DisplayBook {
    const authors = Array.isArray(result.authors)
        ? result.authors.map((author) => author.trim()).filter(Boolean)
        : [];

    return {
        id: String(result.openlibrary_key ?? result.title ?? "openlibrary-book"),
        title: result.title?.trim() || "Untitled book",
        author: authors.join(", ") || "Unknown author",
        coverUrl: result.cover_url?.trim() || undefined,
        openLibraryKey: result.openlibrary_key?.trim() || undefined,
    };
}

function unwrapListResponse<T>(payload: T[] | PaginatedResponse<T>): T[] {
    if (Array.isArray(payload)) {
        return payload;
    }

    if (payload && Array.isArray(payload.results)) {
        return payload.results;
    }

    return [];
}

export async function fetchRecommendations(): Promise<DisplayBook[]> {
    const response = await apiClient.get<ApiRecommendation[] | PaginatedResponse<ApiRecommendation>>(
        "/recommendations/books/",
    );
    return unwrapListResponse(response.data).map((item) =>
        mapBook(item.book ?? {}, item),
    );
}

export async function fetchAllBooks(): Promise<DisplayBook[]> {
    const response = await apiClient.get<ApiBook[] | PaginatedResponse<ApiBook>>("/books/");
    return unwrapListResponse(response.data).map((book) => mapBook(book));
}

export async function searchBooks(query: string): Promise<DisplayBook[]> {
    const response = await apiClient.get<ApiBook[] | PaginatedResponse<ApiBook>>("/books/", {
        params: { search: query },
    });

    const localResults = unwrapListResponse(response.data).map((book) => mapBook(book));
    if (localResults.length > 0) {
        return localResults;
    }

    return searchOpenLibraryBooks(query);
}

export async function searchOpenLibraryBooks(query: string): Promise<DisplayBook[]> {
    const response = await apiClient.get<OpenLibrarySearchResult[]>("/books/olsearch/", {
        params: { q: query },
    });

    return response.data.map((book) => mapOpenLibraryBook(book));
}

export async function fetchOpenLibraryBookDetails(input: {
    title: string;
    openLibraryKey?: string;
    isbn?: string;
}): Promise<OpenLibraryBookDetails> {
    let searchUrl = "";

    if (input.isbn?.trim()) {
        searchUrl = `https://openlibrary.org/search.json?isbn=${encodeURIComponent(input.isbn.trim())}&fields=key,number_of_pages_median,first_publish_year,subject,isbn&limit=1`;
    } else {
        searchUrl = `https://openlibrary.org/search.json?title=${encodeURIComponent(input.title)}&fields=key,number_of_pages_median,first_publish_year,subject,isbn&limit=1`;
    }

    const searchResponse = await fetch(searchUrl);
    if (!searchResponse.ok) {
        return {};
    }

    const searchPayload = await searchResponse.json() as {
        docs?: Array<{
            key?: string;
            number_of_pages_median?: number;
            first_publish_year?: number;
            subject?: string[];
            isbn?: string[];
        }>;
    };

    const doc = Array.isArray(searchPayload.docs) ? searchPayload.docs[0] : undefined;
    const workKey = input.openLibraryKey || doc?.key || "";

    let about = "";
    let workSubjects: string[] | undefined;
    if (workKey) {
        const normalizedKey = workKey.startsWith("/") ? workKey : `/${workKey}`;
        const workResponse = await fetch(`https://openlibrary.org${normalizedKey}.json`);
        if (workResponse.ok) {
            const workPayload = await workResponse.json() as {
                description?: string | { value?: string };
                subjects?: string[];
            };
            if (typeof workPayload.description === "string") {
                about = workPayload.description;
            } else if (workPayload.description?.value) {
                about = workPayload.description.value;
            }
            if (Array.isArray(workPayload.subjects)) {
                workSubjects = workPayload.subjects;
            }
        }
    }

    const genres = normalizeGenres(workSubjects ?? doc?.subject);

    return {
        pages: doc?.number_of_pages_median,
        published: doc?.first_publish_year ? String(doc.first_publish_year) : undefined,
        genres: genres.length > 0 ? genres : undefined,
        about: about || undefined,
        isbn: input.isbn || (Array.isArray(doc?.isbn) ? doc?.isbn[0] : undefined),
    };
}
