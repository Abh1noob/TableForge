import { UserNav } from "@/components/user-nav";

import columns from "@/components/columns";
import { type Metadata } from "next";
import { priorities, statuses, tasks } from "../data/data";
import { DataTable } from "@/components/table/data-table";

export const metadata: Metadata = {
  title: "Tasks",
  description: "A task and issue tracker build using Tanstack Table.",
};

export default async function TaskPage() {
  return (
    <>
      <div className="hidden h-full flex-1 flex-col space-y-8 p-8 md:flex">
        <div className="flex items-center justify-between space-y-2">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Welcome back!</h2>
            <p className="text-muted-foreground">
              Here&apos;s a list of your tasks for this month!
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <UserNav />
          </div>
        </div>
        <DataTable
          columns={columns}
          data={tasks}
          filters={[
            {
              columnId: "status",
              title: "Status",
              options: statuses,
            },
            {
              columnId: "priority",
              title: "Priority",
              options: priorities,
            },
          ]}
        />
      </div>
    </>
  );
}
