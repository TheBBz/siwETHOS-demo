/**
 * Component Exports
 * 
 * These components can be used by integrators to add
 * "Sign in with Ethos" to their applications.
 */

export { EthosAuthModal, type EthosAuthModalProps, type EthosAuthResult } from './EthosAuthModal';
export { 
  useEthosAuth, 
  SignInWithEthosButton,
  type UseEthosAuthOptions,
  type UseEthosAuthReturn,
  type SignInWithEthosButtonProps,
} from './useEthosAuth';
export { DemoButton } from './DemoButton';
