import { NextResponse } from 'next/server';
import { createOrder } from '@/lib/paypal';

// 对外暴露的API路由 API route to create an order
export async function POST(req: Request) {
  try {
    const { cart } = await req.json();
    const response = await createOrder(cart);
    return NextResponse.json(response, { status: response.httpStatusCode });
  } catch (error) {
    console.error('An error occurred:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}