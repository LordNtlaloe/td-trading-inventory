<?php

namespace App\Http\Controllers;

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
        $orders = Order::with('items')->get();
        return Inertia::render('Orders/Index', ['orders' => $orders]);
    }

    public function show($id): Response
    {
        $order = Order::with('items')->findOrFail($id);
        return Inertia::render('Orders/Show', ['order' => $order]);
    }

    public function processPayment(Request $request)
    {
        $validated = $request->validate([
            'items' => 'required|array',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.price' => 'required|numeric|min:0',
            'items.*.discount' => 'nullable|numeric|min:0',
            'total' => 'required|numeric|min:0',
            'branch_id' => 'required|exists:branches,id',
            'cashier_id' => 'required|exists:users,id',
        ]);

        try {
            DB::beginTransaction();

            // Create the order
            $order = Order::create([
                'total_amount' => $validated['total'],
                'branch_id' => $validated['branch_id'],
                'user_id' => $validated['cashier_id'],
                'status' => 'completed',
                'order_date' => now(),
            ]);

            // Process each item
            foreach ($validated['items'] as $item) {
                // Create order item
                OrderItem::create([
                    'order_id' => $order->id,
                    'product_id' => $item['product_id'],
                    'quantity' => $item['quantity'],
                    'price' => $item['price'],
                    'discount' => $item['discount'] ?? 0,
                    'subtotal' => ($item['price'] * $item['quantity']) - ($item['discount'] ?? 0),
                ]);

                // Update product inventory
                $product = Products::findOrFail($item['product_id']);

                // Check inventory
                if ($product->product_quantity < $item['quantity']) {
                    throw new \Exception("Insufficient inventory for {$product->product_name}");
                }

                // Reduce inventory
                $product->decrement('product_quantity', $item['quantity']);
            }

            DB::commit();

            return redirect()->route('orders.index')->with('success', 'Order processed successfully.');
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', $e->getMessage());
        }
    }
}
