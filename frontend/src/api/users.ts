import { apiClient } from "./client";
import type { AuthUser } from "./auth";

export type PublicUser = {
  id: number;
  username: string;
  bio?: string;
};

export type BuddyRelationship = {
  id: number;
  buddy: PublicUser;
};

export type BuddyRecommendation = {
  id: number;
  to_user: PublicUser;
  score?: number | null;
};

type PaginatedResponse<T> = {
  results?: T[] | null;
};

function unwrapListResponse<T>(payload: T[] | PaginatedResponse<T>): T[] {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (payload && Array.isArray(payload.results)) {
    return payload.results;
  }

  return [];
}

export async function fetchCurrentUser(): Promise<AuthUser> {
  const { data } = await apiClient.get<AuthUser>("/users/me/");
  return data;
}

export async function updateCurrentUser(
  payload: Partial<Pick<AuthUser, "username" | "bio">>,
): Promise<AuthUser> {
  const requestPayload: Partial<Pick<AuthUser, "username" | "bio">> = {
    bio: payload.bio,
  };

  if (payload.username !== undefined) {
    requestPayload.username = payload.username;
  }

  const { data } = await apiClient.patch<AuthUser>("/users/me/", requestPayload);
  return data;
}

export async function searchUserByUsername(username: string): Promise<PublicUser> {
  const { data } = await apiClient.get<PublicUser>("/users/search/", {
    params: { username },
  });
  return data;
}

export type BuddyRecommendation = {
  id: string;
  to_user: {
    id: string;
    username: string;
    bio?: string;
    avatar_url?: string;
  };
  score: number;
};

type PaginatedResponse<T> = {
  results?: T[] | null;
};

function unwrapListResponse<T>(payload: T[] | PaginatedResponse<T>): T[] {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (payload && Array.isArray(payload.results)) {
    return payload.results;
  }

  return [];
}

export type PublicUser = {
  id: string;
  name?: string;
  username: string;
  email?: string;
  bio?: string;
  avatar_url?: string;
  reviews?: {
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
  }[];
};

export async function fetchBuddyRecommendations(): Promise<BuddyRecommendation[]> {
  const { data } = await apiClient.get<
    BuddyRecommendation[] | PaginatedResponse<BuddyRecommendation>
  >("/recommendations/buddies/");
  return unwrapListResponse(data);
}

export async function fetchAllUsers(): Promise<PublicUser[]> {
  const { data } = await apiClient.get<PublicUser[] | PaginatedResponse<PublicUser>>(
    "/users/",
  );
  return unwrapListResponse(data);
}

export async function searchBuddyByUsername(username: string): Promise<PublicUser> {
  const { data } = await apiClient.get<PublicUser>("/users/search/", {
    params: { username },
  });
  return data;
}

export async function fetchPublicUserProfile(userId: string): Promise<PublicUser> {
  const { data } = await apiClient.get<PublicUser>(`/users/${userId}/`);
  return data;
}
