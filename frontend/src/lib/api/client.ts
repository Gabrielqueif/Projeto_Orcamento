import { createClient } from '@/utils/supabase/client';

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

export async function fetchWithAuth(url: string, options: RequestInit = {}) {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    const headers: any = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
    }

    // Handle URL: if it starts with /, append to API_URL, else use as is (if valid URL)
    let fullUrl = url;
    if (url.startsWith('/')) {
        fullUrl = `${API_URL}${url}`;
    } else if (!url.startsWith('http')) {
        // If it's just a path but no leading slash, assume path relative to API_URL
        fullUrl = `${API_URL}/${url}`;
    }

    const response = await fetch(fullUrl, {
        ...options,
        headers,
    });

    if (response.status === 401) {
        if (typeof window !== 'undefined') {
            window.location.href = '/login';
        }
    }

    return response;
}
