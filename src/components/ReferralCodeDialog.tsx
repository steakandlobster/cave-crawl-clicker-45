import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users, Copy, Check } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useAchievements } from "@/hooks/useAchievements";

interface ReferralCodeDialogProps {
  className?: string;
}

export const ReferralCodeDialog = ({ className }: ReferralCodeDialogProps) => {
  const [copied, setCopied] = useState(false);
  const { addReferral } = useAchievements();
  
  // Generate a simple referral code based on user's session
  const referralCode = `CAVE${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
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
            <div className="flex gap-2 mt-1">
              <Input
                id="referral-code"
                value={referralCode}
                readOnly
                className="font-mono"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyCode}
                className="shrink-0"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          <div>
            <Label htmlFor="referral-link">Share Link</Label>
            <div className="flex gap-2 mt-1">
              <Input
                id="referral-link"
                value={referralUrl}
                readOnly
                className="text-xs"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyLink}
                className="shrink-0"
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
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