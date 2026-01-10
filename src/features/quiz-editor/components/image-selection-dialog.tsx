import { ImageOff, Loader2, Sparkles, Wand2, X } from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/dialog/dialog';
import { Input } from '@/components/input/input';
import { useDeleteImage, useGenerateImage, useImages, useLoadMoreImages } from '@/hooks/use-api';
import { useTurnstile } from '@/hooks/utils/use-turnstile';
import { DEFAULT_BACKGROUND_IMAGES } from '@/lib/background-images';
import { cn } from '@/lib/utilities';
import { LIMITS } from '@shared/validation';

type ImageSelectionDialogProperties = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	selectedImage: string | undefined;
	onSelectImage: (image: string) => void;
	userId: string;
};

export function ImageSelectionDialog({ open, onOpenChange, selectedImage, onSelectImage, userId }: ImageSelectionDialogProperties) {
	const [imagePrompt, setImagePrompt] = useState('');
	const turnstileReference = useRef<HTMLDivElement>(null);

	const { token: turnstileToken, resetToken, TurnstileWidget } = useTurnstile();

	const { data: imagesData } = useImages(userId);
	const loadMoreImagesMutation = useLoadMoreImages();
	const generateImageMutation = useGenerateImage();
	const deleteImageMutation = useDeleteImage();

	const aiImages = imagesData?.images ?? [];
	const aiImagesCursor = imagesData?.nextCursor;
	const isLoadingMoreImages = loadMoreImagesMutation.isPending;
	const isGeneratingImage = generateImageMutation.isPending;

	const loadMoreImages = () => {
		if (!aiImagesCursor || isLoadingMoreImages) return;
		loadMoreImagesMutation.mutate({ userId, cursor: aiImagesCursor });
	};

	const deleteImage = (imageId: string) => {
		deleteImageMutation.mutate(
			{ userId, imageId },
			{
				onSuccess: () => {
					toast.success('Image deleted');
				},
				onError: (error) => toast.error(error.message || 'Failed to delete image'),
			},
		);
	};

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
					onSelectImage(data.path);
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
				if (!isOpen && !isGeneratingImage) {
					onOpenChange(false);
				}
			}}
		>
			<DialogContent className="flex max-h-[90dvh] max-w-md flex-col overflow-hidden p-0">
				<DialogHeader className="shrink-0 border-b px-4 pt-4 pb-3">
					<DialogTitle>Background Image</DialogTitle>
				</DialogHeader>
				<div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
					{/* Default Images */}
					<div className="space-y-2">
						<h4 className="text-sm font-medium text-muted-foreground">Default</h4>
						<div className="grid grid-cols-3 gap-2">
							<Button
								type="button"
								variant="subtle"
								onClick={() => onSelectImage('')}
								className={cn(
									`aspect-video h-auto bg-muted text-muted-foreground`,
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
									onClick={() => onSelectImage(img.path)}
									className={cn(
										`aspect-video h-auto overflow-hidden p-0`,
										selectedImage === img.path
											? `ring-3 ring-orange ring-offset-2 ring-offset-background`
											: 'bg-muted text-muted-foreground',
									)}
								>
									<img src={img.path} alt={img.name} className="size-full object-cover" />
								</Button>
							))}
						</div>
					</div>

					{/* AI Generated Images */}
					{aiImages.length > 0 && (
						<div className="space-y-2">
							<h4 className="text-sm font-medium text-muted-foreground">AI Generated</h4>
							<div className="grid grid-cols-3 gap-2">
								{aiImages.map((img) => (
									<div key={img.id} className="group relative">
										<Button
											type="button"
											variant="subtle"
											onClick={() => onSelectImage(img.path)}
											className={cn(
												`aspect-video h-auto w-full overflow-hidden p-0`,
												selectedImage === img.path
													? `ring-3 ring-orange ring-offset-2 ring-offset-background`
													: 'bg-muted text-muted-foreground',
											)}
											title={img.prompt}
										>
											<img src={img.path} alt={img.name} className="size-full object-cover" />
										</Button>
										<Button
											type="button"
											variant="ghost"
											size="icon"
											onClick={(event) => {
												event.stopPropagation();
												deleteImage(img.id);
											}}
											className={`
												absolute top-1 right-1 size-6 rounded-full border-0 bg-black/60 p-1
												text-white opacity-0 transition-opacity
												hover:bg-red
												group-hover-always:opacity-100
											`}
											title="Delete image"
										>
											<X className="size-3" />
										</Button>
									</div>
								))}
							</div>
							{aiImagesCursor && (
								<Button type="button" variant="subtle" size="sm" className="w-full" onClick={loadMoreImages} disabled={isLoadingMoreImages}>
									{isLoadingMoreImages ? <Loader2 className="mr-2 size-4 animate-spin" /> : undefined}
									Load More
								</Button>
							)}
						</div>
					)}

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
						onClick={() => onOpenChange(false)}
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
