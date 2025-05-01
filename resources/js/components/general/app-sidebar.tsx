import { NavFooter } from '@/components/general/nav-footer';
import { NavMain } from '@/components/general/nav-main';
import { NavUser } from '@/components/general/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { SharedData, type NavItem } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { BookOpen, Folder, LayoutGrid, MapPinIcon, Package, Monitor, User, Users, Receipt } from 'lucide-react';
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

const footerNavItems: NavItem[] = [
    {
        title: 'Repository',
        href: 'https://github.com/laravel/react-starter-kit',
        icon: Folder,
    },
    {
        title: 'Documentation',
        href: 'https://laravel.com/docs/starter-kits',
        icon: BookOpen,
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
                <NavMain items={filteredNavItems} /> {/* Pass filtered items */}
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}