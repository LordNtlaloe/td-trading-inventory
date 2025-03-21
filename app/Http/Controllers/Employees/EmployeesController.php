<?php

namespace App\Http\Controllers\Employees;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Gate;
use App\Models\Employee;
use Illuminate\Http\Request;
use Inertia\Inertia;

class EmployeesController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return Inertia::render('employees/index', [
            'employees' => Employee::all()
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return Inertia::render('employeee/create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            "user_id" => "required|numeric",
            "branch_id" => "required|numeric"
        ]);

        Employee::create([
            "user_id" => $request->user_id,
            "branch_id" => $request->branch_id
        ]);

        return redirect()->route("employees/index");
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $employee = Employee::find($id);

        if(!$employee){
            return Inertia::render('employees/errors', ["message" => "Employee Record Does Not Exist"]);
        }

        return Inertia::render("employees/index", ["employee" => $employee]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        $employee = Employee::find($id);

        if(!$employee){
            return Inertia::render('employees/errors', ["message" => "Employee Record Does Not Exist"]);
        }

        if (Gate::denies('employees.edit', $employee)) {
            return Inertia::render('branches/index')->with('error', 'You Are Not Authorized To Perform This Action');
        }

        return Inertia::render("employees/index", ["employee" => $employee]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $request->validate([
            "user_id" => 'required|numeric',
            "branch_id" => 'required|numeric'
        ]);

        $employee = Employee::find($id);

        if(!$employee){
            return Inertia::render("employees/errors", ["message" => "Employee Record Does Not Exist"]);
        }

        $employee->user_id = $request->user_id;
        $employee->branch_id = $request->branch_id;
        $employee->save();

        return redirect()->route("emplyees/index")->with('success', 'Emplyoyee Record Updated Successfully');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $employee = Employee::find($id);
        
        if(!$employee){
            return Inertia::render("employees/errors", ["message" => "Employee Record Does Not Exist"]);
        }

        if (Gate::denies('employees.edit', $employee)) {
            return Inertia::render('branches/index')->with('error', 'You Are Not Authorized To Perform This Action');
        }

        $employee->delete();

        return redirect()->route("emplyees/index")->with('success', 'Emplyoyee Record Updated Successfully');
    }
}
