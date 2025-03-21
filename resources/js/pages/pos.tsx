import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Trash2, Plus, Minus, Printer } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetHeader, SheetTitle, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Head, usePage, router } from '@inertiajs/react';
import POSLayout from '@/layouts/pos/pos-layout';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from 'sonner';

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
        branch_name: string;
    };
    branch_id: number;
};

interface CartItem {
    id: number;
    product: Product;
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
    const [isProcessing, setIsProcessing] = useState(false);
    const [showReceipt, setShowReceipt] = useState(false);
    const [currentReceipt, setCurrentReceipt] = useState<Receipt | null>(null);

    const { filtered_products: products = [] } = usePage<{ filtered_products?: Product[] }>().props;
    const { auth } = usePage<SharedData>().props;
    const { employee } = usePage<{ employee?: { branch_id: number, branch: { branch_name: string } } }>().props;

    const filterdProducts = products.filter((product) => {
        const matchedCategory = selectedCategory === "All" || product.product_category === selectedCategory;
        const matchedCommodity = selectedCommodity === "All" || product.product_commodity === selectedCommodity;
        return matchedCategory && matchedCommodity;
    });

    // Add product to cart
    const addToCart = (product: Product) => {
        // Check if product has enough quantity in stock
        if (product.product_quantity <= 0) {
            toast({
                title: "Out of Stock",
                description: `${product.product_name} is currently out of stock.`,
                variant: "destructive"
            });
            return;
        }

        // Check if adding would exceed available quantity
        const existingItem = cart.find(item => item.product.id === product.id);
        const currentQuantity = existingItem ? existingItem.quantity : 0;
        
        if (currentQuantity + 1 > product.product_quantity) {
            toast({
                title: "Insufficient Stock",
                description: `Only ${product.product_quantity} units of ${product.product_name} available.`,
                variant: "destructive"
            });
            return;
        }

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

    // Increase quantity
    const increaseQuantity = (productId: number) => {
        const item = cart.find(item => item.product.id === productId);
        
        if (item && item.quantity + 1 > item.product.product_quantity) {
            toast({
                title: "Insufficient Stock",
                description: `Only ${item.product.product_quantity} units of ${item.product.product_name} available.`,
                variant: "destructive"
            });
            return;
        }
        
        setCart((prev) =>
            prev.map((item) =>
                item.product.id === productId ? { ...item, quantity: item.quantity + 1 } : item
            )
        );
    };

    // Decrease quantity (minimum quantity is 1)
    const decreaseQuantity = (productId: number) => {
        setCart((prev) =>
            prev.map((item) =>
                item.product.id === productId
                    ? { ...item, quantity: Math.max(1, item.quantity - 1) }
                    : item
            )
        );
    };

    // Calculate total and discount
    let subtotal = 0;
    let totalDiscount = 0;
    let total = 0;

    cart.forEach((item) => {
        const itemSubtotal = item.product.product_price * item.quantity;
        subtotal += itemSubtotal;
        const discount = item.quantity >= 4 ? 200 : 0;
        totalDiscount += discount;
    });
    
    total = subtotal - totalDiscount;

    // Get branch name for display
    const branchName = auth.user.role === 'manager' 
        ? 'All Branches' 
        : employee?.branch.branch_name || 'Branch';

    // Process payment and generate receipt
    const processPayment = () => {
        if (cart.length === 0) {
            toast({
                title: "Empty Cart",
                description: "Please add items to your cart before processing payment.",
                variant: "destructive"
            });
            return;
        }

        setIsProcessing(true);

        // Create receipt data
        const receiptData = {
            id: `REC-${Date.now().toString().slice(-6)}`,
            date: new Date(),
            items: [...cart],
            subtotal,
            discount: totalDiscount,
            total,
            cashier: auth.user.name,
            branch: branchName
        };

        // Prepare data for API
        const orderData = {
            items: cart.map(item => ({
                product_id: item.product.id,
                quantity: item.quantity,
                price: item.product.product_price,
                discount: item.quantity >= 4 ? 200 : 0
            })),
            total,
            branch_id: employee?.branch_id || 1,
            cashier_id: auth.user.id
        };

        // Send to server to update inventory and save order
        router.post('/pos/process-payment', orderData, {
            onSuccess: () => {
                setCurrentReceipt(receiptData);
                setShowReceipt(true);
                setCart([]);
                setIsProcessing(false);
                
                toast({
                    title: "Payment Successful",
                    description: "The order has been processed successfully.",
                });
            },
            onError: () => {
                setIsProcessing(false);
                toast({
                    title: "Error",
                    description: "There was an error processing your payment. Please try again.",
                    variant: "destructive"
                });
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

    return (
        <POSLayout breadcrumbs={breadcrumbs}>
            <Head title="POS" />
            <div className="container mx-auto px-5">
                <div className="flex lg:flex-row flex-col-reverse shadow-lg">
                    {/* Product Listing */}
                    <div className="w-full lg:w-3/4 min-h-screen shadow-lg p-5">
                        <CardHeader>
                            <CardTitle className="text-xl font-bold">{branchName}</CardTitle>
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
                                                        <span className={`text-xs ${product.product_quantity > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                            Stock: {product.product_quantity}
                                                        </span>
                                                    </div>
                                                    <Button
                                                        onClick={() => addToCart(product)}
                                                        className="mt-2 w-full cursor-pointer"
                                                        disabled={product.product_quantity <= 0}
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
                    <div className="w-full lg:w-1/4 p-5 screen-h">
                        <Sheet>
                            <SheetHeader>
                                <SheetTitle>Current Order</SheetTitle>
                            </SheetHeader>
                            <ScrollArea className="h-64 mt-5">
                                {cart.length > 0 ? (
                                    cart.map((item) => (
                                        <div key={item.id} className="flex justify-between items-center py-2 border-b">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-white">{item.product.product_name}</span>
                                                <span className="text-gray-400">M{item.product.product_price.toFixed(2)}</span>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <Button variant="ghost" size="icon" onClick={() => decreaseQuantity(item.product.id)}>
                                                    <Minus className="text-red-500" />
                                                </Button>
                                                <span className="text-white">{item.quantity}</span>
                                                <Button variant="ghost" size="icon" onClick={() => increaseQuantity(item.product.id)}>
                                                    <Plus className="text-green-500" />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => removeFromCart(item.product.id)}>
                                                    <Trash2 className="text-red-500" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-center text-gray-500">Your cart is empty</p>
                                )}
                            </ScrollArea>

                            <Separator className="my-4" />
                            <div className="text-gray-400">Subtotal: M{subtotal.toFixed(2)}</div>
                            {totalDiscount > 0 && <div className="text-red-500">Discount: -M{totalDiscount.toFixed(2)}</div>}
                            <div className="font-bold text-xl">Total: M{total.toFixed(2)}</div>
                            <Button 
                                className="mt-4 w-full cursor-pointer" 
                                onClick={processPayment} 
                                disabled={isProcessing || cart.length === 0}
                            >
                                {isProcessing ? "Processing..." : "Process Payment"}
                            </Button>
                        </Sheet>
                    </div>
                </div>
            </div>

            {/* Receipt Dialog */}
            <Dialog open={showReceipt} onOpenChange={setShowReceipt}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Receipt #{currentReceipt?.id}</DialogTitle>
                    </DialogHeader>
                    {currentReceipt && (
                        <div className="space-y-4">
                            <div className="text-center">
                                <p className="text-gray-500">Branch: {currentReceipt.branch}</p>
                                <p className="text-gray-500">Date: {currentReceipt.date.toLocaleString()}</p>
                                <p className="text-gray-500">Cashier: {currentReceipt.cashier}</p>
                            </div>
                            <Separator />
                            <div className="space-y-2">
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
                            <div className="text-center text-gray-500 text-sm">
                                <p>Thank you for your purchase!</p>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowReceipt(false)}>Close</Button>
                        <Button variant="default" onClick={printReceipt}>
                            <Printer className="mr-2 h-4 w-4" />
                            Print Receipt
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </POSLayout>
    );
}