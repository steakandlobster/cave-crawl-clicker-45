import { useAccount } from 'wagmi';
import { Button } from '@/components/ui/button';
import { AGWConnect } from '@/components/AGWConnect';
import { useSiweAuth } from "@/contexts/SiweAuthContext";
import { KeyIcon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SiweButtonProps {
  className?: string;
}

/**
 * SIWE Button following Abstract best practices
 * 
 * Handles the complete SIWE authentication flow:
 * - Wallet connection via AGWConnect
 * - SIWE message signing and verification
 * - Authentication state management
 * - Loading states and error handling
 */
export function SiweButton({ className }: SiweButtonProps) {
  const { isConnected } = useAccount();
  const { isAuthenticated, isAuthenticating, isLoading, signIn, signOut } = useSiweAuth();

  // Not connected: Show wallet connect button
  if (!isConnected) {
    return <AGWConnect />;
  }

  // Connected and authenticated: Show connected state with sign out option
  if (isAuthenticated) {
    return (
      <div className={cn('space-y-2', className)}>
        <AGWConnect />
        <Button
          onClick={signOut}
          variant="outline"
          size="sm"
          className="w-full"
        >
          Sign Out
        </Button>
      </div>
    );
  }

  // Connected but not authenticated: Show sign message button
  return (
    <Button
      onClick={signIn}
      disabled={isAuthenticating || isLoading}
      className={cn('w-full', className)}
    >
      {isAuthenticating ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Signing Message...
        </>
      ) : isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Checking Status...
        </>
      ) : (
        <>
          <KeyIcon className="mr-2 h-4 w-4" />
          Sign Authentication Message
        </>
      )}
    </Button>
  );
}