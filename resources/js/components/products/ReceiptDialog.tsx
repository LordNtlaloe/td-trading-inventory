import { usePos } from '@/contexts/CartContext';
import React, { useCallback, useEffect, useState } from 'react';
import { Printer,  Br, Cut, Line, Row, Text, } from 'react-thermal-printer';

interface OrderItem {
    product_id: number;
    quantity: number;
    price: number;
    discount: number;
    subtotal: number;
    product: {
        product_name: string;
    };
}

interface Order {
    id: number;
    total_amount: number;
    order_date: string;
    items: OrderItem[];
    branch: {
        name: string;
        location: string;
    };
    cashier: {
        name: string;
    };
    payment_method: string;
    payment_reference: string;
    amount_received: number;
    change_amount: number;
}


interface ReceiptProps {
    order: Order;
    branchName: string;
    cashierName: string;
    onPrintComplete?: () => void;
}

export const ReceiptDialog: React.FC<ReceiptProps> = ({ order }) => {
    const { cart, calculateTotals } = usePos();
    const { subtotal, totalDiscount, total } = calculateTotals();
    const [paymentMethod, setPaymentMethod] = useState('');
    const [amountReceived, setAmountReceived] = useState(total.toString());
    const [changeAmount, setChangeAmount] = useState('0.00');
    const [paymentReference, setPaymentReference] = useState('');

    useEffect(() => {
        setAmountReceived(total.toString());
    }, [total]);

    const calculateChange = useCallback(() => {
        const received = parseFloat(amountReceived) || 0;
        const change = received - total;
        setChangeAmount(change > 0 ? change.toFixed(2) : '0.00');
    }, [amountReceived, total]);

    useEffect(() => {
        calculateChange();
    }, [amountReceived, total, calculateChange]);
    
    return (
        <div className="hidden">
            <Printer width={48} debug={true} type={'epson'}>
                <div className="p-4 bg-white text-black w-[80mm]">
                    <img src="./images/TD-Logo.png" alt="logo" className="mx-auto w-16 py-4" />
                    <Row className="flex flex-col justify-center items-center gap-2">
                        <Text className="font-semibold">{order?.branch?.name}</Text>
                        <Text className="text-xs text-center">{order?.branch?.location}</Text>
                    </Row>
                    <div className="flex flex-col gap-3 border-b py-6 text-xs">
                        <p className="flex justify-between">
                            <span className="text-gray-400">Cashier:</span>
                            <span>{order?.cashier?.name}</span>
                        </p>
                        <p className="flex justify-between">
                            <span className="text-gray-400">Date:</span>
                            <span>
                                {order
                                    ? new Date(order.order_date).toLocaleString()
                                    : new Date().toLocaleString()}
                            </span>
                        </p>
                        {order && (
                            <p className="flex justify-between">
                                <span className="text-gray-400">Order #:</span>
                                <span>{order.id}</span>
                            </p>
                        )}
                        <p className="flex justify-between">
                            <span className="text-gray-400">Payment:</span>
                            <span>{paymentMethod.charAt(0).toUpperCase() + paymentMethod.slice(1)}</span>
                        </p>
                        {paymentMethod === 'cash' && (
                            <>
                                <p className="flex justify-between">
                                    <span className="text-gray-400">Amount Received:</span>
                                    <span>M{parseFloat(amountReceived).toFixed(2)}</span>
                                </p>
                                <p className="flex justify-between">
                                    <span className="text-gray-400">Change:</span>
                                    <span>M{parseFloat(changeAmount).toFixed(2)}</span>
                                </p>
                            </>
                        )}
                        {(paymentMethod === 'card' || paymentMethod === 'mobile') && paymentReference && (
                            <p className="flex justify-between">
                                <span className="text-gray-400">Reference:</span>
                                <span>{paymentReference}</span>
                            </p>
                        )}
                    </div>
                    <div className="flex flex-col gap-3 pb-6 pt-2 text-xs">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="flex">
                                    <th className="w-full py-2">Product</th>
                                    <th className="min-w-[44px] py-2">QTY</th>
                                    <th className="min-w-[44px] py-2">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {order
                                    ? order.items.map((item) => (
                                        <tr key={item.product_id} className="flex py-1">
                                            <td className="flex-1">{item.product.product_name}</td>
                                            <td className="min-w-[44px]">{item.quantity}</td>
                                            <td className="min-w-[44px]">M{item.subtotal.toFixed(2)}</td>
                                        </tr>
                                    ))
                                    : cart.map((item) => (
                                        <tr key={item.id} className="flex py-1">
                                            <td className="flex-1">{item.product.product_name}</td>
                                            <td className="min-w-[44px]">{item.quantity}</td>
                                            <td className="min-w-[44px]">M{(item.product.product_price * item.quantity).toFixed(2)}</td>
                                        </tr>
                                    ))
                                }
                            </tbody>
                        </table>
                        <div className="border-b border border-dashed"></div>
                        <div className="flex flex-col gap-1 pt-4 text-sm">
                            <div className="flex justify-between">
                                <span>Subtotal:</span>
                                <span>
                                    {order
                                        ? `M${order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)}`
                                        : `M${subtotal.toFixed(2)}`
                                    }
                                </span>
                            </div>
                            {(order
                                ? order.items.some(item => item.discount > 0)
                                : totalDiscount > 0
                            ) && (
                                    <div className="flex justify-between text-red-500">
                                        <span>Discount:</span>
                                        <span>
                                            {order
                                                ? `-M${order.items.reduce((sum, item) => sum + item.discount, 0).toFixed(2)}`
                                                : `-M${totalDiscount.toFixed(2)}`
                                            }
                                        </span>
                                    </div>
                                )}
                            <div className="flex justify-between font-bold">
                                <span>Total:</span>
                                <span>
                                    {order
                                        ? `M${order.total_amount.toFixed(2)}`
                                        : `M${total.toFixed(2)}`
                                    }
                                </span>
                            </div>
                        </div>
                        <div className="pt-8 text-center text-xs">
                            <p>Thank you for your purchase!</p>
                            <p className="mt-2">Please come again</p>
                        </div>
                    </div>
                </div>
            </Printer>
        </div>
    );
};
