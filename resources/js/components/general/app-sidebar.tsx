import { NavMain } from '@/components/general/nav-main';
import { NavUser } from '@/components/general/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { SharedData, type NavItem } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { LayoutGrid, MapPinIcon, Package, Monitor, User, Users, Receipt } from 'lucide-react';
import AppLogo from './app-logo';

// Define all possible nav items (unchanged)
const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
        icon: LayoutGrid,
    },
    {
        title: 'Users',
        href: '/users',
        icon: User,
    },
    {
        title: 'Employees',
        href: '/employees',
        icon: Users,
    },
    {
        title: 'POS',
        href: '/pos',
        icon: Monitor,
    },
    {
        title: 'Products',
        href: '/products',
        icon: Package,
    },
    {
        title: 'Branches',
        href: '/branches',
        icon: MapPinIcon,
    },
    {
        title: 'Sales',
        href: '/orders',
        icon: Receipt,
    },
];

export function AppSidebar() {
    const { auth } = usePage<SharedData>().props;

    const userRole = auth.user.role;
    
    const filteredNavItems = mainNavItems.filter((item) => {
        if (userRole === 'Admin') {
            return true; // Show all items for admin
        } else if (userRole === 'Manager') {
            return !['Users'].includes(item.title); // Hide "Users" for manager
        } else if (userRole === 'Cashier') {
            return !['Users', 'Employees', 'Branches'].includes(item.title); // Hide these for cashier
        }
        return false; // Default: hide all (or adjust as needed)
    });

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild className='rounded-lg'>
                            <Link href="/dashboard" prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={filteredNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}