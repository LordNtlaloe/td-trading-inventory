interface DashboardCardProps {
    icon: React.ReactNode;
    content: number;
    title: string;
    className?: string;
    bgClass?: string;
    previousPeriodValue: number;
    dataScope: string;
}

export default function DashboardCard({ 
    icon, 
    content, 
    title, 
    className, 
    bgClass,
    previousPeriodValue,
    dataScope
}: DashboardCardProps) {
    
    const calculatePercentageChange = () => {
        if (previousPeriodValue === 0) return 0;
        return ((content - previousPeriodValue) / previousPeriodValue) * 100;
    };

    const percentageChange = calculatePercentageChange();
    const isPositive = percentageChange >= 0;
    const changeText = isPositive ? 'increase' : 'decrease';

    return (
        <div className={`relative flex flex-col bg-clip-border rounded-xl bg-[#2A2A2A] text-white shadow-lg shadow-gray-800/50 p-4 h-full w-full ${className}`}>
            <div className={`bg-clip-border mx-4 rounded-xl overflow-hidden text-white shadow-lg absolute -mt-2 -ml-2 grid h-16 w-16 place-items-center ${bgClass}`}>
                {icon}
            </div>
            <div className="pt-12 text-right">
                <p className="text-sm text-gray-300">{title}</p>
                <h4 className="text-2xl font-semibold text-white">{content}</h4>
                {dataScope && (
                    <p className="text-xs text-gray-400 mt-1">{dataScope}</p>
                )}
            </div>
            <div className="border-t border-gray-700 pt-2">
                <p className="text-xs text-gray-400">
                    <strong className={isPositive ? 'text-green-400' : 'text-red-400'}>
                        {Math.abs(percentageChange).toFixed(1)}%
                    </strong> {changeText} from previous period
                </p>
            </div>
        </div>
    );
}