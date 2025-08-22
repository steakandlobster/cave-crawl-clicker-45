import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users, Copy, Check } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useAchievements } from "@/hooks/useAchievements";
import { supabase } from "@/integrations/supabase/client";
import { useAccount } from "wagmi";

interface ReferralCodeDialogProps {
  className?: string;
}

export const ReferralCodeDialog = ({ className }: ReferralCodeDialogProps) => {
  const [copied, setCopied] = useState(false);
  const [referralCode, setReferralCode] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const { addReferral } = useAchievements();
  const { address } = useAccount();

  useEffect(() => {
    const fetchReferralCode = async () => {
      if (!address) return;
      
      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('referral_code')
          .eq('wallet_address', address)
          .single();

        if (profile && !error) {
          setReferralCode(profile.referral_code || '');
        }
      } catch (error) {
        console.error('Error fetching referral code:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReferralCode();
  }, [address]);
  
  const referralUrl = `${window.location.origin}?ref=${referralCode}`;

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(referralCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Referral Code Copied!",
        description: "Share this code with your friends",
      });
    } catch (err) {
      toast({
        title: "Copy Failed",
        description: "Could not copy referral code",
        variant: "destructive",
      });
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(referralUrl);
      toast({
        title: "Referral Link Copied!",
        description: "Share this link with your friends",
      });
    } catch (err) {
      toast({
        title: "Copy Failed",
        description: "Could not copy referral link",
        variant: "destructive",
      });
    }
  };

  const handleTestReferral = () => {
    addReferral();
    toast({
      title: "Test Referral Added!",
      description: "Added a test referral to check achievements",
    });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className={className}>
          <Users className="w-4 h-4 mr-2" />
          Refer Friends
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-treasure-gold" />
            Refer Friends & Earn Achievements
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 mt-4">
          <div>
            <Label htmlFor="referral-code">Your Referral Code</Label>
            {isLoading ? (
              <div className="flex gap-2 mt-1">
                <div className="flex-1 h-10 bg-muted animate-pulse rounded-md"></div>
                <div className="w-20 h-10 bg-muted animate-pulse rounded-md"></div>
              </div>
            ) : (
              <div className="flex gap-2 mt-1">
                <Input
                  id="referral-code"
                  value={referralCode}
                  readOnly
                  className="font-mono"
                  disabled={!referralCode}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyCode}
                  className="shrink-0"
                  disabled={!referralCode}
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="referral-link">Share Link</Label>
            {isLoading ? (
              <div className="flex gap-2 mt-1">
                <div className="flex-1 h-10 bg-muted animate-pulse rounded-md"></div>
                <div className="w-20 h-10 bg-muted animate-pulse rounded-md"></div>
              </div>
            ) : (
              <div className="flex gap-2 mt-1">
                <Input
                  id="referral-link"
                  value={referralUrl}
                  readOnly
                  className="text-xs"
                  disabled={!referralCode}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyLink}
                  className="shrink-0"
                  disabled={!referralCode}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>

          <div className="bg-secondary/50 p-3 rounded-lg">
            <h4 className="font-semibold text-sm mb-2">Referral Rewards</h4>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• 1 referral = "Recruiter" achievement</li>
              <li>• 5 referrals = "Ambassador" achievement</li>
              <li>• 10 referrals = "Legend Recruiter" achievement</li>
            </ul>
          </div>

          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleTestReferral}
            className="w-full text-xs"
          >
            Add Test Referral (Demo)
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};