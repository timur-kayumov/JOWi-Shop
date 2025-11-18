import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

type RouteParams = {
  params: Promise<{
    storeId: string;
    categoryId: string;
  }>;
};

// GET /api/stores/[storeId]/categories/[categoryId]
// Получить детали категории
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { storeId, categoryId } = await params;

    // Get authorization token from request headers
    const authHeader = request.headers.get('authorization');
    const cookieHeader = request.headers.get('cookie');

    // TODO: Implement backend endpoint
    // Forward request to backend API
    const response = await fetch(
      `${API_BASE_URL}/api/v1/stores/${storeId}/categories/${categoryId}`,
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
        { error: 'Failed to fetch category', details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Get category API route error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// PUT /api/stores/[storeId]/categories/[categoryId]
// Обновить категорию
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { storeId, categoryId } = await params;
    const body = await request.json();

    // Validate request body
    // TODO: Add Zod validation schema
    if (!body.name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    // Get authorization token from request headers
    const authHeader = request.headers.get('authorization');
    const cookieHeader = request.headers.get('cookie');

    // TODO: Implement backend endpoint
    // Forward request to backend API
    const response = await fetch(
      `${API_BASE_URL}/api/v1/stores/${storeId}/categories/${categoryId}`,
      {
        method: 'PUT',
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
        { error: 'Failed to update category', details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Update category API route error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// DELETE /api/stores/[storeId]/categories/[categoryId]
// Удалить категорию
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { storeId, categoryId } = await params;

    // Get authorization token from request headers
    const authHeader = request.headers.get('authorization');
    const cookieHeader = request.headers.get('cookie');

    // TODO: Implement backend endpoint
    // Backend should check:
    // 1. Category is not system (isSystem = false)
    // 2. Handle products in category (set categoryId to null or prevent deletion)
    const response = await fetch(
      `${API_BASE_URL}/api/v1/stores/${storeId}/categories/${categoryId}`,
      {
        method: 'DELETE',
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
        { error: 'Failed to delete category', details: errorText },
        { status: response.status }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete category API route error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
