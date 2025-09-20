'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Camera, Mic, Plus, Grid3X3, User, LogOut } from 'lucide-react';
import { ArtisanTutorial } from '@/components/ArtisanTutorial';
import { VoiceAssistantWorkflow } from '@/components/VoiceAssistantWorkflow';
import { ProductGrid } from '@/components/ProductGrid';
import { authService } from '@/lib/authService';
import { firestoreService } from '@/lib/firestoreService';
import { toast } from 'sonner';

export default function ArtisanPage() {
  const [currentView, setCurrentView] = useState<'tutorial' | 'products' | 'create'>('tutorial');
  const [showTutorial, setShowTutorial] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const initializeArtisan = async () => {
      try {
        const currentUser = await authService.initializeAuth();
        if (!currentUser) {
          router.push('/');
          return;
        }

        setUser(currentUser);

        // Check if user has completed tutorial
        const hasCompletedTutorial = localStorage.getItem('craftstory_tutorial_completed');
        if (hasCompletedTutorial) {
          setShowTutorial(false);
          setCurrentView('products');
        }

        // Load user's products
        const userProducts = await firestoreService.getCraftsByArtisan(currentUser.uid);
        setProducts(userProducts);
      } catch (error) {
        console.error('Error initializing artisan page:', error);
        toast.error('Failed to load your data');
      } finally {
        setIsLoading(false);
      }
    };

    initializeArtisan();
  }, [router]);

  const handleTutorialComplete = () => {
    localStorage.setItem('craftstory_tutorial_completed', 'true');
    setShowTutorial(false);
    setCurrentView('products');
    toast.success('Tutorial completed! Ready to create your first product.');
  };

  const handleTutorialSkip = () => {
    localStorage.setItem('craftstory_tutorial_completed', 'true');
    setShowTutorial(false);
    setCurrentView('products');
    toast.info('Tutorial skipped. You can always access help later.');
  };

  const handleProductCreated = (product: any) => {
    setProducts(prev => [product, ...prev]);
    setCurrentView('products');
    toast.success('Product created successfully!');
  };

  const handleSignOut = async () => {
    try {
      await authService.signOut();
      localStorage.clear();
      router.push('/');
      toast.success('Signed out successfully');
    } catch (error) {
      console.error('Sign out error:', error);
      toast.error('Failed to sign out');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-warm flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold mx-auto mb-4"></div>
          <p className="text-brown">Loading your artisan workspace...</p>
        </div>
      </div>
    );
  }

  if (showTutorial) {
    return (
      <div className="min-h-screen bg-gradient-warm">
        <ArtisanTutorial
          onComplete={handleTutorialComplete}
          onSkip={handleTutorialSkip}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-warm">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-beige">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-br from-gold to-gold-light rounded-full flex items-center justify-center">
                <span className="text-charcoal font-bold">CS</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-charcoal font-serif">CraftStory</h1>
                <p className="text-sm text-brown">Artisan Dashboard</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-charcoal">
                  {user?.displayName || 'Artisan'}
                </p>
                <p className="text-xs text-brown">
                  {products.length} product{products.length !== 1 ? 's' : ''}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
                className="border-brown text-brown hover:bg-brown hover:text-cream"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-cream border-b border-beige">
        <div className="container mx-auto px-4">
          <div className="flex space-x-1">
            <button
              onClick={() => setCurrentView('products')}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                currentView === 'products'
                  ? 'text-charcoal border-b-2 border-gold bg-white'
                  : 'text-brown hover:text-charcoal'
              }`}
            >
              <Grid3X3 className="w-4 h-4 inline mr-2" />
              My Products
            </button>
            <button
              onClick={() => setCurrentView('create')}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                currentView === 'create'
                  ? 'text-charcoal border-b-2 border-gold bg-white'
                  : 'text-brown hover:text-charcoal'
              }`}
            >
              <Plus className="w-4 h-4 inline mr-2" />
              Create Product
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {currentView === 'products' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-charcoal font-serif">Your Products</h2>
                <p className="text-brown">Manage and showcase your beautiful crafts</p>
              </div>
              <Button
                onClick={() => setCurrentView('create')}
                className="bg-gold hover:bg-gold-light text-charcoal"
              >
                <Plus className="w-5 h-5 mr-2" />
                Create New Product
              </Button>
            </div>

            {products.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-24 h-24 bg-gold/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Camera className="w-12 h-12 text-gold" />
                </div>
                <h3 className="text-xl font-semibold text-charcoal mb-2">No products yet</h3>
                <p className="text-brown mb-6">
                  Start by creating your first product with our AI voice assistant
                </p>
                <Button
                  onClick={() => setCurrentView('create')}
                  className="bg-gold hover:bg-gold-light text-charcoal"
                >
                  <Mic className="w-5 h-5 mr-2" />
                  Create Your First Product
                </Button>
              </div>
            ) : (
              <ProductGrid />
            )}
          </div>
        )}

        {currentView === 'create' && (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-charcoal font-serif">Create New Product</h2>
              <p className="text-brown">Use our AI voice assistant to create your product listing</p>
            </div>

            <VoiceAssistantWorkflow
              userId={user?.uid || 'demo-user'}
              onProductCreated={handleProductCreated}
              onCancel={() => setCurrentView('products')}
            />
          </div>
        )}
      </main>

      {/* Quick Actions FAB */}
      {currentView === 'products' && (
        <div className="fixed bottom-6 right-6">
          <Button
            onClick={() => setCurrentView('create')}
            className="w-14 h-14 rounded-full bg-gold hover:bg-gold-light text-charcoal shadow-lg hover:shadow-xl transition-all"
            size="lg"
          >
            <Plus className="w-6 h-6" />
          </Button>
        </div>
      )}
    </div>
  );
}