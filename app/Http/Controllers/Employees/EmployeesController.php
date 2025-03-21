<?php

namespace App\Http\Controllers\Employees;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Hash;
use App\Models\Employee;
use App\Models\User;
use App\Models\Branch;
use Illuminate\Http\Request;
use Illuminate\Validation\Rules;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class EmployeesController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $employees = Employee::with(['user', 'branch'])
            ->get()
            ->map(function ($employee) {
                return [
                    'id' => $employee->id,
                    'employee_name' => $employee->user->name,
                    'employee_location' => $employee->branch->branch_name,
                    'user_id' => $employee->user_id,
                    'branch_id' => $employee->branch_id,
                ];
            });

        return Inertia::render('employees/index', [
            'employees' => $employees
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return Inertia::render('employees/create', [
            'branches' => Branch::all()
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|lowercase|email|max:255|unique:'.User::class,
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            'branch_id' => 'required|exists:branches,id',
        ]);

        // Use a transaction to ensure both user and employee are created or neither
        DB::beginTransaction();
        
        try {
            // First create the user
            $user = User::create([
                'name' => $request->name,
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'role' => 'employee', // Set default role
            ]);

            // Then create the employee record
            Employee::create([
                'user_id' => $user->id,
                'branch_id' => $request->branch_id,
            ]);

            DB::commit();
            
            return redirect()->route('employees.index')
                ->with('success', 'Employee created successfully');
                
        } catch (\Exception $e) {
            DB::rollBack();
            
            return redirect()->back()
                ->withInput()
                ->with('error', 'Failed to create employee: ' . $e->getMessage());
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $employee = Employee::with(['user', 'branch'])->find($id);

        if(!$employee){
            return redirect()->route('employees.index')
                ->with('error', 'Employee Record Does Not Exist');
        }

        return Inertia::render('employees/show', [
            'employee' => [
                'id' => $employee->id,
                'employee_name' => $employee->user->name,
                'employee_location' => $employee->branch->branch_name,
                'email' => $employee->user->email,
                'user_id' => $employee->user_id,
                'branch_id' => $employee->branch_id,
            ]
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        $employee = Employee::with(['user', 'branch'])->find($id);

        if(!$employee){
            return redirect()->route('employees.index')
                ->with('error', 'Employee Record Does Not Exist');
        }

        if (Gate::denies('employees.edit', $employee)) {
            return redirect()->route('employees.index')
                ->with('error', 'You Are Not Authorized To Perform This Action');
        }

        return Inertia::render('employees/edit', [
            'employee' => [
                'id' => $employee->id,
                'name' => $employee->user->name,
                'email' => $employee->user->email,
                'branch_id' => $employee->branch_id,
                'user_id' => $employee->user_id,
            ],
            'branches' => Branch::all()
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'branch_id' => 'required|exists:branches,id',
        ]);

        $employee = Employee::with('user')->find($id);

        if(!$employee){
            return redirect()->route('employees.index')
                ->with('error', 'Employee Record Does Not Exist');
        }

        // Update user name
        $employee->user->name = $request->name;
        $employee->user->save();
        
        // Update employee branch
        $employee->branch_id = $request->branch_id;
        $employee->save();

        return redirect()->route('employees.index')
            ->with('success', 'Employee Record Updated Successfully');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $employee = Employee::find($id);
        
        if(!$employee){
            return redirect()->route('employees.index')
                ->with('error', 'Employee Record Does Not Exist');
        }

        if (Gate::denies('employees.delete', $employee)) {
            return redirect()->route('employees.index')
                ->with('error', 'You Are Not Authorized To Perform This Action');
        }

        $employee->delete();

        return redirect()->route('employees.index')
            ->with('success', 'Employee Record Deleted Successfully');
    }
}