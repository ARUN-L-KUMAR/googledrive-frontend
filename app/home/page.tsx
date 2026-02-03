'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Cloud, Lock, Share2, Zap, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Check if user is already logged in (in background, don't block UI)
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/users/profile');
        if (response.ok) {
          router.push('/dashboard');
        }
      } catch (err) {
        // User not authenticated, stay on landing page
      }
    };

    checkAuth();
  }, [router]);

  // Always render the landing page immediately
  // Only redirect to dashboard if user is already authenticated
  return (
    <div className="bg-gradient-to-b from-white to-blue-50">
      {/* Navigation */}
      <nav className="flex justify-between items-center p-6 max-w-6xl mx-auto">
        <div className="flex items-center gap-2 text-2xl font-bold text-gray-900">
          <Cloud className="w-8 h-8 text-blue-600" />
          CloudDrive
        </div>
        <div className="flex gap-4">
          <Link href="/login">
            <Button variant="outline">Sign In</Button>
          </Link>
          <Link href="/register">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">Get Started</Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-6 py-20 text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-6">
          Your Files, <span className="text-blue-600">Anywhere</span>
        </h1>
        <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
          Store, share, and collaborate on your files securely. Get 5GB free storage to get started.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/register">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg rounded-lg gap-2">
              Start Free <ChevronRight size={20} />
            </Button>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="p-8 bg-white rounded-xl border border-gray-200 text-center">
            <Lock className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">Secure Storage</h3>
            <p className="text-gray-600">
              Bank-grade encryption keeps your files safe and secure in the cloud.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="p-8 bg-white rounded-xl border border-gray-200 text-center">
            <Share2 className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">Easy Sharing</h3>
            <p className="text-gray-600">
              Share files with customizable permissions. Control who sees what.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="p-8 bg-white rounded-xl border border-gray-200 text-center">
            <Zap className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">Fast Access</h3>
            <p className="text-gray-600">
              Access your files anytime, anywhere, on any device with fast sync.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-6xl mx-auto px-6 py-20 text-center">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-12 text-white">
          <h2 className="text-3xl font-bold mb-4">Ready to get started?</h2>
          <p className="text-lg mb-8 text-blue-100">
            Sign up now and get 5GB of free storage instantly.
          </p>
          <Link href="/register">
            <Button className="bg-white text-blue-600 hover:bg-blue-50 px-8 py-6 text-lg rounded-lg">
              Create Free Account
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-8 px-6">
        <div className="max-w-6xl mx-auto text-center text-gray-600 text-sm">
          <p>&copy; 2024 CloudDrive. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
