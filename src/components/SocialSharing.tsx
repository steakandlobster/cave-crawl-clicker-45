import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { X, Users, Copy, CheckCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";

interface SocialSharingProps {
  totalScore: number;
  roundsCompleted: number;
  isVictory: boolean;
}

export const SocialSharing = ({ totalScore, roundsCompleted, isVictory }: SocialSharingProps) => {
  const [copiedReferral, setCopiedReferral] = useState(false);

  const formatScore = (score: number) => (score / 1000).toFixed(3);

  const getShareText = () => {
    const scoreText = `${formatScore(totalScore)} ETH`;
    const statusText = isVictory ? "escaped" : "didn't make it";
    
    return `I just ${statusText} from the Cave Explorer game with ${scoreText} after ${roundsCompleted} rounds! 🔥 Can you do better? Play at ${window.location.origin}`;
  };

  const shareOnX = () => {
    const text = encodeURIComponent(getShareText());
    const url = `https://twitter.com/intent/tweet?text=${text}`;
    window.open(url, '_blank', 'width=550,height=420');
  };

  const copyReferralLink = async () => {
    const referralCode = localStorage.getItem('cave-explorer-user-id') || 'explorer';
    const referralLink = `${window.location.origin}?ref=${referralCode}`;
    
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopiedReferral(true);
      toast({
        title: "Referral link copied!",
        description: "Share this link with friends to track your referrals",
      });
      setTimeout(() => setCopiedReferral(false), 2000);
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Please copy the link manually",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="p-4 bg-secondary/20 border-border/50">
      <h3 className="font-semibold mb-3 text-center">Share Your Results</h3>
      
      <div className="space-y-3">
        <Button
          onClick={shareOnX}
          className="w-full flex items-center gap-2 bg-black hover:bg-gray-800 text-white"
          size="sm"
        >
          <X className="w-4 h-4" />
          Share on X
        </Button>

        <Button
          onClick={copyReferralLink}
          variant="outline"
          className="w-full flex items-center gap-2"
          size="sm"
        >
          {copiedReferral ? (
            <CheckCircle className="w-4 h-4 text-green-500" />
          ) : (
            <Users className="w-4 h-4" />
          )}
          {copiedReferral ? "Copied!" : "Refer Friends"}
        </Button>
      </div>
    </Card>
  );
};