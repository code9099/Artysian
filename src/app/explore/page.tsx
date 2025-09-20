'use client';

import { useState, useEffect } from 'react';
import { VerticalCardSwiper } from '@/components/VerticalCardSwiper';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Filter, Search } from 'lucide-react';
import { SwipeCardData } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';
import { firestoreService } from '@/lib/firestoreService';
import { toast } from 'sonner';

export default function ExplorePage() {
  const [cards, setCards] = useState<SwipeCardData[]>([]);
  const [filteredCards, setFilteredCards] = useState<SwipeCardData[]>([]);
  const [likedCards, setLikedCards] = useState<SwipeCardData[]>([]);
  const [savedCards, setSavedCards] = useState<SwipeCardData[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const { user, isGuest } = useAuth();

  // Load real data from Firestore
  useEffect(() => {
    const loadCrafts = async () => {
      try {
        const crafts = await firestoreService.getAllCrafts(50);
        const swipeCards: SwipeCardData[] = crafts.map(craft => ({
          id: craft.id,
          title: craft.title,
          description: craft.description,
          image: craft.images[0] || 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=600&fit=crop',
          artisan: {
            name: craft.artisanName || 'Anonymous Artisan',
            location: craft.location || 'Unknown Location'
          },
          tags: craft.tags || [],
          difficulty: craft.difficulty || 'intermediate',
          price: craft.price ? `$${craft.price}` : undefined,
          rating: craft.rating || 4.5
        }));
        
        setCards(swipeCards);
        setFilteredCards(swipeCards);
      } catch (error) {
        console.error('Error loading crafts:', error);
        // Fallback to mock data
        loadMockData();
      }
    };

    const loadMockData = () => {
      const mockCards: SwipeCardData[] = [
      {
        id: '1',
        title: 'Traditional Blue Pottery Bowl',
        description: 'Hand-thrown ceramic bowl with intricate floral patterns painted using natural cobalt oxide from Rajasthan.',
        image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=600&fit=crop',
        artisan: {
          name: 'Priya Sharma',
          location: 'Jaipur, Rajasthan'
        },
        tags: ['blue pottery', 'ceramics', 'traditional', 'handmade', 'Rajasthan'],
        difficulty: 'intermediate',
        price: '$45',
        rating: 4.8
      },
      {
        id: '2',
        title: 'Islamic Geometric Wood Carving',
        description: 'Intricate geometric patterns carved in cedar wood, showcasing sacred geometry principles from Islamic art tradition.',
        image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=600&fit=crop',
        artisan: {
          name: 'Ahmed Hassan',
          location: 'Cairo, Egypt'
        },
        tags: ['wood carving', 'Islamic art', 'geometric', 'sacred geometry', 'Egypt'],
        difficulty: 'advanced',
        price: '$120',
        rating: 4.9
      },
      {
        id: '3',
        title: 'Zapotec Textile Weaving',
        description: 'Vibrant handwoven textiles featuring traditional Zapotec patterns, each thread dyed using natural pigments from local plants.',
        image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=600&fit=crop',
        artisan: {
          name: 'Maria Santos',
          location: 'Oaxaca, Mexico'
        },
        tags: ['textile', 'weaving', 'Zapotec', 'natural dyes', 'Mexico'],
        difficulty: 'intermediate',
        price: '$85',
        rating: 4.7
      },
      {
        id: '4',
        title: 'Japanese Kintsugi Bowl',
        description: 'Ceramic bowl repaired with gold lacquer using the ancient Kintsugi method, embracing the philosophy of finding beauty in imperfection.',
        image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=600&fit=crop',
        artisan: {
          name: 'Yuki Tanaka',
          location: 'Kyoto, Japan'
        },
        tags: ['kintsugi', 'ceramics', 'repair', 'gold', 'wabi-sabi', 'Japan'],
        difficulty: 'advanced',
        price: '$200',
        rating: 4.9
      },
      {
        id: '5',
        title: 'Moroccan Leather Pouf',
        description: 'Hand-stitched leather pouf with intricate embroidery, perfect for home decor. Made by skilled leather artisans in Fes.',
        image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=600&fit=crop',
        artisan: {
          name: 'Omar Benali',
          location: 'Fes, Morocco'
        },
        tags: ['leather', 'pouf', 'embroidery', 'Morocco', 'home decor'],
        difficulty: 'intermediate',
        price: '$75',
        rating: 4.6
      }
    ];

      setCards(mockCards);
      setFilteredCards(mockCards);
    };

    loadCrafts();
  }, []);

  // Filter cards based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredCards(cards);
    } else {
      const filtered = cards.filter(card =>
        card.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        card.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        card.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())) ||
        card.artisan.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        card.artisan.location.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredCards(filtered);

    }
  }, [searchTerm, cards]);

  const handleSwipe = (direction: 'left' | 'right', card: SwipeCardData) => {
    if (direction === 'right') {
      setLikedCards(prev => [...prev, card]);
      toast.success(`Liked ${card.title}!`);
    } else {
      toast.info(`Passed on ${card.title}`);
    }
    

  };

  const handleSave = async (card: SwipeCardData) => {
    if (isGuest) {
      toast.error('Please sign in to save crafts');
      return;
    }
    
    if (!user?.uid) return;

    try {
      const isAlreadySaved = savedCards.find(c => c.id === card.id);
      
      if (isAlreadySaved) {
        await firestoreService.removeFromFavorites(user.uid, card.id);
        setSavedCards(prev => prev.filter(c => c.id !== card.id));
        toast.info('Removed from saved');
      } else {
        await firestoreService.addToFavorites(user.uid, card.id);
        setSavedCards(prev => [...prev, card]);
        toast.success('Saved to favorites!');
      }
    } catch (error) {
      console.error('Error updating favorites:', error);
      toast.error('Failed to update favorites');
    }
  };

  const handleLike = async (card: SwipeCardData) => {
    if (isGuest) {
      toast.error('Please sign in to like crafts');
      return;
    }
    
    if (!user?.uid) return;

    try {
      const isAlreadyLiked = likedCards.find(c => c.id === card.id);
      
      if (isAlreadyLiked) {
        setLikedCards(prev => prev.filter(c => c.id !== card.id));
        toast.info('Removed from liked');
      } else {
        setLikedCards(prev => [...prev, card]);
        toast.success('Added to liked!');
      }
    } catch (error) {
      console.error('Error updating likes:', error);
      toast.error('Failed to update likes');
    }
  };



  return (
    <ProtectedRoute requireAuth={false} guestAllowed={true}>
      <div className="min-h-screen bg-gradient-warm">
        {/* Header */}
        <div className="bg-white/90 backdrop-blur-sm border-b border-beige/50 sticky top-0 z-40">
          <div className="container mx-auto px-6 py-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex items-center space-x-4">
                <h1 className="text-3xl font-bold text-charcoal font-serif">Explore Crafts</h1>
                {isGuest && (
                  <span className="bg-orange-100 text-orange-800 text-sm px-3 py-1 rounded-full font-medium">
                    Guest Mode
                  </span>
                )}
              </div>
              
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  className="border-brown text-brown hover:bg-brown hover:text-cream"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Filters
                </Button>
                
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-brown w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search crafts..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-beige rounded-lg bg-cream text-charcoal placeholder-brown focus:outline-none focus:ring-2 focus:ring-gold min-w-[250px]"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-white/80 border-b border-beige/50 py-6">
            <div className="container mx-auto px-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <select className="px-4 py-3 border border-beige rounded-xl bg-white text-charcoal font-medium focus:outline-none focus:ring-2 focus:ring-gold">
                  <option>All Difficulties</option>
                  <option>Beginner</option>
                  <option>Intermediate</option>
                  <option>Advanced</option>
                </select>
                
                <select className="px-4 py-3 border border-beige rounded-xl bg-white text-charcoal font-medium focus:outline-none focus:ring-2 focus:ring-gold">
                  <option>All Locations</option>
                  <option>India</option>
                  <option>Egypt</option>
                  <option>Mexico</option>
                  <option>Japan</option>
                  <option>Morocco</option>
                </select>
                
                <select className="px-4 py-3 border border-beige rounded-xl bg-white text-charcoal font-medium focus:outline-none focus:ring-2 focus:ring-gold">
                  <option>All Price Ranges</option>
                  <option>Under $50</option>
                  <option>$50 - $100</option>
                  <option>$100 - $200</option>
                  <option>Over $200</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="container mx-auto px-6 py-12">
          {filteredCards.length === 0 ? (
            <div className="text-center py-24">
              <div className="w-32 h-32 bg-beige rounded-full flex items-center justify-center mx-auto mb-8">
                <Search className="w-16 h-16 text-brown/50" />
              </div>
              <h2 className="text-3xl font-bold text-charcoal mb-4 font-serif">No crafts found</h2>
              <p className="text-brown mb-8 text-lg">Try adjusting your search or filters</p>
              <Button 
                onClick={() => setSearchTerm('')}
                className="bg-gold hover:bg-gold-light text-charcoal px-8 py-3"
              >
                Clear Search
              </Button>
            </div>
          ) : (
            <div className="max-w-md mx-auto">


              {/* 3D Vertical Card Swiper */}
              <div className="relative mb-8">
                <VerticalCardSwiper
                  cards={filteredCards}
                  onSwipeLeft={(card) => handleSwipe('left', card)}
                  onSwipeRight={(card) => handleLike(card)}
                  onSwipeUp={(card) => handleSave(card)}
                />
              </div>


            </div>
          )}

          {/* Stats */}
          <div className="mt-12 text-center">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
              <div className="bg-cream rounded-lg p-4">
                <div className="text-2xl font-bold text-gold">{likedCards.length}</div>
                <div className="text-sm text-brown">Liked</div>
              </div>
              <div className="bg-cream rounded-lg p-4">
                <div className="text-2xl font-bold text-gold">{savedCards.length}</div>
                <div className="text-sm text-brown">Saved</div>
              </div>
              <div className="bg-cream rounded-lg p-4">
                <div className="text-2xl font-bold text-gold">{filteredCards.length}</div>
                <div className="text-sm text-brown">Available</div>
              </div>
              <div className="bg-cream rounded-lg p-4">
                <div className="text-2xl font-bold text-gold">{cards.length}</div>
                <div className="text-sm text-brown">Total</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}