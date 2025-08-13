import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Share2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { ReferralCodeDialog } from "@/components/ReferralCodeDialog";

interface SocialSharingProps {
  totalScore: number;
  roundsCompleted: number;
  isVictory: boolean;
  referralMode?: boolean;
}

export const SocialSharing = ({ totalScore, roundsCompleted, isVictory, referralMode = false }: SocialSharingProps) => {
  const shareText = referralMode 
    ? `🏴‍☠️ Join me in Cave Explorer - the ultimate ETH treasure hunting game! Navigate dangerous cave passages and escape with cryptocurrency treasures! ⚡🪙`
    : isVictory 
      ? `🏆 I just escaped the Cave Explorer game with ${totalScore.toFixed(3)} ETH treasure after surviving ${roundsCompleted} rounds! Think you can do better? 🪙⚡`
      : `💀 I made it through ${roundsCompleted} rounds in Cave Explorer but didn't escape! The caves got me in the end. Can you survive longer? 🏴‍☠️⛏️`;

  const gameUrl = window.location.origin;
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(gameUrl)}`;

  const handleTwitterShare = () => {
    window.open(twitterUrl, '_blank', 'width=550,height=420');
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(gameUrl);
      toast({
        title: "Link Copied!",
        description: "Share link copied to clipboard",
      });
    } catch (err) {
      toast({
        title: "Copy Failed",
        description: "Could not copy link to clipboard",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleTwitterShare}
        className="flex-1"
      >
        <Share2 className="w-4 h-4 mr-2" />
        {referralMode ? "Share on X" : "Share Result"}
      </Button>
      
      {referralMode && <ReferralCodeDialog className="flex-1" />}
    </div>
  );
};