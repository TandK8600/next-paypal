const { PAYPAL_CLIENT_ID, PAYPAL_SECRET, PAYPAL_DOMAIN } = process.env;


// 获取token
export async function generateAccessToken() {
    const BASE64_ENCODED_CLIENT_ID_AND_SECRET = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET}`).toString('base64');

    const response = await fetch(`${PAYPAL_DOMAIN}/v1/oauth2/token`, {
        method: 'POST',
        headers: {
            Authorization: `Basic ${BASE64_ENCODED_CLIENT_ID_AND_SECRET}`,
        },
        body: new URLSearchParams({
            grant_type: 'client_credentials',
            response_type: "id_token",
            intent: "sdk_init",
        }),
    });
    const responseBodyText = await response.text();
    const json = JSON.parse(responseBodyText);
    return json.access_token;
}


// 处理响应结果
export async function handleResponse(response: Response) {
    const responseBodyText = await response.text();
    const result = JSON.parse(responseBodyText);
    return {
        ...result,
        httpStatusCode: response.status,
    };
}



// 创建订单
export async function createOrder(cart: any) {
    const accessToken = await generateAccessToken();
    const url = `${PAYPAL_DOMAIN}/v2/checkout/orders`;
    const payload = {
        intent: "CAPTURE",
        purchase_units: [{ amount: { currency_code: "USD", value: "0.01" } }],
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