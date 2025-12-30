export interface SteamAchievement {
    apiname: string;
    achieved: number;
    unlocktime?: number;
}

export interface PlayerAchievementsParams {
    apiKey: string;
    appId: number;
    steamId: string;
}

interface PlayerAchievementsResponse {
    playerstats?: {
        achievements?: SteamAchievement[];
    };
}

const PLAYER_ACHIEVEMENTS_URL =
    "https://api.steampowered.com/ISteamUserStats/GetPlayerAchievements/v1/";

export async function fetchPlayerAchievements(
    params: PlayerAchievementsParams,
): Promise<SteamAchievement[]> {
    const { apiKey, appId, steamId } = params;

    const url = new URL(PLAYER_ACHIEVEMENTS_URL);
    url.searchParams.set("appid", appId.toString());
    url.searchParams.set("key", apiKey);
    url.searchParams.set("steamid", steamId);

    const response = await fetch(url);
    const body = await response.text();

    if (!response.ok) {
        throw new Error(`Steam achievements ${response.status}: ${body}`);
    }

    const data = JSON.parse(body) as PlayerAchievementsResponse;
    return data.playerstats?.achievements ?? [];
}