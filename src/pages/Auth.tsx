import { useEffect, useState } from 'react';
import { Card } from "@/components/ui/card";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Pickaxe } from "lucide-react";
import { SiweButton } from "@/components/SiweButton";
import { SignupWithReferral } from "@/components/SignupWithReferral";
import { useSiweAuth } from "@/hooks/useSiweAuth";
import { useAccount } from 'wagmi';
import { supabase } from '@/integrations/supabase/client';
import caveBackground from "@/assets/cave-background.jpg";

export default function Auth() {
  const { isConnected, address } = useAccount();
  const { isAuthenticated } = useSiweAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [referralCodeFromUrl, setReferralCodeFromUrl] = useState<string>('');

  useEffect(() => {
    // Get referral code from URL
    const refCode = searchParams.get('ref');
    if (refCode) {
      setReferralCodeFromUrl(refCode);
    }
  }, [searchParams]);

  // Check if user has completed profile setup after SIWE authentication
  useEffect(() => {
    const checkProfile = async () => {
      if (!isConnected || !address || !isAuthenticated) return;
      
      setIsChecking(true);
      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('id')
          .eq('wallet_address', address)
          .single();

        if (profile && !error) {
          // Profile exists, redirect to home
          navigate('/');
        } else {
          // No profile found, show signup form
          setHasProfile(false);
        }
      } catch (error) {
        console.error('Error checking profile:', error);
        setHasProfile(false);
      } finally {
        setIsChecking(false);
      }
    };

    checkProfile();
  }, [isConnected, address, isAuthenticated, navigate]);

  const handleSignupComplete = () => {
    navigate('/');
  };


  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${caveBackground})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/50 to-background/30" />
      </div>

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Pickaxe className="w-8 h-8 text-treasure-gold" />
              <h1 className="text-3xl font-bold bg-gradient-treasure bg-clip-text text-transparent">
                Cave Explorer
              </h1>
            </div>
            <h2 className="text-2xl font-bold">
              Welcome to Cave Explorer
            </h2>
          </div>

          {/* SIWE Authentication and Profile Setup */}
          <div className="flex justify-center">
            {!isConnected || !isAuthenticated ? (
              <SiweButton />
            ) : isChecking ? (
              <Card className="w-full max-w-md">
                <div className="p-6 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p>Checking your profile...</p>
                </div>
              </Card>
            ) : hasProfile === false ? (
              <SignupWithReferral 
                onComplete={handleSignupComplete} 
                initialReferralCode={referralCodeFromUrl}
              />
            ) : null}
          </div>

        </div>
      </div>
    </div>
  );
}