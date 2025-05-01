<?php

namespace App\Providers;

use App\Models\User;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Define gates for branch permissions
        Gate::define('branches.manage', function (?User $user) {
            return in_array($user?->role, ['Admin', 'Manager']);
        });
        Gate::define('create', function ($user) {
            return $user->role === 'Admin';
        });
    
        Gate::define('edit', function ($user) {
            return $user->role === 'Admin';
        });
    
        Gate::define('delete', function ($user) {
            return $user->role === 'Admin';
        });
        // Share auth data with Inertia
        Inertia::share([
            'auth' => function () {
                return [
                    'user' => Auth::user() ? [
                        'id' => Auth::user()->id,
                        'name' => Auth::user()->name,
                        'email' => Auth::user()->email,
                        'role' => Auth::user()->role,
                        // Add other user fields as needed
                    ] : null,
                ];
            },
            // You can add other shared data here
        ]);
    }
}