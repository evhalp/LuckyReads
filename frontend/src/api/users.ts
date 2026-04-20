import { apiClient } from "./client";
import type { AuthUser } from "./auth";

export type PublicUser = {
  id: number;
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

export type BuddyRelationship = {
  id: number;
  buddy: PublicUser;
};

export type BuddyRecommendation = {
  id: number;
  to_user: PublicUser;
  score: number;
};

type IdLike = number | string;

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

function normalizeId(value: IdLike): number {
  return typeof value === "number" ? value : Number(value);
}

function normalizePublicUser(user: PublicUser): PublicUser {
  return {
    ...user,
    id: normalizeId(user.id),
  };
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
  return normalizePublicUser(data);
}

export async function fetchBuddyRecommendations(): Promise<BuddyRecommendation[]> {
  const { data } = await apiClient.get<
    BuddyRecommendation[] | PaginatedResponse<BuddyRecommendation>
  >("/recommendations/buddies/");
  return unwrapListResponse(data).map((recommendation) => ({
    ...recommendation,
    id: normalizeId(recommendation.id),
    to_user: normalizePublicUser(recommendation.to_user),
  }));
}

export async function fetchAllUsers(): Promise<PublicUser[]> {
  const { data } = await apiClient.get<PublicUser[] | PaginatedResponse<PublicUser>>(
    "/users/",
  );
  return unwrapListResponse(data).map(normalizePublicUser);
}

export async function searchBuddyByUsername(username: string): Promise<PublicUser> {
  const { data } = await apiClient.get<PublicUser>("/users/search/", {
    params: { username },
  });
  return normalizePublicUser(data);
}

export async function fetchPublicUserProfile(userId: number | string): Promise<PublicUser> {
  const { data } = await apiClient.get<PublicUser>(`/users/${userId}/`);
  return normalizePublicUser(data);
}

export async function fetchBuddies(userId: number): Promise<BuddyRelationship[]> {
  const { data } = await apiClient.get<BuddyRelationship[] | PaginatedResponse<BuddyRelationship>>(
    `/users/${userId}/buddies/`,
  );
  return unwrapListResponse(data).map((relationship) => ({
    ...relationship,
    buddy: normalizePublicUser(relationship.buddy),
  }));
}

export async function checkBuddyStatus(viewerUserId: number, targetUserId: number): Promise<boolean> {
  const { data } = await apiClient.get<{ are_buddies: boolean }>(
    `/users/${viewerUserId}/buddies/check/`,
    { params: { buddy_id: targetUserId } },
  );
  return data.are_buddies;
}

export async function addBuddy(userId: number): Promise<BuddyRelationship> {
  const { data } = await apiClient.post<BuddyRelationship>(`/users/${userId}/buddy/`);
  return {
    ...data,
    buddy: normalizePublicUser(data.buddy),
  };
}

export async function removeBuddy(userId: number): Promise<void> {
  await apiClient.delete(`/users/${userId}/buddy/`);
}
