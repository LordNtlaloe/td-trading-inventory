<?php

namespace App\Http\Controllers\OrderItem;

use Illuminate\Support\Facades\Auth;
use App\Http\Controllers\Controller;
use App\Models\OrderItem;
use Inertia\Inertia;
use Inertia\Response;

class OrderItemController extends Controller
{
    public function index(): Response
    {
        $orderItems = OrderItem::with(['order', 'product'])
            ->latest()
            ->filter(request()->only(['search', 'order_id'])) // Added filtering
            ->paginate(15);

        return Inertia::render('OrderItems/Index', [
            'orderItems' => $orderItems,
            'filters' => request()->all(['search', 'order_id']),
        ]);
    }

    public function show($id): Response
    {
        $orderItem = OrderItem::with(['order', 'product', 'order.branch', 'order.cashier'])
            ->findOrFail($id);

        return Inertia::render('OrderItems/Show', [
            'orderItem' => $orderItem,
            'canRefund' => auth()->user()->can('refund', $orderItem), // Added authorization
        ]);
    }
}