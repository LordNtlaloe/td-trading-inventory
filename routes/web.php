<?php
use Illuminate\Support\Facades\Auth;
use App\Http\Controllers\Branches\BranchesController;
use App\Http\Controllers\Employees\EmployeesController;
use App\Http\Controllers\Products\ProductsController;
use App\Http\Controllers\UsersController;
use App\Http\Controllers\Order\OrderController;
use App\Http\Controllers\OrderItem\OrderItemController;
use App\Http\Controllers\DashboardController;
use App\Models\Products;
use App\Models\Branch;
use App\Models\Employee;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

// Route::middleware(['auth', 'verified'])->group(function () {
//     Route::get('dashboard', function () {
//         $products = Products::all();
//         $employees = Employee::all();
//         $branches = Branch::all();
//         $orders = Order::all();
        
//         return Inertia::render('dashboard', [
//             "products" => $products,
//             "employees" => $employees,
//             "branches" => $branches,
//             "orders" => $orders
//         ]);
//     })->name('dashboard');
// });

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('pos', function () {
        $user = Auth::user();
        $employee = null;
        
        // Get employee record for non-manager users
        if ($user->role !== 'manager') {
            $employee = Employee::where('user_id', $user->id)
                ->with('branch')
                ->first();
        }

        // Get all branches
        $branches = Branch::select('id', 'branch_name', 'branch_location')->get();

        // Get all products
        $allProducts = Products::with('branch')->get();
        $filteredProducts = $allProducts;

        // If user is not a manager and has an assigned branch, filter products
        if ($user->role !== 'manager' && $employee?->branch_id) {
            $filteredProducts = $allProducts->filter(function ($product) use ($employee) {
                return $product->branch_id === $employee->branch_id;
            })->values();
        }

        return Inertia::render('pos', [
            'filtered_products' => $filteredProducts,
            'branches' => $branches,
            'employee' => $employee,
            'requires_branch_selection' => $user->role !== 'manager' && !$employee?->branch_id,
        ]);
    })->name('pos');
    
    // Add route to handle branch selection
    Route::post('pos/select-branch', function (Request $request) {
        $request->validate(['branch_id' => 'required|exists:branches,id']);
        
        $user = Auth::user();
        
        // Update or create employee record
        Employee::updateOrCreate(
            ['user_id' => $user->id],
            ['branch_id' => $request->branch_id]
        );
        
        return redirect()->route('pos');
    })->middleware('auth')->name('pos.select-branch');
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
Route::resource('dashboard', DashboardController::class)->middleware(['auth', 'verified']);
Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
