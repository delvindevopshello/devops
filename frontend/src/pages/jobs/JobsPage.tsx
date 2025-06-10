import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, MapPin, Filter, Calendar, DollarSign } from 'lucide-react';
import { Link } from 'react-router-dom';
import { jobsApi } from '../../services/api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';

export function JobsPage() {
  const [search, setSearch] = useState('');
  const [location, setLocation] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useQuery({
    queryKey: ['jobs', { page, search, location }],
    queryFn: () => jobsApi.getJobs({ 
      page, 
      limit: 10, 
      search: search || undefined, 
      location: location || undefined 
    }),
  });

  const jobs = data?.data?.jobs || [];
  const totalPages = Math.ceil((data?.data?.total || 0) / 10);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  };

  if (error) {
    return (
      <div className="page-container">
        <div className="text-center py-12">
          <p className="text-red-600">Failed to load jobs. Please try again later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Find DevOps Jobs</h1>
        <p className="text-gray-600">Discover your next career opportunity</p>
      </div>

      {/* Search Filters */}
      <div className="card p-6 mb-8">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Job title, skills, or company"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button type="submit" className="w-full md:w-auto">
              Search Jobs
            </Button>
          </div>
        </form>
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-12">
          <Briefcase className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs found</h3>
          <p className="text-gray-600">Try adjusting your search criteria</p>
        </div>
      ) : (
        <>
          <div className="mb-6">
            <p className="text-gray-600">
              Showing {((page - 1) * 10) + 1} - {Math.min(page * 10, data?.data?.total || 0)} of {data?.data?.total || 0} jobs
            </p>
          </div>

          <div className="space-y-6">
            {jobs.map((job: any) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-8 space-x-2">
              <Button
                variant="secondary"
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
              >
                Previous
              </Button>
              
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = page - 2 + i;
                if (pageNum < 1 || pageNum > totalPages) return null;
                
                return (
                  <Button
                    key={pageNum}
                    variant={pageNum === page ? 'primary' : 'secondary'}
                    onClick={() => setPage(pageNum)}
                  >
                    {pageNum}
                  </Button>
                );
              })}
              
              <Button
                variant="secondary"
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function JobCard({ job }: { job: any }) {
  const formatSalary = (min: number, max: number) => {
    if (!min && !max) return 'Competitive';
    if (!max) return `$${min.toLocaleString()}+`;
    return `$${min.toLocaleString()} - $${max.toLocaleString()}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="card p-6 hover:shadow-lg transition-all duration-200">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between">
        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <div>
              <Link 
                to={`/jobs/${job.id}`} 
                className="text-xl font-semibold text-gray-900 hover:text-primary-600 transition-colors"
              >
                {job.title}
              </Link>
              <p className="text-primary-600 font-medium">{job.company}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              job.status === 'approved' ? 'bg-green-100 text-green-800' :
              job.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {job.status}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-3">
            <div className="flex items-center">
              <MapPin className="h-4 w-4 mr-1" />
              {job.location}
            </div>
            <div className="flex items-center">
              <DollarSign className="h-4 w-4 mr-1" />
              {formatSalary(job.salaryMin, job.salaryMax)}
            </div>
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-1" />
              {formatDate(job.createdAt)}
            </div>
          </div>

          <p className="text-gray-700 mb-4 line-clamp-2">
            {job.description}
          </p>

          <div className="flex flex-wrap gap-2">
            {job.skills?.slice(0, 4).map((skill: string, index: number) => (
              <span
                key={index}
                className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-xs font-medium"
              >
                {skill}
              </span>
            ))}
            {job.skills?.length > 4 && (
              <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                +{job.skills.length - 4} more
              </span>
            )}
          </div>
        </div>

        <div className="mt-4 lg:mt-0 lg:ml-6 flex-shrink-0">
          <Link to={`/jobs/${job.id}`}>
            <Button>View Details</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}