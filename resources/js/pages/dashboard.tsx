import { Chart } from '@/components/general/area-chart';
import DashboardCard from '@/components/general/cards/dashboard-card';
import AppLayout from '@/layouts/app-layout';
import { FaShoppingCart, FaUsers, FaBuilding, FaFileInvoice } from "react-icons/fa";
import { type BreadcrumbItem } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import { PeriodSelector } from '@/components/dashboard/PeriodSelector';
import { DashboardPageProps } from '@/lib/types';
import { useEffect } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
];

export default function Dashboard() {
    const {
        products,
        employees,
        branches,
        orders,
        chartData = [],
        period,
        previousPeriodProducts,
        previousPeriodEmployees,
        previousPeriodBranches,
        previousPeriodOrders,
        branchName = 'All Branches',
        auth,
        employee
    } = usePage<DashboardPageProps>().props;

    const transformedChartData = chartData.map(item => ({
        ...item,
        total_orders: item.total // map 'total' to 'total_orders'
    }));

    const isEmployee = auth.user.role === 'employee';
    const dataScope: string = isEmployee ? branchName : 'All Branches';

    // Debugging - log chart data
    useEffect(() => {
        console.log('Chart Data:', chartData);
    }, [chartData]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold">Dashboard Overview</h1>
                        <p className="text-sm text-gray-400">
                            Showing data for: <span className="font-medium">{dataScope}</span>
                            {isEmployee && employee?.branch_name && (
                                <span className="ml-2">({employee.branch_name})</span>
                            )}
                        </p>
                    </div>
                    <PeriodSelector currentPeriod={period} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    <DashboardCard
                        title="Products"
                        icon={<FaShoppingCart />}
                        content={products}
                        previousPeriodValue={previousPeriodProducts}
                        bgClass="bg-gradient-to-tr from-blue-600 to-blue-400 shadow-blue-500/40"
                        dataScope={dataScope}
                    />
                    <DashboardCard
                        title="Employees"
                        icon={<FaUsers />}
                        content={employees}
                        previousPeriodValue={previousPeriodEmployees}
                        bgClass="bg-gradient-to-tr from-green-600 to-green-400 text-white shadow-green-500/40"
                        dataScope={dataScope}
                    />
                    {!isEmployee && (
                        <DashboardCard
                            title="Branches"
                            icon={<FaBuilding />}
                            content={branches}
                            previousPeriodValue={previousPeriodBranches}
                            bgClass="bg-gradient-to-tr from-purple-600 to-purple-400 shadow-purple-500/40"
                            dataScope={dataScope}
                        />
                    )}
                    <DashboardCard
                        title="Orders"
                        icon={<FaFileInvoice />}
                        content={orders}
                        previousPeriodValue={previousPeriodOrders}
                        bgClass="bg-gradient-to-tr from-red-600 to-red-400 shadow-red-500/40"
                        dataScope={dataScope}
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <Chart
                        data={transformedChartData }
                        title="Order Trends"
                        description="Total orders over time"
                        showPaymentMethods={false}
                        branchName={branchName}
                        isEmployee={isEmployee}
                    />
                    <Chart
                        data={transformedChartData }
                        title="Payment Methods"
                        description="Breakdown by payment type"
                        showPaymentMethods
                        branchName={branchName}
                        isEmployee={isEmployee}
                    />
                </div>
            </div>
        </AppLayout>
    );
}