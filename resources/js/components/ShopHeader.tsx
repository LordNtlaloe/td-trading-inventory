import { Button } from "@/components/ui/button";
import { HelpCircle } from "lucide-react";

const ShopHeader = () => {
    return (
        <div className="flex justify-between items-start mb-8">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Simons's BBQ Team</h1>
                <p className="text-sm text-gray-500">Location ID# SIMON123</p>
            </div>

            <div className="flex items-center space-x-4">
                <div className="flex items-center">
                    <span className="h-2 w-2 rounded-full bg-green-500 mr-2"></span>
                    <span className="text-sm text-gray-500">
                        Last update
                        <br />
                        3 mins ago
                    </span>
                </div>
                <Button variant="outline" size="sm" className="rounded-full">
                    <HelpCircle className="h-5 w-5 mr-1" />
                    Help
                </Button>
            </div>
        </div>
    );
};

export default ShopHeader;
