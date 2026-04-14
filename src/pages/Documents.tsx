'use client';

import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { DocumentLibrary } from '@/components/documents/DocumentLibrary';
import { Loader2 } from 'lucide-react';
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export interface Document {
  id: number;
  title: string;
  description: string;
  file_type: string;
  file_size: number;
  folder_id: number | null;
  is_confidential: boolean;
  created_at: string;
  updated_at: string;
  created_by: number;
  updated_by: number;
}

const Documents = () => {
  const { user } = useAuth();
  const { data: documents, isLoading } = useQuery<Document[]>({
    queryKey: ['documents'],
    queryFn: async () => {
      const response = await api.get('/api/documents/documents/all');
      return response.data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen w-full bg-gray-50/40">
        <Sidebar />
        <div className="flex-1">
          <Header title="Documents" />
          <main className="flex-1 p-6 md:p-8">
            <div className="flex h-full items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          </main>
        </div>
      </div>
    );
  }

  // Check if user is admin
  if (user?.role !== "admin") {
    return (
      <div className="flex min-h-screen w-full bg-gray-50/40">
        <Sidebar />
        <div className="flex-1">
          <Header title="Documents" />
          <main className="flex-1 p-6 md:p-8">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Access Denied</AlertTitle>
              <AlertDescription>
                You don't have permission to access the document management page. Only administrators can access this page.
              </AlertDescription>
            </Alert>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full bg-gray-50/40">
      <Sidebar />
      <div className="flex-1">
        <Header title="Documents" />
        <main className="flex-1 p-6 md:p-8">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Document Management</h1>
            <p className="text-muted-foreground">
              Upload, organize, and access your organization's documents
            </p>
          </div>
          <div className="mt-6">
            <DocumentLibrary documents={documents || []} />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Documents;
