import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useAccount } from 'wagmi';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Users, Gift } from 'lucide-react';

interface SignupWithReferralProps {
  onComplete: () => void;
}

export function SignupWithReferral({ onComplete }: SignupWithReferralProps) {
  const { address } = useAccount();
  const [username, setUsername] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address) return;

    setIsSubmitting(true);
    try {
      let referredBy = null;

      // If referral code is provided, validate and find the referrer
      if (referralCode.trim()) {
        const { data: referrer, error: referrerError } = await supabase
          .from('profiles')
          .select('id')
          .eq('referral_code', referralCode.trim().toUpperCase())
          .single();

        if (referrerError || !referrer) {
          toast.error('Invalid referral code. Please check and try again.');
          setIsSubmitting(false);
          return;
        }

        referredBy = referrer.id;
      }

      // Generate a unique referral code for this user
      const userReferralCode = `CAVE${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      // Create user profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: crypto.randomUUID(), // Generate a UUID for the profile
          username: username || `Explorer${address.slice(-4)}`,
          wallet_address: address,
          referral_code: userReferralCode,
          referred_by: referredBy,
        });

      if (profileError) {
        console.error('Profile creation error:', profileError);
        toast.error('Failed to create profile. Please try again.');
        setIsSubmitting(false);
        return;
      }

      toast.success('Profile created successfully!');
      onComplete();
    } catch (error) {
      console.error('Signup error:', error);
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Complete Your Profile
        </CardTitle>
        <CardDescription>
          Set up your profile to start exploring caves
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username (Optional)</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={`Explorer${address?.slice(-4) || ''}`}
              maxLength={20}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="referral">Referral Code (Optional)</Label>
            <Input
              id="referral"
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
              placeholder="Enter referral code"
              maxLength={10}
            />
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Gift className="h-3 w-3" />
              <span>Enter a friend's referral code to earn bonus rewards!</span>
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating Profile...' : 'Complete Setup'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}