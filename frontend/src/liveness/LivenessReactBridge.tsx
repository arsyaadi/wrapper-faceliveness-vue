/** @jsxImportSource react */
import React from 'react';
import { FaceLivenessDetector } from '@aws-amplify/ui-react-liveness';
import { Amplify } from 'aws-amplify';

interface LivenessReactBridgeProps {
  sessionId: string;
  region: string;
  onComplete: (sessionId: string) => void;
  onError: (error: Error) => void;
}

Amplify.configure({
  Auth: {
    Cognito: {
      identityPoolId: import.meta.env.VITE_COGNITO_IDENTITY_POOL_ID,
      allowGuestAccess: true,
    }
  }
});

export const LivenessReactBridge: React.FC<LivenessReactBridgeProps> = ({
  sessionId,
  region,
  onComplete,
  onError,
}) => {
  return (
    <FaceLivenessDetector
      sessionId={sessionId}
      region={region}
      onAnalysisComplete={async () => {
        onComplete(sessionId);
      }}
      onError={(err) => {
        onError(err instanceof Error ? err : new Error(err.message || 'Liveness error'));
      }}
    />
  );
};
