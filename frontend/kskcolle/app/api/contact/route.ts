import { NextRequest, NextResponse } from 'next/server';

// In production, this should come from environment variables
const BACKEND_URL = process.env.NODE_ENV === 'production' 
  ? 'https://kskcolle-production.up.railway.app' 
  : 'http://localhost:9000';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['firstName', 'lastName', 'email', 'phoneNumber', 'address', 'description'];
    for (const field of requiredFields) {
      if (!body[field] || body[field].trim() === '') {
        return NextResponse.json(
          { message: `Veld '${field}' is verplicht.` },
          { status: 400 }
        );
      }
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { message: 'Ongeldig e-mailadres.' },
        { status: 400 }
      );
    }

    // Send to backend
    const response = await fetch(`${BACKEND_URL}/api/contact`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { message: errorData.message || 'Er is een fout opgetreden bij het verzenden.' },
        { status: response.status }
      );
    }

    const result = await response.json();
    return NextResponse.json(result);

  } catch (error) {
    console.error('Contact form error:', error);
    return NextResponse.json(
      { message: 'Er is een interne fout opgetreden. Probeer het later opnieuw.' },
      { status: 500 }
    );
  }
}
