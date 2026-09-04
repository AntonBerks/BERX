/**
 * The BERX first experience, as one sequence.
 *
 * The archive describes AUTH as a journey — reveal, world, account,
 * identity, safety, entry — not a login form with extra pages. This is
 * that journey, assembled from the contracts that BERX can actually
 * honour:
 *
 *   BERX-001 reveal → BERX-004 colour world → BERX-003 account
 *     → (server-side email activation) → BERX-002 sign in
 *   then, on first authenticated run:
 *   BERX-006 photo → BERX-009 safety → BERX-010 entry
 *
 * The world is chosen before the account exists on purpose: it is
 * device-local anyway, and it means the account-creation screen is
 * already in the atmosphere the person picked. That is the archive's
 * intent — personalisation first — achieved without a preferences
 * endpoint BERX does not have.
 *
 * Three contracts in the archive's sequence are absent here rather
 * than faked, each for a reason the API makes plain:
 *   BERX-005 Interests — no interest-tag resource exists;
 *     `/dating/interests` records a dating like, not a tag list.
 *   BERX-007 Permissions — an OS grant, not a BERX resource, and the
 *     app has no camera/location module to request one for yet.
 *   BERX-008 Privacy Setup — no account-wide privacy resource.
 * A step that configures nothing does not belong in a sequence that
 * claims to set the account up.
 *
 * Completion is remembered on the device. There is no server field for
 * "has onboarded", so the flag is local — which is honest, and means a
 * new device shows the three post-auth steps again rather than
 * pretending to know.
 */
import {useCallback, useEffect, useState} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {BerxApiClient, BerxFilePart} from '@berx/api/client';
import type {BerxAuthState} from '@berx/auth';
import WelcomeScreen from '../WelcomeScreen';
import LoginScreen from '../LoginScreen';
import RegisterScreen from '../RegisterScreen';
import ColorWorldScreen from '../ColorWorldScreen';
import ProfilePhotoScreen from './ProfilePhotoScreen';
import SafetySetupScreen from './SafetySetupScreen';
import OnboardingCompleteScreen from './OnboardingCompleteScreen';

const DONE_KEY = 'berx.onboarding.completed';

/* ------------------------------------------------------------------ */
/* Pre-account                                                         */
/* ------------------------------------------------------------------ */

type AuthStep = 'welcome' | 'world' | 'register' | 'login';

export interface BerxAuthFlowProps {
	authState: BerxAuthState;
	/**
	 * Registration is the one pre-auth call that goes to the API
	 * directly rather than through BerxAuthState — the auth state
	 * machine owns sessions, not account creation. Passed in rather
	 * than reached for, since BerxAuthState keeps its client private
	 * on purpose.
	 */
	api: BerxApiClient;
}

export function BerxAuthFlow({authState, api}: BerxAuthFlowProps) {
	const [step, setStep] = useState<AuthStep>('welcome');

	if (step === 'world') {
		return <ColorWorldScreen onBack={() => setStep('welcome')} onContinue={() => setStep('register')} />;
	}
	if (step === 'register') {
		return (
			<RegisterScreen
				api={api}
				/* registration requires email activation, so the next real step is signing in */
				onRegistered={() => setStep('login')}
				onBack={() => setStep('world')}
			/>
		);
	}
	if (step === 'login') {
		return <LoginScreen authState={authState} onGoToRegister={() => setStep('world')} />;
	}
	return <WelcomeScreen onLogin={() => setStep('login')} onRegister={() => setStep('world')} />;
}

/* ------------------------------------------------------------------ */
/* Post-account                                                        */
/* ------------------------------------------------------------------ */

type SetupStep = 'photo' | 'safety' | 'complete';

export interface BerxFirstRunProps {
	api: BerxApiClient;
	pickImage: () => Promise<BerxFilePart | null>;
	displayName: string;
	currentIconUrl?: string;
	onOpenBlockedUsers?: () => void;
	onOpenDatingPrivacy?: () => void;
	/** Rendered once the sequence is finished, or immediately if it already was. */
	children: React.ReactNode;
}

export function BerxFirstRun({
	api,
	pickImage,
	displayName,
	currentIconUrl,
	onOpenBlockedUsers,
	onOpenDatingPrivacy,
	children,
}: BerxFirstRunProps) {
	/** null while the stored flag is still being read. */
	const [completed, setCompleted] = useState<boolean | null>(null);
	const [step, setStep] = useState<SetupStep>('photo');

	useEffect(() => {
		let cancelled = false;
		AsyncStorage.getItem(DONE_KEY)
			.then((value) => {
				if (!cancelled) setCompleted(value === '1');
			})
			/**
			 * A storage failure must not trap someone in onboarding
			 * forever, so an unreadable flag is treated as "already
			 * done" — the steps are all reachable later from Profile.
			 */
			.catch(() => {
				if (!cancelled) setCompleted(true);
			});
		return () => {
			cancelled = true;
		};
	}, []);

	const finish = useCallback(() => {
		setCompleted(true);
		AsyncStorage.setItem(DONE_KEY, '1').catch(() => undefined);
	}, []);

	/* the app renders as usual while the flag is unknown — never a blank frame */
	if (completed === null || completed) return <>{children}</>;

	if (step === 'photo') {
		return (
			<ProfilePhotoScreen
				api={api}
				pickImage={pickImage}
				displayName={displayName}
				currentIconUrl={currentIconUrl}
				onDone={() => setStep('safety')}
			/>
		);
	}
	if (step === 'safety') {
		return (
			<SafetySetupScreen
				onOpenBlockedUsers={onOpenBlockedUsers}
				onOpenDatingPrivacy={onOpenDatingPrivacy}
				onDone={() => setStep('complete')}
				onBack={() => setStep('photo')}
			/>
		);
	}
	return <OnboardingCompleteScreen api={api} onEnter={finish} />;
}
