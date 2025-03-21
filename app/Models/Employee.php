<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Employee extends Model
{
    use HasFactory;

    // Define the relationship with the User model (one-to-one)
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // Define the relationship with the Branch model (belongs to one)
    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }
}
