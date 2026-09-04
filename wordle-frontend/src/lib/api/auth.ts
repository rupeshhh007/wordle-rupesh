import { post } from "./client";
import type {
  RegisterRequest,
  UserResponse,
  LoginRequest,
  LoginResponse,
} from "@/types/api";

export function register(data: RegisterRequest): Promise<UserResponse> {
  return post<UserResponse>("/api/auth/register", data);
}

export function login(data: LoginRequest): Promise<LoginResponse> {
  return post<LoginResponse>("/api/auth/login", data);
}
