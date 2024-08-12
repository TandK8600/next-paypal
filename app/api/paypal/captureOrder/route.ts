import { NextResponse } from 'next/server';
import { captureOrder } from '@/lib/paypal';

// 对外暴露的API路由 API route to create an order
export async function POST(req: Request) {
  try {
    // 解析请求体中的订单 ID
    const { orderID } = await req.json();
    if (!orderID) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }
    const response = await captureOrder(orderID);
    return NextResponse.json(response, { status: response.httpStatusCode });
  } catch (error) {
    console.error('An error occurred:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}