import React from 'react';
import { FaTools, FaBolt, FaTruck } from 'react-icons/fa';

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="text-center">
      <div className="w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center text-2xl mx-auto mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}

export default function FeaturesSection() {
  const features = [
    {
      icon: <FaTools />,
      title: "Expert Guidance",
      description: "Our compatibility checker ensures all your components work perfectly together"
    },
    {
      icon: <FaBolt />,
      title: "Premium Quality", 
      description: "Only the highest quality components from trusted brands and manufacturers"
    },
    {
      icon: <FaTruck />,
      title: "Fast Delivery",
      description: "Quick and secure shipping to get your components to you as soon as possible"
    }
  ];

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Choose TechCortex?</h2>
          <p className="text-xl text-gray-600">Your trusted partner in PC building</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
            />
          ))}
        </div>
      </div>
    </section>
  );
}