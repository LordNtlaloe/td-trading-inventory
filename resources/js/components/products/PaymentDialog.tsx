/* eslint-disable @typescript-eslint/no-explicit-any */
import { router, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { usePos } from '@/contexts/CartContext';
import { MdFileDownload } from 'react-icons/md';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useReactToPrint } from "react-to-print";
import { Receipt } from '@/lib/types';

interface PaymentDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: (receiptData: Receipt) => void;
  branchId: number;
  cashierId: number;
  branchName: string;
  branchLocation: string;
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

export default function PaymentDialog({
  open,
  onClose,
  onSuccess,
  branchId,
  cashierId,
  branchName,
  branchLocation,
  cashierName
}: PaymentDialogProps) {
  const { cart, calculateTotals, clearCart } = usePos();
  const { subtotal, totalDiscount, total } = calculateTotals();
  const [error, setError] = useState('');
  const [orderData, setOrderData] = useState<Order | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [amountReceived, setAmountReceived] = useState(total.toString());
  const [changeAmount, setChangeAmount] = useState('0.00');
  const [paymentReference, setPaymentReference] = useState('');

  const contentRef = useRef<HTMLDivElement>(null);
  const reactToPrintFn = useReactToPrint({
    contentRef
  });

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

  const { post, processing, errors, setData } = useForm({
    items: [],
    total_amount: 0,
    branch_id: branchId,
    cashier_id: cashierId,
    payment_method: '',
    amount_received: 0,
    change_amount: 0,
    payment_reference: ''
  });

  useEffect(() => {
    const formattedItems = cart.map((item: CartItem) => ({
      product_id: item.product.id,
      quantity: item.quantity,
      price: item.product.product_price,
      discount: item.discount || 0,
      subtotal: (item.product.product_price * item.quantity) - (item.discount || 0)
    }));

    setData({
      items: formattedItems,
      total_amount: total,
      branch_id: branchId,
      cashier_id: cashierId,
      payment_method: paymentMethod,
      amount_received: parseFloat(amountReceived) || total,
      change_amount: parseFloat(changeAmount) || 0,
      payment_reference: paymentReference
    });
  }, [cart, total, paymentMethod, amountReceived, changeAmount, paymentReference, setData, branchId, cashierId]);

  const handleConfirmPayment = () => {
    setError('');

    if (cart.length === 0) {
      setError('Cart is empty');
      return;
    }

    if (!paymentMethod) {
      setError('Payment method is required');
      return;
    }

    if (paymentMethod === 'cash' && (!amountReceived || parseFloat(amountReceived) < total)) {
      setError('Amount received must be at least equal to the total');
      return;
    }

    if ((paymentMethod === 'card' || paymentMethod === 'mobile') && !paymentReference) {
      setError('Reference number is required for card or mobile payments');
      return;
    }

    post(route('orders.process-payment'), {
      preserveScroll: true,
      onSuccess: (page: any) => {
        if (page.props.order) {
          const order = page.props.order;
          console.log(order);
          setOrderData(order);
          clearCart();
          if (onSuccess) onSuccess(order as unknown as Receipt);
          onClose();

          setTimeout(() => {
            reactToPrintFn();
            router.visit(route('pos'));
          }, 500);
        }
        clearCart();
      },
      onError: (errors: any) => {
        setError(
          errors.error ||
          'Failed to process order. Please check all fields and try again.'
        );
      }
    });
    onClose();
    reactToPrintFn();
  };

  const handlePaymentMethodChange = (method: string) => {
    console.log('Changing payment method to:', method);
    setPaymentMethod(method);
    setData('payment_method', method);
  };

  return (
    <div>
      <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${open ? '' : 'hidden'}`}>
        <div className="w-80 bg-[#1D1D1D] rounded px-6 pt-8 shadow-lg">
          <div className="">

          </div>
          <img src="./images/TD-Logo.png" alt="logo" className="mx-auto w-16 py-4" />
          <div className="flex flex-col justify-center items-center gap-2">
            <h4 className="font-semibold">{branchName}</h4>
            <p className="text-xs">{branchLocation}</p>
          </div>
          <div className="flex flex-col gap-3 border-b py-6 text-xs">
            <p className="flex justify-between">
              <span className="text-gray-400">Cashier:</span>
              <span>{cashierName}</span>
            </p>
            <p className="flex justify-between">
              <span className="text-gray-400">Date:</span>
              <span>{new Date().toLocaleString()}</span>
            </p>
          </div>
          <div className="flex flex-col gap-3 py-2 text-xs">
            <table className="w-full text-left">
              <thead>
                <tr className="flex">
                  <th className="w-full py-2">Product</th>
                  <th className="min-w-[44px] py-2">QTY</th>
                  <th className="min-w-[44px] py-2">Total</th>
                </tr>
              </thead>
              <tbody>
                {cart.map((item) => (
                  <tr key={item.id} className="flex py-1">
                    <td className="flex-1">{item.product.product_name}</td>
                    <td className="min-w-[44px]">{item.quantity}</td>
                    <td className="min-w-[44px]">M{(item.product.product_price * item.quantity).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="border-b border-dashed mt-2"></div>
            <div className="flex flex-col gap-1 pt-2 text-sm">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>M{subtotal.toFixed(2)}</span>
              </div>
              {totalDiscount > 0 && (
                <div className="flex justify-between text-red-500">
                  <span>Discount:</span>
                  <span>-M{totalDiscount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold">
                <span>Total:</span>
                <span>M{total.toFixed(2)}</span>
              </div>
            </div>

            <div className="border-t border-dashed mt-2 pt-4">
              <div className="mb-4">
                <label className="block text-sm mb-2">Payment Method</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className={`flex-1 py-2 px-3 text-center rounded ${paymentMethod === 'cash' ? 'bg-blue-600 text-white' : 'bg-gray-700'}`}
                    onClick={() => handlePaymentMethodChange('cash')}
                  >
                    Cash
                  </button>
                  <button
                    type="button"
                    className={`flex-1 py-2 px-3 text-center rounded ${paymentMethod === 'card' ? 'bg-blue-600 text-white' : 'bg-gray-700'}`}
                    onClick={() => handlePaymentMethodChange('card')}
                  >
                    Card
                  </button>
                  <button
                    type="button"
                    className={`flex-1 py-2 px-3 text-center rounded ${paymentMethod === 'mobile' ? 'bg-blue-600 text-white' : 'bg-gray-700'}`}
                    onClick={() => handlePaymentMethodChange('mobile')}
                  >
                    Mobile
                  </button>
                </div>
              </div>

              {paymentMethod === 'cash' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm mb-1">Amount Received</label>
                    <input
                      type="number"
                      value={amountReceived}
                      onChange={(e) => setAmountReceived(e.target.value)}
                      className="w-full p-2 bg-gray-800 rounded text-white"
                      min={total}
                      step="0.01"
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-1">Change</label>
                    <input
                      type="text"
                      value={changeAmount}
                      readOnly
                      className="w-full p-2 bg-gray-800 rounded text-white"
                    />
                  </div>
                </div>
              )}

              {(paymentMethod === 'card' || paymentMethod === 'mobile') && (
                <div>
                  <label className="block text-sm mb-1">Reference Number</label>
                  <input
                    type="text"
                    value={paymentReference}
                    onChange={(e) => setPaymentReference(e.target.value)}
                    className="w-full p-2 bg-gray-800 rounded text-white"
                    placeholder="Transaction ID / Reference"
                    required
                  />
                </div>
              )}
            </div>

            <div className="pt-4">
              {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
              {Object.keys(errors).length > 0 && (
                <div className="text-red-500 text-sm mb-2">
                  {Object.values(errors).map((err, index) => (
                    <p key={index}>{err}</p>
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
                  onClick={handleConfirmPayment}
                  disabled={processing}
                  className="flex items-center gap-2"
                >
                  <><MdFileDownload /> Confirm & Save PDF</>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Receipt for printing */}
      <div className="hidden">
        <div ref={contentRef} className="p-4 bg-white text-black w-[80mm]">
          <img src="./images/TD-Logo.png" alt="logo" className="mx-auto w-16 py-4" />
          <div className="flex flex-col justify-center items-center gap-2">
            <h4 className="font-semibold">{orderData?.branch?.name || branchName}</h4>
            <p className="text-xs text-center">{orderData?.branch?.location || branchLocation}</p>
          </div>
          <div className="flex flex-col gap-3 border-b py-6 text-xs">
            <p className="flex justify-between">
              <span className="text-gray-400">Cashier:</span>
              <span>{orderData?.cashier?.name || cashierName}</span>
            </p>
            <p className="flex justify-between">
              <span className="text-gray-400">Date:</span>
              <span>
                {orderData
                  ? new Date(orderData.order_date).toLocaleString()
                  : new Date().toLocaleString()}
              </span>
            </p>
            {orderData && (
              <p className="flex justify-between">
                <span className="text-gray-400">Order #:</span>
                <span>{orderData.id}</span>
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
                {orderData
                  ? orderData.items.map((item) => (
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
                  {orderData
                    ? `M${orderData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)}`
                    : `M${subtotal.toFixed(2)}`
                  }
                </span>
              </div>
              {(orderData
                ? orderData.items.some(item => item.discount > 0)
                : totalDiscount > 0
              ) && (
                  <div className="flex justify-between text-red-500">
                    <span>Discount:</span>
                    <span>
                      {orderData
                        ? `-M${orderData.items.reduce((sum, item) => sum + item.discount, 0).toFixed(2)}`
                        : `-M${totalDiscount.toFixed(2)}`
                      }
                    </span>
                  </div>
                )}
              <div className="flex justify-between font-bold">
                <span>Total:</span>
                <span>
                  {orderData
                    ? `M${orderData.total_amount.toFixed(2)}`
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
      </div>
    </div>
  );
}