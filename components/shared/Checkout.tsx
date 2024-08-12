"use client";

import React, { useState } from "react";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";

function Message({ content }: { content:React.ReactNode}) {
  return <p>{content}</p>;
}

const initialOptions = {
  "clientId": "AU2Uy3kFsTu4mWmVkayVAnicpyhx8tuzAR_BoxEXjVbJfwkkLRBS9HqpGstRC4GQJi1rOd-HoS92IEfn", // 使用环境变量
  "enableFunding": "venmo",
  country: "US",
  currency: "USD",
  components: "buttons",
  "dataPageType": "product",
  "dataSdkIntegrationSource": "create-react-app"
};

const Checkout = () => {
  const [message, setMessage] = useState("");

  // PayPal 按钮的创建订单函数
  const createOrder = async () => {
    try {
      const response = await fetch('/api/paypal/createOrder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        // 这里可以包含购物车数据等
        body: JSON.stringify({
            cart: [
                {id: "MY_PRODUCT_ID", quantity: 1}
            ]
        })
      });
      const data = await response.json();
      if (response.ok) {
        return data.orderID;
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('Error creating order:', error);
      setMessage(`Error creating order: ${error}`);
      return null;
    }
  };

  interface OnApproveData { orderID: string; }
  interface OnApproveActions { restart: () => void; }

  // PayPal 按钮的订单批准处理函数
  const onApprove = async (data: OnApproveData, actions: OnApproveActions) => {
    const { orderID } = data;
    if (!orderID) {
      setMessage('Order ID is missing');
      return;
    }
    try {
      const response = await fetch(`/api/paypal/captureOrder`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ orderID })
      });
      const captureData = await response.json();
      // 检查捕获订单的响应
      if (captureData.error) {
        throw new Error(captureData.error);
      }
      setMessage(`Transaction completed successfully: ${captureData.status}`);
    } catch (error) {
      console.error('Error in onApprove:', error);
      // if (error.message === 'INSTRUMENT_DECLINED') {
      //   // 调用 PayPal 重启支付流程
      //   return actions.restart();
      // }
      setMessage(`Transaction failed: ${error}`);
    }
  };

  return (
    <div className="App">
      <PayPalScriptProvider options={initialOptions}>
        <PayPalButtons
          createOrder={createOrder}
          onApprove={onApprove}
          style={{
            shape: "rect",
            layout: "vertical",
            color: "gold",
            label: "paypal",
          }}
        />
      </PayPalScriptProvider>
      <Message content={message} />
    </div>
  );
};

export default Checkout;