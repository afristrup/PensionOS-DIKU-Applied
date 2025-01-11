import { NextResponse } from 'next/server';

// In a real application, this would be stored in a database
let userSettings = {
    theme: 'light',
    notifications: true,
    emailNotifications: true,
    language: 'en',
    documentsPerPage: '10',
    useMockData: false
};

export async function GET() {
    return NextResponse.json(userSettings);
}

export async function POST(request: Request) {
    try {
        const newSettings = await request.json();
        userSettings = { ...userSettings, ...newSettings };
        
        // In a real application, save to database here
        
        return NextResponse.json(userSettings);
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to update settings' },
            { status: 500 }
        );
    }
} 