<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->string("product_name");
            $table->decimal("product_price", 10, 2);
            $table->integer("product_quantity");
            $table->string("product_category");
            $table->foreignId("branch_id")->constrained('branches')->onDelete('cascade');
            $table->timestamps();
            $table->enum('product_commodity', ['New Tyre', 'Used Tyre']);
            $table->enum('product_grade', ['A', 'B', 'C']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
