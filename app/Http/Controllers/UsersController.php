<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rules;
use Illuminate\Support\Facades\Hash;


class UsersController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return Inertia::render('users/index', [
            "users" => User::all()
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        
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
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
        ]);


    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        $user = User::find($id);

        if(!$user){
            return redirect()->route('users.index')->with('error', 'User Does Not Exist');

        }

        // if (Gate::denies('users.edit', $user)) {
        //     return redirect()->route('users.index')->with('error', 'You Are Not Authorized To Perform This Action');
        // }

        return Inertia::render('users/edit', [
            'user' => $user 
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $request->validate([
            'role' => 'required|string|max:255',
        ]);

        $user = User::find($id);
        if (!$user) {
            return Inertia::render('users/index')->with('error', 'User Does Not Exist');
        }

        $user->role = $request->role;
        $user->save();
        return redirect()->route('users.index')->with('success', 'User Role Updated Succesfully');


    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $user = User::find($id);
        if(!$user){
            return Inertia::render('users/index')->with('error', 'User Does Not Exist');
        }
        
        if (Gate::denies('users.edit', $user)) {
            return redirect()->route('users.index')->with('error', 'You Are Not Authorized To Perform This Action');
        }

        $user->delete();
    }
}
