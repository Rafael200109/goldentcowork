import React, { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import ReviewStars from '@/components/reviews/ReviewStars';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

const ReviewCard = memo(({ review }) => {
  const getInitials = (name) => {
    if (!name) return 'U';
    const names = name.split(' ');
    return names.map((n) => n[0]).join('').toUpperCase();
  };

  return (
    <Card className="bg-card/50 border-border/50">
      <CardContent className="p-4">
        <div className="flex items-start space-x-4">
          <Avatar>
            <AvatarImage src={review.profiles?.avatar_url} alt={review.profiles?.full_name} loading="lazy" />
            <AvatarFallback>{getInitials(review.profiles?.full_name)}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-foreground">{review.profiles?.full_name || 'Anónimo'}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(review.created_at), { addSuffix: true, locale: es })}
                </p>
              </div>
              <ReviewStars rating={review.rating} size="sm" />
            </div>
            <p className="mt-2 text-sm text-foreground/90">{review.comment}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

ReviewCard.displayName = 'ReviewCard';

export default ReviewCard;