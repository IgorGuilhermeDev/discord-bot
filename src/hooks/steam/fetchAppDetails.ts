
const APP_DETAILS_URL = "https://store.steampowered.com/api/appdetails";

export interface SteamAppDetails {
    id: number;
    name: string;
    headerImage?: string;
}

interface StoreAppDetailsResponse {
    success: boolean;
    data?: {
        name?: string;
        header_image?: string;
    };
}

export async function fetchAppDetails(appId: number): Promise<SteamAppDetails | null> {
    const response = await fetch(`${APP_DETAILS_URL}?appids=${appId}`);
    const body = await response.text();

    if (!response.ok) {
        throw new Error(`Steam store ${response.status}: ${body}`);
    }

    const parsed = JSON.parse(body) as Record<string, StoreAppDetailsResponse>;
    const entry = parsed?.[String(appId)];

    if (!entry?.success || !entry.data) {
        return null;
    }

    return {
        id: appId,
        name: entry.data.name ?? `App ${appId}`,
        headerImage: entry.data.header_image,
    };
}
