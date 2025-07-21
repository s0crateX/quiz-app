import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import {
  Users,
  Settings,
  Monitor,
  Trophy,
  Play,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import Layout from '../components/Layout';

export default function Home() {
  const menuItems = [
    {
      href: '/join',
      title: 'Join as Player',
      description: 'Enter the quiz as a participant and test your knowledge',
      icon: Users,
      color: 'from-blue-500 to-cyan-500',
      hoverColor: 'hover:from-blue-600 hover:to-cyan-600'
    },
    {
      href: '/master',
      title: 'Quiz Master',
      description: 'Control the quiz, manage questions and monitor players',
      icon: Settings,
      color: 'from-red-500 to-pink-500',
      hoverColor: 'hover:from-red-600 hover:to-pink-600'
    },
    {
      href: '/display',
      title: 'Display Screen',
      description: 'Show questions and answers for all participants to see',
      icon: Monitor,
      color: 'from-purple-500 to-indigo-500',
      hoverColor: 'hover:from-purple-600 hover:to-indigo-600'
    },
    {
      href: '/scoreboard',
      title: 'Scoreboard',
      description: 'View real-time rankings and player scores',
      icon: Trophy,
      color: 'from-yellow-500 to-orange-500',
      hoverColor: 'hover:from-yellow-600 hover:to-orange-600'
    }
  ];

  return (
    <Layout title="Interactive Quiz System">
      <div className="space-y-8">
        {/* Welcome Section */}
        <Card className="bg-gradient-to-r from-blue-600 via-purple-600 to-red-600 text-white border-0 shadow-2xl">
          <CardHeader className="text-center space-y-4">
            <div className="flex items-center justify-center space-x-3">
              <Play className="w-12 h-12 text-yellow-300" />
              <CardTitle className="text-4xl md:text-5xl font-bold">
                Quiz Game
              </CardTitle>
              <Sparkles className="w-12 h-12 text-yellow-300" />
            </div>
            <CardDescription className="text-xl text-blue-100">
              Welcome to the AMA Computer College Interactive Quiz System
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Menu Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {menuItems.map((item, index) => {
            const IconComponent = item.icon;
            return (
              <Link key={index} href={item.href} className="group">
                <Card className="h-full transition-all duration-300 transform hover:scale-105 hover:shadow-2xl border-0 bg-white/90 backdrop-blur-sm">
                  <CardHeader>
                    <div className="flex items-center space-x-4">
                      <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${item.color} flex items-center justify-center transition-all duration-300 ${item.hoverColor} group-hover:scale-110`}>
                        <IconComponent className="w-8 h-8 text-white" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-2xl font-bold text-gray-800 group-hover:text-gray-900">
                          {item.title}
                        </CardTitle>
                      </div>
                      <ArrowRight className="w-6 h-6 text-gray-400 group-hover:text-gray-600 transition-colors duration-300" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-gray-600 text-lg leading-relaxed">
                      {item.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* Quick Start Guide */}
        <Card className="bg-gray-50 border-2 border-dashed border-gray-300">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-gray-800 text-center">
              🚀 Quick Start Guide
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
              <div className="space-y-2">
                <div className="w-12 h-12 bg-blue-500 text-white rounded-full flex items-center justify-center mx-auto font-bold text-xl">
                  1
                </div>
                <h4 className="font-semibold text-gray-800">Setup</h4>
                <p className="text-sm text-gray-600">Quiz Master creates questions</p>
              </div>
              <div className="space-y-2">
                <div className="w-12 h-12 bg-green-500 text-white rounded-full flex items-center justify-center mx-auto font-bold text-xl">
                  2
                </div>
                <h4 className="font-semibold text-gray-800">Join</h4>
                <p className="text-sm text-gray-600">Players enter their names</p>
              </div>
              <div className="space-y-2">
                <div className="w-12 h-12 bg-purple-500 text-white rounded-full flex items-center justify-center mx-auto font-bold text-xl">
                  3
                </div>
                <h4 className="font-semibold text-gray-800">Play</h4>
                <p className="text-sm text-gray-600">Answer questions in real-time</p>
              </div>
              <div className="space-y-2">
                <div className="w-12 h-12 bg-yellow-500 text-white rounded-full flex items-center justify-center mx-auto font-bold text-xl">
                  4
                </div>
                <h4 className="font-semibold text-gray-800">Results</h4>
                <p className="text-sm text-gray-600">View scores and rankings</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Floating background elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 left-10 w-32 h-32 bg-blue-200 rounded-full opacity-10 animate-pulse"></div>
        <div className="absolute top-40 right-20 w-24 h-24 bg-red-200 rounded-full opacity-10 animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 left-20 w-40 h-40 bg-yellow-200 rounded-full opacity-10 animate-pulse delay-2000"></div>
        <div className="absolute bottom-40 right-10 w-28 h-28 bg-green-200 rounded-full opacity-10 animate-pulse delay-500"></div>
      </div>
    </Layout>
  );
}
