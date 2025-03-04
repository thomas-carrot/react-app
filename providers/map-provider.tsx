'use client';

import { Libraries, useJsApiLoader } from '@react-google-maps/api';
import { ReactNode } from 'react';

const libraries: Libraries = ['places', 'drawing', 'geometry']; // Typage explicite

export function MapProvider({ children }: { children: ReactNode }) {

    const { isLoaded: scriptLoaded, loadError } = useJsApiLoader({
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string,
        libraries: libraries,
    });

    if (loadError) {
        console.error("Error loading Google Maps:", loadError);
        return <p>Encountered error while loading Google Maps. Please check your API key and ensure the API is enabled.</p>;
    }

    if (!scriptLoaded) {
        return <p>Map Script is loading...</p>;
    }

    return children;
}
