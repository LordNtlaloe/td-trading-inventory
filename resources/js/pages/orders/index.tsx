import { Head, Link, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { BreadcrumbItem } from '@/types';
import OrdersLayout from '@/layouts/orders/layout';

interface Order {
    id: number;
    total_amount: number;
    status: string;
    order_date: string;
    items_count: number;
    branch: {
        branch_name: string;
    };
    cashier: {
        name: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Orders', href: '/orders' },
];

export default function OrdersIndex() {
    const { orders } = usePage<{ orders: Order[] }>().props;

    // Handle cases where orders might be undefined or null
    const safeOrders = Array.isArray(orders) ? orders : [];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Sales/Orders" />
            <OrdersLayout>
                <div className="container mx-auto py-6">
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-2xl font-bold">Orders</h1>
                    </div>
                    <Table className='border px-5 rounded-md'>
                        <TableCaption>A list of all branches.</TableCaption>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Order #</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Branch</TableHead>
                                <TableHead>Cashier</TableHead>
                                <TableHead>Items</TableHead>
                                <TableHead>Total</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {safeOrders.length > 0 ? (
                                safeOrders.map((order) => (
                                    <TableRow key={order.id}>
                                        <TableCell>#{order.id}</TableCell>
                                        <TableCell>
                                            {format(new Date(order.order_date), 'MMM dd, yyyy HH:mm')}
                                        </TableCell>
                                        <TableCell>{order.branch.branch_name}</TableCell>
                                        <TableCell>{order.cashier.name}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline">
                                                {order.items_count} items
                                            </Badge>
                                        </TableCell>
                                        <TableCell>M{order.total_amount.toFixed(2)}</TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={
                                                    order.status === 'completed' ? 'default' :
                                                        order.status === 'pending' ? 'secondary' :
                                                            'destructive'
                                                }
                                            >
                                                {order.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Link href={route('orders.show', order.id)}>
                                                <Button variant="ghost" size="sm">
                                                    View
                                                </Button>
                                            </Link>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center py-4">
                                        No orders found
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </OrdersLayout>
        </AppLayout>
    );
}