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

export async function addBuddy(userId: number): Promise<BuddyRelationship> {
  const { data } = await apiClient.post<BuddyRelationship>(`/users/${userId}/buddy/`);
  return data;
}

export async function removeBuddy(userId: number): Promise<void> {
  await apiClient.delete(`/users/${userId}/buddy/`);
}

export async function fetchBuddies(userId: number): Promise<BuddyRelationship[]> {
  const { data } = await apiClient.get<BuddyRelationship[]>(`/users/${userId}/buddies/`);
  return data;
}

export async function fetchBuddyRecommendations(): Promise<BuddyRecommendation[]> {
  const { data } = await apiClient.get<
    BuddyRecommendation[] | PaginatedResponse<BuddyRecommendation>
  >("/recommendations/buddies/");
  return unwrapListResponse(data);
}

export async function checkBuddyStatus(
  userId: number,
  buddyId: number,
): Promise<boolean> {
  const { data } = await apiClient.get<{ are_buddies: boolean }>(
    `/users/${userId}/buddies/${buddyId}/`,
  );
  return data.are_buddies;
}
