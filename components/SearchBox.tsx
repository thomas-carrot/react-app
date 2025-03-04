"use client";

import { useEffect, useRef } from "react";

interface SearchBoxProps {
    onSelect: (location: google.maps.LatLngLiteral) => void;
    placeholder?: string;
}

const SearchBox = ({ onSelect, placeholder }: SearchBoxProps) => {
    const inputRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        if (!inputRef.current) return;

        const autocomplete = new google.maps.places.Autocomplete(inputRef.current, { types: ["geocode"] });

        autocomplete.addListener("place_changed", () => {
            const place = autocomplete.getPlace();
            if (place.geometry && place.geometry.location) {
                onSelect({
                    lat: place.geometry.location.lat(),
                    lng: place.geometry.location.lng(),
                });
            }
        });
    }, [onSelect]);

    return (
        <input ref={inputRef} type="text" placeholder={placeholder} className="w-full p-2 border rounded text-black"/>
    );
};

export { SearchBox };
