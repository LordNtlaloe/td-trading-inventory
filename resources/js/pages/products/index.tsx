import { Head, Link, usePage } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import AppLayout from '@/layouts/app-layout';
import ProductsLayout from '@/layouts/products/layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableFooter,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { PenIcon, Trash2Icon } from "lucide-react";
import { useState, useEffect } from 'react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Products', href: '/products' }];

type Products = {
    id: number;
    product_name: string;
    product_price: number;
    product_quantity: number;
    product_category: string;
    product_commodity: string;
    product_grade: string;
    branch: {
        branch_location: string;
    };
};

export default function Products() {
    const { filtered_products, all_products } = usePage<{ filtered_products: Products[], all_products: Products[] }>().props;
    const [search, setSearch] = useState('');
    const [alert, setAlert] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const displayedProducts = search.length > 0
        ? filtered_products.filter(p => p.product_name.toLowerCase().includes(search.toLowerCase()))
        : filtered_products;

    useEffect(() => {
        if (alert) {
            const timeout = setTimeout(() => setAlert(null), 3000); // Hide alert after 3 seconds
            return () => clearTimeout(timeout);
        }
    }, [alert]);
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Products" />

            <ProductsLayout>
                <div className="space-y-2">
                    <div className="flex justify-between">
                        <Input
                            className="w-1/4"
                            placeholder="Search"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        <Link href="/products/create" className="cursor-pointer">
                            <Button className="cursor-pointer" variant="secondary">Add New Product</Button>
                        </Link>
                    </div>

                    <div className="overflow-x-auto">
                        <Table className="border px-5 rounded-md w-full">
                            <TableCaption>A list of all products.</TableCaption>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[100px]">ID</TableHead>
                                    <TableHead>Product Name</TableHead>
                                    <TableHead>Price</TableHead>
                                    <TableHead>Quantity</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead>Commodity</TableHead>
                                    <TableHead>Grade</TableHead>
                                    <TableHead>Location</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {displayedProducts.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center text-gray-500">
                                            No products available.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    displayedProducts.map(({ id, product_name, product_price, product_quantity, product_category, product_commodity, product_grade, branch }) => (
                                        <TableRow key={id}>
                                            <TableCell className="font-medium">{id}</TableCell>
                                            <TableCell>{product_name}</TableCell>
                                            <TableCell>{product_price}</TableCell>
                                            <TableCell>{product_quantity}</TableCell>
                                            <TableCell>{product_category}</TableCell>
                                            <TableCell>{product_commodity}</TableCell>
                                            <TableCell>{product_grade}</TableCell>
                                            <TableCell>{branch?.branch_location}</TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex gap-2 justify-end">
                                                    <Button variant="outline">
                                                        <Link href={`/products/${id}/edit`} className="flex gap-2">
                                                            <PenIcon className="h-4 w-4" /> Edit
                                                        </Link>
                                                    </Button>
                                                    <Button variant="destructive">
                                                        <Trash2Icon className="h-4 w-4" /> Delete
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                            <TableFooter>
                                <TableRow>
                                    <TableCell colSpan={7}>Total Products</TableCell>
                                    <TableCell className="text-right">{displayedProducts.length}</TableCell>
                                </TableRow>
                            </TableFooter>
                        </Table>
                    </div>
                </div>
            </ProductsLayout>
        </AppLayout>
    );
}
