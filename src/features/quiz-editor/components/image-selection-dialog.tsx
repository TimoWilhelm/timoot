import { ImageOff, Loader2, Sparkles, Wand2 } from 'lucide-react';
import { Suspense, useRef, useState } from 'react';

import { Button } from '@/components/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/dialog';
import { Input } from '@/components/input';
import { toast } from '@/components/toast';
import { useGenerateImage } from '@/hooks/use-api';
import { useTurnstile } from '@/hooks/utils/use-turnstile';
import { DEFAULT_BACKGROUND_IMAGES } from '@/lib/background-images';
import { getOptimizedImageUrl } from '@/lib/image-optimization';
import { cn } from '@/lib/utilities';
import { LIMITS } from '@shared/validation';

import { UserImagesList } from './user-images-list';

type ImageSelectionDialogProperties = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	selectedImage: string | undefined;
	onSelectImage: (image: string) => void;
	userId: string;
};

export function ImageSelectionDialog({
	open,
	onOpenChange,
	selectedImage: initialSelectedImage,
	onSelectImage,
	userId,
}: ImageSelectionDialogProperties) {
	const [selectedImage, setSelectedImage] = useState(initialSelectedImage);
	const [imagePrompt, setImagePrompt] = useState('');
	const turnstileReference = useRef<HTMLDivElement>(null);

	const handleSelectImage = (path: string) => {
		setSelectedImage(path);
		onSelectImage(path);
	};

	const { token: turnstileToken, resetToken, TurnstileWidget } = useTurnstile();

	const generateImageMutation = useGenerateImage();
	const isGeneratingImage = generateImageMutation.isPending;

	const generateImage = () => {
		if (!imagePrompt.trim()) {
			toast.error('Please enter a prompt for the image');
			return;
		}

		if (!turnstileToken) {
			turnstileReference.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
			toast.error('Please complete the captcha verification first');
			return;
		}

		generateImageMutation.mutate(
			{ header: { 'x-user-id': userId, 'x-turnstile-token': turnstileToken }, json: { prompt: imagePrompt } },
			{
				onSuccess: (data) => {
					handleSelectImage(data.path);
					setImagePrompt('');

					resetToken();
				},
				onError: (error) => {
					toast.error(error.message || 'Failed to generate image');
					resetToken();
				},
			},
		);
	};

	return (
		<Dialog
			open={open}
			onOpenChange={(isOpen) => {
				if (!isOpen && isGeneratingImage) {
					return;
				}
				onOpenChange(isOpen);
			}}
		>
			<DialogContent className="flex max-h-[90dvh] max-w-md flex-col overflow-hidden p-0">
				<DialogHeader className="shrink-0 border-b px-4 pt-4 pb-3">
					<DialogTitle className="whitespace-nowrap">Background Image</DialogTitle>
					<DialogDescription className="sr-only">Select a default background image or generate one using AI.</DialogDescription>
				</DialogHeader>
				<div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
					{/* Default Images */}
					<div className="space-y-2">
						<h4 className="text-sm font-medium text-muted-foreground">Default</h4>
						<div className="grid grid-cols-3 gap-2">
							<Button
								type="button"
								variant="subtle"
								onClick={() => handleSelectImage('')}
								className={cn(
									`
										aspect-video h-auto bg-muted text-muted-foreground ring-0
										ring-transparent ring-offset-0 transition-all duration-300 ease-spring
										hover:translate-y-0 hover:shadow-none
										hover:after:translate-y-0
										active:translate-y-0 active:shadow-none
									`,
									!selectedImage && `ring-3 ring-orange ring-offset-2 ring-offset-background`,
								)}
							>
								<div className="flex flex-col items-center gap-1 text-muted-foreground">
									<ImageOff className="size-5" />
									<span className="text-[10px]">None</span>
								</div>
							</Button>
							{DEFAULT_BACKGROUND_IMAGES.map((img) => (
								<Button
									key={img.id}
									type="button"
									variant="subtle"
									onClick={() => handleSelectImage(img.path)}
									className={cn(
										`
											aspect-video h-auto overflow-hidden p-0 ring-0 ring-transparent
											ring-offset-0 transition-all duration-300 ease-spring
											hover:translate-y-0 hover:shadow-none
											hover:after:translate-y-0
											active:translate-y-0 active:shadow-none
										`,
										selectedImage === img.path
											? `ring-3 ring-orange ring-offset-2 ring-offset-background`
											: 'bg-muted text-muted-foreground',
									)}
									aria-label={img.name}
								>
									<img src={getOptimizedImageUrl(img.path, { width: 400 })} alt={img.name} className="size-full object-cover" />
								</Button>
							))}
						</div>
					</div>

					{/* AI Generated Images with Suspense */}
					<Suspense
						fallback={
							<div className="space-y-2">
								<h4 className="text-sm font-medium text-muted-foreground">AI Generated</h4>
								<div
									className={`
										flex h-20 items-center justify-center rounded-md border border-dashed
										text-muted-foreground
									`}
								>
									<Loader2 className="mr-2 size-4 animate-spin" />
									Loading images...
								</div>
							</div>
						}
					>
						<UserImagesList userId={userId} selectedImage={selectedImage} onSelectImage={handleSelectImage} />
					</Suspense>

					{/* AI Image Generation */}
					<div className="space-y-2">
						<div className="flex items-center justify-between">
							<h4 className="flex items-center gap-1.5 text-sm font-medium">
								<Sparkles className="size-4 text-orange" />
								Generate with AI
							</h4>
							<span className="flex items-center gap-1 text-[10px] text-muted-foreground">
								<img src="/icons/blackforestlabs.svg" alt="Black Forest Labs" className="size-3" />
								FLUX.2
							</span>
						</div>
						<div className="flex items-center gap-2">
							<div className="relative flex-1">
								<Input
									placeholder="Describe the image..."
									value={imagePrompt}
									onChange={(event) => setImagePrompt(event.target.value)}
									className="pr-14 text-sm"
									maxLength={LIMITS.AI_IMAGE_PROMPT_MAX}
									disabled={isGeneratingImage}
									onKeyDown={(event) => {
										if (event.key === 'Enter') {
											event.preventDefault();
											generateImage();
										}
									}}
								/>
								<span
									className="
										pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 text-xs
										text-muted-foreground
									"
								>
									{imagePrompt.length}/{LIMITS.AI_IMAGE_PROMPT_MAX}
								</span>
							</div>
							<Button
								type="button"
								variant="accent"
								size="icon"
								onClick={generateImage}
								disabled={isGeneratingImage || !imagePrompt.trim() || !turnstileToken}
								className="shrink-0"
								aria-label="Generate image"
							>
								{isGeneratingImage ? <Loader2 className="size-4 animate-spin" /> : <Wand2 className="size-4" />}
							</Button>
						</div>
						{isGeneratingImage && <p className="text-center text-xs text-muted-foreground">Generating image, please wait...</p>}
						<div ref={turnstileReference} className="flex justify-center">
							<TurnstileWidget />
						</div>
					</div>
				</div>
				<DialogFooter className="shrink-0 border-t px-4 py-3">
					<Button
						type="button"
						variant="accent"
						onClick={() => !isGeneratingImage && onOpenChange(false)}
						disabled={isGeneratingImage}
						className={`
							w-full
							sm:w-auto
						`}
					>
						Done
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
