import { apiClient } from "./client";

export type AuthUser = {
  id: number;
  username: string;
  email: string;
  bio?: string;
};

export type AuthResponse = {
  token?: string;
  user: AuthUser;
};

export type RegisterPayload = {
  email: string;
  password: string;
  confirmPassword: string;
  username: string;
  bio?: string;
};

export async function registerUser({
  email,
  password,
  confirmPassword,
  username,
  bio,
}: RegisterPayload) {
  const { data } = await apiClient.post<AuthResponse>("/users/register/", {
    email,
    password,
    confirm_password: confirmPassword,
    username,
    bio: bio ?? "",
  });

  return data;
}

export async function loginUser(email: string, password: string) {
  const { data } = await apiClient.post<AuthResponse>("/users/login/", {
    email,
    password,
  });

  return data;
}
