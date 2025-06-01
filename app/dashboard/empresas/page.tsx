"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { CompanyTable } from "./_components/company_table";
import { CompanyFilters } from "./_components/company_filters";
import { CompanyDialog } from "./_components/company_dialog";

export default function CompaniesPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <div className="space-y-8">
      <Card>
        <div className="p-6 space-y-4">
          <CompanyFilters onCreateClick={() => setIsDialogOpen(true)} />
          <CompanyTable />
        </div>
      </Card>

      <CompanyDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
    </div>
  );
}
