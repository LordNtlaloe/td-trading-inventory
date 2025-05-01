/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import POSLayout from '@/layouts/pos/pos-layout';
import { type BreadcrumbItem } from '@/types';
import ProductList from '@/components/products/ProductList';
import PaymentDialog from '@/components/products/PaymentDialog';
import { Receipt, PageProps } from '@/lib/types';
import { PosProvider, usePos } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { MdReceipt } from 'react-icons/md';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'POS',
        href: '/pos',
    },
];

export default function POS() {
    const { props } = usePage<PageProps>();

    return (
        <PosProvider>
            <POSContent {...props} />
        </PosProvider>
    );
}

function POSContent(props: PageProps & { requires_branch_selection?: boolean }) {
    const {
        filtered_products: products = [],
        auth,
        employee,
        branches = [],
        requires_branch_selection = false
    } = props;

    const {
        clearCart,
        closePaymentDialog,
        isPaymentDialogVisible,
    } = usePos();

    const [currentReceipt, setCurrentReceipt] = useState<Receipt | null>(null);
    const [showReceipt, setShowReceipt] = useState(false);
    const [showBranchDialog, setShowBranchDialog] = useState(requires_branch_selection);
    const [selectedBranch, setSelectedBranch] = useState<string>('');

    useEffect(() => {
        // Show branch dialog if required
        setShowBranchDialog(requires_branch_selection);
    }, [requires_branch_selection]);

    const handleBranchSelect = () => {
        if (!selectedBranch) {
            alert('Please select a branch');
            return;
        }

        router.post('/pos/select-branch', {
            branch_id: selectedBranch,
        }, {
            onSuccess: () => {
                setShowBranchDialog(false);
            },
            onError: () => {
                alert('Failed to select branch. Please try again.');
            }
        });
    };

    const branchName = auth.user.role === 'manager'
        ? 'All Branches'
        : employee?.branch?.branch_name || 'Branch';

    const branchLocation = auth.user.role === 'manager'
        ? 'All Branches'
        : employee?.branch?.branch_location || 'Branch';

    const handleProcessPaymentSuccess = (receiptData: Receipt) => {
        setCurrentReceipt(receiptData);
        setShowReceipt(true);
        clearCart();
    };

    return (
        <POSLayout breadcrumbs={breadcrumbs}>
            <Head>
                <title>POS</title>
            </Head>

            {/* Branch Selection Dialog */}
            <Dialog open={showBranchDialog} onOpenChange={setShowBranchDialog}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Select Your Branch</DialogTitle>
                        <DialogDescription>
                            You need to select a branch to work with before using the POS system.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="branch" className="text-right">
                                Branch
                            </Label>
                            <Select
                                value={selectedBranch}
                                onValueChange={setSelectedBranch}
                            >
                                <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="Select a branch" />
                                </SelectTrigger>
                                <SelectContent>
                                    {branches.map((branch: any) => (
                                        <SelectItem key={branch.id} value={branch.id.toString()}>
                                            {branch.branch_name} - {branch.branch_location}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button
                            variant="outline"
                            onClick={() => router.get('/dashboard')}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleBranchSelect}
                            disabled={!selectedBranch}
                        >
                            Continue
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Main POS Content - Only shown when branch is selected */}
            {!showBranchDialog && (
                <div className="container mx-auto px-5">
                    <div className="flex lg:flex-row flex-col-reverse gap-4">
                        <ProductList
                            products={products || []}
                            branchName={branchName}
                            user={auth.user}
                        />
                    </div>
                </div>
            )}

            {/* Receipt Modal */}
            {showReceipt && currentReceipt && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white p-6 rounded-lg max-w-md w-full max-h-[90vh] overflow-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold">Order Receipt</h2>
                            <MdReceipt className="text-2xl" />
                        </div>

                        <div className="space-y-2 mb-4">
                            <p><span className="font-medium">Order #:</span> {currentReceipt.id}</p>
                            <p><span className="font-medium">Date:</span> {new Date(currentReceipt.date).toLocaleString()}</p>
                            <p><span className="font-medium">Cashier:</span> {currentReceipt.cashier}</p>
                            <p><span className="font-medium">Branch:</span> {currentReceipt.branch}</p>
                        </div>

                        <div className="border-t border-b py-4 my-4">
                            <h3 className="font-medium mb-2">Items:</h3>
                            {currentReceipt.items.map(item => (
                                <div key={item.id} className="flex justify-between py-1">
                                    <span>{item.product.product_name} × {item.quantity}</span>
                                    <span>M{(item.product.product_price * item.quantity).toFixed(2)}</span>
                                </div>
                            ))}
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span className="font-medium">Subtotal:</span>
                                <span>M{currentReceipt.items.reduce((sum, item) => sum + (item.product.product_price * item.quantity), 0).toFixed(2)}</span>
                            </div>
                            {currentReceipt.items.some(item => item.discount > 0) && (
                                <div className="flex justify-between text-red-500">
                                    <span className="font-medium">Discount:</span>
                                    <span>-M{currentReceipt.items.reduce((sum, item) => sum + item.discount, 0).toFixed(2)}</span>
                                </div>
                            )}
                            <div className="flex justify-between font-bold text-lg">
                                <span>Total:</span>
                                <span>M{currentReceipt.total.toFixed(2)}</span>
                            </div>
                        </div>

                        <Button
                            className="w-full mt-6"
                            onClick={() => setShowReceipt(false)}
                        >
                            Close Receipt
                        </Button>
                    </div>
                </div>
            )}

            <PaymentDialog
                open={isPaymentDialogVisible}
                onClose={closePaymentDialog}
                onSuccess={handleProcessPaymentSuccess}
                branchId={employee?.branch?.id ?? 0}
                cashierId={auth.user.id}
                branchName={branchName}
                branchLocation={branchLocation}
                cashierName={auth.user.name}
            />
        </POSLayout>
    );
}