<?php

namespace App\Http\Controllers\Products;

use App\Models\Branch;
use App\Models\Products;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class ProductsController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $user = Auth::user();
        $branchId = $request->query('branch_id');

        // Start with base query
        $productsQuery = Products::with('branch');

        // Apply branch filter based on user role
        if ($user->role !== 'Admin') {  // Changed from !$user->isAdmin()
            // For non-admin users (employees), only show products from their branch
            if ($user->employee && $user->employee->branch_id) {
                $productsQuery->where('branch_id', $user->employee->branch_id);
            } else {
                // If employee doesn't have a branch assigned, show nothing
                $productsQuery->where('branch_id', -1);
            }
        } elseif ($branchId && $branchId !== 'all') {
            // For admins, allow filtering by branch
            $productsQuery->where('branch_id', $branchId);
        }

        return Inertia::render('products/index', [
            'products' => $productsQuery->get(),
            'branches' => Branch::select('id', 'branch_name')->get(),
            'user_role' => $user->role,
            'current_branch' => $user->role !== 'Admin' ?
                ($user->employee->branch_id ?? null) : null,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        $user = Auth::user();

        // For employees, only allow creating products for their branch
        $branchesQuery = Branch::query();
        if ($user->role === 'employee') {
            $branchesQuery->where('id', $user->employee->branch_id);
        }

        return Inertia::render('products/create', [
            'branches' => $branchesQuery->get(['id', 'branch_name']),
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $user = Auth::user();

        $request->validate([
            'product_name' => "required|string|max:255",
            'product_price' => 'required|numeric',
            'product_category' => 'required|string|max:255',
            'product_quantity' => 'required|numeric',
            'branch_id' => 'required|numeric|exists:branches,id',
            'product_commodity' => 'required|string|max:255',
            'product_grade' => 'required|string|max:1'
        ]);

        // For employees, ensure they can only create products for their branch
        if ($user->role === 'employee') {
            if ($request->branch_id != $user->employee->branch_id) {
                abort(403, 'Unauthorized action.');
            }
        }

        Products::create([
            "product_name" => $request->product_name,
            "product_price" => $request->product_price,
            "product_category" => $request->product_category,
            "product_quantity" => $request->product_quantity,
            "branch_id" => $request->branch_id,
            "product_commodity" => $request->product_commodity,
            "product_grade" => $request->product_grade
        ]);

        return redirect()->route("products.index");
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $product = Products::with('branch')->findOrFail($id);
        $user = Auth::user();

        // For employees, ensure product belongs to their branch
        if ($user->role === 'employee') {
            if ($product->branch_id != $user->employee->branch_id) {
                abort(403, 'Unauthorized action.');
            }
        }

        return Inertia::render('products/show', [
            "product" => $product
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        $product = Products::findOrFail($id);
        $user = Auth::user();

        // For employees, ensure product belongs to their branch
        if ($user->role === 'employee') {
            if ($product->branch_id != $user->employee->branch_id) {
                abort(403, 'Unauthorized action.');
            }
        }

        // For employees, only show their branch
        $branchesQuery = Branch::query();
        if ($user->role === 'employee') {
            $branchesQuery->where('id', $user->employee->branch_id);
        }

        return Inertia::render('products/edit', [
            "product" => $product,
            "branches" => $branchesQuery->get(['id', 'branch_name']),
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $product = Products::findOrFail($id);
        $user = Auth::user();

        // For employees, ensure product belongs to their branch
        if ($user->role === 'employee') {
            if ($product->branch_id != $user->employee->branch_id) {
                abort(403, 'Unauthorized action.');
            }
        }

        $request->validate([
            'product_name' => "required|string|max:255",
            'product_price' => 'required|numeric',
            'product_category' => 'required|string|max:255',
            'product_quantity' => 'required|numeric',
            'branch_id' => 'required|numeric|exists:branches,id',
            'product_commodity' => 'required|string|max:255',
            'product_grade' => 'required|string|max:1',
        ]);

        // For employees, ensure they can only assign to their branch
        if ($user->role === 'employee') {
            if ($request->branch_id != $user->employee->branch_id) {
                abort(403, 'Unauthorized action.');
            }
        }

        $product->update($request->all());

        return redirect()->route('products.index')->with('success', 'Product updated successfully!');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $product = Products::findOrFail($id);
        $user = Auth::user();

        // For employees, ensure product belongs to their branch
        if ($user->role === 'employee') {
            if ($product->branch_id != $user->employee->branch_id) {
                abort(403, 'Unauthorized action.');
            }
        }

        $product->delete();
        return redirect()->route('products.index');
    }
}
