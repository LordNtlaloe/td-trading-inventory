import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import AppLayout from '@/layouts/app-layout';
import BranchesLayout from '@/layouts/branches/layout';
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
  { title: 'Branches', href: '/branches' },
];

type Branch = {
  id: number;
  branch_name: string;
  branch_location: string;
};

export default function Branches() {
  const { branches } = usePage<{ branches: Branch[] }>().props;
  const { success, error } = usePage<{ success?: string; error?: string }>().props;
  const { delete: destroy } = useForm();
  const [alert, setAlert] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Delete branch using Inertia's useForm
  const deleteBranch = async (id: number) => {
    try {
      destroy(route('branches.destroy', id), {
        onFinish: () => {
          setAlert({ message: 'Branch deleted successfully!', type: 'success' });
        },
        onError: () => {
          setAlert({ message: 'Failed to delete branch.', type: 'error' });
        }
      });
    } catch (error) {
      setAlert({ message: 'An error occurred.', type: 'error' });
    }
  };

  useEffect(() => {
          if (success) {
              setAlert({ message: success, type: "success" });
          }
          else if (error) {
              setAlert({ message: error, type: "error" });
          }
      }, [success, error])

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Branches" />

      <BranchesLayout>
        <div className="space-y-2">
          <div className="flex justify-between">
            <Input className="w-1/4" placeholder="Search" />
            <Link href={route('branches.create')} className="cursor-pointer">
              <Button className="cursor-pointer" variant="secondary">Add New Branch</Button>
            </Link>
          </div>

          <Table className="border px-5 rounded-md">
            <TableCaption>A list of all branches.</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Location</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {branches.map(({ id, branch_name, branch_location }) => (
                <TableRow key={id}>
                  <TableCell className="font-medium">{id}</TableCell>
                  <TableCell>{branch_name}</TableCell>
                  <TableCell>{branch_location}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Button variant="outline">
                        <Link href={route('branches.edit', id)} className="cursor-pointer flex gap-2 justify-end">
                          <PenIcon className="h-4 w-4 mr-1" /> Edit
                        </Link>
                      </Button>
                      <Button variant="destructive" onClick={() => deleteBranch(id)}>
                        <Trash2Icon className="h-4 w-4 mr-1" /> Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={3}>Total Branches</TableCell>
                <TableCell className="text-right">{branches.length}</TableCell>
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
      </BranchesLayout>
    </AppLayout>
  );
}
