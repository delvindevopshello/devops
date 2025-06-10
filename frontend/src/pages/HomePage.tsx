import { Link } from 'react-router-dom';
import { Search, MapPin, Users, Briefcase, TrendingUp, Shield } from 'lucide-react';
import { Button } from '../components/ui/Button';

export function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 sm:py-32">
        <div className="page-container">
          <div className="text-center">
            <h1 className="text-4xl sm:text-6xl font-bold text-gray-900 mb-6">
              Find Your Dream
              <span className="text-primary-600 block">DevOps Career</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Connect with top companies hiring DevOps engineers, SREs, and cloud specialists. 
              Discover opportunities that match your skills and passion.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/jobs">
                <Button size="lg" className="min-w-48">
                  <Search className="h-5 w-5 mr-2" />
                  Browse Jobs
                </Button>
              </Link>
              <Link to="/register">
                <Button variant="secondary" size="lg" className="min-w-48">
                  <Users className="h-5 w-5 mr-2" />
                  Join as Employer
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="page-container">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why Choose DevOps Jobs?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              We specialize in connecting DevOps professionals with innovative companies
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-8 rounded-xl bg-primary-50 hover:bg-primary-100 transition-colors">
              <Briefcase className="h-12 w-12 text-primary-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Curated Opportunities
              </h3>
              <p className="text-gray-600">
                Hand-picked DevOps, SRE, and cloud engineering positions from leading companies
              </p>
            </div>

            <div className="text-center p-8 rounded-xl bg-secondary-50 hover:bg-secondary-100 transition-colors">
              <TrendingUp className="h-12 w-12 text-secondary-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Career Growth
              </h3>
              <p className="text-gray-600">
                Find roles that advance your career with competitive salaries and benefits
              </p>
            </div>

            <div className="text-center p-8 rounded-xl bg-accent-50 hover:bg-accent-100 transition-colors">
              <Shield className="h-12 w-12 text-accent-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Trusted Platform
              </h3>
              <p className="text-gray-600">
                Verified companies and secure application process for your peace of mind
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary-600">
        <div className="page-container text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Start Your Journey?
          </h2>
          <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
            Join thousands of DevOps professionals who have found their dream jobs through our platform
          </p>
          <Link to="/register">
            <Button size="lg" className="bg-white text-primary-600 hover:bg-gray-100">
              Get Started Today
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}