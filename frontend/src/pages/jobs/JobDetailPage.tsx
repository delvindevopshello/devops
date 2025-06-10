import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MapPin, DollarSign, Calendar, Users, ArrowLeft, Send } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { jobsApi } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';

const applicationSchema = z.object({
  coverLetter: z.string().min(50, 'Cover letter must be at least 50 characters'),
  resume: z.string().url('Please provide a valid resume URL'),
});

type ApplicationFormData = z.infer<typeof applicationSchema>;

export function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['job', id],
    queryFn: () => jobsApi.getJob(id!),
    enabled: !!id,
  });

  const applyMutation = useMutation({
    mutationFn: (applicationData: ApplicationFormData) => 
      jobsApi.applyToJob(id!, applicationData),
    onSuccess: () => {
      toast.success('Application submitted successfully!');
      setShowApplicationForm(false);
      queryClient.invalidateQueries({ queryKey: ['job', id] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to submit application');
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ApplicationFormData>({
    resolver: zodResolver(applicationSchema),
  });

  if (isLoading) {
    return (
      <div className="page-container">
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  if (error || !data?.data) {
    return (
      <div className="page-container">
        <div className="text-center py-12">
          <p className="text-red-600">Job not found or failed to load.</p>
          <Button onClick={() => navigate('/jobs')} className="mt-4">
            Back to Jobs
          </Button>
        </div>
      </div>
    );
  }

  const job = data.data;

  const formatSalary = (min: number, max: number) => {
    if (!min && !max) return 'Competitive';
    if (!max) return `$${min.toLocaleString()}+`;
    return `$${min.toLocaleString()} - $${max.toLocaleString()}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const onSubmitApplication = (data: ApplicationFormData) => {
    applyMutation.mutate(data);
  };

  const hasApplied = job.applications?.some((app: any) => app.userId === user?.id);
  const canApply = user?.role === 'user' && !hasApplied && job.status === 'approved';

  return (
    <div className="page-container">
      <Button
        variant="ghost"
        onClick={() => navigate('/jobs')}
        className="mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Jobs
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <div className="card p-8">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{job.title}</h1>
              <h2 className="text-xl text-primary-600 font-semibold mb-4">{job.company}</h2>
              
              <div className="flex flex-wrap items-center gap-6 text-gray-600 mb-6">
                <div className="flex items-center">
                  <MapPin className="h-5 w-5 mr-2" />
                  {job.location}
                </div>
                <div className="flex items-center">
                  <DollarSign className="h-5 w-5 mr-2" />
                  {formatSalary(job.salaryMin, job.salaryMax)}
                </div>
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  Posted {formatDate(job.createdAt)}
                </div>
                {job.applications && (
                  <div className="flex items-center">
                    <Users className="h-5 w-5 mr-2" />
                    {job.applications.length} applications
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-2 mb-6">
                {job.skills?.map((skill: string, index: number) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <div className="prose max-w-none">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Job Description</h3>
              <div className="whitespace-pre-wrap text-gray-700">
                {job.description}
              </div>

              {job.requirements && (
                <>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4 mt-8">Requirements</h3>
                  <div className="whitespace-pre-wrap text-gray-700">
                    {job.requirements}
                  </div>
                </>
              )}

              {job.benefits && (
                <>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4 mt-8">Benefits</h3>
                  <div className="whitespace-pre-wrap text-gray-700">
                    {job.benefits}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Application Form */}
          {showApplicationForm && (
            <div className="card p-8 mt-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Apply for this position</h3>
              <form onSubmit={handleSubmit(onSubmitApplication)} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Resume URL
                  </label>
                  <Input
                    {...register('resume')}
                    placeholder="https://drive.google.com/your-resume"
                    error={errors.resume?.message}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Please provide a link to your resume (Google Drive, Dropbox, etc.)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cover Letter
                  </label>
                  <textarea
                    {...register('coverLetter')}
                    rows={6}
                    className="input resize-none"
                    placeholder="Tell us why you're interested in this position and how your experience makes you a great fit..."
                  />
                  {errors.coverLetter && (
                    <p className="text-sm text-red-600 mt-1">{errors.coverLetter.message}</p>
                  )}
                </div>

                <div className="flex gap-4">
                  <Button
                    type="submit"
                    loading={applyMutation.isPending}
                    className="flex-1"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Submit Application
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setShowApplicationForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div>
          <div className="card p-6 sticky top-8">
            <div className="mb-6">
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                job.status === 'approved' ? 'bg-green-100 text-green-800' :
                job.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {job.status}
              </span>
            </div>

            {user ? (
              hasApplied ? (
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-green-800 font-medium">Application Submitted</p>
                  <p className="text-green-600 text-sm mt-1">
                    We'll notify you of any updates
                  </p>
                </div>
              ) : canApply ? (
                <Button
                  onClick={() => setShowApplicationForm(true)}
                  className="w-full"
                  size="lg"
                >
                  Apply Now
                </Button>
              ) : job.status !== 'approved' ? (
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <p className="text-yellow-800 font-medium">Job Under Review</p>
                  <p className="text-yellow-600 text-sm mt-1">
                    This job is pending approval
                  </p>
                </div>
              ) : (
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-gray-800 font-medium">Can't Apply</p>
                  <p className="text-gray-600 text-sm mt-1">
                    Only job seekers can apply
                  </p>
                </div>
              )
            ) : (
              <div className="space-y-3">
                <Button
                  onClick={() => navigate('/register')}
                  className="w-full"
                  size="lg"
                >
                  Sign Up to Apply
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => navigate('/login')}
                  className="w-full"
                >
                  Already have an account?
                </Button>
              </div>
            )}

            <div className="mt-8 pt-6 border-t border-gray-200">
              <h4 className="font-semibold text-gray-900 mb-4">Job Details</h4>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-gray-600">Employment Type:</span>
                  <span className="block font-medium">{job.type || 'Full-time'}</span>
                </div>
                <div>
                  <span className="text-gray-600">Experience Level:</span>
                  <span className="block font-medium">{job.experienceLevel || 'Not specified'}</span>
                </div>
                <div>
                  <span className="text-gray-600">Remote Work:</span>
                  <span className="block font-medium">{job.remote ? 'Yes' : 'No'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}