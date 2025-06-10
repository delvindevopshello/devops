import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, X, Eye, BarChart3, Users, Briefcase, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminApi } from '../../services/api';
import { Button } from '../../components/ui/Button';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';

export function AdminPage() {
  const [activeTab, setActiveTab] = useState<'pending' | 'stats'>('pending');
  const queryClient = useQueryClient();

  const { data: pendingJobs, isLoading: pendingLoading } = useQuery({
    queryKey: ['pendingJobs'],
    queryFn: () => adminApi.getPendingJobs(),
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['adminStats'],
    queryFn: () => adminApi.getStats(),
  });

  const approveMutation = useMutation({
    mutationFn: (jobId: string) => adminApi.approveJob(jobId),
    onSuccess: () => {
      toast.success('Job approved successfully!');
      queryClient.invalidateQueries({ queryKey: ['pendingJobs'] });
      queryClient.invalidateQueries({ queryKey: ['adminStats'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to approve job');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (jobId: string) => adminApi.rejectJob(jobId),
    onSuccess: () => {
      toast.success('Job rejected successfully!');
      queryClient.invalidateQueries({ queryKey: ['pendingJobs'] });
      queryClient.invalidateQueries({ queryKey: ['adminStats'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to reject job');
    },
  });

  return (
    <div className="page-container">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
        <p className="text-gray-600 mt-2">Manage job postings and platform statistics</p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('pending')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'pending'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Pending Jobs
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'stats'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Statistics
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'pending' && (
        <PendingJobsTab
          jobs={pendingJobs?.data || []}
          loading={pendingLoading}
          onApprove={(id) => approveMutation.mutate(id)}
          onReject={(id) => rejectMutation.mutate(id)}
          approving={approveMutation.isPending}
          rejecting={rejectMutation.isPending}
        />
      )}

      {activeTab === 'stats' && (
        <StatsTab stats={stats?.data} loading={statsLoading} />
      )}
    </div>
  );
}

function PendingJobsTab({
  jobs,
  loading,
  onApprove,
  onReject,
  approving,
  rejecting,
}: {
  jobs: any[];
  loading: boolean;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  approving: boolean;
  rejecting: boolean;
}) {
  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="text-center py-12">
        <Briefcase className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No pending jobs</h3>
        <p className="text-gray-600">All jobs have been reviewed</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {jobs.map((job) => (
        <div key={job.id} className="card p-6">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between">
            <div className="flex-1">
              <div className="mb-4">
                <h3 className="text-xl font-semibold text-gray-900">{job.title}</h3>
                <p className="text-primary-600 font-medium">{job.company}</p>
                <p className="text-gray-600">{job.location}</p>
              </div>

              <div className="mb-4">
                <p className="text-gray-700 line-clamp-3">{job.description}</p>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                {job.skills?.slice(0, 5).map((skill: string, index: number) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium"
                  >
                    {skill}
                  </span>
                ))}
              </div>

              <div className="text-sm text-gray-600">
                <p>Posted by: {job.employer?.firstName} {job.employer?.lastName}</p>
                <p>Company: {job.employer?.company}</p>
                <p>Email: {job.employer?.email}</p>
              </div>
            </div>

            <div className="mt-4 lg:mt-0 lg:ml-6 flex-shrink-0">
              <div className="flex flex-col gap-3">
                <Button
                  onClick={() => onApprove(job.id)}
                  loading={approving}
                  className="min-w-32"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Approve
                </Button>
                <Button
                  variant="danger"
                  onClick={() => onReject(job.id)}
                  loading={rejecting}
                  className="min-w-32"
                >
                  <X className="h-4 w-4 mr-2" />
                  Reject
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => window.open(`/jobs/${job.id}`, '_blank')}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </Button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function StatsTab({ stats, loading }: { stats: any; loading: boolean }) {
  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card p-6">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-primary-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.totalUsers || 0}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <Briefcase className="h-8 w-8 text-secondary-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Jobs</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.totalJobs || 0}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <FileText className="h-8 w-8 text-accent-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Applications</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.totalApplications || 0}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <BarChart3 className="h-8 w-8 text-yellow-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending Jobs</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.pendingJobs || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">User Breakdown</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Job Seekers</span>
              <span className="font-medium">{stats?.usersByRole?.user || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Employers</span>
              <span className="font-medium">{stats?.usersByRole?.employer || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Admins</span>
              <span className="font-medium">{stats?.usersByRole?.admin || 0}</span>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Job Status</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Approved</span>
              <span className="font-medium text-green-600">{stats?.jobsByStatus?.approved || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Pending</span>
              <span className="font-medium text-yellow-600">{stats?.jobsByStatus?.pending || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Rejected</span>
              <span className="font-medium text-red-600">{stats?.jobsByStatus?.rejected || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}