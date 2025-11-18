import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

type RouteParams = {
  params: Promise<{
    storeId: string;
    categoryId: string;
    productId: string;
  }>;
};

// DELETE /api/stores/[storeId]/categories/[categoryId]/products/[productId]
// Отвязать товар от категории
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { storeId, categoryId, productId } = await params;

    // Get authorization token from request headers
    const authHeader = request.headers.get('authorization');
    const cookieHeader = request.headers.get('cookie');

    // TODO: Implement backend endpoint
    // Backend should:
    // 1. Validate that product exists and belongs to the category
    // 2. Set categoryId to null for the product
    // 3. Return success response
    const response = await fetch(
      `${API_BASE_URL}/api/v1/stores/${storeId}/categories/${categoryId}/products/${productId}`,
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
        { error: 'Failed to detach product', details: errorText },
        { status: response.status }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Detach product API route error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
