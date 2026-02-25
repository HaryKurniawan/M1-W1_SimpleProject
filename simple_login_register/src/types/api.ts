export interface UserProfile {
  id: number;
  name: string;
  email: string;
  createdAt?: string;
}

export interface LoginResponse {
  message: string;
  token: string;
  user: UserProfile;
}

export interface RegisterResponse {
  message: string;
  data: UserProfile;
}

export interface ProfileResponse {
  message: string;
  data: UserProfile;
}

export interface ApiErrorResponse {
  message: string;
  error?: unknown;
}
