<?php

namespace App\Http\Controllers\Products;

use App\Models\Branch;
use App\Models\Products;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Inertia\Inertia;

class ProductsController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $branchId = $request->query('branch_id');

        $productsQuery = Products::query();

        if ($branchId && $branchId !== 'all') {
            $productsQuery->where('branch_id', $branchId);
        }

        return Inertia::render('products/index', [
            'all_products' => Products::all(), // Unfiltered products
            'filtered_products' => $productsQuery->get(), // Filtered by branch
            'branches' => Branch::select('id', 'branch_name')->get(),
        ]);
    }


    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return Inertia::render('products/create', [
            'branches' => Branch::select('id', 'branch_name')->get(),
        ]);
    }


    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'product_name' => "required|string|max:255",
            'product_price' => 'required|numeric',
            'product_category' => 'required|string|max:255',
            'product_quantity' => 'required|numeric',
            'branch_id' => 'required|numeric',
            'product_commodity' => 'required|string|max:255',
            'product_grade' => 'required|string|max:1'
        ]);

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
        $product = Products::find($id);
        if (!$product) {
            return Inertia::render('products.errors', ["message" => "Product Does Not Exist"]);
        }

        return Inertia::render('products/product', ["product" => $product]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        $product = Products::find($id);
        if (!$product) {
            return Inertia::render('product.errors', ["message" => "Product Does Not Exist"]);
        }
        return Inertia::render("products/edit", [
            "product" => $product
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        // Validate incoming request
        $request->validate([
            'product_name' => "required|string|max:255",
            'product_price' => 'required|numeric',
            'product_category' => 'required|string|max:255',
            'product_quantity' => 'required|numeric',
            'branch_id' => 'required|numeric',
            'product_commodity' => 'required|string|max:255',
            'product_grade' => 'required|string|max:1',
        ]);

        // Find the product by ID
        $product = Products::find($id);

        // If product not found, return an error message
        if (!$product) {
            return Inertia::render('products.errors', ["message" => "Product Does Not Exist"]);
        }

        // Update the product's details
        $product->update([
            'product_name' => $request->product_name,
            'product_price' => $request->product_price,
            'product_category' => $request->product_category,
            'product_quantity' => $request->product_quantity,
            'branch_id' => $request->branch_id,
            'product_commodity' => $request->product_commodity,
            'product_grade' => $request->product_grade,
        ]);

        // Redirect to the product list with a success message
        return redirect()->route('products.index')->with('success', 'Product updated successfully!');
    }


    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $product = Products::find($id);
        if (!$product) {
            return Inertia::render("product.error", ["message" => "Product Does Not Exist"]);
        }
        $product->delete();
        return redirect()->route('products.index');
    }
}
