<?php

namespace App\Http\Controllers;

use App\Models\OrderItem;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class OrderItemController extends Controller
{
    public function index(): Response
    {
        $orderItems = OrderItem::all();
        return Inertia::render('OrderItems/Index', ['orderItems' => $orderItems]);
    }

    public function show($id): Response
    {
        $orderItem = OrderItem::findOrFail($id);
        return Inertia::render('OrderItems/Show', ['orderItem' => $orderItem]);
    }
}

