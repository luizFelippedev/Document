// frontend/src/components/layout/Footer.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { APP_NAME } from '@/config/constants';
import { ROUTES } from '@/config/routes';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useNotification } from '@/hooks/useNotification';
import {
  GitHub,
  Twitter,
  Instagram,
  Linkedin,
  Heart,
  Mail,
  ExternalLink,
  ArrowRight,
} from 'lucide-react';

export const Footer = () => {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useNotification();

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !email.includes('@')) {
      showToast('error', 'Please enter a valid email address');
      return;
    }

    setSubmitting(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      showToast('success', 'Thanks for subscribing to our newsletter!');
      setEmail('');
    } catch (error) {
      showToast('error', 'Failed to subscribe. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const footerLinks = [
    {
      title: 'Product',
      links: [
        { label: 'Features', href: '#features' },
        { label: 'Pricing', href: '#pricing' },
        { label: 'Roadmap', href: '#roadmap' },
        { label: 'Testimonials', href: '#testimonials' },
      ],
    },
    {
      title: 'Resources',
      links: [
        { label: 'Documentation', href: ROUTES.DOCUMENTATION },
        { label: 'Help Center', href: ROUTES.HELP },
        { label: 'Blog', href: '/blog' },
        { label: 'Changelog', href: '/changelog' },
      ],
    },
    {
      title: 'Company',
      links: [
        { label: 'About Us', href: '/about' },
        { label: 'Careers', href: '/careers' },
        { label: 'Contact', href: '/contact' },
        { label: 'Press Kit', href: '/press' },
      ],
    },
    {
      title: 'Legal',
      links: [
        { label: 'Privacy Policy', href: ROUTES.PRIVACY },
        { label: 'Terms of Service', href: ROUTES.TERMS },
        { label: 'Cookie Policy', href: '/cookies' },
        { label: 'GDPR', href: '/gdpr' },
      ],
    },
  ];

  const socialLinks = [
    {
      label: 'Twitter',
      icon: <Twitter size={18} />,
      href: 'https://twitter.com',
    },
    { label: 'GitHub', icon: <GitHub size={18} />, href: 'https://github.com' },
    {
      label: 'LinkedIn',
      icon: <Linkedin size={18} />,
      href: 'https://linkedin.com',
    },
    {
      label: 'Instagram',
      icon: <Instagram size={18} />,
      href: 'https://instagram.com',
    },
  ];

  return (
    <footer className="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
      <div className="container mx-auto px-4 py-12">
        {/* Newsletter Section */}
        <div className="bg-blue-600 dark:bg-blue-700 rounded-xl p-6 md:p-8 mb-12">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="md:w-1/2">
              <h3 className="text-xl md:text-2xl font-bold text-white mb-2">
                Stay in the loop
              </h3>
              <p className="text-blue-100">
                Subscribe to our newsletter for updates, tips, and special
                offers.
              </p>
            </div>
            <div className="md:w-1/2">
              <form onSubmit={handleSubscribe} className="flex">
                <Input
                  type="email"
                  placeholder="Your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 rounded-r-none bg-white/90 border-0 focus:bg-white"
                  leftElement={<Mail size={18} className="text-gray-400" />}
                />
                <Button
                  type="submit"
                  className="rounded-l-none bg-white text-blue-600 hover:bg-gray-100 border-0"
                  disabled={submitting}
                  loading={submitting}
                  loadingText="Subscribing..."
                >
                  Subscribe
                </Button>
              </form>
            </div>
          </div>
        </div>

        {/* Main Footer Content */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8 mb-12">
          {/* Logo and Description */}
          <div className="col-span-2">
            <Link href="/" className="flex items-center mb-4">
              <div className="h-10 w-10 rounded-md bg-blue-600 text-white flex items-center justify-center text-xl font-bold mr-3">
                {APP_NAME.charAt(0)}
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                {APP_NAME}
              </span>
            </Link>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Showcase your projects and certificates with style and security.
              Build your professional portfolio with ease.
            </p>
            <div className="flex space-x-4">
              {socialLinks.map((link, index) => (
                <motion.a
                  key={index}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  aria-label={link.label}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {link.icon}
                </motion.a>
              ))}
            </div>
          </div>

          {/* Footer Links */}
          {footerLinks.map((group, index) => (
            <div key={index} className="col-span-1">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-4">
                {group.title}
              </h4>
              <ul className="space-y-2">
                {group.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <Link
                      href={link.href}
                      className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Section */}
        <div className="pt-8 border-t border-gray-200 dark:border-gray-800 flex flex-col md:flex-row md:items-center justify-between text-sm">
          <div className="text-gray-600 dark:text-gray-400 mb-4 md:mb-0">
            <p>
              &copy; {new Date().getFullYear()} {APP_NAME}. All rights reserved.
            </p>
            <p className="mt-1 flex items-center">
              Made with <Heart size={14} className="mx-1 text-red-500" /> by the{' '}
              {APP_NAME} Team
            </p>
          </div>

          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <Link
              href={ROUTES.PRIVACY}
              className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              href={ROUTES.TERMS}
              className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              Terms of Service
            </Link>
            <Link
              href="/cookies"
              className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              Cookies
            </Link>
            <a
              href="https://status.devfolio.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center"
            >
              Status <ExternalLink size={12} className="ml-1" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
