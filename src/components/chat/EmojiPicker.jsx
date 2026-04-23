import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Smile } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

const EMOJI_CATEGORIES = {
  'Emociones': ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙', '🥲', '😋'],
  'Gestos': ['😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥', '😌', '😔', '😪'],
  'Celebración': ['🎉', '🎊', '🎈', '🎁', '🏆', '🥇', '🥈', '🥉', '⭐', '🌟', '✨', '💫', '🔥', '💯', '👏', '🙌', '🤝', '👍', '👎', '✌️', '🤞'],
  'Corazones': ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝'],
  'Varios': ['💬', '💭', '🗨️', '👋', '🙏', '💪', '👌', '✅', '❌', '⚠️', '📍', '🔔', '💡', '⏰', '📞', '📧', '📱', '💻', '🎯', '📝']
};

const EmojiPicker = ({ onEmojiSelect, className }) => {
  const [open, setOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('Emociones');

  const handleEmojiClick = (emoji) => {
    onEmojiSelect(emoji);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn("h-9 w-9", className)}
          type="button"
        >
          <Smile className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="border-b p-2">
          <div className="flex gap-1 flex-wrap">
            {Object.keys(EMOJI_CATEGORIES).map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "ghost"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className="text-xs h-7"
              >
                {category}
              </Button>
            ))}
          </div>
        </div>
        <ScrollArea className="h-64 p-3">
          <div className="grid grid-cols-8 gap-2">
            {EMOJI_CATEGORIES[selectedCategory].map((emoji, index) => (
              <button
                key={`${emoji}-${index}`}
                onClick={() => handleEmojiClick(emoji)}
                className="text-2xl hover:bg-muted rounded p-1 transition-colors cursor-pointer"
                type="button"
              >
                {emoji}
              </button>
            ))}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

export default EmojiPicker;