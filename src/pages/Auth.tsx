import { useEffect, useState } from 'react';
import { Card } from "@/components/ui/card";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAccount } from 'wagmi';
import { Pickaxe } from "lucide-react";
import { WalletConnect } from "@/components/WalletConnect";
import { SignupWithReferral } from "@/components/SignupWithReferral";
import { supabase } from '@/integrations/supabase/client';
import caveBackground from "@/assets/cave-background.jpg";

export default function Auth() {
  const { isConnected, address } = useAccount();
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

  useEffect(() => {
    const checkProfile = async () => {
      if (!isConnected || !address) return;
      
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
  }, [isConnected, address, navigate]);

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
              Connect Your Wallet
            </h2>
            <p className="text-muted-foreground">
              Connect your Abstract wallet to start exploring caves and earning on-chain rewards
            </p>
          </div>

          {/* Wallet Connection or Profile Setup */}
          <div className="flex justify-center">
            {!isConnected ? (
              <WalletConnect />
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

          <div className="text-center text-sm text-muted-foreground">
            <p>Connect your wallet to:</p>
            <ul className="mt-2 space-y-1">
              <li>• Play on-chain cave exploration games</li>
              <li>• Earn verifiable rewards on Abstract</li>
              <li>• Compete on the blockchain leaderboard</li>
              <li>• Own your achievements as NFTs</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}