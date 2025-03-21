<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    use HasFactory;

    protected $fillable = [
        'total_amount', 'branch_id', 'user_id', 'status', 'order_date'
    ];

    public function items()
    {
        return $this->hasMany(OrderItem::class);
    }
}
