import { MenuItem } from "@/types/";
import Image from "./Image";

interface ItemMenuProps {
    item: MenuItem;
    onAddToOrder: () => void;
}

const ItemMenu = ({ item, onAddToOrder }: ItemMenuProps) => {
    const { name, price, weight, image } = item;

    return (
        <div className="border border-gray-200 rounded-lg overflow-hidden cursor-pointer" onClick={onAddToOrder}>
            <div className="p-4">
                <h3 className="font-semibold text-gray-800">{name}</h3>
                <p className="text-sm text-gray-500">{weight}</p>

                <div className="flex justify-between items-center mt-6">
                    <span className="text-xl font-bold text-orange-500">${price.toFixed(2)}</span>
                    <div className="w-24 h-24 rounded-md overflow-hidden">
                        <Image src={image} className="w-full h-full object-cover" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ItemMenu;
