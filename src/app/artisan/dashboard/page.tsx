'use client';

import { useState, useEffect } from 'react';
import { ProductPin } from '@/components/ProductPin';
import { Button } from '@/components/ui/button';
import { Plus, BarChart3, Users, Camera, Eye, Heart, Share2, MessageCircle, TrendingUp, Award, Star } from 'lucide-react';
import { Craft } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';
import { firestoreService } from '@/lib/firestoreService';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export default function ArtisanDashboardPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [crafts, setCrafts] = useState<Craft[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalViews: 0,
    totalLikes: 0,
    totalShares: 0,
    publishedCrafts: 0
  });
  const { user } = useAuth();
  const router = useRouter();

  // Load crafts from Firestore
  useEffect(() => {
    const loadCrafts = async () => {
      if (!user?.uid) return;
      
      try {
        setLoading(true);
        const userCrafts = await firestoreService.getCraftsByArtisan(user.uid);
        setCrafts(userCrafts);
      } catch (error) {
        console.error('Error loading crafts:', error);
        toast.error('Failed to load crafts');
      } finally {
        setLoading(false);
      }
    };

    loadCrafts();
  }, [user?.uid]);

  // Load mock data if no crafts exist
  useEffect(() => {
    if (!loading && crafts.length === 0) {
      const mockCrafts: Craft[] = [
        {
          id: '1',
          artisanId: 'artisan1',
          title: 'Traditional Blue Pottery Bowl',
          description: 'Hand-thrown ceramic bowl with intricate floral patterns painted using natural cobalt oxide.',
          myth: 'According to legend, blue pottery was gifted by the goddess of creativity to bring harmony to homes.',
          story: 'This piece carries the whispers of generations, each brushstroke a prayer, each pattern a memory.',
          images: ['https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=400&fit=crop'],
          culturalContext: 'Blue pottery represents the fusion of Persian and Indian artistic traditions.',
          materials: ['Clay', 'Cobalt Oxide', 'Natural Pigments'],
          techniques: ['Hand Throwing', 'Brush Painting', 'Firing'],
          difficulty: 'intermediate',
          timeToComplete: '2-3 days',
          location: 'Jaipur, Rajasthan',
          tags: ['blue pottery', 'ceramics', 'traditional', 'handmade'],
          isPublished: true,
          aiGenerated: {
            descriptionGenerated: true,
            mythGenerated: true,
            storyGenerated: true,
            tagsGenerated: true,
            lastGenerated: new Date()
          },
          stats: {
            views: 156,
            likes: 23,
            saves: 8,
            shares: 3
          },
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: '2',
          artisanId: 'artisan1',
          title: 'Islamic Geometric Wood Carving',
          description: 'Intricate geometric patterns carved in cedar wood, showcasing sacred geometry principles.',
          myth: 'Ancient wisdom holds that geometric patterns are pathways to the divine.',
          story: 'Each angle and curve represents a different aspect of creation, a meditation on sacred geometry.',
          images: ['https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=400&fit=crop'],
          culturalContext: 'Islamic geometric art represents mathematical precision and spiritual depth.',
          materials: ['Cedar Wood', 'Chisels', 'Sandpaper'],
          techniques: ['Hand Carving', 'Geometric Design', 'Finishing'],
          difficulty: 'advanced',
          timeToComplete: '1-2 weeks',
          location: 'Cairo, Egypt',
          tags: ['wood carving', 'Islamic art', 'geometric', 'sacred geometry'],
          isPublished: false,
          aiGenerated: {
            descriptionGenerated: true,
            mythGenerated: true,
            storyGenerated: true,
            tagsGenerated: true,
            lastGenerated: new Date()
          },
          stats: {
            views: 89,
            likes: 12,
            saves: 5,
            shares: 2
          },
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: '3',
          artisanId: 'artisan1',
          title: 'Handwoven Silk Scarf',
          description: 'Luxurious silk scarf with traditional paisley patterns, handwoven on a traditional loom.',
          myth: 'The paisley pattern is said to represent the tree of life and eternal growth.',
          story: 'Woven with threads of gold and silk, this scarf tells the story of ancient weaving traditions.',
          images: ['https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=400&h=400&fit=crop'],
          culturalContext: 'Silk weaving represents centuries of Indian textile mastery.',
          materials: ['Silk', 'Gold Thread', 'Natural Dyes'],
          techniques: ['Hand Weaving', 'Pattern Design', 'Dyeing'],
          difficulty: 'advanced',
          timeToComplete: '1 week',
          location: 'Varanasi, India',
          tags: ['silk', 'weaving', 'traditional', 'luxury'],
          isPublished: true,
          aiGenerated: {
            descriptionGenerated: true,
            mythGenerated: true,
            storyGenerated: true,
            tagsGenerated: true,
            lastGenerated: new Date()
          },
          stats: {
            views: 203,
            likes: 45,
            saves: 18,
            shares: 7
          },
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
      setCrafts(mockCrafts);
      
      // Calculate stats
      const totalViews = mockCrafts.reduce((sum, craft) => sum + (craft.stats?.views || 0), 0);
      const totalLikes = mockCrafts.reduce((sum, craft) => sum + (craft.stats?.likes || 0), 0);
      const totalShares = mockCrafts.reduce((sum, craft) => sum + (craft.stats?.shares || 0), 0);
      const publishedCrafts = mockCrafts.filter(craft => craft.isPublished).length;
      
      setStats({
        totalViews,
        totalLikes,
        totalShares,
        publishedCrafts
      });
    }
  }, [loading, crafts.length]);

  const handleEditCraft = (craft: Craft) => {
    router.push(`/artisan/craft/${craft.id}/edit`);
  };

  const handlePublishCraft = async (craft: Craft) => {
    try {
      const newStatus = !craft.isPublished;
      await firestoreService.updateCraft(craft.id, { isPublished: newStatus });
      
      setCrafts(prev => prev.map(c => 
        c.id === craft.id ? { ...c, isPublished: newStatus } : c
      ));
      
      toast.success(newStatus ? 'Craft published successfully!' : 'Craft unpublished');
    } catch (error) {
      console.error('Error updating craft:', error);
      toast.error('Failed to update craft status');
    }
  };

  const handleDeleteCraft = async (craft: Craft) => {
    try {
      await firestoreService.deleteCraft(craft.id);
      setCrafts(prev => prev.filter(c => c.id !== craft.id));
      toast.success('Craft deleted successfully');
    } catch (error) {
      console.error('Error deleting craft:', error);
      toast.error('Failed to delete craft');
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'crafts', label: 'My Crafts', icon: Camera },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
    { id: 'profile', label: 'Profile', icon: Users }
  ];

  return (
    <div className="min-h-screen bg-gradient-warm">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-beige/50">
        <div className="container mx-auto px-6 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-charcoal font-serif">
                Welcome back, {user?.displayName || 'Artisan'}!
              </h1>
              <p className="text-brown mt-1">
                Manage your crafts and grow your artisan business
              </p>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() => router.push('/artisan/voice-onboard')}
                className="bg-gold hover:bg-gold-light text-charcoal font-medium"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create New Craft
              </Button>
              
              <Button
                variant="outline"
                onClick={() => router.push('/voice-demo')}
                className="border-brown text-brown hover:bg-brown hover:text-cream"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Try Voice Demo
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 mb-8 bg-white/50 p-2 rounded-2xl backdrop-blur-sm">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-gold text-charcoal shadow-md'
                    : 'text-brown hover:bg-white/70 hover:text-charcoal'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-brown text-sm font-medium">Total Views</p>
                    <p className="text-3xl font-bold text-charcoal mt-1">{stats.totalViews}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Eye className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-brown text-sm font-medium">Total Likes</p>
                    <p className="text-3xl font-bold text-charcoal mt-1">{stats.totalLikes}</p>
                  </div>
                  <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                    <Heart className="w-6 h-6 text-red-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-brown text-sm font-medium">Total Shares</p>
                    <p className="text-3xl font-bold text-charcoal mt-1">{stats.totalShares}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <Share2 className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-brown text-sm font-medium">Published Crafts</p>
                    <p className="text-3xl font-bold text-charcoal mt-1">{stats.publishedCrafts}</p>
                  </div>
                  <div className="w-12 h-12 bg-gold/20 rounded-xl flex items-center justify-center">
                    <Award className="w-6 h-6 text-gold" />
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Crafts */}
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 border border-white/50">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-charcoal font-serif">Recent Crafts</h2>
                <Button
                  variant="outline"
                  onClick={() => setActiveTab('crafts')}
                  className="border-brown text-brown hover:bg-brown hover:text-cream"
                >
                  View All
                </Button>
              </div>
              
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold mx-auto mb-4"></div>
                  <p className="text-brown">Loading your crafts...</p>
                </div>
              ) : crafts.length === 0 ? (
                <div className="text-center py-12">
                  <Camera className="w-16 h-16 text-brown/50 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-charcoal mb-2">No crafts yet</h3>
                  <p className="text-brown mb-6">Start by creating your first craft with our voice assistant</p>
                  <Button
                    onClick={() => router.push('/artisan/voice-onboard')}
                    className="bg-gold hover:bg-gold-light text-charcoal"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Craft
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {crafts.slice(0, 3).map(craft => (
                    <ProductPin
                      key={craft.id}
                      craft={craft}
                      onEdit={handleEditCraft}
                      onPublish={handlePublishCraft}
                      onDelete={handleDeleteCraft}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'crafts' && (
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 border border-white/50">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-charcoal font-serif">My Crafts</h2>
              <Button
                onClick={() => router.push('/artisan/voice-onboard')}
                className="bg-gold hover:bg-gold-light text-charcoal"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Craft
              </Button>
            </div>
            
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold mx-auto mb-4"></div>
                <p className="text-brown">Loading your crafts...</p>
              </div>
            ) : crafts.length === 0 ? (
              <div className="text-center py-16">
                <Camera className="w-20 h-20 text-brown/50 mx-auto mb-6" />
                <h3 className="text-2xl font-semibold text-charcoal mb-3">No crafts yet</h3>
                <p className="text-brown mb-8 max-w-md mx-auto">
                  Start your journey by creating your first craft. Our voice assistant will guide you through the process.
                </p>
                <Button
                  onClick={() => router.push('/artisan/voice-onboard')}
                  className="bg-gold hover:bg-gold-light text-charcoal text-lg px-8 py-3"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Create Your First Craft
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {crafts.map(craft => (
                  <ProductPin
                    key={craft.id}
                    craft={craft}
                    onEdit={handleEditCraft}
                    onPublish={handlePublishCraft}
                    onDelete={handleDeleteCraft}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-8">
            {/* Detailed Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/50">
                <div className="flex items-center space-x-3 mb-4">
                  <Eye className="w-8 h-8 text-blue-600" />
                  <h3 className="text-lg font-semibold text-charcoal">Views</h3>
                </div>
                <p className="text-3xl font-bold text-charcoal mb-2">{stats.totalViews}</p>
                <p className="text-sm text-brown">Total views across all crafts</p>
              </div>

              <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/50">
                <div className="flex items-center space-x-3 mb-4">
                  <Heart className="w-8 h-8 text-red-600" />
                  <h3 className="text-lg font-semibold text-charcoal">Likes</h3>
                </div>
                <p className="text-3xl font-bold text-charcoal mb-2">{stats.totalLikes}</p>
                <p className="text-sm text-brown">People who loved your work</p>
              </div>

              <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/50">
                <div className="flex items-center space-x-3 mb-4">
                  <Share2 className="w-8 h-8 text-green-600" />
                  <h3 className="text-lg font-semibold text-charcoal">Shares</h3>
                </div>
                <p className="text-3xl font-bold text-charcoal mb-2">{stats.totalShares}</p>
                <p className="text-sm text-brown">Times your crafts were shared</p>
              </div>
            </div>

            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 border border-white/50">
              <h3 className="text-xl font-semibold text-charcoal mb-4">Performance Overview</h3>
              <p className="text-brown">Detailed analytics and insights coming soon...</p>
            </div>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 border border-white/50">
            <h2 className="text-2xl font-bold text-charcoal mb-6 font-serif">Profile Settings</h2>
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gold rounded-full flex items-center justify-center">
                  <Users className="w-8 h-8 text-charcoal" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-charcoal">{user?.displayName || 'Artisan'}</h3>
                  <p className="text-brown">{user?.email}</p>
                </div>
              </div>
              
              <div className="border-t border-beige pt-6">
                <p className="text-brown">Profile management features coming soon...</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}