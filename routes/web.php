<?php

use App\Http\Controllers\Branches\BranchesController;
use App\Http\Controllers\Products\ProductsController;
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

Route::resource('branches', BranchesController::class)->middleware(['auth', 'verified']); 
Route::resource('products', ProductsController::class)->middleware(['auth', 'verified']);

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';