import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Printer, CreditCard, Banknote, ArrowLeft, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Head, usePage, router } from '@inertiajs/react';
import POSLayout from '@/layouts/pos/pos-layout';
import { type BreadcrumbItem } from '@/types';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Types matching your existing code
interface CartItem {
    id: number;
    product: {
        id: number;
        product_name: string;
        product_price: number;
        product_quantity: number;
        product_category: string;
        product_commodity: string;
        product_grade: string;
    };
    quantity: number;
}

interface Receipt {
    id: string;
    date: Date;
    items: CartItem[];
    subtotal: number;
    discount: number;
    total: number;
    cashier: string;
    branch: string;
    paymentMethod: string;
    amountPaid: number;
    change: number;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'POS',
        href: '/pos',
    },
    {
        title: 'Payment',
        href: '/pos/payment',
    },
];

export default function ProcessPayment() {
    const [paymentMethod, setPaymentMethod] = useState<string>("cash");
    const [cashAmount, setCashAmount] = useState<string>("");
    const [change, setChange] = useState<number>(0);
    const [paymentError, setPaymentError] = useState<string>("");
    const [isProcessing, setIsProcessing] = useState(false);
    const [paymentComplete, setPaymentComplete] = useState(false);
    const [currentReceipt, setCurrentReceipt] = useState<Receipt | null>(null);

    // Get data from props
    const { order_data = null } = usePage<{ order_data?: any }>().props;
    const { auth } = usePage<{ auth: any }>().props;
    const { employee } = usePage<{ employee?: { branch_id: number, branch: { branch_name: string } } }>().props;

    useEffect(() => {
        // Redirect back to POS if no order data
        if (!order_data) {
            toast({
                title: "No order data",
                description: "No order data found. Redirecting to POS.",
                variant: "destructive"
            });
            router.visit('/pos');
            return;
        }

        // Set initial cash amount to total
        setCashAmount(order_data.total.toString());
    }, [order_data]);

    // Handle cash amount change
    const handleCashAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        
        // Only allow numeric input with up to 2 decimal places
        if (/^\d*\.?\d{0,2}$/.test(value) || value === "") {
            setCashAmount(value);
            
            // Calculate change
            const amount = parseFloat(value || "0");
            if (amount >= order_data.total) {
                setChange(amount - order_data.total);
                setPaymentError("");
            } else {
                setChange(0);
                setPaymentError("Insufficient amount");
            }
        }
    };

    // Process payment
    const processPayment = () => {
        setIsProcessing(true);
        
        // Validate payment
        if (paymentMethod === "cash") {
            const cashValue = parseFloat(cashAmount || "0");
            if (cashValue < order_data.total) {
                setPaymentError("Insufficient amount");
                setIsProcessing(false);
                return;
            }
        }
        
        // Create order data to send to server
        const paymentData = {
            ...order_data,
            payment_method: paymentMethod,
            amount_paid: paymentMethod === "cash" ? parseFloat(cashAmount) : order_data.total,
            change: paymentMethod === "cash" ? change : 0
        };

        // Create receipt data
        const receiptData: Receipt = {
            id: `REC-${Date.now().toString().slice(-6)}`,
            date: new Date(),
            items: order_data.items,
            subtotal: order_data.subtotal,
            discount: order_data.discount,
            total: order_data.total,
            cashier: auth.user.name,
            branch: employee?.branch.branch_name || 'Branch',
            paymentMethod: paymentMethod,
            amountPaid: paymentMethod === "cash" ? parseFloat(cashAmount) : order_data.total,
            change: paymentMethod === "cash" ? change : 0
        };

        // Send to server
        router.post('/pos/complete-payment', paymentData, {
            onSuccess: () => {
                setCurrentReceipt(receiptData);
                setPaymentComplete(true);
                setIsProcessing(false);
                
                toast({
                    title: "Payment Successful",
                    description: "The payment has been processed successfully.",
                });
            },
            onError: (errors) => {
                setIsProcessing(false);
                
                // Display specific error if available
                if (errors.message) {
                    setPaymentError(errors.message);
                } else {
                    toast({
                        title: "Error",
                        description: "There was an error processing your payment. Please try again.",
                        variant: "destructive"
                    });
                }
            }
        });
    };

    // Print receipt functionality
    const printReceipt = () => {
        if (!currentReceipt) return;
        
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const receiptContent = `
            <html>
            <head>
                <title>Receipt #${currentReceipt.id}</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
                    .receipt { width: 80mm; margin: 0 auto; }
                    .header { text-align: center; margin-bottom: 20px; }
                    .items { border-top: 1px dashed #000; border-bottom: 1px dashed #000; padding: 10px 0; }
                    .item { display: flex; justify-content: space-between; margin: 5px 0; }
                    .totals { margin-top: 10px; }
                    .total-line { display: flex; justify-content: space-between; }
                    .payment-info { margin-top: 10px; border-top: 1px dashed #000; padding-top: 10px; }
                    .footer { text-align: center; margin-top: 20px; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="receipt">
                    <div class="header">
                        <h2>RECEIPT</h2>
                        <p>Branch: ${currentReceipt.branch}</p>
                        <p>Date: ${currentReceipt.date.toLocaleString()}</p>
                        <p>Receipt #: ${currentReceipt.id}</p>
                        <p>Cashier: ${currentReceipt.cashier}</p>
                    </div>
                    <div class="items">
                        ${currentReceipt.items.map(item => `
                            <div class="item">
                                <span>${item.quantity} x ${item.product.product_name}</span>
                                <span>M${(item.product.product_price * item.quantity).toFixed(2)}</span>
                            </div>
                        `).join('')}
                    </div>
                    <div class="totals">
                        <div class="total-line">
                            <span>Subtotal:</span>
                            <span>M${currentReceipt.subtotal.toFixed(2)}</span>
                        </div>
                        ${currentReceipt.discount > 0 ? `
                            <div class="total-line">
                                <span>Discount:</span>
                                <span>-M${currentReceipt.discount.toFixed(2)}</span>
                            </div>
                        ` : ''}
                        <div class="total-line" style="font-weight: bold; margin-top: 5px;">
                            <span>TOTAL:</span>
                            <span>M${currentReceipt.total.toFixed(2)}</span>
                        </div>
                    </div>
                    <div class="payment-info">
                        <div class="total-line">
                            <span>Payment Method:</span>
                            <span>${currentReceipt.paymentMethod === 'cash' ? 'Cash' : 'Card'}</span>
                        </div>
                        ${currentReceipt.paymentMethod === 'cash' ? `
                            <div class="total-line">
                                <span>Amount Paid:</span>
                                <span>M${currentReceipt.amountPaid.toFixed(2)}</span>
                            </div>
                            <div class="total-line">
                                <span>Change:</span>
                                <span>M${currentReceipt.change.toFixed(2)}</span>
                            </div>
                        ` : ''}
                    </div>
                    <div class="footer">
                        <p>Thank you for your purchase!</p>
                    </div>
                </div>
                <script>
                    window.onload = function() { window.print(); }
                </script>
            </body>
            </html>
        `;
        
        printWindow.document.open();
        printWindow.document.write(receiptContent);
        printWindow.document.close();
    };

    // Return to POS page
    const returnToPOS = () => {
        router.visit('/pos');
    };

    if (!order_data) {
        return (
            <POSLayout breadcrumbs={breadcrumbs}>
                <Head title="Payment Processing" />
                <div className="container mx-auto px-5 py-10">
                    <Card>
                        <CardContent className="p-6 flex flex-col items-center justify-center">
                            <p>No order data found. Please return to POS.</p>
                            <Button className="mt-4" onClick={returnToPOS}>Return to POS</Button>
                        </CardContent>
                    </Card>
                </div>
            </POSLayout>
        );
    }

    return (
        <POSLayout breadcrumbs={breadcrumbs}>
            <Head title={paymentComplete ? "Payment Complete" : "Payment Processing"} />
            <div className="container mx-auto px-5 py-10">
                <Card className="max-w-2xl mx-auto">
                    <CardHeader>
                        <CardTitle>{paymentComplete ? "Payment Complete" : "Payment Processing"}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        {!paymentComplete ? (
                            <div className="space-y-6">
                                {/* Order Summary */}
                                <div>
                                    <h3 className="text-lg font-medium mb-2">Order Summary</h3>
                                    <div className="space-y-2 max-h-40 overflow-y-auto">
                                        {order_data.items.map((item: CartItem, index: number) => (
                                            <div key={index} className="flex justify-between items-center">
                                                <div>
                                                    <Badge variant="outline" className="mr-2">{item.quantity}</Badge>
                                                    <span>{item.product.product_name}</span>
                                                </div>
                                                <span>M{(item.product.product_price * item.quantity).toFixed(2)}</span>
                                            </div>
                                        ))}
                                    </div>
                                    
                                    <Separator className="my-4" />
                                    
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <span>Subtotal:</span>
                                            <span>M{order_data.subtotal.toFixed(2)}</span>
                                        </div>
                                        {order_data.discount > 0 && (
                                            <div className="flex justify-between text-red-500">
                                                <span>Discount:</span>
                                                <span>-M{order_data.discount.toFixed(2)}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between font-bold text-lg">
                                            <span>Total:</span>
                                            <span>M{order_data.total.toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <Separator />
                                
                                {/* Payment Method */}
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="payment-method">Payment Method</Label>
                                        <Select
                                            value={paymentMethod}
                                            onValueChange={setPaymentMethod}
                                        >
                                            <SelectTrigger id="payment-method">
                                                <SelectValue placeholder="Select payment method" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="cash">
                                                    <div className="flex items-center">
                                                        <Banknote className="mr-2 h-4 w-4" />
                                                        <span>Cash</span>
                                                    </div>
                                                </SelectItem>
                                                <SelectItem value="card">
                                                    <div className="flex items-center">
                                                        <CreditCard className="mr-2 h-4 w-4" />
                                                        <span>Card</span>
                                                    </div>
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    
                                    {paymentMethod === "cash" && (
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="cash-amount">Cash Amount</Label>
                                                <Input
                                                    id="cash-amount"
                                                    type="text"
                                                    value={cashAmount}
                                                    onChange={handleCashAmountChange}
                                                    placeholder="Enter cash amount"
                                                />
                                            </div>
                                            
                                            {change > 0 && (
                                                <div className="p-4 bg-gray-100 rounded-md">
                                                    <div className="font-bold">
                                                        Change: M{change.toFixed(2)}
                                                    </div>
                                                </div>
                                            )}
                                            
                                            {paymentError && (
                                                <div className="text-red-500 text-sm">
                                                    {paymentError}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                                
                                {/* Action Buttons */}
                                <div className="flex justify-between pt-4">
                                    <Button 
                                        variant="outline" 
                                        onClick={returnToPOS}
                                        disabled={isProcessing}
                                    >
                                        <ArrowLeft className="mr-2 h-4 w-4" />
                                        Return to POS
                                    </Button>
                                    <Button 
                                        variant="default" 
                                        onClick={processPayment} 
                                        disabled={isProcessing || (paymentMethod === "cash" && parseFloat(cashAmount || "0") < order_data.total)}
                                    >
                                        {isProcessing ? "Processing..." : "Confirm Payment"}
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="flex flex-col items-center justify-center text-center">
                                    <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
                                    <h3 className="text-2xl font-bold">Payment Successful</h3>
                                    <p className="text-gray-500 mt-2">Your transaction has been completed</p>
                                </div>
                                
                                <Separator />
                                
                                {/* Receipt Details */}
                                {currentReceipt && (
                                    <div className="space-y-4">
                                        <div className="text-center">
                                            <p className="text-gray-500">Receipt #{currentReceipt.id}</p>
                                            <p className="text-gray-500">Date: {currentReceipt.date.toLocaleString()}</p>
                                        </div>
                                        
                                        <div className="space-y-2 max-h-40 overflow-y-auto">
                                            {currentReceipt.items.map((item, index) => (
                                                <div key={index} className="flex justify-between">
                                                    <span>{item.quantity} x {item.product.product_name}</span>
                                                    <span>M{(item.product.product_price * item.quantity).toFixed(2)}</span>
                                                </div>
                                            ))}
                                        </div>
                                        
                                        <Separator />
                                        
                                        <div className="space-y-1">
                                            <div className="flex justify-between">
                                                <span>Subtotal:</span>
                                                <span>M{currentReceipt.subtotal.toFixed(2)}</span>
                                            </div>
                                            {currentReceipt.discount > 0 && (
                                                <div className="flex justify-between text-red-500">
                                                    <span>Discount:</span>
                                                    <span>-M{currentReceipt.discount.toFixed(2)}</span>
                                                </div>
                                            )}
                                            <div className="flex justify-between font-bold">
                                                <span>Total:</span>
                                                <span>M{currentReceipt.total.toFixed(2)}</span>
                                            </div>
                                        </div>
                                        
                                        <Separator />
                                        
                                        <div className="space-y-1">
                                            <div className="flex justify-between">
                                                <span>Payment Method:</span>
                                                <span>{currentReceipt.paymentMethod === 'cash' ? 'Cash' : 'Card'}</span>
                                            </div>
                                            {currentReceipt.paymentMethod === 'cash' && (
                                                <>
                                                    <div className="flex justify-between">
                                                        <span>Amount Paid:</span>
                                                        <span>M{currentReceipt.amountPaid.toFixed(2)}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span>Change:</span>
                                                        <span>M{currentReceipt.change.toFixed(2)}</span>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                )}
                                
                                {/* Action Buttons */}
                                <div className="flex justify-between pt-4">
                                    <Button 
                                        variant="outline" 
                                        onClick={returnToPOS}
                                    >
                                        <ArrowLeft className="mr-2 h-4 w-4" />
                                        Return to POS
                                    </Button>
                                    <Button 
                                        variant="default" 
                                        onClick={printReceipt}
                                    >
                                        <Printer className="mr-2 h-4 w-4" />
                                        Print Receipt
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </POSLayout>
    );
}