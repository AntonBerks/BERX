/** Node entry for the Voice OS gate: the core, plus the real API client. */
export {
	berxSituation, berxHere, berxNth, berxCanAnswerNearby, BERX_NO_PERMISSIONS, BERX_RECENT_ACTIONS,
	BERX_EMPTY_MEMORY, berxShow, berxDismiss, berxSelect, berxAsked, berxNthShown, berxResolvable,
	berxReadIntent, berxExecutable, BERX_VOICE_CAPABILITY,
	berxPlan, berxOutcome, berxNeedsConfirmation, berxChangesTheWorld,
	berxAcknowledge, berxReport, berxShouldDescribe, berxAskWhich,
} from '@berx/spatial';
/* The REAL client, so the gate can check every capability against the
   methods that actually exist rather than against a list of names. */
export {BerxVoiceAssistant} from '@berx/spatial';
export {BerxApiClient} from '@berx/api/client';
