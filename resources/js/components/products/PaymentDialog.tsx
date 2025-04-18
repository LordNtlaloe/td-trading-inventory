import { useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { usePos } from '@/contexts/CartContext';
import { MdPrint } from 'react-icons/md';
import { useState } from 'react';
import { saveReceiptPdf } from '@/components/products/ReceiptDialog';

interface PaymentDialogProps {
    open: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    branchId: number;
    cashierId: number;
    branchName: string;
    cashierName: string;
}

interface CartItem {
    id: number;
    product: {
        id: number;
        product_name: string;
        product_price: number;
        product_quantity: number;
    };
    quantity: number;
    discount?: number;
}

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
    };
    cashier: {
        name: string;
    };
}

export default function PaymentDialog({
    open,
    onClose,
    onSuccess,
    branchId,
    cashierId,
    branchName,
    cashierName
}: PaymentDialogProps) {
    const { cart, calculateTotals, clearCart } = usePos();
    const { subtotal, totalDiscount, total } = calculateTotals();
    const [error, setError] = useState('');

    const { post, processing, errors } = useForm({
        items: cart.map((item: CartItem) => ({
            product_id: item.product.id,
            quantity: item.quantity,
            price: item.product.product_price,
            discount: item.discount || 0,
        })),
        total: total,
        branch_id: branchId,
        cashier_id: cashierId,
    });

    const handleConfirmAndPrint = () => {
        setError('');

        post(route('orders.process-payment'), {
            preserveScroll: true,
            onSuccess: (page) => {
                if (page.props.order) {
                    const order = page.props.order as Order;
                    saveReceiptPdf({
                        order,
                        branchName: order.branch.name,
                        cashierName: order.cashier.name
                    });
                    clearCart();
                    onClose();
                    onSuccess?.();
                }
            },
            onError: (errors) => {
                console.error('Order processing errors:', errors);
                setError(
                    errors.error || 
                    'Failed to process order. Please check all fields and try again.'
                );
            }
        });
    };

    return (
        <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center ${open ? '' : 'hidden'}`}>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
                <h2 className="text-xl font-bold mb-4">Order Summary</h2>

                {/* Order Preview Section */}
                <div className="border rounded-lg p-4 mb-4">
                    <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">Branch:</span>
                        <span>{branchName}</span>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">Cashier:</span>
                        <span>{cashierName}</span>
                    </div>
                    <div className="flex justify-between items-center mb-4">
                        <span className="font-medium">Date:</span>
                        <span>{new Date().toLocaleString()}</span>
                    </div>

                    <div className="border-t pt-3">
                        <h3 className="font-medium mb-2">Items:</h3>
                        {cart.map((item) => (
                            <div key={item.id} className="flex justify-between mb-1">
                                <span>
                                    {item.product.product_name} × {item.quantity}
                                </span>
                                <span>M{(item.product.product_price * item.quantity).toFixed(2)}</span>
                            </div>
                        ))}
                    </div>

                    <div className="border-t pt-3">
                        <div className="flex justify-between mb-1">
                            <span>Subtotal:</span>
                            <span>M{subtotal.toFixed(2)}</span>
                        </div>
                        {totalDiscount > 0 && (
                            <div className="flex justify-between text-red-500 mb-1">
                                <span>Discount:</span>
                                <span>-M{totalDiscount.toFixed(2)}</span>
                            </div>
                        )}
                        <div className="flex justify-between font-bold mt-2">
                            <span>Total:</span>
                            <span>M{total.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                {/* Error Display */}
                {error && (
                    <div className="text-red-500 mb-4">
                        {error}
                    </div>
                )}

                {/* Form Errors */}
                {Object.keys(errors).length > 0 && (
                    <div className="text-red-500 mb-4">
                        {Object.values(errors).map((error, index) => (
                            <p key={index}>{error}</p>
                        ))}
                    </div>
                )}

                <div className="flex justify-end gap-2">
                    <Button 
                        variant="outline" 
                        onClick={onClose} 
                        disabled={processing}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleConfirmAndPrint}
                        disabled={processing}
                        className="flex items-center gap-2"
                    >
                        {processing ? 'Processing...' : (
                            <>
                                <MdPrint /> Confirm & Print
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}