import { NextApiRequest, NextApiResponse } from 'next';
import { Buffer } from 'buffer';

const { PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET, PAYPAL_DOMAIN } = process.env;

// 获取token
export async function generateAccessToken() {
  const BASE64_ENCODED_CLIENT_ID_AND_SECRET = Buffer.from(
    `${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`
  ).toString('base64');

  const response = await fetch(`${PAYPAL_DOMAIN}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${BASE64_ENCODED_CLIENT_ID_AND_SECRET}`,
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
    }),
  });

  const json = await response.json();
  return json.access_token;
}

// 处理响应结果
export async function handleResponse(response: Response) {
  const result = await response.json();
  return {
    ...result,
    httpStatusCode: response.status,
  };
}

// 对外暴露的API路由 API route to create an order
export async function POST(req: NextApiRequest, res: NextApiResponse) {
  try {
    // 根据请求路径区分不同的操作
    if (req.url === '/api/paypal/createOrder') {
      // 解析请求体中的购物车数据
      const { cart } = req.body;
      const { jsonResponse, httpStatusCode } = await createOrder(cart);
      res.status(httpStatusCode).json(jsonResponse);
    } else if (req.url === '/api/paypal/captureOrder') {
      // 解析请求体中的订单 ID
      const { orderID } = req.body;
      if (!orderID) {
        return res.status(400).json({ error: 'Order ID is required' });
      }
      const { jsonResponse, httpStatusCode } = await captureOrder(orderID);
      res.status(httpStatusCode).json(jsonResponse);
    } else {
      // 如果路径不匹配，返回 404 Not Found
      res.status(404).json({ error: 'Not Found' });
    }
  } catch (error) {
    console.error('An error occurred:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

// 创建订单
export async function createOrder(cart: any) {
  const accessToken = await generateAccessToken();
  const url = `${PAYPAL_DOMAIN}/v2/checkout/orders`;
  const payload = {
    intent: "CAPTURE",
    purchase_units: [ { amount: { currency_code: "USD", value: "100" } } ],
  };
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      // 取消其中一个注释，以强制进行负面测试（仅在沙盒模式下）。
      // 相关文档: https://developer.paypal.com/tools/sandbox/negative-testing/request-headers/
      // "PayPal-Mock-Response": '{"mock_application_codes": "MISSING_REQUIRED_PARAMETER"}'
      // "PayPal-Mock-Response": '{"mock_application_codes": "PERMISSION_DENIED"}'
      // "PayPal-Mock-Response": '{"mock_application_codes": "INTERNAL_SERVER_ERROR"}'
    },
    method: "POST",
    body: JSON.stringify(payload),
  });
  return handleResponse(response);
}

// 捕获订单
export async function captureOrder(orderID: string) { 
    const accessToken = await generateAccessToken();
    const url = `${PAYPAL_DOMAIN}/v2/checkout/orders/${orderID}/capture`;
    const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          // 取消其中一个注释，以强制进行负面测试（仅在沙盒模式下）。
          // 相关文档: https://developer.paypal.com/tools/sandbox/negative-testing/request-headers/
          // "PayPal-Mock-Response": '{"mock_application_codes": "INSTRUMENT_DECLINED"}'
          // "PayPal-Mock-Response": '{"mock_application_codes": "TRANSACTION_REFUSED"}'
          // "PayPal-Mock-Response": '{"mock_application_codes": "INTERNAL_SERVER_ERROR"}'
        },
    });
    return handleResponse(response);
}