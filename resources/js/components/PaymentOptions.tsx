import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PaymentMethod } from "@/types";
import { CreditCard, DollarSign, Check, Receipt } from "lucide-react";
import { toast } from "sonner";

interface PaymentOptionsProps {
    total: number;
    cashlessCredit: number;
    onPaymentComplete: (method: PaymentMethod) => void;
    onPrintReceipt: () => void;
}

const PaymentOptions = ({ total, cashlessCredit, onPaymentComplete, onPrintReceipt }: PaymentOptionsProps) => {
    const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
    const [showReceipt, setShowReceipt] = useState(false);

    const handlePayment = () => {
        if (!selectedMethod) {
            toast.error("Please select a payment method");
            return;
        }

        toast.success(`Payment of M${total.toFixed(2)} processed successfully with ${formatPaymentMethod(selectedMethod)}`);
        onPaymentComplete(selectedMethod);
        setShowReceipt(true);
    };

    const formatPaymentMethod = (method: PaymentMethod): string => {
        switch (method) {
            case "cash": return "Cash";
            case "credit_card": return "Credit Card";
            case "cashless_credit": return "Cashless Credit";
            default: return "Unknown Method";
        }
    };

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-bold">Payment Method</h2>

            <div className="grid grid-cols-3 gap-3">
                <Button
                    variant={selectedMethod === "cash" ? "default" : "outline"}
                    className={`flex flex-col items-center py-4 ${selectedMethod === "cash" ? "bg-orange-500 hover:bg-orange-600 text-white" : ""}`}
                    onClick={() => setSelectedMethod("cash")}
                >
                    <DollarSign className="h-6 w-6 mb-2" />
                    <span>Cash</span>
                </Button>

                <Button
                    variant={selectedMethod === "credit_card" ? "default" : "outline"}
                    className={`flex flex-col items-center py-4 ${selectedMethod === "credit_card" ? "bg-orange-500 hover:bg-orange-600 text-white" : ""}`}
                    onClick={() => setSelectedMethod("credit_card")}
                >
                    <CreditCard className="h-6 w-6 mb-2" />
                    <span>Credit Card</span>
                </Button>

                <Button
                    variant={selectedMethod === "cashless_credit" ? "default" : "outline"}
                    className={`flex flex-col items-center py-4 ${selectedMethod === "cashless_credit" ? "bg-orange-500 hover:bg-orange-600 text-white" : ""}`}
                    onClick={() => setSelectedMethod("cashless_credit")}
                    disabled={total > cashlessCredit}
                >
                    <Check className="h-6 w-6 mb-2" />
                    <span>Cashless Credit</span>
                    <span className="text-xs mt-1">M{cashlessCredit.toFixed(2)}</span>
                </Button>
            </div>

            <Button
                className="w-full bg-orange-500 hover:bg-orange-600 py-4 text-lg"
                onClick={handlePayment}
                disabled={!selectedMethod}
            >
                Pay M{total.toFixed(2)}
            </Button>

            {showReceipt && (
                <Button
                    variant="outline"
                    className="w-full flex items-center justify-center gap-2 mt-4"
                    onClick={() => {
                        onPrintReceipt();
                        toast.success("Receipt printed successfully!");
                    }}
                >
                    <Receipt className="h-5 w-5" />
                    Print Receipt
                </Button>
            )}
        </div>
    );
};

export default PaymentOptions;