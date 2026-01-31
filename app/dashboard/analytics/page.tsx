'use client';

import DashboardLayout from '@/components/DashboardLayout';
import StorageAnalytics from '@/components/StorageAnalytics';

export default function AnalyticsPage() {
    return (
        <DashboardLayout currentPage="analytics">
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Storage</h1>
                    <p className="text-gray-600 mt-2">Monitor your storage usage and file distribution</p>
                </div>

                <StorageAnalytics />
            </div>
        </DashboardLayout>
    );
}
