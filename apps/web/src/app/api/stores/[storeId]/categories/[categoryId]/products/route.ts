import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

type RouteParams = {
  params: Promise<{
    storeId: string;
    categoryId: string;
  }>;
};

// GET /api/stores/[storeId]/categories/[categoryId]/products
// Получить список товаров в категории
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { storeId, categoryId } = await params;

    // Get authorization token from request headers
    const authHeader = request.headers.get('authorization');
    const cookieHeader = request.headers.get('cookie');

    // TODO: Implement backend endpoint
    // Forward request to backend API
    const response = await fetch(
      `${API_BASE_URL}/api/v1/stores/${storeId}/categories/${categoryId}/products`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(authHeader && { Authorization: authHeader }),
          ...(cookieHeader && { Cookie: cookieHeader }),
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend API error:', errorText);

      return NextResponse.json(
        { error: 'Failed to fetch products', details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Get category products API route error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// POST /api/stores/[storeId]/categories/[categoryId]/products
// Привязать товары к категории
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { storeId, categoryId } = await params;
    const body = await request.json();

    // Validate request body
    // TODO: Add Zod validation schema
    if (!body.productIds || !Array.isArray(body.productIds)) {
      return NextResponse.json(
        { error: 'productIds array is required' },
        { status: 400 }
      );
    }

    // Get authorization token from request headers
    const authHeader = request.headers.get('authorization');
    const cookieHeader = request.headers.get('cookie');

    // TODO: Implement backend endpoint
    // Backend should:
    // 1. Validate that products exist and belong to the same tenant
    // 2. Update categoryId for all products in productIds array
    // 3. Return updated products
    const response = await fetch(
      `${API_BASE_URL}/api/v1/stores/${storeId}/categories/${categoryId}/products`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authHeader && { Authorization: authHeader }),
          ...(cookieHeader && { Cookie: cookieHeader }),
        },
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend API error:', errorText);

      return NextResponse.json(
        { error: 'Failed to attach products', details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Attach products API route error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
