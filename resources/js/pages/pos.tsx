// src/pages/POS.tsx
import { useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import POSLayout from '@/layouts/pos/pos-layout';
import { type BreadcrumbItem } from '@/types';
import ProductList from '@/components/products/ProductList';
import PaymentDialog from '@/components/products/PaymentDialog';
import { Receipt, PageProps } from '@/lib/types';
import { PosProvider, usePos } from '@/contexts/CartContext';

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

function POSContent(props: PageProps) {
    const { filtered_products: products = [], auth, employee } = props;
    const { clearCart, openPaymentDialog, closePaymentDialog } = usePos();

    const [showReceipt, setShowReceipt] = useState(false);
    const [currentReceipt, setCurrentReceipt] = useState<Receipt | null>(null);
    const [isPaymentDialogVisible, setIsPaymentDialogVisible] = useState(false);

    const branchName = auth.user.role === 'manager'
        ? 'All Branches'
        : employee?.branch?.branch_name || 'Branch';

    const handleProcessPaymentSuccess = () => {
        // No need for receiptData here since onSuccess should not expect any arguments
        setCurrentReceipt(null); // Reset receipt if necessary
        setShowReceipt(true);
        clearCart();
    };

    return (
        <POSLayout breadcrumbs={breadcrumbs}>
            <Head>
                <title>POS</title>
            </Head>
            <div className="container mx-auto px-5">
                <div className="flex lg:flex-row flex-col-reverse shadow-lg">
                    <ProductList
                        products={products || []}
                        branchName={branchName}
                        user={auth.user} 
                    />
                </div>
            </div>

            <PaymentDialog
                open={isPaymentDialogVisible}
                onClose={() => setIsPaymentDialogVisible(false)}  // Close dialog
                onSuccess={handleProcessPaymentSuccess}
                branchId={employee?.branch?.id ?? 0}  // Provide fallback value if undefined
                cashierId={auth.user.id}
                branchName={branchName}
                cashierName={auth.user.name} 
            />
        </POSLayout>
    );
}
