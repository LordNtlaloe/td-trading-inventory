<?php

use App\Http\Controllers\BranchesController;
use Inertia\Inertia;
use Illuminate\Support\Facades\Route;

// Route::middleware('auth')->group(function () {
//     Route::get('branches', function(){
//         return Inertia::render('branches/branches');
//     })->name('branches');
//     Route::get('settings/profile', [BranchesController::class, 'edit'])->name('profile.edit');
//     Route::patch('settings/profile', [BranchesController::class, 'update'])->name('profile.update');
//     Route::delete('settings/profile', [BranchesController::class, 'destroy'])->name('profile.destroy');

//     Route::get('settings/password', [BranchesController::class, 'edit'])->name('password.edit');
//     Route::put('settings/password', [BranchesController::class, 'update'])->name('password.update');

//     Route::get('settings/appearance', function () {
//         return Inertia::render('settings/appearance');
//     })->name('appearance');
// });
