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
    public function index(): Response
    {
        $orders = Order::with(['items.product', 'branch', 'cashier'])
            ->latest()
            ->paginate(10);

        return Inertia::render('Orders/Index', [
            'orders' => $orders,
            'filters' => request()->all(['search', 'status']), // Added filters
        ]);
    }

    public function show($id): Response
    {
        $order = Order::with(['items.product', 'branch', 'cashier'])
            ->findOrFail($id);

        return Inertia::render('Orders/Show', [
            'order' => $order,
            'canEdit' => auth()->user()->can('update', $order), // Added authorization
        ]);
    }

    public function processPayment(Request $request)
    {
        $validated = $request->validate([
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.price' => 'required|numeric|min:0',
            'items.*.discount' => 'nullable|numeric|min:0|max:' . $request->input('items.*.price'), // Ensure discount doesn't exceed price
            'total' => 'required|numeric|min:0',
            'branch_id' => 'required|exists:branches,id',
            'cashier_id' => 'required|exists:users,id',
        ]);

        try {
            DB::beginTransaction();

            $order = Order::create([
                'total_amount' => $validated['total'],
                'branch_id' => $validated['branch_id'],
                'user_id' => $validated['cashier_id'],
                'status' => 'completed',
                'order_date' => now(),
                'payment_method' => $request->input('payment_method', 'cash'), // Added payment method
            ]);

            foreach ($validated['items'] as $item) {
                $product = Products::findOrFail($item['product_id']);

                // More detailed stock validation
                if ($product->product_quantity < $item['quantity']) {
                    throw new \Exception("Insufficient stock for {$product->product_name}. Available: {$product->product_quantity}, Requested: {$item['quantity']}");
                }

                $subtotal = ($item['price'] * $item['quantity']) - ($item['discount'] ?? 0);

                OrderItem::create([
                    'order_id' => $order->id,
                    'product_id' => $item['product_id'],
                    'quantity' => $item['quantity'],
                    'price' => $item['price'],
                    'discount' => $item['discount'] ?? 0,
                    'subtotal' => $subtotal,
                ]);

                $product->decrement('product_quantity', $item['quantity']);
                
                // Optional: Track inventory changes
                $product->inventoryLogs()->create([
                    'quantity' => -$item['quantity'],
                    'remaining' => $product->product_quantity,
                    'reason' => 'POS order #' . $order->id,
                ]);
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'order' => $order->load(['items.product', 'branch', 'cashier']),
                'message' => 'Order processed successfully',
                'receipt_data' => $this->generateReceiptData($order), // Added receipt data
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            report($e); // Log the exception
            return response()->json([
                'success' => false,
                'message' => 'Order processing failed: ' . $e->getMessage(),
            ], 500);
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