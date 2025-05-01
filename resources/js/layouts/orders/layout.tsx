"use client"

import { Link, usePage } from "@inertiajs/react"
import { cn } from "@/lib/utils"
import { type PropsWithChildren } from "react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

type Branch = {
    id: number
    branch_name: string
}

export default function OrdersLayout({ children }: PropsWithChildren) {
    const { branches, user_role } = usePage<{ 
        branches?: Branch[]
        user_role: string
    }>().props

    const isAdmin = user_role === 'Admin'

    return (
        <div className="px-4 py-6">
            <div className="flex flex-col space-y-8 lg:flex-row lg:space-y-0 lg:space-x-12">
                {/* Sidebar - Only show for admin users */}
                {isAdmin && branches && (
                    <aside className="w-full max-w-xl lg:w-48">
                        <nav className="flex flex-col space-y-1 space-x-0">
                            <Button
                                variant="ghost"
                                asChild
                                className={cn('w-full justify-start')}
                            >
                                <Link href="/orders" prefetch>All Orders</Link>
                            </Button>
                            {branches.map((branch) => (
                                <Button
                                    key={branch.id}
                                    variant="ghost"
                                    asChild
                                    className={cn('w-full justify-start')}
                                >
                                    <Link href={`/orders?branch_id=${branch.id}`} prefetch>
                                        {branch.branch_name}
                                    </Link>
                                </Button>
                            ))}
                        </nav>
                    </aside>
                )}

                {/* Separator for larger screens - Only show if sidebar is visible */}
                {isAdmin && <Separator className="my-6 md:hidden" />}

                {/* Main Content */}
                <div className={cn("flex-1 w-full", {
                    "lg:max-w-4xl xl:max-w-6xl": !isAdmin,
                    "lg:max-w-5xl xl:max-w-7xl": isAdmin
                })}>
                    {children}
                </div>
            </div>
        </div>
    )
}