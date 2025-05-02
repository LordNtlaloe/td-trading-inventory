import React from 'react';
import { Button } from './ui/button';

const UserInfo = () => {
    return (
        <div className="border-t pt-4 mt-4">
            <h3 className="text-xs font-medium uppercase text-gray-500 mb-2">WRISTBAND INFORMATION</h3>
            <div className="flex items-center justify-between">
                <div className="flex items-center">
                    <div className="h-12 w-12 bg-gray-200 rounded-full overflow-hidden mr-3">
                        <img
                            src="/placeholder.svg"
                            alt="Eleanor Russell"
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <div>
                        <h4 className="font-medium">Eleanor Russell</h4>
                        <span className="text-xs font-medium px-2 py-0.5 bg-orange-500 text-white rounded-full">VIP TICKET HOLDER</span>
                    </div>
                </div>
                <Button className="bg-rose-500 hover:bg-rose-600">Unlink</Button>
            </div>
        </div>
    );
};

export default UserInfo;
