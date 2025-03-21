<?php

use App\Http\Controllers\Branches\BranchesController;
use App\Http\Controllers\Employees\EmployeesController;
use App\Http\Controllers\Products\ProductsController;
use App\Http\Controllers\UsersController;
use App\Models\Products;
use App\Models\Branch;
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
    Route::get('pos', function (Request $request) {
        $branchId = $request->query('branch_id');

        $productsQuery = Products::with('branch'); // Eager load branch details

        if ($branchId && $branchId !== 'all') {
            $productsQuery->where('branch_id', $branchId);
        }

        return Inertia::render('pos', [
            'all_products' => Products::with('branch')->get(), // Include branch details
            'filtered_products' => $productsQuery->get(), // Filtered by branch
            'branches' => Branch::select('id', 'branch_name')->get(),
        ]);
        
    })->name('pos');
});

Route::resource('branches', BranchesController::class)->middleware(['auth', 'verified']); 
Route::resource('products', ProductsController::class)->middleware(['auth', 'verified']);
Route::resource('users', UsersController::class)->middleware(['auth', 'verified']);
Route::resource('employees', EmployeesController::class)->middleware(['auth', 'verified']);
require __DIR__.'/settings.php';
require __DIR__.'/auth.php';