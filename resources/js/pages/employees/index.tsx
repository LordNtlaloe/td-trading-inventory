import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import AppLayout from '@/layouts/app-layout';
import EmployeesLayout from '@/layouts/employees/layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableFooter,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { PenIcon, InfoIcon, Trash2Icon } from "lucide-react";
import { useState, useEffect } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Employees', href: '/employees' },
];

type Employee = {
    id: number;
    employee_name: string;
    employee_location: string;
};

export default function Employees() {
    const { employees } = usePage<{ employees: Employee[] }>().props;
    const { success, errors } = usePage<{ success?: string; errors?: string }>().props; // Fix: Renamed error to _error
    const { delete: destroy } = useForm();
    const [alert, setAlert] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    // Delete employee using Inertia's useForm
    const deleteBranch = async (id: number) => {
        try {
            destroy(route('employees.destroy', id), {
                onFinish: () => {
                    setAlert({ message: 'Branch deleted successfully!', type: 'success' });
                },
                onError: () => {
                    setAlert({ message: 'Failed to delete employee.', type: 'error' });
                }
            });
        } catch (error) {
            setAlert({ message: 'An error occurred' + error, type: 'error' });
        }
    };

    useEffect(() => {
        if (success) {
            setAlert({ message: success, type: "success" });
        }
        if (errors && typeof errors === 'object') {
            const errorMessage = Object.values(errors).flat().join(', '); // Convert object errors to string
            setAlert({ message: errorMessage, type: "error" });
        }
    }, [success, errors]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Employees" />

            <EmployeesLayout>
                <div className="space-y-2">
                    <div className="flex justify-between">
                        <Input className="w-1/4" placeholder="Search" />
                        <Link href={route('employees.create')} className="cursor-pointer">
                            <Button className="cursor-pointer" variant="secondary">Add New Employee</Button>
                        </Link>
                    </div>

                    <Table className="border px-5 rounded-md">
                        <TableCaption>A list of all employees.</TableCaption>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[100px]">ID</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Location</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {employees.length > 0 ? (
                                employees.map(({ id, employee_name, employee_location }) => (
                                    <TableRow key={id}>
                                        <TableCell className="font-medium">{id}</TableCell>
                                        <TableCell>{employee_name}</TableCell>
                                        <TableCell>{employee_location}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex gap-2 justify-end">
                                                <Button variant="outline">
                                                    <Link href={route('employees.edit', id)} className="cursor-pointer flex gap-2 justify-end">
                                                        <PenIcon className="h-4 w-4 mr-1" /> Edit
                                                    </Link>
                                                </Button>
                                                <Button variant="destructive" onClick={() => deleteBranch(id)}>
                                                    <Trash2Icon className="h-4 w-4 mr-1" /> Delete
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-4 text-gray-500">
                                        No employees found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                        <TableFooter>
                            <TableRow>
                                <TableCell colSpan={3}>Total Employees</TableCell>
                                <TableCell className="text-right">{employees.length}</TableCell>
                            </TableRow>
                        </TableFooter>
                    </Table>


                </div>

                {/* Alert Component */}
                {alert && (
                    <Alert className={`z-50 h-15 w-96 fixed bottom-4 right-4 p-4 rounded-md shadow-lg ${alert.type === 'success' ? 'bg-green-500' : 'bg-red-500'} text-white`}>
                        <InfoIcon className="h-4 w-4" />
                        <AlertTitle className='pb-2'>{alert.type === 'success' ? 'Success' : 'Error'}</AlertTitle>
                        <AlertDescription className='text-white pb-4'>
                            {alert.message}
                        </AlertDescription>
                    </Alert>
                )}
            </EmployeesLayout>
        </AppLayout>
    );
}
