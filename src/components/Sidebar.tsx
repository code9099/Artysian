'use client';

import { DashboardCard } from '@/lib/types';
import { Button } from '@/components/ui/button';

interface SidebarProps {
  cards: DashboardCard[];
  selectedTab: string;
  onTabChange: (tabId: string) => void;
}

export function Sidebar({ cards, selectedTab, onTabChange }: SidebarProps) {
  return (
    <div className="bg-cream rounded-2xl p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-charcoal mb-6 font-serif">
        Dashboard
      </h3>
      
      <nav className="space-y-2">
        {cards.map((card) => {
          const Icon = card.icon;
          const isActive = selectedTab === card.id;
          
          return (
            <Button
              key={card.id}
              variant={isActive ? "default" : "ghost"}
              className={`w-full justify-start ${
                isActive 
                  ? `bg-${card.color} text-charcoal hover:bg-${card.color}/90` 
                  : 'text-brown hover:bg-beige'
              }`}
              onClick={() => onTabChange(card.id)}
            >
              <div className="w-5 h-5 mr-3 flex items-center justify-center">
                <Icon />
              </div>
              <div className="text-left">
                <div className="font-medium">{card.title}</div>
                <div className="text-xs opacity-80">{card.description}</div>
              </div>
            </Button>
          );
        })}
      </nav>

      {/* User Info */}
      <div className="mt-8 pt-6 border-t border-beige">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-gold rounded-full flex items-center justify-center">
            <span className="text-charcoal font-bold">A</span>
          </div>
          <div>
            <div className="font-medium text-charcoal text-sm">Artisan Profile</div>
            <div className="text-xs text-brown">Active</div>
          </div>
        </div>
      </div>
    </div>
  );
}
