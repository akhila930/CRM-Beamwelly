'use client';

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RatingStars } from '@/components/ui/rating-stars';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/axios';

export default function ClientFeedbackForm() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [feedback, setFeedback] = useState('');
  const [rating, setRating] = useState(0);
  const [remarks, setRemarks] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rating === 0) {
      toast({
        title: 'Error',
        description: 'Please provide a rating',
        variant: 'destructive',
      });
      return;
    }

    if (!feedback.trim()) {
      toast({
        title: 'Error',
        description: 'Please provide feedback',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await api.post(`/api/feedback/client/${token}`, {
        feedback: feedback.trim(),
        rating,
        remarks: remarks.trim() || null
      });

      toast({
        title: 'Success',
        description: 'Thank you for your feedback!',
      });

      // Redirect to home page after successful submission
      setTimeout(() => navigate('/'), 1500);
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Failed to submit feedback';
      toast({
        title: 'Error',
        description: typeof errorMessage === 'string' ? errorMessage : 'Failed to submit feedback',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container max-w-2xl mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Client Feedback Form</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label>Rating *</Label>
              <div className="py-2">
                <RatingStars
                  rating={rating}
                  onRatingChange={setRating}
                  size="lg"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="feedback">Feedback *</Label>
              <Textarea
                id="feedback"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Please share your experience..."
                className="min-h-[120px]"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="remarks">Additional Remarks</Label>
              <Textarea
                id="remarks"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Any additional comments or suggestions..."
                className="min-h-[80px]"
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 