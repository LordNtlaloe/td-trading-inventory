import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Head, usePage } from '@inertiajs/react';
import POSLayout from '@/layouts/pos/pos-layout';
import { type BreadcrumbItem, type SharedData } from '@/types';

type Product = {
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

interface CartItem {
    id: number;
    product: Product;
    quantity: number;
}


const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'POS',
        href: '/pos',
    },
];

export default function POS() {
    const [cart, setCart] = useState<CartItem[]>([]);
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [selectedCommodity, setSelectedCommodity] = useState("All");
    // Ensure we correctly receive products from Laravel
    const { all_products: products = [] } = usePage<{ all_products?: Product[] }>().props;
    const { auth } = usePage<SharedData>().props;

    const filterdProducts = products.filter((product) => {
        const matchedCategory = selectedCategory === "All" || product.product_category === selectedCategory;
        const matchedCommodity = selectedCommodity === "All" || product.product_commodity === selectedCommodity;
        return matchedCategory && matchedCommodity;
    })

    // Add product to cart
    const addToCart = (product: Product) => {
        setCart((prev) => {
            const item = prev.find((item) => item.product.id === product.id);
            if (item) {
                return prev.map((item) =>
                    item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
                );
            } else {
                return [...prev, { id: Date.now(), product, quantity: 1 }];
            }
        });
    };

    // Remove product from cart
    const removeFromCart = (productId: number) => {
        setCart((prev) => prev.filter((item) => item.product.id !== productId));
    };

    // Calculate total
    const total = cart.reduce((sum, item) => sum + item.product.product_price * item.quantity, 0).toFixed(2);

    return (
        <POSLayout breadcrumbs={breadcrumbs}>
            <Head title="POS"/>
            <div className="container mx-auto px-5">
                <div className="flex lg:flex-row flex-col-reverse shadow-lg">
                    {/* Product Listing */}
                    <div className="w-full lg:w-3/4 min-h-screen shadow-lg p-5">
                        <CardHeader>
                            <CardTitle className="text-xl font-bold">Simon's BBQ Team</CardTitle>
                            <span className="text-md text-gray-500">{auth.user.name} - {auth.user.role}</span>
                        </CardHeader>
                        <div className="flex mt-5">
                            <aside className="w-full lg:w-30">
                                <nav className="flex flex-col space-y-1 space-x-0">
                                    {["All", "New Tyre", "Used Tyre"].map((commodity) => (
                                        <Badge className='cursor-pointer' key={commodity} onClick={() => setSelectedCommodity(commodity)} variant={`${selectedCommodity === commodity ? "default" : "outline"}`} >
                                            {commodity}
                                        </Badge>
                                    ))}
                                </nav>
                            </aside>
                            <div className="">
                                <div className="mt-4 flex flex-row space-x-4">
                                    {["All", "Car Tyres", "4*4 Tyres", "Truck Tyres"].map((category) => (

                                        <Badge className='cursor-pointer' key={category} onClick={() => setSelectedCategory(category)} variant={`${selectedCategory === category ? "default" : "outline"}`} >
                                            {category}
                                        </Badge>
                                    ))}
                                </div>

                                {/* Product Cards */}
                                <div className="grid grid-cols-3 gap-4 mt-5">
                                    {filterdProducts.length > 0 ? (
                                        filterdProducts.map((product) => (
                                            <Card key={product.id} className="p-4 border bg-[#1D1D1D]">
                                                <CardContent>
                                                    <div className="font-bold text-white">{product.product_name}</div>
                                                    <span className="text-sm text-gray-400">{product.product_category}</span>
                                                    <div className="flex justify-between items-center mt-2">
                                                        <span className="font-bold text-sm text-slate-100">
                                                            M{product.product_price.toFixed(2)}
                                                        </span>
                                                        <span className="font-bold text-sm text-slate-100">
                                                            {product.product_commodity}
                                                        </span>
                                                    </div>
                                                    <Button
                                                        onClick={() => addToCart(product)}
                                                        className="mt-2 w-full cursor-pointer"
                                                    >
                                                        Add
                                                    </Button>
                                                </CardContent>
                                            </Card>
                                        ))
                                    ) : (
                                        <p className="text-center col-span-3 text-gray-500">No products available</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Shopping Cart */}
                    <div className="w-full lg:w-1/4 p-5]">
                        <Sheet>
                            <SheetHeader>
                                <SheetTitle>Current Order</SheetTitle>
                            </SheetHeader>
                            <ScrollArea className="h-64 mt-5">
                                {cart.length > 0 ? (
                                    cart.map((item) => (
                                        <div key={item.id} className="flex justify-between items-center py-2 border-b">
                                            <div className="flex items-center space-x-4">
                                                <span className="font-bold text-lg text-yellow-500">
                                                    M{item.product.product_price.toFixed(2)}
                                                </span>
                                                <span className="font-semibold text-sm">{item.product.product_name}</span>
                                            </div>
                                            <Button variant="ghost" size="sm" onClick={() => removeFromCart(item.product.id)}>
                                                <Trash2 className="text-red-500" />
                                            </Button>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-center text-gray-500">Your cart is empty</p>
                                )}
                            </ScrollArea>
                            <Separator className="my-4" />
                            <div className="flex justify-between font-bold text-xl">
                                <span>Total:</span>
                                <span>M{total}</span>
                            </div>
                            <Button className="mt-4 w-full bg-yellow-500 text-white">
                                Pay With Cashless Credit
                            </Button>
                        </Sheet>
                    </div>
                </div>
            </div>
        </POSLayout>
    );
}
