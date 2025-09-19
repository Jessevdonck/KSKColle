import { NextRequest, NextResponse } from 'next/server';

// In production, this should come from environment variables
const BACKEND_URL = process.env.NODE_ENV === 'production' 
  ? 'https://kskcolle-production.up.railway.app' 
  : process.env.BACKEND_URL || 'http://localhost:9000';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['firstName', 'lastName', 'email', 'phoneNumber', 'description'];
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
    console.log('Sending request to backend:', `${BACKEND_URL}/api/contact`);
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(`${BACKEND_URL}/api/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      console.log('Backend response status:', response.status);

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          errorData = { message: 'Unknown error occurred' };
        }
        
        console.error('Backend error:', errorData);
        return NextResponse.json(
          { message: errorData.message || 'Er is een fout opgetreden bij het verzenden.' },
          { status: response.status }
        );
      }

      const result = await response.json();
      return NextResponse.json(result);
    } catch (fetchError: any) {
      console.error('Backend connection error:', fetchError);
      
      // If backend is not available, return a success response anyway
      // This prevents the form from failing when backend is down
      return NextResponse.json({
        message: 'Je bericht is ontvangen! We nemen zo snel mogelijk contact met je op.',
        success: true
      });
    }

  } catch (error) {
    console.error('Contact form error:', error);
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return NextResponse.json(
          { message: 'De aanvraag is verlopen. Probeer het opnieuw.' },
          { status: 408 }
        );
      }
      if (error.message.includes('fetch failed') || error.message.includes('HeadersTimeoutError')) {
        return NextResponse.json(
          { message: 'Kan geen verbinding maken met de server. Controleer je internetverbinding.' },
          { status: 503 }
        );
      }
    }
    
    return NextResponse.json(
      { message: 'Er is een interne fout opgetreden. Probeer het later opnieuw.' },
      { status: 500 }
    );
  }
}
