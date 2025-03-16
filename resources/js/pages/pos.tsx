import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { ShoppingCart, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

interface Product {
    id: number;
    name: string;
    price: number;
    image: string;
}

interface CartItem {
    id: number;
    product: Product;
    quantity: number;
}

const initialProducts: Product[] = [
    { id: 1, name: 'Grilled Corn', price: 1.75, image: 'https://source.unsplash.com/MNtag_eXMKw/600x600' },
    { id: 2, name: 'Ranch Burger', price: 2.50, image: 'https://source.unsplash.com/4u_nRgiLW3M/600x600' },
    { id: 3, name: 'Stuffed Flank Steak', price: 3.50, image: 'https://source.unsplash.com/sc5sTPMrVfk/600x600' },
];

export default function Dashboard() {
    const [cart, setCart] = useState<CartItem[]>([]);
    const [products] = useState<Product[]>(initialProducts);

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

    const removeFromCart = (productId: number) => {
        setCart((prev) => prev.filter((item) => item.product.id !== productId));
    };

    const total = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0).toFixed(2);

    return (
        <div className="container mx-auto px-5">
            <div className="flex lg:flex-row flex-col-reverse shadow-lg">
                <div className="w-full lg:w-3/5 min-h-screen shadow-lg p-5">
                    <CardHeader>
                        <CardTitle className="text-xl font-bold">Simon's BBQ Team</CardTitle>
                        <span className="text-xs text-gray-500">Location ID#SIMON123</span>
                    </CardHeader>
                    <div className="mt-4 flex flex-row space-x-4">
                        <Badge variant="default">All Items</Badge>
                        <Badge variant="outline">Food</Badge>
                        <Badge variant="outline">Cold Drinks</Badge>
                        <Badge variant="outline">Hot Drinks</Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-4 mt-5">
                        {products.map((product) => (
                            <Card key={product.id} className="p-4">
                                <CardContent>
                                    <div className="font-bold text-gray-800">{product.name}</div>
                                    <span className="text-sm text-gray-400">150g</span>
                                    <div className="flex justify-between items-center mt-2">
                                        <span className="font-bold text-lg text-yellow-500">${product.price.toFixed(2)}</span>
                                        <img src={product.image} className="h-14 w-14 object-cover rounded-md" alt={product.name} />
                                    </div>
                                    <Button onClick={() => addToCart(product)} className="mt-2 bg-yellow-500 text-white w-full">
                                        Add to Cart
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
                <div className="w-full lg:w-2/5 p-5">
                    <Sheet>
                        <SheetHeader>
                            <SheetTitle>Current Order</SheetTitle>
                        </SheetHeader>
                        <ScrollArea className="h-64 mt-5">
                            {cart.map((item) => (
                                <div key={item.id} className="flex justify-between items-center py-2 border-b">
                                    <div className="flex items-center space-x-4">
                                        <img src={item.product.image} className="w-10 h-10 rounded-md" alt={item.product.name} />
                                        <span className="font-semibold text-sm">{item.product.name}</span>
                                    </div>
                                    <Button variant="ghost" size="sm" onClick={() => removeFromCart(item.product.id)}>
                                        <Trash2 className="text-red-500" />
                                    </Button>
                                </div>
                            ))}
                        </ScrollArea>
                        <Separator className="my-4" />
                        <div className="flex justify-between font-bold text-xl">
                            <span>Total:</span>
                            <span>${total}</span>
                        </div>
                        <Button className="mt-4 w-full bg-yellow-500 text-white">
                            Pay With Cashless Credit
                        </Button>
                    </Sheet>
                </div>
            </div>
        </div>
    );
}
