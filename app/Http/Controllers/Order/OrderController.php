<?php

namespace App\Http\Controllers\Order;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Products;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class OrderController extends Controller
{
    public function index()
    {
        $orders = Order::with(['branch', 'cashier'])
            ->withCount('items')
            ->latest()
            ->get();

        return inertia('orders/index', [
            'orders' => $orders->isEmpty() ? [] : $orders->toArray(),
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
        'canEdit' => auth()->user()->can('update', $order),
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
        ]);

        DB::beginTransaction();

        try {
            $order = Order::create([
                'total_amount' => $validated['total'],
                'branch_id' => $validated['branch_id'],
                'user_id' => $validated['cashier_id'],
                'status' => 'completed',
                'order_date' => now(),
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
            }

            DB::commit();

            return redirect()->back()->with([
                'order' => $order->load(['items.product', 'branch', 'cashier']),
                'success' => 'Order processed successfully!'
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->withErrors([
                'error' => 'Failed to process order: ' . $e->getMessage()
            ]);
        }
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
            'branch' => $order->branch->name,
            'cashier' => $order->cashier->name,
        ];
    }

    
}
