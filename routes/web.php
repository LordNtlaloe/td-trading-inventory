<?php

use App\Http\Controllers\Branches\BranchesController;
use App\Http\Controllers\Employees\EmployeesController;
use App\Http\Controllers\Products\ProductsController;
use App\Http\Controllers\UsersController;
use App\Models\Products;
use App\Models\Branch;
use App\Models\Employee;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');
});

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('pos', function () {
        
        $user = auth()->user();
        
        // Get the employee record and their branch if the user is not a manager
        $employee = null;
        if ($user->role !== 'Manager' || $user->role !== 'Cashier') {
            $employee = Employee::where('user_id', $user->id)
                ->with('branch')
                ->first();
        }
        
        // Get all products for reference (managers can see all)
        $allProducts = Products::with('branch')->get();
        
        // Get products filtered by branch
        $filteredProducts = $allProducts;
        
        // If user is not a manager, filter by their branch
        if ($user->role !== 'manager' && $employee) {
            $filteredProducts = $allProducts->filter(function ($product) use ($employee) {
                return $product->branch_id === $employee->branch_id;
            })->values();
        }
        
        return Inertia::render('pos', [
            'all_products' => $allProducts,
            'filtered_products' => $filteredProducts,
            'branches' => Branch::select('id', 'branch_name')->get(),
            'employee' => $employee,
        ]);
    })->name('pos');
});
Route::resource('branches', BranchesController::class)->middleware(['auth', 'verified']); 
Route::resource('products', ProductsController::class)->middleware(['auth', 'verified']);
Route::resource('users', UsersController::class)->middleware(['auth', 'verified']);
Route::resource('employees', EmployeesController::class)->middleware(['auth', 'verified']);
require __DIR__.'/settings.php';
require __DIR__.'/auth.php';