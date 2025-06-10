import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { Briefcase, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { jobsApi } from '../../services/api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

const jobSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(100, 'Description must be at least 100 characters'),
  requirements: z.string().min(50, 'Requirements must be at least 50 characters'),
  benefits: z.string().optional(),
  location: z.string().min(2, 'Location is required'),
  salaryMin: z.number().min(0, 'Minimum salary must be positive').optional(),
  salaryMax: z.number().min(0, 'Maximum salary must be positive').optional(),
  skills: z.string().min(1, 'At least one skill is required'),
  type: z.enum(['full-time', 'part-time', 'contract', 'freelance']),
  experienceLevel: z.enum(['entry', 'mid', 'senior', 'lead']),
  remote: z.boolean(),
}).refine((data) => {
  if (data.salaryMin && data.salaryMax) {
    return data.salaryMax >= data.salaryMin;
  }
  return true;
}, {
  message: "Maximum salary must be greater than minimum salary",
  path: ["salaryMax"],
});

type JobFormData = z.infer<typeof jobSchema>;

export function PostJobPage() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<JobFormData>({
    resolver: zodResolver(jobSchema),
    defaultValues: {
      type: 'full-time',
      experienceLevel: 'mid',
      remote: false,
    },
  });

  const postJobMutation = useMutation({
    mutationFn: (jobData: any) => jobsApi.createJob(jobData),
    onSuccess: () => {
      toast.success('Job posted successfully! It will be reviewed by our team.');
      navigate('/dashboard');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to post job');
    },
  });

  const onSubmit = async (data: JobFormData) => {
    setIsSubmitting(true);
    
    // Process skills string into array
    const processedData = {
      ...data,
      skills: data.skills.split(',').map(skill => skill.trim()).filter(Boolean),
      salaryMin: data.salaryMin || null,
      salaryMax: data.salaryMax || null,
    };

    postJobMutation.mutate(processedData);
    setIsSubmitting(false);
  };

  return (
    <div className="page-container">
      <Button
        variant="ghost"
        onClick={() => navigate('/dashboard')}
        className="mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Dashboard
      </Button>

      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <Briefcase className="mx-auto h-12 w-12 text-primary-600 mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Post a New Job</h1>
          <p className="text-gray-600">
            Find the perfect DevOps professional for your team
          </p>
        </div>

        <div className="card p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Basic Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
              <div className="space-y-6">
                <Input
                  {...register('title')}
                  label="Job Title"
                  placeholder="Senior DevOps Engineer"
                  error={errors.title?.message}
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Job Description
                  </label>
                  <textarea
                    {...register('description')}
                    rows={6}
                    className="input resize-none"
                    placeholder="Describe the role, responsibilities, and what makes this opportunity exciting..."
                  />
                  {errors.description && (
                    <p className="text-sm text-red-600 mt-1">{errors.description.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Requirements
                  </label>
                  <textarea
                    {...register('requirements')}
                    rows={6}
                    className="input resize-none"
                    placeholder="List the required skills, experience, and qualifications..."
                  />
                  {errors.requirements && (
                    <p className="text-sm text-red-600 mt-1">{errors.requirements.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Benefits (Optional)
                  </label>
                  <textarea
                    {...register('benefits')}
                    rows={4}
                    className="input resize-none"
                    placeholder="Health insurance, remote work, professional development, etc..."
                  />
                  {errors.benefits && (
                    <p className="text-sm text-red-600 mt-1">{errors.benefits.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Job Details */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Job Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  {...register('location')}
                  label="Location"
                  placeholder="San Francisco, CA"
                  error={errors.location?.message}
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Skills (comma-separated)
                  </label>
                  <Input
                    {...register('skills')}
                    placeholder="Docker, Kubernetes, AWS, Terraform"
                    error={errors.skills?.message}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Employment Type
                  </label>
                  <select {...register('type')} className="input">
                    <option value="full-time">Full-time</option>
                    <option value="part-time">Part-time</option>
                    <option value="contract">Contract</option>
                    <option value="freelance">Freelance</option>
                  </select>
                  {errors.type && (
                    <p className="text-sm text-red-600 mt-1">{errors.type.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Experience Level
                  </label>
                  <select {...register('experienceLevel')} className="input">
                    <option value="entry">Entry Level</option>
                    <option value="mid">Mid Level</option>
                    <option value="senior">Senior Level</option>
                    <option value="lead">Lead/Principal</option>
                  </select>
                  {errors.experienceLevel && (
                    <p className="text-sm text-red-600 mt-1">{errors.experienceLevel.message}</p>
                  )}
                </div>

                <Input
                  {...register('salaryMin', { valueAsNumber: true })}
                  type="number"
                  label="Minimum Salary (Optional)"
                  placeholder="80000"
                  error={errors.salaryMin?.message}
                />

                <Input
                  {...register('salaryMax', { valueAsNumber: true })}
                  type="number"
                  label="Maximum Salary (Optional)"
                  placeholder="120000"
                  error={errors.salaryMax?.message}
                />
              </div>

              <div className="mt-6">
                <label className="flex items-center">
                  <input
                    {...register('remote')}
                    type="checkbox"
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Remote work available
                  </span>
                </label>
              </div>
            </div>

            <div className="flex gap-4 pt-6 border-t border-gray-200">
              <Button
                type="submit"
                loading={isSubmitting || postJobMutation.isPending}
                className="flex-1"
              >
                Post Job
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate('/dashboard')}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}