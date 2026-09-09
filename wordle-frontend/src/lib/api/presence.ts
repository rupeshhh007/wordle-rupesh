import { get } from "./client";

export async function getOnlineUsers(): Promise<string[]> {
  try {
    const res = await get<string[]>("/api/presence/online");
    return Array.isArray(res) ? res : [];
  } catch {
    return [];
  }
}

export async function getUserStatus(
  username: string
): Promise<{ username: string; online: boolean }> {
  try {
    return await get<{ username: string; online: boolean }>(
      `/api/presence/status/${encodeURIComponent(username)}`
    );
  } catch {
    return { username, online: false };
  }
}
