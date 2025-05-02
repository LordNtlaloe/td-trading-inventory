import { OrderItem, PaymentMethod } from "@/types";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import Image from "./Image";
import { useState } from "react";
import PaymentOptions from "./PaymentOptions";
import Receipt from "./Receipt";
import { toast } from "sonner";

interface OrderSummaryProps {
    orderItems: OrderItem[];
    updateItemQuantity: (id: number, quantity: number) => void;
    clearOrder: () => void;
}

const OrderSummary = ({ orderItems, updateItemQuantity, clearOrder }: OrderSummaryProps) => {
    const [orderProcessing, setOrderProcessing] = useState(false);
    const [orderCompleted, setOrderCompleted] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
    const [showReceipt, setShowReceipt] = useState(false);
    const [orderDate, setOrderDate] = useState(new Date());

    // Calculate order summary
    const subtotal = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discount = 5.00;
    const salesTax = subtotal > 0 ? 2.25 : 0;
    const total = subtotal - discount + salesTax;
    const cashlessCredit = 32.50;
    const balanceDue = total - cashlessCredit > 0 ? (total - cashlessCredit).toFixed(2) : "0.00";

    const handlePaymentComplete = (method: PaymentMethod) => {
        setPaymentMethod(method);
        setOrderCompleted(true);
        setOrderDate(new Date());
    };

    const handlePrintReceipt = () => {
        setShowReceipt(true);
    };

    const handleNewOrder = () => {
        setOrderProcessing(false);
        setOrderCompleted(false);
        setPaymentMethod(null);
        clearOrder();
        toast.success("Ready for a new order!");
    };

    if (orderCompleted && paymentMethod) {
        return (
            <div className="rounded-lg p-6 h-full flex flex-col">
                <div className="text-center py-8 flex-grow flex flex-col justify-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold mb-2">Order Complete!</h2>
                    <p className="text-gray-600 mb-6">Your payment has been processed successfully.</p>

                    <div className="flex justify-center space-x-3">
                        <Button variant="outline" onClick={handlePrintReceipt}>
                            Print Receipt
                        </Button>
                        <Button onClick={handleNewOrder} className="">
                            New Order
                        </Button>
                    </div>
                </div>

                {showReceipt && paymentMethod && (
                    <Receipt
                        orderItems={orderItems}
                        subtotal={subtotal}
                        discount={discount}
                        salesTax={salesTax}
                        total={total}
                        paymentMethod={paymentMethod}
                        orderDate={orderDate}
                        onClose={() => setShowReceipt(false)}
                    />
                )}
            </div>
        );
    }

    if (orderProcessing) {
        return (
            <div className="rounded-lg p-6 h-full flex flex-col">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold">Complete Order</h2>
                    <Button variant="ghost" size="sm" onClick={() => setOrderProcessing(false)}>
                        Back to Order
                    </Button>
                </div>

                <div className="border-b pb-4 mb-4">
                    <h3 className="font-semibold mb-2">Order Summary</h3>
                    {orderItems.map((item) => (
                        <div key={`${item.id}-${item.name}`} className="flex justify-between text-sm py-1">
                            <span>{item.quantity}x {item.name}</span>
                            <span>M{(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                    ))}
                </div>

                <div className="border-b pb-4 mb-6">
                    <div className="flex justify-between py-1">
                        <span>Subtotal</span>
                        <span>M{subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between py-1 text-green-600">
                        <span>Discounts</span>
                        <span>- M{discount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between py-1">
                        <span>Sales Tax</span>
                        <span>M{salesTax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between pt-2 font-bold">
                        <span>Total</span>
                        <span>M{total.toFixed(2)}</span>
                    </div>
                </div>

                <PaymentOptions
                    total={total}
                    cashlessCredit={cashlessCredit}
                    onPaymentComplete={handlePaymentComplete}
                    onPrintReceipt={handlePrintReceipt}
                />
            </div>
        );
    }

    return (
        <div className="rounded-lg p-6 h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Current Order</h2>
                <div className="flex space-x-2">
                    <Button
                        variant="secondary"
                        size="sm"
                        className="bg-rose-100 hover:bg-rose-200 text-rose-500"
                        onClick={clearOrder}
                    >
                        Clear All
                    </Button>
                    <Button variant="outline" size="sm" className="p-2">
                        <Settings className="h-5 w-5" />
                    </Button>
                </div>
            </div>

            {/* Order items */}
            <div className="space-y-4 mb-6 max-h-[50vh] overflow-y-auto pr-2 border-b pb-4">
                {orderItems.map((item) => (
                    <div key={`${item.id}-${item.name}`} className="flex items-center justify-between">
                        <div className="flex items-center">
                            <div className="h-12 w-12 rounded overflow-hidden mr-3">
                                <Image src={item.image} className="w-full h-full object-cover" />
                            </div>
                            <div>
                                <h4 className="font-medium">{item.name}</h4>
                                <p className="text-sm text-gray-500">{item.category || 'N/A'}</p>
                            </div>
                        </div>

                        <div className="flex items-center">
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 rounded-md"
                                onClick={() => updateItemQuantity(item.id, item.quantity - 1)}
                            >
                                —
                            </Button>
                            <span className="w-8 text-center">{item.quantity}</span>
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 rounded-md"
                                onClick={() => updateItemQuantity(item.id, item.quantity + 1)}
                            >
                                +
                            </Button>
                            <span className="ml-4 font-medium w-16 text-right">M{(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                    </div>
                ))}

                {orderItems.length === 0 && (
                    <div className="text-center py-10 text-gray-500">
                        <p>No items in your order yet</p>
                        <p className="text-sm mt-2">Add items from the menu to start your order</p>
                    </div>
                )}
            </div>

            {/* Order summary */}
            {orderItems.length > 0 && (
                <>
                    <div className="border-t pt-4 space-y-3">
                        <div className="flex justify-between">
                            <span>Subtotal</span>
                            <span className="font-medium">M{subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-green-600">
                            <span>Discounts</span>
                            <span>- M{discount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Sales Tax</span>
                            <span>M{salesTax.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t font-bold text-lg">
                            <span>Total</span>
                            <span>M{total.toFixed(2)}</span>
                        </div>
                    </div>

                    {/* Payment section */}
                    <div className="mt-8 bg-gray-100 rounded-lg p-4">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="uppercase text-xs font-medium text-amber-500">CASHLESS CREDIT</p>
                                <p className="text-2xl font-bold text-amber-500">M{cashlessCredit.toFixed(2)}</p>
                                <p className="text-xs text-gray-500">Available</p>
                            </div>
                            <Button variant="outline" size="sm" className="text-gray-500">Cancel</Button>
                        </div>
                    </div>

                    {/* Payment button */}
                    <div className="mt-4">
                        <Button
                            className="w-full bg-orange-500 hover:bg-orange-600 py-4 text-lg"
                            onClick={() => setOrderProcessing(true)}
                        >
                            Complete Order
                        </Button>
                        <div className="flex justify-between mt-2 text-sm">
                            <span>Balance Due</span>
                            <span className="font-medium">M{balanceDue}</span>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default OrderSummary;