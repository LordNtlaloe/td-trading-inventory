import React from 'react';

const PromoSection = () => {
    return (
        <div className="mt-6">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-medium uppercase text-gray-500">SELECT AVAILABLE PROMO TO APPLY</h3>
                <span className="text-xs text-gray-400">(LIMIT 1 PER ORDER)</span>
            </div>

            <div className="flex space-x-3 overflow-x-auto pb-2">
                <div className="border-2 border-orange-400 rounded-md px-4 py-2 min-w-[120px] text-center">
                    <p className="text-sm font-medium">$5 Off Any Item</p>
                </div>
                <div className="border rounded-md px-4 py-2 min-w-[120px] text-center">
                    <p className="text-sm font-medium">Free Beverage</p>
                </div>
                <div className="border rounded-md px-4 py-2 min-w-[140px] text-center">
                    <p className="text-sm font-medium">20% Off Entire Order</p>
                </div>
            </div>
        </div>
    );
};

export default PromoSection;
