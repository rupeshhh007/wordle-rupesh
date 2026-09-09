import { Client, StompSubscription } from "@stomp/stompjs";
import { MatchEventDto, ChallengeEventDto } from "@/types/api";

function getWsUrl(): string {
  if (process.env.NEXT_PUBLIC_WS_URL) {
    return process.env.NEXT_PUBLIC_WS_URL;
  }
  const apiUrl =
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:8080";
  const urlWithoutApi = apiUrl.replace(/\/api\/?$/, "").replace(/\/$/, "");
  const isHttps = urlWithoutApi.startsWith("https://");
  const wsProto = isHttps ? "wss://" : "ws://";
  const host = urlWithoutApi.replace(/^https?:\/\//, "");
  return `${wsProto}${host}/ws`;
}

class StompManager {
  private client: Client | null = null;
  private connected: boolean = false;
  private subscriptions: Map<
    string,
    { destination: string; handler: (body: any) => void; sub?: StompSubscription }
  > = new Map();
  private token: string | null = null;

  private getTokenFromStorage(): string | null {
    if (typeof window === "undefined") return null;
    try {
      const stored = localStorage.getItem("wordle-auth");
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed?.state?.token ?? null;
      }
    } catch {
      // localStorage read fallback
    }
    return null;
  }

  public setToken(token: string | null) {
    this.token = token;
    if (this.client && token) {
      this.client.connectHeaders = {
        Authorization: `Bearer ${token}`,
        token: token,
      };
    }
  }

  public connect(token?: string) {
    if (typeof window === "undefined") return;

    if (token) {
      this.token = token;
    } else if (!this.token) {
      this.token = this.getTokenFromStorage();
    }

    if (this.client && (this.connected || this.client.active)) {
      return;
    }

    const brokerURL = getWsUrl();

    this.client = new Client({
      brokerURL,
      connectHeaders: {
        Authorization: this.token ? `Bearer ${this.token}` : "",
        token: this.token || "",
      },
      beforeConnect: () => {
        const currentToken = this.token || this.getTokenFromStorage();
        if (currentToken && this.client) {
          this.client.connectHeaders = {
            Authorization: `Bearer ${currentToken}`,
            token: currentToken,
          };
        }
      },
      reconnectDelay: 3000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      onConnect: () => {
        this.connected = true;
        // Re-subscribe all registered listeners upon connection/reconnection
        this.subscriptions.forEach((entry, key) => {
          this.activateSubscription(key, entry);
        });
      },
      onDisconnect: () => {
        this.connected = false;
      },
      onStompError: (frame) => {
        console.warn("[STOMP] Protocol error:", frame.headers?.["message"]);
        this.connected = false;
      },
      onWebSocketClose: () => {
        this.connected = false;
      },
    });

    this.client.activate();
  }

  public isConnected(): boolean {
    return this.connected;
  }

  private activateSubscription(
    key: string,
    entry: { destination: string; handler: (body: any) => void; sub?: StompSubscription }
  ) {
    if (!this.client || !this.connected) return;
    try {
      if (entry.sub) {
        entry.sub.unsubscribe();
      }
      entry.sub = this.client.subscribe(entry.destination, (message) => {
        try {
          const payload = JSON.parse(message.body);
          entry.handler(payload);
        } catch {
          // ignore unparseable payload
        }
      });
    } catch {
      // subscription failure
    }
  }

  public subscribeToMatch(
    matchId: number,
    handler: (event: MatchEventDto) => void
  ): () => void {
    const key = `match_${matchId}`;
    const destination = `/topic/match/${matchId}`;

    const entry = { destination, handler };
    this.subscriptions.set(key, entry);

    if (this.connected) {
      this.activateSubscription(key, entry);
    } else {
      this.connect();
    }

    return () => {
      const subEntry = this.subscriptions.get(key);
      if (subEntry?.sub) {
        subEntry.sub.unsubscribe();
      }
      this.subscriptions.delete(key);
    };
  }

  public subscribeToUserChallenges(
    username: string,
    handler: (event: ChallengeEventDto) => void
  ): () => void {
    const key = `user_challenges_${username}`;
    const userDest = `/user/queue/challenges`;
    const topicDest = `/topic/user/${username}/challenges`;

    const entry = {
      destination: userDest,
      handler,
    };
    this.subscriptions.set(key, entry);

    const topicKey = `topic_challenges_${username}`;
    const topicEntry = {
      destination: topicDest,
      handler,
    };
    this.subscriptions.set(topicKey, topicEntry);

    const lowerName = username.toLowerCase();
    const lowerKey = `topic_challenges_lower_${lowerName}`;
    let lowerEntry: { destination: string; handler: (body: any) => void; sub?: StompSubscription } | null = null;
    if (lowerName !== username) {
      lowerEntry = {
        destination: `/topic/user/${lowerName}/challenges`,
        handler,
      };
      this.subscriptions.set(lowerKey, lowerEntry);
    }

    if (this.connected) {
      this.activateSubscription(key, entry);
      this.activateSubscription(topicKey, topicEntry);
      if (lowerEntry) {
        this.activateSubscription(lowerKey, lowerEntry);
      }
    } else {
      this.connect();
    }

    return () => {
      const subEntry = this.subscriptions.get(key);
      if (subEntry?.sub) {
        subEntry.sub.unsubscribe();
      }
      this.subscriptions.delete(key);

      const topicSubEntry = this.subscriptions.get(topicKey);
      if (topicSubEntry?.sub) {
        topicSubEntry.sub.unsubscribe();
      }
      this.subscriptions.delete(topicKey);

      if (lowerEntry) {
        const lowerSubEntry = this.subscriptions.get(lowerKey);
        if (lowerSubEntry?.sub) {
          lowerSubEntry.sub.unsubscribe();
        }
        this.subscriptions.delete(lowerKey);
      }
    };
  }

  public disconnect() {
    if (this.client) {
      this.subscriptions.forEach((entry) => {
        if (entry.sub) {
          entry.sub.unsubscribe();
        }
      });
      this.subscriptions.clear();
      this.client.deactivate();
      this.client = null;
      this.connected = false;
    }
  }
}

export const stompManager = new StompManager();
