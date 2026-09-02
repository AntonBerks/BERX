/**
 * React Native asset registration.
 *
 * BERX ships two real typefaces (Manrope, Instrument Serif — both SIL
 * OFL 1.1, commercial use permitted, no in-product attribution
 * required). `npx react-native-asset` copies them into the native
 * projects from here; without this entry the app silently falls back
 * to the system font and every screen loses its type.
 */
module.exports = {
	project: {ios: {}, android: {}},
	assets: ['./assets/fonts'],
};
