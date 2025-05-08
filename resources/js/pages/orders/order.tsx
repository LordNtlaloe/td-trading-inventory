import { Head, Link, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { BreadcrumbItem } from '@/types';
import { useReactToPrint } from "react-to-print";
import { useRef } from "react";
import OrdersLayout from '@/layouts/orders/layout';

interface OrderItem {
    id: number;
    quantity: number;
    price: number;
    discount: number;
    subtotal: number;
    product: {
        id: number;
        product_name: string;
        product_image?: string;
    };
}

interface Order {
    id: number;
    total_amount: number;
    status: string;
    order_date: string;
    items: OrderItem[];
    branch: {
        branch_name: string;
    };
    cashier: {
        name: string;
    };
    payment_method?: string;
    payment_reference?: string;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Orders', href: '/orders' },
    { title: 'Order Details', href: '' },
];


export default function OrderShow() {
    const { order } = usePage<{ order: Order }>().props;
    const contentRef = useRef<HTMLDivElement>(null);

    const reactToPrintFn = useReactToPrint({
        contentRef,
        pageStyle: `
            @page {
                size: A4;
                margin: 10mm;
            }
            @media print {
                body {
                    color: #000;
                    background: #fff;
                }
                .no-print {
                    display: none !important;
                }
                .print-content {
                    width: 100% !important;
                    padding: 0 !important;
                    margin: 0 !important;
                }
                img {
                    max-width: 100px !important;
                }
                * {
                    box-shadow: none !important;
                }
            }
        `
    });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Order #${order.id}`} />
            <OrdersLayout>
                {/* Add no-print class to elements that shouldn't appear in print */}
                <div className="no-print mt-6 flex justify-end gap-4">
                    <Link href={route('orders')}>
                        <Button variant="outline">Back to Orders</Button>
                    </Link>
                    <Button onClick={() => reactToPrintFn()}>
                        Print Receipt
                    </Button>
                </div>

                {/* This is the content that will be printed */}
                <div className="container mx-auto py-6 print-content" ref={contentRef}>
                    <div className="my-8">
                        <div className="flex justify-center items-center">
                            <img
                                src="../images/TD-Logo.png"
                                alt="logo"
                                width={100}
                                height={100}
                            />
                        </div>                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                            <div>
                                <h1 className="text-2xl font-bold">Order #{order.id}</h1>
                                <p className="text-gray-700 print:text-black">
                                    {format(new Date(order.order_date), 'MMMM dd, yyyy - hh:mm a')}
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <Badge variant={
                                    order.status === 'completed' ? 'default' :
                                        order.status === 'pending' ? 'secondary' :
                                            'destructive'
                                }>
                                    {order.status}
                                </Badge>
                                <Badge variant="outline">
                                    {order.items.length} items
                                </Badge>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 print:grid-cols-3 print:gap-2">
                            <div className="p-4 border rounded print:border print:border-gray-300">
                                <h3 className="font-semibold text-lg mb-2">Branch Information</h3>
                                <p>{order.branch.branch_name}</p>
                            </div>

                            <div className="p-4 border rounded print:border print:border-gray-300">
                                <h3 className="font-semibold text-lg mb-2">Cashier</h3>
                                <p>{order.cashier.name}</p>
                            </div>

                            <div className="p-4 border rounded print:border print:border-gray-300">
                                <h3 className="font-semibold text-lg mb-2">Payment</h3>
                                <p>
                                    {order.payment_method}
                                    {order.payment_reference && (
                                        <span className="ml-2">
                                            ({order.payment_reference})
                                        </span>
                                    )}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="border rounded-lg print:border print:border-gray-300">
                        <div className="p-4 border-b print:border-b print:border-gray-300">
                            <h2 className="font-semibold text-xl">Order Items</h2>
                        </div>

                        <div className="divide-y print:divide-y print:divide-gray-300">
                            {order.items.map((item) => (
                                <div key={item.id} className="p-4 flex flex-col md:flex-row gap-4 print:flex-row print:p-2">
                                    <div className="w-full md:w-24 h-24 rounded-lg overflow-hidden print:w-16 print:h-16">
                                        {item.product.product_image ? (
                                            <img
                                                src={item.product.product_image}
                                                alt={item.product.product_name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-400 print:text-gray-600 print:text-xs">
                                                No image
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex-1">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 print:flex-row">
                                            <div>
                                                <h3 className="font-semibold">{item.product.product_name}</h3>
                                            </div>
                                            <div className="flex items-center gap-4 print:gap-2">
                                                <div className="text-right">
                                                    <p className="text-sm text-gray-600 print:text-xs">Price</p>
                                                    <p>M{item.price.toFixed(2)}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm text-gray-600 print:text-xs">Qty</p>
                                                    <p>{item.quantity}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-2 pt-2 border-t print:border-t print:border-gray-300 flex flex-col md:flex-row md:items-center justify-between gap-2 print:flex-row">
                                            {item.discount > 0 && (
                                                <div className="text-right">
                                                    <p className="text-sm text-gray-600 print:text-xs">Discount</p>
                                                    <p className="text-red-500">-M{item.discount.toFixed(2)}</p>
                                                </div>
                                            )}
                                            <div className="text-right">
                                                <p className="text-sm text-gray-600 print:text-xs">Subtotal</p>
                                                <p className="font-medium">M{item.subtotal.toFixed(2)}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="p-4 border-t print:border-t print:border-gray-300">
                            <div className="flex justify-end">
                                <div className="w-full md:w-1/3 space-y-1 print:w-1/3">
                                    <div className="flex justify-between">
                                        <span>Subtotal:</span>
                                        <span>
                                            M{order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Discounts:</span>
                                        <span className="text-red-500">
                                            -M{order.items.reduce((sum, item) => sum + item.discount, 0).toFixed(2)}
                                        </span>
                                    </div>
                                    <div className="pt-2 mt-2 border-t print:border-t print:border-gray-300 flex justify-between">
                                        <span className="font-semibold">Total:</span>
                                        <span className="font-bold">
                                            M{order.total_amount.toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </OrdersLayout>
        </AppLayout>
    );
}