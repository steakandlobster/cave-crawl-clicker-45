import { useState } from 'react';
import { useAccount, useSwitchChain } from 'wagmi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Network, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { abstractTestnet, abstract } from 'viem/chains';

const SUPPORTED_NETWORKS = {
  [abstractTestnet.id]: {
    ...abstractTestnet,
    displayName: 'Abstract Testnet',
    description: 'Test environment for development',
    color: 'bg-yellow-500',
  },
  [abstract.id]: {
    ...abstract,
    displayName: 'Abstract Mainnet', 
    description: 'Production network with real ETH',
    color: 'bg-green-500',
  },
};

export function NetworkSwitcher() {
  const { chain, isConnected } = useAccount();
  const { switchChain, isPending } = useSwitchChain();
  const [switchingTo, setSwitchingTo] = useState<number | null>(null);

  const handleNetworkSwitch = async (targetChainId: number) => {
    if (!isConnected) {
      toast.error('Please connect your wallet first');
      return;
    }

    setSwitchingTo(targetChainId);
    try {
      await switchChain({ chainId: targetChainId });
      toast.success(`Switched to ${SUPPORTED_NETWORKS[targetChainId].displayName}`);
    } catch (error: any) {
      console.error('Network switch error:', error);
      toast.error(error.message || 'Failed to switch network');
    } finally {
      setSwitchingTo(null);
    }
  };

  const currentNetwork = chain ? SUPPORTED_NETWORKS[chain.id] : null;
  const isUnsupportedNetwork = isConnected && !currentNetwork;

  if (!isConnected) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Network className="h-5 w-5" />
            Network Selection
          </CardTitle>
          <CardDescription>
            Connect your wallet to select a network
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center">
            Please connect your wallet first
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Network className="h-5 w-5" />
          Network Selection
        </CardTitle>
        <CardDescription>
          Switch between Abstract networks for testing and production
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Network Status */}
        <div className="p-3 bg-secondary/50 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Current Network:</span>
            {isUnsupportedNetwork ? (
              <Badge variant="destructive" className="flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                Unsupported
              </Badge>
            ) : currentNetwork ? (
              <Badge className="flex items-center gap-1">
                <div className={`h-2 w-2 rounded-full ${currentNetwork.color}`} />
                {currentNetwork.displayName}
              </Badge>
            ) : (
              <Badge variant="secondary">Unknown</Badge>
            )}
          </div>
          {isUnsupportedNetwork && (
            <p className="text-xs text-muted-foreground mt-1">
              Please switch to a supported Abstract network
            </p>
          )}
        </div>

        {/* Network Options */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Available Networks:</h4>
          {Object.values(SUPPORTED_NETWORKS).map((network) => {
            const isCurrent = chain?.id === network.id;
            const isSwitching = switchingTo === network.id;
            
            return (
              <div
                key={network.id}
                className={`p-3 border rounded-lg transition-colors ${
                  isCurrent ? 'border-primary bg-primary/5' : 'hover:bg-secondary/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`h-3 w-3 rounded-full ${network.color}`} />
                    <div>
                      <p className="font-medium text-sm">{network.displayName}</p>
                      <p className="text-xs text-muted-foreground">
                        {network.description}
                      </p>
                    </div>
                  </div>
                  
                  {isCurrent ? (
                    <Badge variant="default">Connected</Badge>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleNetworkSwitch(network.id)}
                      disabled={isPending || isSwitching}
                    >
                      {isSwitching ? (
                        <>
                          <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                          Switching...
                        </>
                      ) : (
                        'Switch'
                      )}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Network Warnings */}
        {currentNetwork?.id === abstractTestnet.id && (
          <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
            <div className="text-xs">
              <p className="font-medium text-yellow-800">Testnet Environment</p>
              <p className="text-yellow-700">
                This is a test network. Tokens have no real value.
              </p>
            </div>
          </div>
        )}

        {currentNetwork?.id === abstract.id && (
          <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
            <Network className="h-4 w-4 text-green-600 mt-0.5" />
            <div className="text-xs">
              <p className="font-medium text-green-800">Mainnet Environment</p>
              <p className="text-green-700">
                Real ETH transactions. Use with caution.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}