<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Products extends Model
{
    use HasFactory;

    protected $fillable = [
        'product_name',
        'product_price',
        'product_quantity',
        'product_category',
        'branch_id',
        'product_commodity',
        'product_grade',

    ];
}
