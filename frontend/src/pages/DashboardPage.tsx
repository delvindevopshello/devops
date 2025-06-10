import { useQuery } from '@tanstack/react-query';
import { BarChart3, Briefcase, FileText, Users, Plus, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { jobsApi, applicationsApi, adminApi } from '../services/api';
import { Button } from '../components/ui/Button';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

export function DashboardPage() {
  const { user } = useAuth();

  const { data: userApplications, isLoading: applicationsLoading } = useQuery({
    queryKey: ['userApplications'],
    queryFn: () => applicationsApi.getUserApplications(),
    enabled: user?.role === 'user',
  });

  const { data: employerJobs, isLoading: jobsLoading } = useQuery({
    queryKey: ['employerJobs'],
    queryFn: () => jobsApi.getJobs({ limit: 10 }),
    enabled: user?.role === 'employer',
  });

  const { data: adminStats, isLoading: statsLoading } = useQuery({
    queryKey: ['adminStats'],
    queryFn: () => adminApi.getStats(),
    enabled: user?.role === 'admin',
  });

  if (!user) return null;

  const getDashboardContent = () => {
    switch (user.role) {
      case 'user':
        return <UserDashboard applications={userApplications?.data} loading={applicationsLoading} />;
      case 'employer':
        return <EmployerDashboard jobs={employerJobs?.data} loading={jobsLoading} />;
      case 'admin':
        return <AdminDashboard stats={adminStats?.data} loading={statsLoading} />;
      default:
        return null;
    }
  };

  return (
    <div className="page-container">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {user.firstName}!
        </h1>
        <p className="text-gray-600 mt-2">
          {user.role === 'user' && 'Track your job applications and discover new opportunities'}
          {user.role === 'employer' && 'Manage your job postings and applications'}
          {user.role === 'admin' && 'Overview of platform activity and pending approvals'}
        </p>
      </div>

      {getDashboardContent()}
    </div>
  );
}

function UserDashboard({ applications, loading }: { applications: any; loading: boolean }) {
  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6">
          <div className="flex items-center">
            <FileText className="h-8 w-8 text-primary-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Applications</p>
              <p className="text-2xl font-bold text-gray-900">{applications?.length || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="card p-6">
          <div className="flex items-center">
            <Eye className="h-8 w-8 text-secondary-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">In Review</p>
              <p className="text-2xl font-bold text-gray-900">
                {applications?.filter((app: any) => app.status === 'pending').length || 0}
              </p>
            </div>
          </div>
        </div>
        
        <div className="card p-6">
          <div className="flex items-center">
            <Briefcase className="h-8 w-8 text-accent-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Interviews</p>
              <p className="text-2xl font-bold text-gray-900">
                {applications?.filter((app: any) => app.status === 'interview').length || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="flex flex-wrap gap-4">
          <Link to="/jobs">
            <Button>
              <Briefcase className="h-4 w-4 mr-2" />
              Browse Jobs
            </Button>
          </Link>
        </div>
      </div>

      {/* Recent Applications */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Applications</h3>
        {applications && applications.length > 0 ? (
          <div className="space-y-4">
            {applications.slice(0, 5).map((application: any) => (
              <div key={application.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900">{application.job.title}</h4>
                  <p className="text-sm text-gray-600">{application.job.company}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  application.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  application.status === 'approved' ? 'bg-green-100 text-green-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {application.status}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-600">No applications yet. Start by browsing available jobs!</p>
        )}
      </div>
    </div>
  );
}

function EmployerDashboard({ jobs, loading }: { jobs: any; loading: boolean }) {
  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6">
          <div className="flex items-center">
            <Briefcase className="h-8 w-8 text-primary-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Jobs</p>
              <p className="text-2xl font-bold text-gray-900">
                {jobs?.jobs?.filter((job: any) => job.status === 'approved').length || 0}
              </p>
            </div>
          </div>
        </div>
        
        <div className="card p-6">
          <div className="flex items-center">
            <FileText className="h-8 w-8 text-secondary-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Applications</p>
              <p className="text-2xl font-bold text-gray-900">
                {jobs?.jobs?.reduce((acc: number, job: any) => acc + (job.applications?.length || 0), 0) || 0}
              </p>
            </div>
          </div>
        </div>
        
        <div className="card p-6">
          <div className="flex items-center">
            <Eye className="h-8 w-8 text-accent-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending Review</p>
              <p className="text-2xl font-bold text-gray-900">
                {jobs?.jobs?.filter((job: any) => job.status === 'pending').length || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="flex flex-wrap gap-4">
          <Link to="/post-job">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Post New Job
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

function AdminDashboard({ stats, loading }: { stats: any; loading: boolean }) {
  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Platform Stats */}
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
            <Eye className="h-8 w-8 text-yellow-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending Jobs</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.pendingJobs || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="flex flex-wrap gap-4">
          <Link to="/admin">
            <Button>
              <BarChart3 className="h-4 w-4 mr-2" />
              Admin Panel
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}