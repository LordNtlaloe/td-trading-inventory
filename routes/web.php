<?php
use Illuminate\Support\Facades\Auth;
use App\Http\Controllers\Branches\BranchesController;
use App\Http\Controllers\Employees\EmployeesController;
use App\Http\Controllers\Products\ProductsController;
use App\Http\Controllers\UsersController;
use App\Http\Controllers\Order\OrderController;
use App\Http\Controllers\OrderItem\OrderItemController;
use App\Models\Products;
use App\Models\Branch;
use App\Models\Employee;
use App\Models\Order;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        $products = Products::all();
        $employees = Employee::all();
        $branches = Branch::all();
        $orders = Order::all();
        
        return Inertia::render('dashboard', [
            "products" => $products,
            "employees" => $employees,
            "branches" => $branches,
            "orders" => $orders
        ]);
    })->name('dashboard');
});

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('pos', function () {

        $user = Auth::user();

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

Route::middleware(['auth', 'verified'])->group(function () {
    // Orders
    Route::get('/orders', [OrderController::class, 'index'])->name('orders');
    Route::get('/orders/{order}', [OrderController::class, 'show'])->name('orders.show');
    Route::post('/orders/process-payment', [OrderController::class, 'processPayment'])->name('orders.process-payment');

    // Order Items
    Route::get('/order-items', [OrderItemController::class, 'index'])->name('order-items.index');
    Route::get('/order-items/{orderItem}', [OrderItemController::class, 'show'])->name('order-items.show');
});
Route::resource('branches', BranchesController::class)->middleware(['auth', 'verified']);
Route::resource('products', ProductsController::class)->middleware(['auth', 'verified']);
Route::resource('users', UsersController::class)->middleware(['auth', 'verified']);
Route::resource('employees', EmployeesController::class)->middleware(['auth', 'verified']);
require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
