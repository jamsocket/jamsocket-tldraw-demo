"use client"

import { useEffect } from "react";

export default function DocIdSetter({ docId }: { docId: string }) {
    // This component is used to set the document ID in the URL if it is not already set.

    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }

        let url = new URL(window.location.href);

        if (!url.searchParams.has('docId')) {
            url.searchParams.set('docId', docId);
            window.history.replaceState({}, '', url.toString());
        }
    }, [docId])

    return null;
}
