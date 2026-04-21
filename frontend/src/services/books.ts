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
};

type ApiBookDetailReview = {
    id?: number | string;
    author?: string | null;
    rating?: number | null;
    text?: string | null;
};

type ApiBookDetail = {
    id?: number | string;
    title?: string | null;
    author?: string | null;
    coverUrl?: string | null;
    isbn?: string | null;
    rating?: number | null;
    about?: string | null;
    genres?: string[] | null;
    reviews?: ApiBookDetailReview[] | null;
};

type ApiRecommendation = {
    id?: number | string;
    book?: ApiBook | null;
    score?: number | null;
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
};

export type DisplayBookDetail = {
    id: string;
    title: string;
    author: string;
    coverUrl?: string;
    rating?: number;
    genres?: string[];
    isbn?: string;
    about?: string;
    reviews?: {
        id: string;
        author: string;
        rating: number;
        text: string;
    }[];
};

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
            book.id ??
                recommendation?.id ??
                book.openlibrary_key ??
                book.title ??
                "book-card",
        ),
        title: book.title?.trim() || "Untitled book",
        author: authors.join(", ") || "Unknown author",
        coverUrl: book.cover_url?.trim() || undefined,
        matchPercentage,
    };
}

function mapBookDetail(data: ApiBookDetail): DisplayBookDetail {
    const reviews = Array.isArray(data.reviews)
        ? data.reviews.map((review, index) => ({
              id: String(review.id ?? `review-${index}`),
              author: review.author?.trim() || "Reader",
              rating: typeof review.rating === "number" ? review.rating : 0,
              text: review.text?.trim() || "",
          }))
        : [];

    return {
        id: String(data.id ?? "book-detail"),
        title: data.title?.trim() || "Untitled book",
        author: data.author?.trim() || "Unknown author",
        coverUrl: data.coverUrl?.trim() || undefined,
        rating:
            typeof data.rating === "number"
                ? Math.round(data.rating * 10) / 10
                : undefined,
        genres: Array.isArray(data.genres) ? data.genres.filter(Boolean) : [],
        isbn: data.isbn?.trim() || undefined,
        about: data.about?.trim() || undefined,
        reviews,
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

export async function searchBooks(query: string): Promise<DisplayBook[]> {
    const response = await apiClient.get<ApiBook[] | PaginatedResponse<ApiBook>>("/books/", {
        params: { search: query },
    });

    return unwrapListResponse(response.data).map((book) => mapBook(book));
}

export async function fetchBookDetail(bookId: string): Promise<DisplayBookDetail> {
    const response = await apiClient.get<ApiBookDetail>(`/books/${bookId}/detail/`);
    return mapBookDetail(response.data);
}
