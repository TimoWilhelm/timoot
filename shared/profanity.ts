import { RegExpMatcher, englishDataset, englishRecommendedTransformers } from 'obscenity';

const matcher = new RegExpMatcher({
	...englishDataset.build(),
	...englishRecommendedTransformers,
});

/**
 * Returns true if the given text contains profanity.
 * Uses the obscenity library with the English dataset and recommended transformers
 * for leet-speak normalization and false-positive resistance.
 */
export function containsProfanity(text: string): boolean {
	return matcher.hasMatch(text);
}
