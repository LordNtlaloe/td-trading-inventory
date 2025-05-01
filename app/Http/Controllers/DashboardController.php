<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\Products;
use App\Models\Employee;
use App\Models\Branch;
use Illuminate\Http\Request;
use Carbon\Carbon;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;

class DashboardController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth'); // Ensure user is authenticated
    }

    public function index(Request $request)
    {
        $user = Auth::user();
    
    if (!$user) {
        return redirect()->route('login');
    }

    $period = $request->input('period', '6months');
    [$startDate, $previousStartDate] = $this->getDateRange($period);

    // Initialize variables
    $employee = null;
    $branchId = null;
    $branchName = 'All Branches';
    $isEmployee = in_array($user->role, ['cashier', 'manager']);
    
    if ($isEmployee) {
        $employee = Employee::where('user_id', $user->id)->first();
        $branchId = $employee->branch_id ?? null;
        if ($branchId) {
            $branch = Branch::find($branchId);
            $branchName = $branch->branch_name ?? 'All Branches';
        }
    }

    // Base queries with branch filtering
    $productsQuery = Products::when($branchId, fn($q) => $q->where('branch_id', $branchId));
    $employeesQuery = Employee::when($branchId, fn($q) => $q->where('branch_id', $branchId));
    $ordersQuery = Order::when($branchId, fn($q) => $q->where('branch_id', $branchId));
    $branchesQuery = Branch::query();

    // Current counts
    $productsCount = $productsQuery->count();
    $employeesCount = $employeesQuery->count();
    $branchesCount = $isEmployee ? 1 : $branchesQuery->count();
    $ordersCount = $ordersQuery->where('created_at', '>=', $startDate)->count();

    // Previous period counts
    $previousProductsCount = $productsQuery
        ->whereBetween('created_at', [$previousStartDate, $startDate])
        ->count();
    $previousEmployeesCount = $employeesQuery
        ->whereBetween('created_at', [$previousStartDate, $startDate])
        ->count();
    $previousBranchesCount = $isEmployee ? 1 : $branchesQuery
        ->whereBetween('created_at', [$previousStartDate, $startDate])
        ->count();
    $previousOrdersCount = $ordersQuery
        ->whereBetween('created_at', [$previousStartDate, $startDate])
        ->count();

    // Chart data - now with both counts and monetary values
    $chartData = $ordersQuery
        ->with('branch')
        ->where('created_at', '>=', $startDate)
        ->orderBy('created_at')
        ->get()
        ->groupBy(function ($order) {
            return $order->created_at->format('Y-m');
        })
        ->map(function ($monthOrders, $monthYear) {
            return [
                'month' => Carbon::createFromFormat('Y-m', $monthYear)->format('F'),
                'cash' => $monthOrders->where('payment_method', 'cash')->sum('total'),
                'card' => $monthOrders->where('payment_method', 'card')->sum('total'),
                'mobile_money' => $monthOrders->where('payment_method', 'mobile_money')->sum('total'),
                'bank_transfer' => $monthOrders->where('payment_method', 'bank_transfer')->sum('total'),
                'total_orders' => $monthOrders->count(),
                'total' => $monthOrders->sum('total')
            ];
        })
        ->values()
        ->toArray();

        return Inertia::render('dashboard', [
            'products' => $productsCount,
            'employees' => $employeesCount,
            'branches' => $branchesCount,
            'orders' => $ordersCount,
            'previousPeriodProducts' => $previousProductsCount,
            'previousPeriodEmployees' => $previousEmployeesCount,
            'previousPeriodBranches' => $previousBranchesCount,
            'previousPeriodOrders' => $previousOrdersCount,
            'chartData' => $chartData,
            'period' => $period,
            'branchName' => $branchName,
            'auth' => [
                'user' => $user
            ],
            'employee' => $employee ? [
                'branch_id' => $employee->branch_id,
                'branch_name' => $branchName
            ] : null,
        ]);
    }

    private function getDateRange($period)
    {
        $months = match ($period) {
            '3months' => 3,
            '6months' => 6,
            '12months' => 12,
            'year' => 12,
            'custom' => 1,
            default => 6,
        };

        $startDate = now()->subMonths($months);
        $previousStartDate = now()->subMonths($months * 2);

        return [$startDate, $previousStartDate];
    }
}