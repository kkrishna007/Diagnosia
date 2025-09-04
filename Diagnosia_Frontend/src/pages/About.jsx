import React from 'react';
import { Link } from 'react-router-dom';
import { TestTube, Users, Award, Shield, MapPin, Phone, Mail, ArrowRight } from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

const About = () => {
  const milestones = [
    { year: '2015', event: 'Founded Diagnosia with a vision to make healthcare accessible' },
    { year: '2017', event: 'Launched home sample collection service' },
    { year: '2019', event: 'Achieved NABL certification for all lab processes' },
    { year: '2021', event: 'Expanded to 50+ cities across India' },
    { year: '2023', event: 'Introduced AI-powered health insights' },
    { year: '2025', event: 'Serving 50,000+ customers with 98% satisfaction rate' }
  ];

  const values = [
    {
      icon: Shield,
      title: 'Quality & Accuracy',
      description: 'We maintain the highest standards of quality with NABL certified labs and cutting-edge technology.'
    },
    {
      icon: Users,
      title: 'Customer-Centric',
      description: 'Your health and convenience are our top priorities. We design our services around your needs.'
    },
    {
      icon: Award,
      title: 'Excellence',
      description: 'We strive for excellence in everything we do, from sample collection to report delivery.'
    },
    {
      icon: TestTube,
      title: 'Innovation',
      description: 'We continuously innovate to provide better, faster, and more accurate diagnostic solutions.'
    }
  ];

  const team = [
    {
      name: 'Dr. Rajesh Sharma',
      role: 'Chief Medical Officer',
      experience: '20+ years in clinical pathology',
      image: '/api/placeholder/150/150'
    },
    {
      name: 'Priya Patel',
      role: 'Head of Operations',
      experience: '15+ years in healthcare operations',
      image: '/api/placeholder/150/150'
    },
    {
      name: 'Amit Kumar',
      role: 'Technology Director',
      experience: '12+ years in healthcare technology',
      image: '/api/placeholder/150/150'
    },
    {
      name: 'Dr. Sneha Gupta',
      role: 'Quality Assurance Head',
      experience: '18+ years in laboratory medicine',
      image: '/api/placeholder/150/150'
    }
  ];

  const stats = [
    { number: '50,000+', label: 'Happy Customers' },
    { number: '200+', label: 'Types of Tests' },
    { number: '50+', label: 'Cities Covered' },
    { number: '98%', label: 'Accuracy Rate' }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              About Diagnosia
            </h1>
            <p className="text-xl text-blue-100 leading-relaxed">
              We're on a mission to make quality healthcare accessible, convenient, and affordable for everyone. 
              With cutting-edge technology and a customer-first approach, we're transforming the way people 
              access diagnostic services.
            </p>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Mission</h2>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                To revolutionize healthcare diagnostics by providing accurate, accessible, 
                and affordable lab testing services that empower individuals to take control 
                of their health journey.
              </p>
              
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Vision</h2>
              <p className="text-lg text-gray-600 leading-relaxed">
                To become India's most trusted healthcare partner, making quality diagnostic 
                services available to every household through innovation, technology, and 
                compassionate care.
              </p>
            </div>
            
            <div className="bg-blue-50 rounded-2xl p-8">
              <div className="grid grid-cols-2 gap-6">
                {stats.map((stat, index) => (
                  <div key={index} className="text-center">
                    <div className="text-3xl font-bold text-blue-600 mb-2">{stat.number}</div>
                    <div className="text-gray-700 font-medium">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Values */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Our Core Values
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              These values guide everything we do and shape our commitment to providing 
              exceptional healthcare services.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => {
              const Icon = value.icon;
              return (
                <Card key={index} className="text-center p-8 hover:shadow-lg transition-shadow">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Icon className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">{value.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{value.description}</p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Our Journey */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Our Journey
            </h2>
            <p className="text-xl text-gray-600">
              A decade of innovation and growth in healthcare diagnostics
            </p>
          </div>
          
          <div className="max-w-4xl mx-auto">
            <div className="space-y-8">
              {milestones.map((milestone, index) => (
                <div key={index} className="flex items-start space-x-6">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {milestone.year}
                    </div>
                  </div>
                  <div className="flex-1 bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                    <p className="text-gray-900 font-medium">{milestone.event}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Leadership Team */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Meet Our Leadership Team
            </h2>
            <p className="text-xl text-gray-600">
              Experienced professionals dedicated to advancing healthcare
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {team.map((member, index) => (
              <Card key={index} className="text-center p-6">
                <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <Users className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">{member.name}</h3>
                <p className="text-blue-600 font-medium mb-2">{member.role}</p>
                <p className="text-sm text-gray-600">{member.experience}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Certifications & Quality */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Quality & Certifications
            </h2>
            <p className="text-xl text-gray-600">
              We maintain the highest standards of quality and accuracy
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="text-center p-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Award className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">NABL Certified</h3>
              <p className="text-gray-600">
                All our laboratories are NABL (National Accreditation Board for Testing and 
                Calibration Laboratories) certified, ensuring the highest quality standards.
              </p>
            </Card>
            
            <Card className="text-center p-8">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Shield className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">ISO Certified</h3>
              <p className="text-gray-600">
                Our quality management system is ISO 15189:2012 certified, demonstrating 
                our commitment to excellence in medical laboratory services.
              </p>
            </Card>
            
            <Card className="text-center p-8">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <TestTube className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">CAP Accredited</h3>
              <p className="text-gray-600">
                Our reference laboratory is CAP (College of American Pathologists) accredited, 
                ensuring global standards of laboratory excellence.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Contact Information */}
      <section className="py-20 bg-blue-600 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Get In Touch
              </h2>
              <p className="text-xl text-blue-100 mb-8">
                Have questions about our services? Our team is here to help you 
                with all your healthcare needs.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <MapPin className="h-6 w-6 text-blue-200" />
                  <span className="text-blue-100">
                    123 Medical Plaza, Health District, New Delhi, India - 110001
                  </span>
                </div>
                <div className="flex items-center space-x-4">
                  <Phone className="h-6 w-6 text-blue-200" />
                  <span className="text-blue-100">+91 98765 43210</span>
                </div>
                <div className="flex items-center space-x-4">
                  <Mail className="h-6 w-6 text-blue-200" />
                  <span className="text-blue-100">info@diagnosia.com</span>
                </div>
              </div>
            </div>
            
            <div className="text-center">
              <h3 className="text-2xl font-bold mb-6">Ready to Get Started?</h3>
              <p className="text-blue-100 mb-8">
                Book your health tests today and experience the convenience 
                of professional healthcare at your doorstep.
              </p>
              <div className="space-y-4">
                <Link to="/tests">
                  <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50">
                    Browse Tests
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <div>
                  <Link to="/register" className="text-blue-100 hover:text-white underline">
                    Or create an account to get started
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
