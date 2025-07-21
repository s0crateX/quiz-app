import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Settings, Users, HelpCircle } from 'lucide-react';
import Layout from '../../components/Layout';
import QuestionManager from '../../components/QuestionManager';
import PlayerManager from '../../components/PlayerManager';

const MasterPage = () => {
  return (
    <Layout title="Quiz Master Control Panel">
      <div className="space-y-6">
        {/* Welcome Card */}
        <Card className="bg-gradient-to-r from-blue-600 to-red-600 text-white border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl font-bold flex items-center space-x-2">
              <Settings className="w-6 h-6" />
              <span>Master Control Panel</span>
            </CardTitle>
            <CardDescription className="text-blue-100">
              Manage your quiz questions, monitor players, and control the quiz flow
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Main Control Tabs */}
        <Tabs defaultValue="questions" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 h-12 bg-white shadow-md">
            <TabsTrigger 
              value="questions" 
              className="flex items-center space-x-2 text-base font-medium data-[state=active]:bg-blue-500 data-[state=active]:text-white"
            >
              <HelpCircle className="w-4 h-4" />
              <span>Question Management</span>
            </TabsTrigger>
            <TabsTrigger 
              value="players" 
              className="flex items-center space-x-2 text-base font-medium data-[state=active]:bg-red-500 data-[state=active]:text-white"
            >
              <Users className="w-4 h-4" />
              <span>Player Management</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="questions" className="space-y-4">
            <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-xl text-gray-800">Question Management</CardTitle>
                <CardDescription>
                  Create, edit, and manage quiz questions. Set timers and start quiz sessions.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <QuestionManager />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="players" className="space-y-4">
            <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-xl text-gray-800">Player Management</CardTitle>
                <CardDescription>
                  Monitor active players, view scores, and manage participant data.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PlayerManager />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Quick Actions */}
        <Card className="bg-gray-50 border-2 border-dashed border-gray-300">
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold text-gray-700">Quick Access Links</h3>
              <div className="flex flex-wrap justify-center gap-4 text-sm">
                <a 
                  href="/display" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Open Display Screen
                </a>
                <a 
                  href="/scoreboard" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  Open Scoreboard
                </a>
                <a 
                  href="/join" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
                >
                  Player Join Page
                </a>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default MasterPage;