'use client';

import { useState } from 'react';
import { ProductPin } from './ProductPin';
import { useAuth } from '@/hooks/useAuth';
import { useCrafts } from '@/hooks/useCrafts';
import { Button } from '@/components/ui/button';
import { Plus, Filter, Search, Grid, List } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ProductGridProps {
  showHeader?: boolean;
  showFilters?: boolean;
  onCreateNew?: () => void;
}

export function ProductGrid({ 
  showHeader = true, 
  showFilters = true, 
  onCreateNew 
}: ProductGridProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterStatus, setFilterStatus] = useState<'all' | 'published' | 'draft'>('all');
  
  const { crafts, loading, error, loadMore, hasMore, refresh } = useCrafts({
    artisanId: user?.uid,
    publishedOnly: filterStatus === 'published',
    autoLoad: !!user?.uid,
  });

  const handleCreateNew = () => {
    if (onCreateNew) {
      onCreateNew();
    } else {
      router.push('/artisan/voice-onboard');
    }
  };

  const filteredCrafts = crafts.filter(craft => {
    if (filterStatus === 'published') return craft.isPublished;
    if (filterStatus === 'draft') return !craft.isPublished;
    return true;
  });

  if (loading && crafts.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold mx-auto mb-4"></div>
          <p className="text-brown">Loading your crafts...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="bg-red-50 rounded-lg p-8 max-w-md mx-auto border border-red-200">
          <h3 className="text-xl font-semibold text-red-800 mb-4">Error Loading Crafts</h3>
          <p className="text-red-600 mb-6">{error}</p>
          <Button onClick={refresh} className="bg-red-600 hover:bg-red-700 text-white">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (crafts.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="bg-gradient-warm rounded-2xl p-8 max-w-md mx-auto shadow-elevated">
          <div className="w-16 h-16 bg-gold/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Plus className="w-8 h-8 text-gold" />
          </div>
          <h3 className="text-xl font-semibold text-charcoal mb-4 font-serif">No crafts yet</h3>
          <p className="text-brown mb-6">
            Start by creating your first craft listing using our voice-guided assistant.
          </p>
          <Button 
            onClick={handleCreateNew}
            className="bg-gold hover:bg-gold-light text-charcoal"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Your First Craft
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      {showHeader && (
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-charcoal font-serif">My Crafts</h2>
            <p className="text-brown">
              {crafts.length} craft{crafts.length !== 1 ? 's' : ''} • 
              {crafts.filter(c => c.isPublished).length} published
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-beige rounded-lg p-1">
              <Button
                onClick={() => setViewMode('grid')}
                size="sm"
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                className={viewMode === 'grid' ? 'bg-gold text-charcoal' : 'text-brown'}
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                onClick={() => setViewMode('list')}
                size="sm"
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                className={viewMode === 'list' ? 'bg-gold text-charcoal' : 'text-brown'}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
            
            <Button 
              onClick={handleCreateNew}
              className="bg-gold hover:bg-gold-light text-charcoal"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Craft
            </Button>
          </div>
        </div>
      )}

      {/* Filters */}
      {showFilters && (
        <div className="flex items-center space-x-4 bg-white rounded-lg p-4 shadow-sm">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-brown" />
            <span className="text-sm font-medium text-charcoal">Filter:</span>
          </div>
          
          <div className="flex items-center space-x-2">
            {(['all', 'published', 'draft'] as const).map((status) => (
              <Button
                key={status}
                onClick={() => setFilterStatus(status)}
                size="sm"
                variant={filterStatus === status ? 'default' : 'outline'}
                className={filterStatus === status 
                  ? 'bg-gold text-charcoal' 
                  : 'border-brown text-brown hover:bg-brown hover:text-cream'
                }
              >
                {status === 'all' ? 'All' : status === 'published' ? 'Published' : 'Drafts'}
                <span className="ml-1 text-xs">
                  ({status === 'all' 
                    ? crafts.length 
                    : status === 'published' 
                      ? crafts.filter(c => c.isPublished).length
                      : crafts.filter(c => !c.isPublished).length
                  })
                </span>
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Grid/List View */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredCrafts.map((craft) => (
            <ProductPin
              key={craft.id}
              craft={craft}
              onEdit={(craft) => {
                router.push(`/artisan/crafts/${craft.id}/edit`);
              }}
              onPublish={async (craft) => {
                // Handle publish functionality
                try {
                  // This would be handled by the ProductPin component internally
                  console.log('Publish craft:', craft.id);
                } catch (error) {
                  console.error('Error publishing craft:', error);
                }
              }}
              onDelete={async (craft) => {
                // Handle delete functionality
                try {
                  // This would be handled by the ProductPin component internally
                  console.log('Delete craft:', craft.id);
                  refresh(); // Refresh the list after deletion
                } catch (error) {
                  console.error('Error deleting craft:', error);
                }
              }}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredCrafts.map((craft) => (
            <div key={craft.id} className="bg-white rounded-lg shadow-sm p-6 flex items-center space-x-6">
              <img
                src={craft.images[0] || '/placeholder-craft.jpg'}
                alt={craft.title}
                className="w-20 h-20 object-cover rounded-lg"
              />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-charcoal font-serif">{craft.title}</h3>
                <p className="text-brown text-sm line-clamp-2">{craft.description}</p>
                <div className="flex items-center space-x-4 mt-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    craft.isPublished 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {craft.isPublished ? 'Published' : 'Draft'}
                  </span>
                  <span className="text-xs text-brown">
                    {craft.stats?.views || 0} views • {craft.stats?.likes || 0} likes
                  </span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  onClick={() => router.push(`/artisan/crafts/${craft.id}/edit`)}
                  size="sm"
                  variant="outline"
                  className="border-brown text-brown hover:bg-brown hover:text-cream"
                >
                  Edit
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Load More */}
      {hasMore && (
        <div className="text-center py-6">
          <Button
            onClick={loadMore}
            disabled={loading}
            variant="outline"
            className="border-gold text-gold hover:bg-gold hover:text-charcoal"
          >
            {loading ? 'Loading...' : 'Load More Crafts'}
          </Button>
        </div>
      )}
    </div>
  );
}