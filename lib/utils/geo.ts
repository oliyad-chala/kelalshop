import { headers } from 'next/headers';

export interface UserLocation {
  country?: string;
  region?: string;
  city?: string;
}

/**
 * Gets the user's location based on Vercel's edge headers.
 * If running locally or not on Vercel, these might be undefined unless spoofed.
 */
export async function getUserLocation(): Promise<UserLocation> {
  const headersList = await headers();
  
  const country = headersList.get('x-vercel-ip-country') || undefined;
  const region = headersList.get('x-vercel-ip-country-region') || undefined;
  const city = headersList.get('x-vercel-ip-city') || undefined;

  // In a real app with profiles, you could optionally fallback to reading the user's profile location
  // if headers aren't available, but we rely on IP for true physical geo-targeting.

  return {
    country,
    region,
    city: city ? decodeURIComponent(city) : undefined,
  };
}
