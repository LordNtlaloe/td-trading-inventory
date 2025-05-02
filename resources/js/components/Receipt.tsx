import { OrderItem, PaymentMethod } from "@/types";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import { forwardRef } from "react";

interface ReceiptProps {
    orderItems: OrderItem[];
    subtotal: number;
    discount: number;
    salesTax: number;
    total: number;
    paymentMethod: PaymentMethod;
    orderDate: Date;
    onClose: () => void;
}

const Receipt = forwardRef<HTMLDivElement, ReceiptProps>(({
    orderItems,
    subtotal,
    discount,
    salesTax,
    total,
    paymentMethod,
    orderDate,
    onClose
}, ref) => {
    const formatPaymentMethod = (method: PaymentMethod): string => {
        switch (method) {
            case "cash": return "Cash";
            case "credit_card": return "Credit Card";
            case "cashless_credit": return "Cashless Credit";
            default: return "Unknown";
        }
    };

    const printReceipt = () => {
        const printWindow = window.open('', '', 'height=600,width=800');
        if (!printWindow) return;

        printWindow.document.write(`
            <html>
                <head>
                    <title>Order Receipt</title>
                    <style>
                        body { font-family: Arial, sans-serif; padding: 20px; }
                        h1, h2 { text-align: center; }
                        table { width: 100%; border-collapse: collapse; }
                        th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
                        .total { font-weight: bold; }
                        .footer { margin-top: 30px; text-align: center; font-size: 14px; }
                    </style>
                </head>
                <body>
                    <h2>BBQ Restaurant</h2>
                    <p>Order Receipt</p>
                    <p>Date: ${orderDate.toLocaleString()}</p>
                    <table>
                        <tr><th>Item</th><th>Qty</th><th>Price</th></tr>
                        ${orderItems.map(item => `
                            <tr>
                                <td>${item.name}</td>
                                <td>${item.quantity}x</td>
                                <td>M${(item.price * item.quantity).toFixed(2)}</td>
                            </tr>
                        `).join('')}
                        <tr><td colspan="2">Subtotal</td><td>M${subtotal.toFixed(2)}</td></tr>
                        <tr><td colspan="2">Discount</td><td>-M${discount.toFixed(2)}</td></tr>
                        <tr><td colspan="2">Tax</td><td>M${salesTax.toFixed(2)}</td></tr>
                        <tr class="total"><td colspan="2">Total</td><td>M${total.toFixed(2)}</td></tr>
                        <tr><td colspan="2">Payment Method</td><td>${formatPaymentMethod(paymentMethod)}</td></tr>
                    </table>
                    <div class="footer">
                        <p>Thank you for your order!</p>
                        <p>Come again soon!</p>
                    </div>
                </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        printWindow.close();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6" ref={ref}>
                    <h2 className="text-2xl font-bold text-center mb-2">BBQ Restaurant</h2>
                    <p className="text-gray-500 text-center mb-6">Order Receipt</p>
                    <p className="text-gray-500 text-sm mb-4">
                        Date: {orderDate.toLocaleString()}
                    </p>

                    <div className="border rounded-lg overflow-hidden mb-4">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-2 text-left">Item</th>
                                    <th className="px-4 py-2 text-right">Qty</th>
                                    <th className="px-4 py-2 text-right">Price</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orderItems.map((item, index) => (
                                    <tr key={`${item.id}-${index}`} className="border-t">
                                        <td className="px-4 py-2">{item.name}</td>
                                        <td className="px-4 py-2 text-right">{item.quantity}x</td>
                                        <td className="px-4 py-2 text-right">M{(item.price * item.quantity).toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-gray-50">
                                <tr className="border-t">
                                    <td className="px-4 py-2 font-medium" colSpan={2}>Subtotal</td>
                                    <td className="px-4 py-2 text-right">M{subtotal.toFixed(2)}</td>
                                </tr>
                                <tr>
                                    <td className="px-4 py-2 font-medium" colSpan={2}>Discount</td>
                                    <td className="px-4 py-2 text-right text-green-600">-M{discount.toFixed(2)}</td>
                                </tr>
                                <tr>
                                    <td className="px-4 py-2 font-medium" colSpan={2}>Tax</td>
                                    <td className="px-4 py-2 text-right">M{salesTax.toFixed(2)}</td>
                                </tr>
                                <tr className="border-t font-bold">
                                    <td className="px-4 py-2" colSpan={2}>Total</td>
                                    <td className="px-4 py-2 text-right">M{total.toFixed(2)}</td>
                                </tr>
                                <tr>
                                    <td className="px-4 py-2" colSpan={2}>Payment Method</td>
                                    <td className="px-4 py-2 text-right">{formatPaymentMethod(paymentMethod)}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    <div className="mt-8 text-center text-gray-500 text-sm">
                        <p>Thank you for your order!</p>
                        <p>Come again soon!</p>
                    </div>
                </div>

                <div className="border-t p-4 flex space-x-3 justify-end">
                    <Button variant="outline" onClick={onClose}>
                        Close
                    </Button>
                    <Button onClick={printReceipt} className="bg-orange-500 hover:bg-orange-600">
                        <Printer className="h-4 w-4 mr-2" />
                        Print
                    </Button>
                </div>
            </div>
        </div>
    );
});

Receipt.displayName = "Receipt";

export default Receipt;