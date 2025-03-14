<?php

namespace App\Http\Controllers\Branches;

use App\Models\Branch;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Inertia\Inertia;

class BranchesController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return Inertia::render('branches/branches', [
            "branches" => Branch::all()
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return Inertia::render('branches/create-branch', []);
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
        return redirect()->route('branches.index');
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $branch = Branch::find($id);
        if (!$branch) {
            // Instead of returning a plain JSON response, return an Inertia response.
            return Inertia::render('branches/error', ['message' => 'Branch Does Not Exist']);
        }

        // Render the branch details using Inertia.
        return Inertia::render('branches/show-branch', ['branch' => $branch]);
    }

    public function edit(string $id)
    {
        $branch = Branch::find($id);
        if (!$branch) {
            // Instead of returning a plain JSON response, return an Inertia response.
            return Inertia::render('branches/error', ['message' => 'Branch Does Not Exist']);
        }
        return Inertia::render('branches/edit-branch', [
            "branch" => $branch
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
            // Instead of returning a plain JSON response, return an Inertia response.
            return Inertia::render('branches/error', ['message' => 'Branch Does Not Exist']);
        }
        $branch->branch_name = $request->branch_name;
        $branch->branch_location = $request->branch_location;
        $branch->save();

        // After updating, redirect back to the branches index.
        return redirect()->route('branches.index');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $branch = Branch::find($id);
        if (!$branch) {
            // Instead of returning a plain JSON response, return an Inertia response.
            return Inertia::render('branches/error', ['message' => 'Branch Does Not Exist']);
        }

        $branch->delete();

        // Redirect to the index after deletion with a success message.
        return redirect()->route('branches.index')->with('message', 'Branch Deleted Successfully');
    }
}
