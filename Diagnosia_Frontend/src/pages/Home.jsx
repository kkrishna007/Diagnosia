import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, TestTube, Clock, MapPin, Shield, Star, CheckCircle, Users, Award, TrendingUp } from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

import { useEffect, useState } from 'react';
import { testService } from '../services/testService';

const Home = () => {
  const [popularTests, setPopularTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const features = [
    {
      icon: MapPin,
      title: 'Home Sample Collection',
      description: 'Convenient sample collection from the comfort of your home with trained phlebotomists.'
    },
    {
      icon: Clock,
      title: 'Quick Reports',
      description: 'Get accurate test results within 24-48 hours with digital report delivery.'
    },
    {
      icon: Shield,
      title: 'NABL Certified',
      description: 'All tests are performed in NABL certified labs with highest quality standards.'
    },
    {
      icon: TestTube,
      title: 'Comprehensive Tests',
      description: 'Wide range of blood tests, health packages, and specialized diagnostic services.'
    }
  ];


  useEffect(() => {
    const fetchPopularTests = async () => {
      setLoading(true);
      try {
        const response = await testService.getAllTests();
        // Filter for popular tests if the backend provides a flag, else show all
        const tests = response.data.filter(t => t.isPopular || t.popular);
        setPopularTests(tests.length > 0 ? tests : response.data.slice(0, 4));
      } catch (err) {
        setPopularTests([]);
      }
      setLoading(false);
    };
    fetchPopularTests();
  }, []);

  const stats = [
    { icon: Users, value: '50,000+', label: 'Happy Customers' },
    { icon: TestTube, value: '200+', label: 'Types of Tests' },
    { icon: Award, value: '98%', label: 'Accuracy Rate' },
    { icon: TrendingUp, value: '24-48hrs', label: 'Report Delivery' }
  ];

  const testimonials = [
    {
      name: 'Priya Sharma',
      location: 'Delhi',
      rating: 5,
      comment: 'Excellent service! Home collection was very convenient and reports were delivered on time.'
    },
    {
      name: 'Rajesh Kumar',
      location: 'Mumbai',
      rating: 5,
      comment: 'Professional staff and accurate results. Highly recommend Diagnosia for all lab tests.'
    },
    {
      name: 'Anita Patel',
      location: 'Bangalore',
      rating: 5,
      comment: 'Easy booking process and great customer support. Will definitely use again.'
    }
  ];

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
                Your Health,
                <span className="text-blue-200"> Our Priority</span>
              </h1>
              <p className="text-xl text-blue-100 mb-8 leading-relaxed">
                Get accurate lab tests with home sample collection. Book online, 
                get tested at home, and receive digital reports within 24-48 hours.
              </p>
              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                <Link to="/tests">
                  <Button size="lg" variant="primary" className="font-semibold">
                    Book a Test Now
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link to="/about">
                  <Button variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-blue-600">
                    Learn More
                  </Button>
                </Link>
              </div>
            </div>
            <div className="relative">
              <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-2xl p-8">
                <div className="text-center">
                  <div className="w-24 h-24 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <TestTube className="h-12 w-12 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4">Quick & Easy Booking</h3>
                  <div className="space-y-3 text-left">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-5 w-5 text-blue-200" />
                      <span>Browse & select tests</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-5 w-5 text-blue-200" />
                      <span>Schedule home collection</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-5 w-5 text-blue-200" />
                      <span>Get digital reports</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</div>
                  <div className="text-gray-600 font-medium">{stat.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose Diagnosia?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We provide comprehensive diagnostic services with cutting-edge technology 
              and personalized care for your health monitoring needs.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="text-center p-8 hover:shadow-lg transition-shadow">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Icon className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Popular Tests Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Popular Health Tests
            </h2>
            <p className="text-xl text-gray-600">
              Most commonly booked tests by our customers
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {loading ? (
              <div className="col-span-4 text-center text-gray-500">Loading popular tests...</div>
            ) : popularTests.length === 0 ? (
              <div className="col-span-4 text-center text-gray-500">No popular tests found.</div>
            ) : (
              popularTests.map((test, index) => (
                <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <TestTube className="h-5 w-5 text-blue-600" />
                    </div>
                    {(test.isPopular || test.popular) && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-600">
                        <Star className="h-3 w-3 mr-1 fill-current" />
                        Popular
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{test.test_name || test.name}</h3>
                  <p className="text-gray-600 text-sm mb-4">{test.test_description || test.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-blue-600">{formatPrice(test.base_price || test.price)}</span>
                    <Link to={`/tests`}>
                      <Button size="sm">Book Now</Button>
                    </Link>
                  </div>
                </Card>
              ))
            )}
          </div>
          
          <div className="text-center mt-12">
            <Link to="/tests">
              <Button size="lg">
                View All Tests
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              What Our Customers Say
            </h2>
            <p className="text-xl text-gray-600">
              Real experiences from satisfied customers
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="p-6">
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 mb-4 italic">"{testimonial.comment}"</p>
                <div>
                  <div className="font-semibold text-gray-900">{testimonial.name}</div>
                  <div className="text-sm text-gray-500">{testimonial.location}</div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Take Charge of Your Health?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Book your health tests today and get comprehensive reports 
            with expert recommendations from the comfort of your home.
          </p>
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 justify-center">
            <Link to="/tests">
              <Button size="lg" variant="primary" className="font-semibold">
                Browse Tests
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/register">
              <Button variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-blue-600">
                Create Account
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
