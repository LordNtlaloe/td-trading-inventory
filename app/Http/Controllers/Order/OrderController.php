<?php

namespace App\Http\Controllers\Order;

use App\Http\Controllers\Controller;
use App\Models\Branch;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Products; // This is correct, but we need to use it properly below
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\Auth;

class OrderController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user();
        $branchId = $request->query('branch_id');
        
        // Start with base query
        $query = Order::with(['branch', 'cashier'])
            ->withCount('items')
            ->latest();

        // Apply branch filter based on user role
        if ($user->role !== 'Admin') {
            // For non-admin users (employees), only show orders from their branch
            if ($user->employee && $user->employee->branch_id) {
                $query->where('branch_id', $user->employee->branch_id)
                      ->where('user_id', $user->id); // user_id is the cashier who created the order
            } else {
                // If employee doesn't have a branch assigned, show nothing
                $query->where('branch_id', -1);
            }
        } elseif ($branchId && $branchId !== 'all') {
            // For admins, allow filtering by branch when branch_id is provided
            $query->where('branch_id', $branchId);
        }

        $orders = $query->get();

        return inertia('orders/index', [
            'orders' => $orders->isEmpty() ? [] : $orders->toArray(),
            'user_role' => $user->role,
            'branches' => Branch::select('id', 'branch_name')->get(),
            'current_branch' => $user->role !== 'Admin' ?
                ($user->employee->branch_id ?? null) : null,
            'auth' => [
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                ]
            ]
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
            'items.*.subtotal' => 'required|numeric|min:0',
            'total_amount' => 'required|numeric|min:0',
            'payment_method' => 'required|string|in:cash,card,mobile',
            'amount_received' => 'required_if:payment_method,cash|numeric|min:0',
            'change_amount' => 'nullable|numeric|min:0',
            'payment_reference' => 'nullable|string|max:255',
        ]);
        DB::beginTransaction();
    
        try {
            $order = Order::create([
                'total_amount' => $validated['total_amount'],
                'branch_id' => $validated['branch_id'],
                'user_id' => $validated['cashier_id'],
                'status' => 'completed',
                'order_date' => now(),
                'payment_method' => $validated['payment_method'],
                'amount_received' => $validated['amount_received'] ?? $validated['total_amount'],
                'change_amount' => $validated['change_amount'] ?? 0,
                'payment_reference' => $validated['payment_reference'] ?? null,
            ]);
    
            foreach ($validated['items'] as $item) {
                OrderItem::create([
                    'order_id' => $order->id,
                    'product_id' => $item['product_id'],
                    'quantity' => $item['quantity'],
                    'price' => $item['price'],
                    'discount' => $item['discount'],
                    'subtotal' => $item['subtotal'],
                ]);
                Products::where('id', $item['product_id'])
                    ->decrement('product_quantity', $item['quantity']);
            }
    
            DB::commit();
    
            // Load relationships for the receipt
            $order->load(['items.product', 'branch', 'cashier']);
    
            // Redirect back with order data in session (flash)
            return redirect()->back()->with([
                'order' => $order,
                'success' => 'Order processed successfully'
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