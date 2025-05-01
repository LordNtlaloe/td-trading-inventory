"use client"

import { TrendingUp, TrendingDown } from "lucide-react"
import { Area, Bar, ComposedChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from "recharts"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"

interface ChartData {
    month: string;
    cash: number;
    card: number;
    mobile_money: number;
    bank_transfer: number;
    total_orders: number;
    total?: number;
}

interface ChartProps {
    data: ChartData[];
    title: string;
    description: string;
    showPaymentMethods?: boolean;
    branchName: string;
    isEmployee: boolean;
}

export function Chart({
    data,
    title,
    description,
    showPaymentMethods = true,
    branchName = 'All Branches',
    isEmployee = false
}: ChartProps) {
    if (data.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>{title}</CardTitle>
                    <CardDescription>
                        {description} {isEmployee && `for ${branchName}`}
                    </CardDescription>
                </CardHeader>
                <CardContent className="h-[300px] flex items-center justify-center">
                    <p className="text-muted-foreground">No data available for the selected period</p>
                </CardContent>
            </Card>
        );
    }

    // Calculate trend based on total_orders
    const trend = data.length > 1
        ? ((data[data.length - 1].total_orders - data[0].total_orders) / data[0].total_orders * 100)
        : 0;

    const totalOrders = data.reduce((sum, item) => sum + item.total_orders, 0);
    const totalRevenue = data.reduce((sum, item) => sum + (item.total || 0), 0);

    return (
        <Card>
            <CardHeader>
                <div>
                    <CardTitle>{title}</CardTitle>
                    <CardDescription>
                        {description} {isEmployee && `for ${branchName}`}
                    </CardDescription>
                </div>
            </CardHeader>
            <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis
                            dataKey="month"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            tickFormatter={(value) => value.slice(0, 3)}
                        />
                        <YAxis
                            tickLine={false}
                            axisLine={false}
                            width={40}
                        />
                        <Tooltip
                            formatter={(value, name) => {
                                if (name === 'Total Orders') {
                                    return [value, name];
                                }
                                return [`₱${Number(value).toFixed(2)}`, name];
                            }}
                            labelFormatter={(label) => `Month: ${label}`}
                        />
                        <Legend />
                        {showPaymentMethods && (
                            <>
                                <Area
                                    dataKey="cash"
                                    name="Cash"
                                    stackId="1"
                                    stroke="hsl(var(--primary))"
                                    fill="hsl(var(--primary)/0.2)"
                                />
                                <Area
                                    dataKey="card"
                                    name="Card"
                                    stackId="1"
                                    stroke="hsl(var(--secondary))"
                                    fill="hsl(var(--secondary)/0.2)"
                                />
                                <Area
                                    dataKey="mobile_money"
                                    name="Mobile Money"
                                    stackId="1"
                                    stroke="hsl(var(--accent))"
                                    fill="hsl(var(--accent)/0.2)"
                                />
                                <Area
                                    dataKey="bank_transfer"
                                    name="Bank Transfer"
                                    stackId="1"
                                    stroke="hsl(var(--destructive))"
                                    fill="hsl(var(--destructive)/0.2)"
                                />
                            </>
                        )}
                        <Bar
                            dataKey="total_orders"
                            name="Total Orders"
                            fill="hsl(var(--primary))"
                            radius={[4, 4, 0, 0]}
                        />
                    </ComposedChart>
                </ResponsiveContainer>
            </CardContent>
            <CardFooter>
                <div className="flex items-center gap-2 text-sm">
                    <div className="flex items-center gap-2 font-medium">
                        {trend >= 0 ? (
                            <TrendingUp className="h-4 w-4 text-green-500" />
                        ) : (
                            <TrendingDown className="h-4 w-4 text-red-500" />
                        )}
                        <span>
                            {Math.abs(trend).toFixed(1)}% {trend >= 0 ? 'increase' : 'decrease'}
                        </span>
                    </div>
                    <span className="text-muted-foreground">
                        {`${data[0]?.month} - ${data[data.length - 1]?.month} • `}
                        {showPaymentMethods 
                            ? `Revenue: ₱${totalRevenue.toFixed(2)}` 
                            : `Orders: ${totalOrders}`}
                    </span>
                </div>
            </CardFooter>
        </Card>
    );
}