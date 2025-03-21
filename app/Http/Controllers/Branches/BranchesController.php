<?php

namespace App\Http\Controllers\Branches;

use App\Models\Branch;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class BranchesController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return Inertia::render('branches/index', [
            "branches" => Branch::all()
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        if (Gate::denies('branch.create')) { // Changed from 'branche.create' to 'branch.create' for consistency
            return redirect()->route('branches.index')->with('error', 'You are not authorized to perform this action');
        }

        return Inertia::render('branches/create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'branch_name' => 'required|string|max:255',
            'branch_location' => 'required|string|max:255'
        ]);

        Branch::create([
            "branch_name" => $request->branch_name,
            "branch_location" => $request->branch_location
        ]);
        
        return redirect()->route('branches.index')->with('success', 'Branch created successfully');
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $branch = Branch::find($id);
        
        if (!$branch) {
            return redirect()->route('branches.index')->with('error', 'Branch does not exist');
        }

        return Inertia::render('branches/show', ['branch' => $branch]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        $branch = Branch::find($id);

        if (!$branch) {
            return redirect()->route('branches.index')->with('error', 'Branch does not exist');
        }

        if (Gate::denies('branch.edit', $branch)) { // Changed from 'branches.edit' to 'branch.edit'
            return redirect()->route('branches.index')->with('error', 'You are not authorized to perform this action');
        }

        return Inertia::render('branches/edit', [
            'branch' => $branch
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $request->validate([
            'branch_name' => 'required|string|max:255',
            'branch_location' => 'required|string|max:255'
        ]);

        $branch = Branch::find($id);
        
        if (!$branch) {
            return redirect()->route('branches.index')->with('error', 'Branch does not exist');
        }

        if (Gate::denies('branch.edit', $branch)) {
            return redirect()->route('branches.index')->with('error', 'You are not authorized to perform this action');
        }

        $branch->branch_name = $request->branch_name;
        $branch->branch_location = $request->branch_location;
        $branch->save();

        return redirect()->route('branches.index')->with('success', 'Branch updated successfully');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $branch = Branch::find($id);
        
        if (!$branch) {
            return redirect()->route('branches.index')->with('error', 'Branch does not exist');
        }

        if (Gate::denies('branch.delete', $branch)) {
            return redirect()->route('branches.index')->with('error', 'You are not authorized to perform this action');
        }

        $branch->delete();

        return redirect()->route('branches.index')->with('success', 'Branch deleted successfully');
    }
}