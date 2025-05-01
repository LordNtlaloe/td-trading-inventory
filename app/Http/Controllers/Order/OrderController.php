<?php

namespace App\Http\Controllers\Order;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Products;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Carbon\Carbon;

class OrderController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user();
        $period = $request->input('period', '6months');
        $startDate = $this->getStartDate($period);
        
        $ordersQuery = Order::with(['branch', 'cashier'])
            ->withCount('items')
            ->when($request->has('period'), function($query) use ($startDate) {
                $query->where('created_at', '>=', $startDate);
            });
        
        // Apply branch filter for non-admin users
        if ($user->role !== 'Admin') {
            if ($user->employee && $user->employee->branch_id) {
                $ordersQuery->where('branch_id', $user->employee->branch_id);
            } else {
                // If employee has no branch assigned, return empty
                $ordersQuery->where('branch_id', -1);
            }
        }

        $orders = $ordersQuery->latest()->get();

        return Inertia::render('orders/index', [
            'orders' => $orders->isEmpty() ? [] : $orders->toArray(),
            'period' => $period,
            'user_role' => $user->role, // Pass user role to frontend
        ]);
    }

    public function show($id): Response
    {
        $order = Order::with([
            'items.product', 
            'branch', 
            'cashier'
        ])->findOrFail($id);

        return Inertia::render('orders/order', [
            'order' => [
                'id' => $order->id,
                'total_amount' => $order->total_amount,
                'status' => $order->status,
                'order_date' => $order->order_date,
                'payment_method' => $order->payment_method,
                'payment_reference' => $order->payment_reference,
                'branch' => [
                    'branch_name' => $order->branch->branch_name,
                ],
                'cashier' => [
                    'name' => $order->cashier->name,
                ],
                'items' => $order->items->map(function ($item) {
                    return [
                        'id' => $item->id,
                        'quantity' => $item->quantity,
                        'price' => $item->price,
                        'discount' => $item->discount,
                        'subtotal' => $item->subtotal,
                        'product' => [
                            'id' => $item->product->id,
                            'product_name' => $item->product->product_name,
                            'product_image' => $item->product->product_image,
                        ],
                    ];
                }),
            ],
        ]);
    }

    public function processPayment(Request $request)
    {
        $validated = $request->validate([
            'branch_id' => 'required|integer|exists:branches,id',
            'cashier_id' => 'required|integer|exists:users,id',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|integer|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.price' => 'required|numeric|min:0',
            'items.*.discount' => 'required|numeric|min:0',
            'total' => 'required|numeric|min:0',
            'payment_method' => 'required|string|in:cash,card,mobile_money,bank_transfer',
        ]);

        DB::beginTransaction();

        try {
            $order = Order::create([
                'total_amount' => $validated['total'],
                'branch_id' => $validated['branch_id'],
                'user_id' => $validated['cashier_id'],
                'status' => 'completed',
                'order_date' => now(),
                'payment_method' => $validated['payment_method'],
            ]);

            foreach ($validated['items'] as $item) {
                OrderItem::create([
                    'order_id' => $order->id,
                    'product_id' => $item['product_id'],
                    'quantity' => $item['quantity'],
                    'price' => $item['price'],
                    'discount' => $item['discount'],
                    'subtotal' => ($item['price'] * $item['quantity']) - $item['discount'],
                ]);

                Products::where('id', $item['product_id'])
                    ->decrement('product_quantity', $item['quantity']);
            }

            DB::commit();

            return redirect()->route('orders.show', $order->id)->with([
                'success' => 'Order processed successfully!'
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->withErrors([
                'error' => 'Failed to process order: ' . $e->getMessage()
            ]);
        }
    }

    public function getChartData(Request $request)
    {
        $period = $request->input('period', '6months');
        $startDate = $this->getStartDate($period);

        $connection = config('database.default');
        $isSQLite = config("database.connections.{$connection}.driver") === 'sqlite';

        if ($isSQLite) {
            $chartData = Order::select(
                DB::raw("strftime('%m', created_at) as month_num"),
                DB::raw("strftime('%Y', created_at) as year"),
                DB::raw("strftime('%Y-%m', created_at) as month_year"),
                DB::raw('COUNT(*) as total'),
                DB::raw('SUM(CASE WHEN payment_method = "cash" THEN 1 ELSE 0 END) as cash'),
                DB::raw('SUM(CASE WHEN payment_method = "card" THEN 1 ELSE 0 END) as card'),
                DB::raw('SUM(CASE WHEN payment_method = "mobile_money" THEN 1 ELSE 0 END) as mobile_money'),
                DB::raw('SUM(CASE WHEN payment_method = "bank_transfer" THEN 1 ELSE 0 END) as bank_transfer')
            );
        } else {
            $chartData = Order::select(
                DB::raw('MONTHNAME(created_at) as month'),
                DB::raw('YEAR(created_at) as year'),
                DB::raw('COUNT(*) as total'),
                DB::raw('SUM(CASE WHEN payment_method = "cash" THEN 1 ELSE 0 END) as cash'),
                DB::raw('SUM(CASE WHEN payment_method = "card" THEN 1 ELSE 0 END) as card'),
                DB::raw('SUM(CASE WHEN payment_method = "mobile_money" THEN 1 ELSE 0 END) as mobile_money'),
                DB::raw('SUM(CASE WHEN payment_method = "bank_transfer" THEN 1 ELSE 0 END) as bank_transfer')
            );
        }

        $chartData = $chartData->where('created_at', '>=', $startDate)
            ->groupBy($isSQLite ? ['year', 'month_num'] : ['year', 'month'])
            ->orderBy('year')
            ->orderBy($isSQLite ? 'month_num' : DB::raw('MONTH(created_at)'))
            ->get()
            ->map(function ($item) use ($isSQLite) {
                if ($isSQLite) {
                    $monthName = Carbon::create()->month($item->month_num)->format('F');
                    return [
                        'month' => $monthName,
                        'month_year' => $item->month_year,
                        'cash' => $item->cash,
                        'card' => $item->card,
                        'mobile_money' => $item->mobile_money,
                        'bank_transfer' => $item->bank_transfer,
                        'total' => $item->total,
                    ];
                }
                return [
                    'month' => $item->month,
                    'cash' => $item->cash,
                    'card' => $item->card,
                    'mobile_money' => $item->mobile_money,
                    'bank_transfer' => $item->bank_transfer,
                    'total' => $item->total,
                ];
            });

        return response()->json($chartData);
    }

    protected function getStartDate($period)
    {
        return match ($period) {
            '3months' => now()->subMonths(3),
            '6months' => now()->subMonths(6),
            '12months' => now()->subMonths(12),
            'year' => now()->startOfYear(),
            'custom' => now()->subDays(30),
            default => now()->subMonths(6),
        };
    }

    protected function generateReceiptData(Order $order): array
    {
        return [
            'id' => $order->id,
            'date' => $order->order_date->format('Y-m-d H:i:s'),
            'items' => $order->items->map(function ($item) {
                return [
                    'name' => $item->product->product_name,
                    'quantity' => $item->quantity,
                    'price' => $item->price,
                    'discount' => $item->discount,
                    'subtotal' => $item->subtotal,
                ];
            }),
            'total' => $order->total_amount,
            'branch' => $order->branch->branch_name,
            'cashier' => $order->cashier->name,
            'payment_method' => $order->payment_method,
        ];
    }
}