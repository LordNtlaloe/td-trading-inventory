import jsPDF from 'jspdf';

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
    branch_name?: string;
    cashier_name?: string;
}

interface ReceiptPdfProps {
    order: Order;
    branchName: string;
    cashierName: string;
}

export function generateReceiptPdf({ order, branchName, cashierName }: ReceiptPdfProps) {
    const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [80, 200]
    });

    // Set initial position
    let yPos = 10;

    // Add header
    pdf.setFontSize(14);
    pdf.setTextColor(0, 0, 0);
    pdf.text('Your Restaurant Name', 40, yPos, { align: 'center' });
    yPos += 8;

    pdf.setFontSize(10);
    pdf.text(branchName, 40, yPos, { align: 'center' });
    yPos += 5;

    pdf.text(`Order #${order.id}`, 40, yPos, { align: 'center' });
    yPos += 5;

    const formattedDate = new Date(order.order_date).toLocaleString();
    pdf.text(formattedDate, 40, yPos, { align: 'center' });
    yPos += 5;

    pdf.text(`Cashier: ${cashierName}`, 40, yPos, { align: 'center' });
    yPos += 10;

    // Add items table header
    pdf.setDrawColor(0, 0, 0);
    pdf.line(5, yPos, 75, yPos);
    yPos += 3;

    pdf.setFontSize(10);
    pdf.text('Item', 5, yPos);
    pdf.text('Price', 75, yPos, { align: 'right' });
    yPos += 5;

    pdf.line(5, yPos, 75, yPos);
    yPos += 5;

    // Add items
    pdf.setFontSize(8);
    order.items.forEach((item) => {
        pdf.text(`${item.quantity}x ${item.product.product_name}`, 5, yPos);
        pdf.text(`M${(item.price * item.quantity).toFixed(2)}`, 75, yPos, { align: 'right' });
        yPos += 5;

        if (item.discount > 0) {
            pdf.setTextColor(255, 0, 0);
            pdf.text(`Discount: -M${item.discount.toFixed(2)}`, 5, yPos);
            pdf.setTextColor(0, 0, 0);
            yPos += 5;
        }
    });

    yPos += 5;
    pdf.line(5, yPos, 75, yPos);
    yPos += 5;

    // Add totals
    pdf.setFontSize(10);
    pdf.text('Total:', 5, yPos);
    pdf.text(`M${order.total_amount.toFixed(2)}`, 75, yPos, { align: 'right' });
    yPos += 8;

    // Add footer
    pdf.setFontSize(8);
    pdf.setTextColor(100, 100, 100);
    pdf.text('Thank you for your purchase!', 40, yPos, { align: 'center' });
    yPos += 4;
    pdf.text('Please visit us again', 40, yPos, { align: 'center' });

    return pdf;
}

export function saveReceiptPdf(props: ReceiptPdfProps) {
    const pdf = generateReceiptPdf(props);
    pdf.save(`receipt-${props.order.id}.pdf`);
}