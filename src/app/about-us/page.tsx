import { Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Metadata } from 'next';
import ClientImage from '@/components/ui/ClientImage';

export const metadata: Metadata = {
  title: 'About Us - TechCortex',
  description: 'Learn about TechCortex, our mission, values, and the team behind your favorite computer hardware store.',
  openGraph: {
    title: 'About Us - TechCortex',
    description: 'Learn about TechCortex, our mission, values, and the team behind your favorite computer hardware store.',
    url: 'https://tech-cortex.com/about-us',
    siteName: 'TechCortex',
    images: [
      {
        url: 'https://tech-cortex.com/about-us-og.jpg',
        width: 1200,
        height: 630,
        alt: 'TechCortex - About Us',
      },
    ],
  },
};

// Team member type
type TeamMember = {
  name: string;
  role: string;
  bio: string;
  imageUrl: string;
};

// Company milestone type
type Milestone = {
  year: string;
  title: string;
  description: string;
};

// About Us content component
function AboutUsContent() {
  // Team members data
  const teamMembers: TeamMember[] = [
    {
      name: 'Alex Chen',
      role: 'Founder & CEO',
      bio: 'With over 15 years of experience in the tech industry, Alex founded TechCortex with a vision to provide high-quality computer hardware with exceptional customer service.',
      imageUrl: '/team/alex-chen.jpg',
    },
    {
      name: 'Sarah Johnson',
      role: 'CTO',
      bio: 'Sarah leads our technical team with her extensive knowledge of computer hardware and software. She ensures we stay at the cutting edge of technology.',
      imageUrl: '/team/sarah-johnson.jpg',
    },
    {
      name: 'Michael Rodriguez',
      role: 'Head of Customer Experience',
      bio: 'Michael is dedicated to making every customer interaction with TechCortex exceptional. He leads our support and service teams.',
      imageUrl: '/team/michael-rodriguez.jpg',
    },
    {
      name: 'Emily Wong',
      role: 'Product Manager',
      bio: 'Emily curates our product catalog, ensuring we offer only the best and most reliable hardware to our customers.',
      imageUrl: '/team/emily-wong.jpg',
    },
  ];

  // Company milestones
  const milestones: Milestone[] = [
    {
      year: '2015',
      title: 'Foundation',
      description: 'TechCortex was founded with a mission to provide high-quality computer hardware to tech enthusiasts.',
    },
    {
      year: '2017',
      title: 'Online Store Launch',
      description: 'We launched our online store, making our products accessible nationwide.',
    },
    {
      year: '2019',
      title: 'Expansion',
      description: 'Expanded our product range to include premium gaming hardware and custom PC builds.',
    },
    {
      year: '2021',
      title: 'Customer Service Excellence Award',
      description: 'Recognized for our outstanding customer service with a national industry award.',
    },
    {
      year: '2023',
      title: 'Sustainability Initiative',
      description: 'Launched our sustainability program, focusing on eco-friendly packaging and responsible recycling.',
    },
  ];

  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-gray-100 to-gray-200 py-16 mb-12 rounded-lg">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">About TechCortex</h1>
            <p className="text-lg text-gray-600 mb-8">
              Your trusted partner in premium computer hardware since 2015
            </p>
          </div>
        </div>
      </section>

      {/* Our Story Section */}
      <section className="mb-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="relative h-96 rounded-lg overflow-hidden shadow-lg bg-gray-200">
              {/* Fallback content if image is not available */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center p-6">
                  <svg className="h-16 w-16 text-gray-400 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                  </svg>
                  <p className="text-gray-500">TechCortex office</p>
                </div>
              </div>
              {/* Try to load the image, but the fallback will display if it fails */}
              <ClientImage
                src="/about/our-story.jpg"
                alt="TechCortex office"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
                priority
                fallbackContent={null} // This will make the fallback div visible when image fails to load
              />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Story</h2>
              <p className="text-gray-600 mb-4">
                TechCortex was born from a passion for technology and a vision to make high-quality computer hardware accessible to everyone. Founded in 2015 by Alex Chen, a tech enthusiast with a background in computer engineering, our journey began in a small garage with a handful of carefully selected products.
              </p>
              <p className="text-gray-600 mb-4">
                What started as a small operation quickly grew as customers recognized our commitment to quality and service. Today, TechCortex is a leading provider of premium computer hardware in the United States, serving thousands of customers from tech enthusiasts to professional organizations.
              </p>
              <p className="text-gray-600">
                Despite our growth, we've never lost sight of our founding principles: offering only the highest quality products, providing exceptional customer service, and fostering a community of tech enthusiasts who share our passion.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Our Mission & Values Section */}
      <section className="mb-16 bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">Our Mission & Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-lg shadow-md">
              <div className="text-primary mb-4">
                <svg className="h-12 w-12" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Quality First</h3>
              <p className="text-gray-600">
                We believe in offering only the highest quality products. Every item in our catalog undergoes rigorous testing and quality checks before it reaches our customers.
              </p>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-md">
              <div className="text-primary mb-4">
                <svg className="h-12 w-12" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Customer-Centric</h3>
              <p className="text-gray-600">
                Our customers are at the heart of everything we do. We're committed to providing exceptional service, expert advice, and a seamless shopping experience.
              </p>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-md">
              <div className="text-primary mb-4">
                <svg className="h-12 w-12" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.083 9h1.946c.089-1.546.383-2.97.837-4.118A6.004 6.004 0 004.083 9zM10 2a8 8 0 100 16 8 8 0 000-16zm0 2c-.076 0-.232.032-.465.262-.238.234-.497.623-.737 1.182-.389.907-.673 2.142-.766 3.556h3.936c-.093-1.414-.377-2.649-.766-3.556-.24-.56-.5-.948-.737-1.182C10.232 4.032 10.076 4 10 4zm3.971 5c-.089-1.546-.383-2.97-.837-4.118A6.004 6.004 0 0115.917 9h-1.946zm-2.003 2H8.032c.093 1.414.377 2.649.766 3.556.24.56.5.948.737 1.182.233.23.389.262.465.262.076 0 .232-.032.465-.262.238-.234.498-.623.737-1.182.389-.907.673-2.142.766-3.556zm1.166 4.118c.454-1.147.748-2.572.837-4.118h1.946a6.004 6.004 0 01-2.783 4.118zm-6.268 0C6.412 13.97 6.118 12.546 6.03 11H4.083a6.004 6.004 0 002.783 4.118z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Innovation</h3>
              <p className="text-gray-600">
                We embrace innovation and continuously seek out the latest advancements in computer hardware to offer cutting-edge solutions to our customers.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Our Journey Timeline */}
      <section className="mb-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">Our Journey</h2>
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-1 bg-gray-200"></div>

            {/* Timeline items */}
            <div className="space-y-12">
              {milestones.map((milestone, index) => (
                <div key={index} className={`flex items-center ${index % 2 === 0 ? 'flex-row' : 'flex-row-reverse'}`}>
                  <div className="w-1/2"></div>
                  <div className="z-10 flex items-center justify-center w-12 h-12 bg-primary rounded-full shadow-lg transform -translate-x-1/2">
                    <span className="text-white font-bold">{milestone.year}</span>
                  </div>
                  <div className={`w-1/2 ${index % 2 === 0 ? 'pl-12' : 'pr-12'}`}>
                    <div className="bg-white p-6 rounded-lg shadow-md">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{milestone.title}</h3>
                      <p className="text-gray-600">{milestone.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Meet Our Team Section */}
      <section className="mb-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">Meet Our Team</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {teamMembers.map((member, index) => (
              <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="relative h-64 w-full bg-gray-100">
                  {/* Fallback content if image is not available */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center p-6">
                      <svg className="h-12 w-12 text-gray-400 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                      <p className="text-gray-500 text-sm">{member.name}</p>
                    </div>
                  </div>
                  {/* Try to load the image, but the fallback will display if it fails */}
                  <ClientImage
                    src={member.imageUrl}
                    alt={member.name}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                    className="object-cover"
                    fallbackContent={null} // This will make the fallback div visible when image fails to load
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-1">{member.name}</h3>
                  <p className="text-primary font-medium mb-3">{member.role}</p>
                  <p className="text-gray-600 text-sm">{member.bio}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="mb-16 bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">Why Choose TechCortex</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-md flex">
              <div className="text-primary mr-4 flex-shrink-0">
                <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Premium Quality Products</h3>
                <p className="text-gray-600">We carefully select each product in our catalog to ensure it meets our high standards for quality and performance.</p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md flex">
              <div className="text-primary mr-4 flex-shrink-0">
                <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Competitive Pricing</h3>
                <p className="text-gray-600">We offer fair and competitive prices on all our products, with regular deals and promotions for even better value.</p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md flex">
              <div className="text-primary mr-4 flex-shrink-0">
                <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Expert Support</h3>
                <p className="text-gray-600">Our knowledgeable team is always ready to provide expert advice and support for all your technical questions.</p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md flex">
              <div className="text-primary mr-4 flex-shrink-0">
                <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                  <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707l-2-2A1 1 0 0015 7h-1z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Fast & Reliable Shipping</h3>
                <p className="text-gray-600">We partner with trusted shipping providers to ensure your orders arrive quickly and safely.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Us CTA */}
      <section className="mb-16">
        <div className="container mx-auto px-4">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg overflow-hidden">
            <div className="p-8 md:p-12 text-white text-center">
              <h2 className="text-2xl md:text-3xl font-bold mb-4">Have Questions?</h2>
              <p className="text-lg mb-6">Our team is here to help with any questions you might have about our products or services.</p>
              <Link 
                href="/contact" 
                className="bg-white text-blue-600 px-8 py-3 rounded-md hover:bg-gray-100 transition-colors inline-block"
              >
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

// Main About Us page component with suspense for loading state
export default function AboutUs() {
  return (
    <main className="min-h-screen">
      <Suspense fallback={
        <div className="flex justify-center items-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      }>
        <AboutUsContent />
      </Suspense>
    </main>
  );
}
